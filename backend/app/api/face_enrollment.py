# Face enrollment API routes
from flask import Blueprint, request, jsonify
from datetime import datetime
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_auth, require_admin, validate_required_fields, decode_base64_image, log_activity
from ..face_user_register.face_enroll import capture_and_store_face_temp
import json

face_enrollment_bp = Blueprint('face_enrollment', __name__)

@face_enrollment_bp.route('/enroll', methods=['POST'])
@require_admin
def enroll_face(current_user_id):
    """Face enrollment endpoint (requires admin authentication)"""
    try:
        if 'image' not in request.files:
            return create_response(False, error='No image file provided', status_code=400)
        
        image_file = request.files['image']
        if image_file.filename == '':
            return create_response(False, error='No image file selected', status_code=400)
        
        # Read image data
        image_data = image_file.read()
        
        # Convert to OpenCV format for processing
        import numpy as np
        import cv2
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return create_response(False, error='Invalid image format', status_code=400)
        
        # Process face enrollment (admin only - no liveness detection needed)
        pending_id = capture_and_store_face_temp(image)
        
        log_activity('INFO', f'Face enrolled successfully, pending_id: {pending_id}', 'face_enrollment')
        
        return create_response(True, {
            'pending_id': pending_id,
            'message': 'Face enrolled successfully. Please complete user registration.'
        })
        
    except ValueError as e:
        log_activity('WARNING', f'Face enrollment failed: {str(e)}', 'face_enrollment')
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'Face enrollment error: {str(e)}', 'face_enrollment')
        return create_response(False, error=f'Face enrollment failed: {str(e)}', status_code=500)

@face_enrollment_bp.route('/register', methods=['POST'])
@require_admin
def register_user(current_user_id):
    """Complete user registration with pending face (admin only)"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['username', 'full_name', 'email', 'pending_id'])
        
        username = data['username']
        full_name = data['full_name']
        email = data['email']
        pending_id = data['pending_id']
        role = data.get('role', 'user')
        
        with get_db_cursor() as cursor:
            # Check if pending face exists
            cursor.execute(
                "SELECT face_encoding FROM pending_faces WHERE id = %s",
                (pending_id,)
            )
            pending_face = cursor.fetchone()
            
            if not pending_face:
                return create_response(False, error='Pending face not found', status_code=404)
            
            # Check if username or email already exists
            cursor.execute(
                "SELECT id FROM users WHERE username = %s OR email = %s",
                (username, email)
            )
            existing_user = cursor.fetchone()
            
            if existing_user:
                return create_response(False, error='Username or email already exists', status_code=409)
            
            # Create new user
            cursor.execute("""
                INSERT INTO users (username, full_name, email, role) 
                VALUES (%s, %s, %s, %s) RETURNING id
            """, (username, full_name, email, role))
            
            user_id = cursor.fetchone()[0]
            
            # Move face encoding from pending to faces table
            cursor.execute("""
                INSERT INTO faces (user_id, face_encoding) 
                VALUES (%s, %s)
            """, (user_id, pending_face[0]))
            
            # Delete pending face
            cursor.execute("DELETE FROM pending_faces WHERE id = %s", (pending_id,))
            
            log_activity('INFO', f'User registered successfully: {username}', 'face_enrollment')
            
            return create_response(True, {
                'user_id': user_id,
                'username': username,
                'full_name': full_name,
                'email': email,
                'role': role
            }, message='User registered successfully')
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'User registration error: {str(e)}', 'face_enrollment')
        return create_response(False, error=f'User registration failed: {str(e)}', status_code=500)

@face_enrollment_bp.route('/pending', methods=['GET'])
@require_admin
def get_pending_faces(current_user_id):
    """Get list of pending face enrollments (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, created_at 
                FROM pending_faces 
                ORDER BY created_at DESC
            """)
            pending_faces = cursor.fetchall()
            
            pending_data = []
            for face in pending_faces:
                pending_data.append({
                    'id': face[0],
                    'created_at': face[1].isoformat() if face[1] else None
                })
            
            return create_response(True, {
                'pending_faces': pending_data,
                'count': len(pending_data)
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get pending faces: {str(e)}', status_code=500)
