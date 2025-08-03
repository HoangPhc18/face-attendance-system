# test_create_user_with_face.py
# Test tạo user mới với pending_face_id tự động đọc từ file JSON

import requests
import json
import os

API_URL = "http://localhost:5000/api/user/create-with-face"

def get_sample_user_data(pending_face_id):
    return {
        "username": "testuser01",
        "full_name": "Test User",
        "email": "testuser01@example.com",
        "password_hash": "hashedpassword123",  # Hash thật khi deploy
        "pending_face_id": pending_face_id
    }

def main():
    try:
        if not os.path.exists("last_pending.json"):
            print("❌ File 'last_pending.json' không tồn tại. Hãy chạy 'test_enroll.py' trước.")
            return

        with open("last_pending.json", "r") as f:
            data = json.load(f)
        pending_face_id = data.get("pending_face_id")

        if not pending_face_id:
            print("❌ Không tìm thấy pending_face_id trong file 'last_pending.json'.")
            return

        user_data = get_sample_user_data(pending_face_id)

        print(f"🚀 Gửi yêu cầu tạo user mới với pending_face_id={pending_face_id}...")
        response = requests.post(API_URL, json=user_data)
        res_json = response.json()

        if response.status_code == 201:
            print("✅ Tạo user và gán khuôn mặt thành công!")
            print(f"🆔 User ID: {res_json.get('user_id')}")
        else:
            print(f"❌ Lỗi: {res_json.get('message') or res_json}")

    except Exception as e:
        print(f"❌ Lỗi khi gọi API: {e}")

if __name__ == "__main__":
    main()
