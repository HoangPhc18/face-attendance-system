# Module chấm công bằng khuôn mặt (attendance)
# Chỉ xử lý nhận diện, so sánh với embedding đã lưu, ghi nhận check-in/out
import cv2
import numpy as np
import face_recognition
from ..liveness_detection.liveness_detection import check_liveness_from_image

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

def process_attendance_image(image, enable_liveness_check=True):
    """Xử lý ảnh chấm công với liveness detection"""
    # Kiểm tra liveness detection nếu được bật
    if enable_liveness_check:
        is_live, liveness_score, message = check_liveness_from_image(image)
        if not is_live:
            return {
                'success': False,
                'error': f'Liveness detection failed: {message}',
                'liveness_score': liveness_score,
                'liveness_passed': False
            }
    
    try:
        # Encode khuôn mặt
        encoding = encode_face(image)
        
        return {
            'success': True,
            'encoding': encoding,
            'liveness_passed': enable_liveness_check,
            'liveness_score': liveness_score if enable_liveness_check else None
        }
    except ValueError as e:
        return {
            'success': False,
            'error': str(e),
            'liveness_passed': enable_liveness_check,
            'liveness_score': liveness_score if enable_liveness_check else None
        }

# Chỉ cho phép gọi từ API chấm công, không chứa logic đăng ký
