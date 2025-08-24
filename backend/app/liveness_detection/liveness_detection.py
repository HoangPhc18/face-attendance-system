# Module liveness detection (chống giả mạo)
# Kiểm tra dấu hiệu sống như nháy mắt, chuyển động đầu

import cv2
import numpy as np
import dlib
import os
from scipy.spatial import distance as dist
from collections import deque
import time
from ..config.settings import Config

class LivenessDetector:
    def __init__(self):
        # Khởi tạo face detector và landmark predictor
        self.detector = dlib.get_frontal_face_detector()
        # Use correct path to the model file in liveness_detection/models directory
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'shape_predictor_68_face_landmarks.dat')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"shape_predictor_68_face_landmarks.dat not found at: {model_path}\n"
                "Please download from http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2 "
                "and extract to app/liveness_detection/models/ directory\n"
                "Or run: python download_liveness_model.py"
            )
        
        self.predictor = dlib.shape_predictor(model_path)
        
        # Thông số cho phát hiện nháy mắt
        self.EYE_AR_THRESH = 0.25  # Ngưỡng Eye Aspect Ratio
        self.EYE_AR_CONSEC_FRAMES = 3  # Số frame liên tiếp mắt đóng
        self.BLINK_TIME_THRESH = 0.1  # Thời gian tối thiểu cho một cái nháy mắt
        
        # Thông số cho phát hiện chuyển động đầu
        self.HEAD_MOVEMENT_THRESH = 15  # Ngưỡng chuyển động đầu (pixels)
        self.MOVEMENT_FRAMES = 5  # Số frame để theo dõi chuyển động
        
        # Lưu trữ trạng thái
        self.blink_counter = 0
        self.total_blinks = 0
        self.blink_start_time = None
        self.head_positions = deque(maxlen=self.MOVEMENT_FRAMES)
        
    def eye_aspect_ratio(self, eye):
        """Tính toán Eye Aspect Ratio (EAR)"""
        # Tính khoảng cách giữa các điểm landmark của mắt
        A = dist.euclidean(eye[1], eye[5])
        B = dist.euclidean(eye[2], eye[4])
        C = dist.euclidean(eye[0], eye[3])
        
        # Tính EAR
        ear = (A + B) / (2.0 * C)
        return ear
    
    def get_head_pose(self, landmarks, img_size):
        """Tính toán pose của đầu"""
        # Các điểm 3D của khuôn mặt chuẩn
        model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye left corner
            (225.0, 170.0, -135.0),      # Right eye right corner
            (-150.0, -150.0, -125.0),    # Left Mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ])
        
        # Các điểm 2D tương ứng trên ảnh
        image_points = np.array([
            (landmarks[30][0], landmarks[30][1]),     # Nose tip
            (landmarks[8][0], landmarks[8][1]),       # Chin
            (landmarks[36][0], landmarks[36][1]),     # Left eye left corner
            (landmarks[45][0], landmarks[45][1]),     # Right eye right corner
            (landmarks[48][0], landmarks[48][1]),     # Left Mouth corner
            (landmarks[54][0], landmarks[54][1])      # Right mouth corner
        ], dtype="double")
        
        # Camera matrix
        focal_length = img_size[1]
        center = (img_size[1]/2, img_size[0]/2)
        camera_matrix = np.array(
            [[focal_length, 0, center[0]],
             [0, focal_length, center[1]],
             [0, 0, 1]], dtype="double"
        )
        
        # Distortion coefficients
        dist_coeffs = np.zeros((4,1))
        
        # Solve PnP
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs)
        
        return rotation_vector, translation_vector
    
    def detect_blink(self, landmarks):
        """Phát hiện nháy mắt"""
        # Lấy tọa độ các điểm landmark của mắt trái và phải
        left_eye = landmarks[42:48]
        right_eye = landmarks[36:42]
        
        # Tính EAR cho cả hai mắt
        left_ear = self.eye_aspect_ratio(left_eye)
        right_ear = self.eye_aspect_ratio(right_eye)
        
        # Trung bình EAR của cả hai mắt
        ear = (left_ear + right_ear) / 2.0
        
        # Kiểm tra nháy mắt
        if ear < self.EYE_AR_THRESH:
            self.blink_counter += 1
            if self.blink_counter == 1:
                self.blink_start_time = time.time()
        else:
            if self.blink_counter >= self.EYE_AR_CONSEC_FRAMES:
                if self.blink_start_time:
                    blink_duration = time.time() - self.blink_start_time
                    if blink_duration >= self.BLINK_TIME_THRESH:
                        self.total_blinks += 1
                        self.blink_start_time = None
            self.blink_counter = 0
        
        return ear, self.total_blinks
    
    def detect_head_movement(self, landmarks):
        """Phát hiện chuyển động đầu"""
        # Lấy tọa độ trung tâm khuôn mặt
        nose_tip = landmarks[30]
        current_position = np.array([nose_tip[0], nose_tip[1]])
        
        # Thêm vị trí hiện tại vào queue
        self.head_positions.append(current_position)
        
        # Tính chuyển động nếu có đủ frame
        if len(self.head_positions) >= 2:
            movement = np.linalg.norm(self.head_positions[-1] - self.head_positions[0])
            return movement > self.HEAD_MOVEMENT_THRESH
        
        return False
    
    def analyze_frame(self, frame):
        """Phân tích một frame để phát hiện liveness"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.detector(gray)
        
        results = {
            'face_detected': False,
            'blink_detected': False,
            'head_movement': False,
            'ear_value': 0.0,
            'total_blinks': 0,
            'liveness_score': 0.0
        }
        
        if len(faces) > 0:
            results['face_detected'] = True
            face = faces[0]
            
            # Lấy landmarks
            landmarks = self.predictor(gray, face)
            landmarks = np.array([[p.x, p.y] for p in landmarks.parts()])
            
            # Phát hiện nháy mắt
            ear, total_blinks = self.detect_blink(landmarks)
            results['ear_value'] = ear
            results['total_blinks'] = total_blinks
            results['blink_detected'] = total_blinks > 0
            
            # Phát hiện chuyển động đầu
            head_movement = self.detect_head_movement(landmarks)
            results['head_movement'] = head_movement
            
            # Tính điểm liveness
            liveness_score = 0.0
            if results['blink_detected']:
                liveness_score += 0.6
            if results['head_movement']:
                liveness_score += 0.4
            
            results['liveness_score'] = liveness_score
        
        return results
    
    def is_live(self, frames_or_video):
        """Kiểm tra liveness từ danh sách frames hoặc video"""
        if isinstance(frames_or_video, str):  # Video file path
            cap = cv2.VideoCapture(frames_or_video)
            frames = []
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                frames.append(frame)
            cap.release()
        else:  # List of frames
            frames = frames_or_video
        
        if not frames:
            return False, 0.0, "No frames to analyze"
        
        # Reset counters
        self.blink_counter = 0
        self.total_blinks = 0
        self.head_positions.clear()
        
        total_liveness_score = 0.0
        valid_frames = 0
        
        for frame in frames:
            result = self.analyze_frame(frame)
            if result['face_detected']:
                total_liveness_score += result['liveness_score']
                valid_frames += 1
        
        if valid_frames == 0:
            return False, 0.0, "No face detected in any frame"
        
        # Tính điểm liveness trung bình
        avg_liveness_score = total_liveness_score / valid_frames
        
        # Ngưỡng để xác định live (có thể điều chỉnh)
        LIVENESS_THRESHOLD = 0.5
        
        is_live = avg_liveness_score >= LIVENESS_THRESHOLD
        
        if is_live:
            return True, avg_liveness_score, "Liveness detected"
        else:
            return False, avg_liveness_score, "Possible spoofing detected"
    
    def reset(self):
        """Reset trạng thái detector"""
        self.blink_counter = 0
        self.total_blinks = 0
        self.blink_start_time = None
        self.head_positions.clear()


# Singleton instance
_liveness_detector = None

def get_liveness_detector():
    """Lấy instance của LivenessDetector"""
    global _liveness_detector
    if _liveness_detector is None:
        _liveness_detector = LivenessDetector()
    return _liveness_detector


def check_liveness_from_image(image):
    """Kiểm tra liveness từ một ảnh đơn (ít tin cậy hơn)"""
    detector = get_liveness_detector()
    detector.reset()
    
    result = detector.analyze_frame(image)
    
    # Với ảnh đơn, chỉ có thể kiểm tra một số đặc điểm cơ bản
    if not result['face_detected']:
        return False, 0.0, "No face detected"
    
    # Điểm liveness thấp hơn cho ảnh đơn vì thiếu thông tin chuyển động
    liveness_score = 0.3 if result['face_detected'] else 0.0
    
    return liveness_score > 0.2, liveness_score, "Single image analysis (limited accuracy)"


def check_liveness_from_frames(frames):
    """Kiểm tra liveness từ nhiều frames (tin cậy hơn)"""
    detector = get_liveness_detector()
    return detector.is_live(frames)


def check_liveness_from_video(video_path):
    """Kiểm tra liveness từ video file"""
    detector = get_liveness_detector()
    return detector.is_live(video_path)
