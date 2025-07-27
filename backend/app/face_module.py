# Module nhận diện khuôn mặt
# Face Recognition Module
# Sử dụng OpenCV và face_recognition (dlib backend)
import cv2
import numpy as np
import face_recognition

def capture_face_from_webcam():
    """Chụp khuôn mặt từ webcam và trả về ảnh (numpy array)"""
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise RuntimeError("Không thể truy cập webcam hoặc không lấy được ảnh.")
    return frame

def encode_face(image):
    """Trích xuất embedding 128D từ ảnh khuôn mặt"""
    rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    boxes = face_recognition.face_locations(rgb_img)
    if not boxes:
        raise ValueError("Không tìm thấy khuôn mặt trong ảnh.")
    encodings = face_recognition.face_encodings(rgb_img, boxes)
    return encodings[0]  # Giả sử chỉ có 1 khuôn mặt

def match_face(encoding, known_encodings, threshold=0.5):
    """So khớp embedding với danh sách embedding đã lưu. Trả về chỉ số và độ tin cậy nếu khớp."""
    if not known_encodings:
        return None, 0.0
    distances = face_recognition.face_distance(known_encodings, encoding)
    min_dist = np.min(distances)
    idx = np.argmin(distances)
    if min_dist < threshold:
        confidence = 1 - min_dist  # Độ tin cậy càng cao khi khoảng cách càng nhỏ
        return idx, confidence
    return None, 0.0

def enroll_new_employee(image, save_embedding_func):
    """Lưu embedding của nhân viên mới (image: ảnh khuôn mặt, save_embedding_func: hàm lưu embedding vào DB)"""
    embedding = encode_face(image)
    save_embedding_func(embedding)
    return embedding

# Ví dụ sử dụng (chạy thử):
if __name__ == "__main__":
    print("Chụp ảnh từ webcam...")
    img = capture_face_from_webcam()
    try:
        emb = encode_face(img)
        print("Embedding 128D:", emb)
    except Exception as e:
        print("Lỗi:", e)
