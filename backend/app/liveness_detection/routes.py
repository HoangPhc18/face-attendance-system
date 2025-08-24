# API routes cho liveness detection
from flask import Blueprint, request, jsonify
import cv2
import numpy as np
from .liveness_detection import check_liveness_from_image, check_liveness_from_frames, check_liveness_from_video
import base64
import io
from PIL import Image

liveness_bp = Blueprint('liveness', __name__)

def decode_base64_image(base64_string):
    """Decode base64 string thành OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        raise ValueError(f"Invalid image data: {str(e)}")

@liveness_bp.route('/check_image', methods=['POST'])
def check_liveness_image():
    """Kiểm tra liveness từ một ảnh đơn"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        # Decode image
        image = decode_base64_image(data['image'])
        
        # Kiểm tra liveness
        is_live, score, message = check_liveness_from_image(image)
        
        return jsonify({
            'success': True,
            'is_live': is_live,
            'liveness_score': float(score),
            'message': message,
            'method': 'single_image'
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Liveness detection failed: {str(e)}'
        }), 500

@liveness_bp.route('/check_frames', methods=['POST'])
def check_liveness_frames():
    """Kiểm tra liveness từ nhiều frames"""
    try:
        data = request.get_json()
        
        if not data or 'frames' not in data:
            return jsonify({
                'success': False,
                'error': 'No frames data provided'
            }), 400
        
        frames_data = data['frames']
        if not isinstance(frames_data, list) or len(frames_data) == 0:
            return jsonify({
                'success': False,
                'error': 'Invalid frames data'
            }), 400
        
        # Decode tất cả frames
        frames = []
        for i, frame_data in enumerate(frames_data):
            try:
                frame = decode_base64_image(frame_data)
                frames.append(frame)
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Invalid frame {i}: {str(e)}'
                }), 400
        
        # Kiểm tra liveness
        is_live, score, message = check_liveness_from_frames(frames)
        
        return jsonify({
            'success': True,
            'is_live': is_live,
            'liveness_score': float(score),
            'message': message,
            'method': 'multiple_frames',
            'frames_analyzed': len(frames)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Liveness detection failed: {str(e)}'
        }), 500

@liveness_bp.route('/check_video', methods=['POST'])
def check_liveness_video():
    """Kiểm tra liveness từ video file upload"""
    try:
        if 'video' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No video file provided'
            }), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No video file selected'
            }), 400
        
        # Lưu video tạm thời
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
            video_file.save(temp_file.name)
            temp_video_path = temp_file.name
        
        try:
            # Kiểm tra liveness
            is_live, score, message = check_liveness_from_video(temp_video_path)
            
            return jsonify({
                'success': True,
                'is_live': is_live,
                'liveness_score': float(score),
                'message': message,
                'method': 'video_file'
            })
            
        finally:
            # Xóa file tạm
            if os.path.exists(temp_video_path):
                os.unlink(temp_video_path)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Liveness detection failed: {str(e)}'
        }), 500

@liveness_bp.route('/status', methods=['GET'])
def liveness_status():
    """Kiểm tra trạng thái liveness detection service"""
    try:
        from .liveness_detection import get_liveness_detector
        
        detector = get_liveness_detector()
        
        return jsonify({
            'success': True,
            'status': 'active',
            'message': 'Liveness detection service is running',
            'features': {
                'blink_detection': True,
                'head_movement_detection': True,
                'single_image_analysis': True,
                'multi_frame_analysis': True,
                'video_analysis': True
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'error',
            'error': f'Liveness detection service error: {str(e)}'
        }), 500
