# Face enrollment API routes - New workflow: Create user first, then capture face
from flask import Blueprint, request, jsonify
from datetime import datetime
import bcrypt
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_auth, require_admin, validate_required_fields, decode_base64_image, log_activity
import json

face_enrollment_bp = Blueprint('face_enrollment', __name__)

# =============================================================================
# NEW WORKFLOW: Step 1 - Create User Account First
# =============================================================================

@face_enrollment_bp.route('/create-user', methods=['POST'])
@require_admin
def create_user_account(current_user_id):
    """Step 1: Create user account first (admin only)"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['username', 'full_name', 'email', 'password'])
        
        username = data['username']
        full_name = data['full_name']
        email = data['email']
        role = data.get('role', 'user')
        password = data['password']  # Required password for external network access
        
        with get_db_cursor() as cursor:
            # Check if username or email already exists
            cursor.execute(
                "SELECT id FROM users WHERE username = %s OR email = %s",
                (username, email)
            )
            existing_user = cursor.fetchone()
            
            if existing_user:
                return create_response(False, error='Username or email already exists', status_code=409)
            
            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Generate employee ID
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
            user_count = cursor.fetchone()[0]
            employee_id = f"EMP{str(user_count + 1).zfill(3)}" if role == 'user' else f"ADMIN{str(user_count + 1).zfill(3)}"
            
            # Set access control based on role
            allow_password_login = True  # All users can login with password
            allow_face_only = True       # All users can use face recognition
            require_password_for_external = role != 'admin'  # Only non-admin users require password for external access
            
            # Create new user with full access control
            try:
                cursor.execute("""
                    INSERT INTO users (
                        username, full_name, email, password_hash, role, is_active,
                        allow_password_login, allow_face_only, require_password_for_external,
                        employee_id, department, position
                    ) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    username, full_name, email, password_hash, role, True,
                    allow_password_login, allow_face_only, require_password_for_external,
                    employee_id, data.get('department', 'General'), data.get('position', 'Employee')
                ))
            except Exception as e:
                # Fallback to old schema if new columns don't exist
                cursor.execute("""
                    INSERT INTO users (username, full_name, email, password_hash, role, is_active) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (username, full_name, email, password_hash, role, True))
            
            # Get the created user ID
            cursor.execute("SELECT LAST_INSERT_ID()")
            user_id = cursor.fetchone()[0]
            
            log_activity('INFO', f'User account created: {username}', 'face_enrollment')
            
            return create_response(True, {
                'user_id': user_id,
                'username': username,
                'full_name': full_name,
                'email': email,
                'role': role,
                'temp_password': password,
                'message': 'User account created successfully. Now proceed to capture face.',
                'next_step': 'capture_face'
            })
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'User creation error: {str(e)}', 'face_enrollment')
        return create_response(False, error=f'User creation failed: {str(e)}', status_code=500)

# =============================================================================
# NEW WORKFLOW: Step 2 - Capture Face from Camera
# =============================================================================

@face_enrollment_bp.route('/capture-face', methods=['POST'])
@require_admin
def capture_face_from_camera(current_user_id):
    """Step 2: Capture face from camera and link to user (admin only)"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['user_id', 'face_image'])
        
        user_id = data['user_id']
        face_image_base64 = data['face_image']  # Base64 image from camera
        
        with get_db_cursor() as cursor:
            # Verify user exists and doesn't have face yet
            cursor.execute(
                "SELECT username, full_name FROM users WHERE id = %s AND is_active = TRUE",
                (user_id,)
            )
            user = cursor.fetchone()
            
            if not user:
                return create_response(False, error='User not found or inactive', status_code=404)
            
            # Check if user already has face registered
            cursor.execute("SELECT id FROM faces WHERE user_id = %s", (user_id,))
            existing_face = cursor.fetchone()
            
            if existing_face:
                return create_response(False, error='User already has face registered', status_code=409)
            
            # Process face image from camera
            try:
                # Decode base64 image
                face_image = decode_base64_image(face_image_base64)
                
                # Generate face encoding
                import face_recognition
                import cv2
                
                # Convert BGR to RGB for face_recognition
                rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
                
                # Find face locations
                face_locations = face_recognition.face_locations(rgb_image)
                
                if not face_locations:
                    return create_response(False, error='No face detected in image', status_code=400)
                
                if len(face_locations) > 1:
                    return create_response(False, error='Multiple faces detected. Please ensure only one face is visible.', status_code=400)
                
                # Generate face encoding
                face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
                
                if not face_encodings:
                    return create_response(False, error='Could not generate face encoding', status_code=400)
                
                face_encoding = face_encodings[0]
                
                # Convert encoding to JSON string for storage
                encoding_json = json.dumps(face_encoding.tolist())
                
                # Store face encoding in database
                cursor.execute("""
                    INSERT INTO faces (user_id, face_encoding, is_active) 
                    VALUES (%s, %s, %s)
                """, (user_id, encoding_json, True))
                
                log_activity('INFO', f'Face captured and linked to user: {user[0]}', 'face_enrollment')
                
                return create_response(True, {
                    'user_id': user_id,
                    'username': user[0],
                    'full_name': user[1],
                    'message': 'Face captured and registered successfully!',
                    'status': 'completed'
                })
                
            except Exception as face_error:
                return create_response(False, error=f'Face processing failed: {str(face_error)}', status_code=400)
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'Face capture error: {str(e)}', 'face_enrollment')
        return create_response(False, error=f'Face capture failed: {str(e)}', status_code=500)

# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@face_enrollment_bp.route('/users-without-face', methods=['GET'])
@require_admin
def get_users_without_face(current_user_id):
    """Get list of users who don't have face registered yet (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, u.email, u.role, u.created_at
                FROM users u
                LEFT JOIN faces f ON u.id = f.user_id
                WHERE f.user_id IS NULL AND u.is_active = TRUE
                ORDER BY u.created_at DESC
            """)
            users = cursor.fetchall()
            
            users_data = []
            for user in users:
                users_data.append({
                    'id': user[0],
                    'username': user[1],
                    'full_name': user[2],
                    'email': user[3],
                    'role': user[4],
                    'created_at': user[5].isoformat() if user[5] else None
                })
            
            return create_response(True, {
                'users_without_face': users_data,
                'count': len(users_data)
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get users: {str(e)}', status_code=500)

@face_enrollment_bp.route('/user-status/<int:user_id>', methods=['GET'])
@require_admin
def get_user_enrollment_status(current_user_id, user_id):
    """Get enrollment status of a specific user (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, u.email, u.role, u.is_active,
                       f.id as face_id, f.created_at as face_registered_at
                FROM users u
                LEFT JOIN faces f ON u.id = f.user_id
                WHERE u.id = %s
            """, (user_id,))
            
            result = cursor.fetchone()
            
            if not result:
                return create_response(False, error='User not found', status_code=404)
            
            has_face = result[6] is not None
            
            return create_response(True, {
                'user_id': result[0],
                'username': result[1],
                'full_name': result[2],
                'email': result[3],
                'role': result[4],
                'is_active': result[5],
                'has_face': has_face,
                'face_registered_at': result[7].isoformat() if result[7] else None,
                'enrollment_status': 'completed' if has_face else 'pending_face_capture'
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get user status: {str(e)}', status_code=500)

# =============================================================================
# LEGACY ENDPOINTS (for backward compatibility)
# =============================================================================

@face_enrollment_bp.route('/pending', methods=['GET'])
@require_admin
def get_pending_faces(current_user_id):
    """Get list of users without face registration (admin only)"""
    # Redirect to new endpoint
    return get_users_without_face(current_user_id)
