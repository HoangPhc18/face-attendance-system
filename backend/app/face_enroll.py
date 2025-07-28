# Module đăng ký khuôn mặt mới (enroll)
# Chỉ xử lý việc thêm mới user và lưu embedding
import cv2
import numpy as np
import face_recognition

def capture_face_from_webcam():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise RuntimeError("Không thể truy cập webcam hoặc không lấy được ảnh.")
    return frame

def encode_face(image):
    rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    boxes = face_recognition.face_locations(rgb_img)
    if not boxes:
        raise ValueError("Không tìm thấy khuôn mặt trong ảnh.")
    encodings = face_recognition.face_encodings(rgb_img, boxes)
    return encodings[0]

def enroll_new_employee(image, save_embedding_func):
    embedding = encode_face(image)
    save_embedding_func(embedding)
    return embedding

# Chỉ cho phép gọi từ API có xác thực và phân quyền
