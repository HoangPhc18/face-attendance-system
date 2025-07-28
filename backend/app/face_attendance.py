# Module chấm công bằng khuôn mặt (attendance)
# Chỉ xử lý nhận diện, so sánh với embedding đã lưu, ghi nhận check-in/out
import cv2
import numpy as np
import face_recognition

def encode_face(image):
    rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    boxes = face_recognition.face_locations(rgb_img)
    if not boxes:
        raise ValueError("Không tìm thấy khuôn mặt trong ảnh.")
    encodings = face_recognition.face_encodings(rgb_img, boxes)
    return encodings[0]

def match_face(encoding, known_encodings, threshold=0.5):
    if not known_encodings:
        return None, 0.0
    distances = face_recognition.face_distance(known_encodings, encoding)
    min_dist = np.min(distances)
    idx = np.argmin(distances)
    if min_dist < threshold:
        confidence = 1 - min_dist
        return idx, confidence
    return None, 0.0

# Chỉ cho phép gọi từ API chấm công, không chứa logic đăng ký
