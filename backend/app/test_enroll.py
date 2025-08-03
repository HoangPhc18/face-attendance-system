# test_enroll.py
# Test chụp ảnh, lưu khuôn mặt tạm, và ghi pending_face_id ra file JSON

from face_enroll import capture_face_from_webcam, capture_and_store_face_temp
import json

def test_capture_and_enroll_temp():
    try:
        print("📸 Đang chụp ảnh từ webcam...")
        image = capture_face_from_webcam()
        print("✅ Đã chụp ảnh thành công.")

        print("⏳ Đang lưu khuôn mặt vào bảng pending_faces...")
        pending_face_id = capture_and_store_face_temp(image)

        print(f"✅ Đã lưu khuôn mặt tạm với pending_face_id = {pending_face_id}")

        # Ghi pending_face_id ra file last_pending.json
        with open("last_pending.json", "w") as f:
            json.dump({"pending_face_id": pending_face_id}, f)
        print("💾 pending_face_id đã được lưu vào file 'last_pending.json'.")

    except Exception as e:
        print(f"❌ Lỗi khi đăng ký khuôn mặt: {e}")

if __name__ == "__main__":
    test_capture_and_enroll_temp()
