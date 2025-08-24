# face_enroll.py
# Module xử lý đăng ký khuôn mặt (tạm thời & gắn với user sau)

import cv2
import numpy as np
import face_recognition
import json
import psycopg2
from urllib.parse import urlparse
from ..config.settings import Config
# Removed liveness detection import - not needed for admin face registration
from ..core.database import get_db_cursor

# ---------------------------
# Kết nối database
# ---------------------------
# Use centralized database connection from core module

# ---------------------------
# Chụp ảnh từ webcam
# ---------------------------
def capture_face_from_webcam():
    print("Đang mở webcam...")
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Không thể mở webcam.")
    
    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise RuntimeError("Không lấy được ảnh từ webcam.")
    
    return frame

# ---------------------------
# Encode khuôn mặt thành vector embedding
# ---------------------------
def encode_face(image):
    rgb_img = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    boxes = face_recognition.face_locations(rgb_img)

    if not boxes:
        raise ValueError("Không tìm thấy khuôn mặt trong ảnh.")

    encodings = face_recognition.face_encodings(rgb_img, boxes)
    return encodings[0]  # Lấy khuôn mặt đầu tiên (nếu có nhiều)

# ---------------------------
# Lưu embedding tạm thởi vào pending_faces
# ---------------------------
def save_pending_embedding(embedding):
    with get_db_cursor() as cursor:
        embedding_json = json.dumps(embedding.tolist())
        cursor.execute(
            "INSERT INTO pending_faces (face_encoding) VALUES (%s) RETURNING id",
            (embedding_json,)
        )
        pending_id = cursor.fetchone()[0]
        return pending_id

# ---------------------------
# Tích hợp: Chụp ảnh + tạo embedding + lưu vào DB tạm thởi
# ---------------------------
def capture_and_store_face_temp(image=None):
    """
    Chụp ảnh và lưu face encoding vào pending_faces
    Chỉ dành cho admin đăng ký khuôn mặt mới - không cần liveness detection
    """
    if image is None:
        image = capture_face_from_webcam()
    
    # Chỉ encode khuôn mặt và lưu vào DB - không kiểm tra liveness
    # Liveness detection chỉ dùng cho attendance check-in/out
    embedding = encode_face(image)
    pending_id = save_pending_embedding(embedding)
    return pending_id

# Chỉ cho phép gọi từ API có xác thực và phân quyền
# Không chứa logic chấm công, chỉ xử lý đăng ký khuôn mặt mới
