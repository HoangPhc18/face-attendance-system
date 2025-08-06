# routes.py
# API tạo tài khoản cho khuôn mặt vừa đăng ký

from flask import Blueprint, request, jsonify
from .face_enroll import get_db_connection

face_register_bp = Blueprint('face_register', __name__)

@face_register_bp.route('/register_face_user', methods=['POST'])
def register_face_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    pending_id = data.get('pending_id')
    if not username or not email or not pending_id:
        return jsonify({'error': 'Missing required fields'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Lấy embedding từ pending_faces
            cur.execute("SELECT face_encoding FROM pending_faces WHERE id = %s", (pending_id,))
            result = cur.fetchone()
            if not result:
                return jsonify({'error': 'Pending face not found'}), 404
            embedding = result[0]

            # Tạo user mới
            cur.execute("""
                INSERT INTO users (username, email)
                VALUES (%s, %s)
                RETURNING id
            """, (username, email))
            user_id = cur.fetchone()[0]

            # Lưu embedding vào bảng faces, liên kết với user
            cur.execute("""
                INSERT INTO faces (user_id, face_encoding)
                VALUES (%s, %s)
            """, (user_id, embedding))

            # Xóa bản ghi tạm
            cur.execute("DELETE FROM pending_faces WHERE id = %s", (pending_id,))
        conn.commit()
        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
