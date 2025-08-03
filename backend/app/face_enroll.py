# face_enroll.py
# Module xử lý đăng ký khuôn mặt (tạm thời & gắn với user sau)

import cv2
import numpy as np
import face_recognition
import json
import psycopg2
from urllib.parse import urlparse
from config import Config

# ---------------------------
# Kết nối database
# ---------------------------
def get_db_connection():
    result = urlparse(Config.SQLALCHEMY_DATABASE_URI)
    return psycopg2.connect(
        dbname=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port
    )

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
# Lưu embedding tạm thời vào pending_faces
# ---------------------------
def save_pending_embedding(embedding, image_url=None):
    embedding_json = json.dumps(embedding.tolist() if isinstance(embedding, np.ndarray) else embedding)

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO pending_faces (face_encoding, image_url)
                VALUES (%s, %s)
                RETURNING id
            """, (embedding_json, image_url))
            pending_id = cur.fetchone()[0]
        conn.commit()
        return pending_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

# ---------------------------
# Tích hợp: Chụp ảnh + tạo embedding + lưu vào DB tạm thời
# ---------------------------
def capture_and_store_face_temp(image=None):
    if image is None:
        image = capture_face_from_webcam()
    embedding = encode_face(image)
    pending_id = save_pending_embedding(embedding)
    return pending_id

# Chỉ cho phép gọi từ API có xác thực và phân quyền
# Không chứa logic chấm công, chỉ xử lý đăng ký khuôn mặt mới