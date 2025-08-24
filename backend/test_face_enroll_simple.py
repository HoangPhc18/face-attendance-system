# Simple test script for face enrollment without Flask dependencies
import sys
import os

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def test_face_enrollment():
    """Test face enrollment functionality without Flask dependencies"""
    try:
        # Import only the face enrollment module
        from face_user_register.face_enroll import capture_face_from_webcam, encode_face, save_pending_embedding
        
        print("📸 Đang chụp ảnh từ webcam...")
        image = capture_face_from_webcam()
        print("✅ Đã chụp ảnh thành công.")
        
        print("⏳ Đang encode khuôn mặt...")
        embedding = encode_face(image)
        print("✅ Đã encode khuôn mặt thành công.")
        
        print("💾 Đang lưu vào database...")
        pending_id = save_pending_embedding(embedding)
        print(f"✅ Đã lưu khuôn mặt tạm với pending_face_id = {pending_id}")
        
        # Save to JSON file for reference
        import json
        with open("last_pending.json", "w") as f:
            json.dump({"pending_face_id": pending_id}, f)
        print("💾 pending_face_id đã được lưu vào file 'last_pending.json'.")
        
        return True
        
    except Exception as e:
        print(f"❌ Lỗi khi đăng ký khuôn mặt: {e}")
        return False

if __name__ == "__main__":
    print("=== Test Face Enrollment (Admin Only) ===")
    print("Lưu ý: Module này chỉ dành cho admin đăng ký khuôn mặt mới")
    print("Không sử dụng liveness detection - chỉ cần cho attendance check-in")
    print()
    
    success = test_face_enrollment()
    
    if success:
        print("\n🎉 Test hoàn thành thành công!")
    else:
        print("\n❌ Test thất bại!")
