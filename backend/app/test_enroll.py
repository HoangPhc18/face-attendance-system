import json
import numpy as np
import os
from face_enroll import capture_face_from_webcam, enroll_new_employee
from face_attendance import match_face  # Import hàm so khớp

def mock_save_embedding(embedding):
    file_path = "test_faces.json"

    # Load embedding cũ
    data = {}
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        with open(file_path, "r") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                print("⚠️ File JSON bị lỗi. Tạo lại file mới.")
                data = {}

    # Kiểm tra trùng khuôn mặt
    if data:
        known_encodings = [np.array(v) for v in data.values()]
        _, confidence = match_face(embedding, known_encodings, threshold=0.45)  # Có thể giảm threshold nếu cần
        if confidence > 0:
            print(f"❌ Khuôn mặt đã tồn tại trong hệ thống (độ trùng: {confidence:.2f}). Không đăng ký lại.")
            return

    # Nếu không trùng thì cho đăng ký
    name = input("✅ Khuôn mặt mới. Nhập tên người dùng để lưu: ")
    data[name] = embedding.tolist()

    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Đã lưu embedding của '{name}' vào {file_path}")

if __name__ == "__main__":
    try:
        print("🧪 Đang chụp ảnh để đăng ký khuôn mặt...")
        img = capture_face_from_webcam()
        enroll_new_employee(img, mock_save_embedding)
        print("✅ Đăng ký khuôn mặt thành công.")
    except Exception as e:
        print("❌ Lỗi:", e)
