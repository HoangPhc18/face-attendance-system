# Face Authentication API - Internal Network Only
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import jwt
import numpy as np
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_internal_network, log_activity
from ..config.settings import Config
import face_recognition

face_auth_bp = Blueprint('face_auth', __name__)

@face_auth_bp.route('/face-login', methods=['POST'])
@require_internal_network
def face_login():
    """Face-based login for internal network only"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return create_response(False, error='Face image is required', status_code=400)
        
        # Decode base64 image and extract face encoding
        import base64
        import cv2
        
        # Remove data URL prefix if present
        image_data = data['image']
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode image
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Extract face encoding
        face_locations = face_recognition.face_locations(rgb_image)
        if not face_locations:
            return create_response(False, error='No face detected in image', status_code=400)
        
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        if not face_encodings:
            return create_response(False, error='Could not extract face encoding', status_code=400)
        
        input_encoding = face_encodings[0]
        
        with get_db_cursor() as cursor:
            # Get all users with face encodings
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, u.email, u.role, 
                       u.allow_face_only, f.face_encoding, u.employee_id, u.department, u.position
                FROM users u
                JOIN faces f ON u.id = f.user_id
                WHERE u.is_active = true AND u.allow_face_only = true AND f.is_active = true
            """)
            
            users_with_faces = cursor.fetchall()
            
            if not users_with_faces:
                return create_response(False, error='No users with face encoding found', status_code=404)
            
            # Compare with stored face encodings
            best_match = None
            best_distance = float('inf')
            
            for user_data in users_with_faces:
                user_id, username, full_name, email, role, allow_face_only, stored_encoding_str, employee_id, department, position = user_data
                
                # Convert stored encoding string back to numpy array
                try:
                    stored_encoding = np.array(eval(stored_encoding_str))
                    
                    # Calculate face distance
                    distance = face_recognition.face_distance([stored_encoding], input_encoding)[0]
                    
                    # Face recognition threshold (lower = more strict)
                    if distance < 0.6 and distance < best_distance:
                        best_match = {
                            'user_id': user_id,
                            'username': username,
                            'full_name': full_name,
                            'email': email,
                            'role': role,
                            'employee_id': employee_id,
                            'department': department,
                            'position': position,
                            'distance': distance
                        }
                        best_distance = distance
                        
                except Exception as e:
                    print(f"Error processing face encoding for user {user_id}: {e}")
                    continue
            
            if not best_match:
                log_activity('WARNING', 'Face login failed - no matching face found', 'face_auth')
                return create_response(False, error='Face not recognized', status_code=401)
            
            # Generate JWT token for face-based login
            token_payload = {
                'user_id': best_match['user_id'],
                'username': best_match['username'],
                'role': best_match['role'],
                'login_method': 'face',
                'network_type': 'internal',
                'exp': datetime.utcnow() + timedelta(hours=8),  # 8 hour expiry
                'iat': datetime.utcnow()
            }
            
            token = jwt.encode(token_payload, Config.SECRET_KEY, algorithm='HS256')
            
            # Log successful face login
            log_activity('INFO', f'Face login successful for user {best_match["user_id"]} ({best_match["username"]})', 'face_auth')
            
            return create_response(True, {
                'message': 'Face login successful',
                'token': token,
                'user': {
                    'id': best_match['user_id'],
                    'username': best_match['username'],
                    'full_name': best_match['full_name'],
                    'email': best_match['email'],
                    'role': best_match['role'],
                    'employee_id': best_match['employee_id'],
                    'department': best_match['department'],
                    'position': best_match['position'],
                    'login_method': 'face',
                    'network_type': 'internal'
                },
                'face_match_confidence': round((1 - best_distance) * 100, 2)
            })
            
    except Exception as e:
        log_activity('ERROR', f'Face login error: {str(e)}', 'face_auth')
        return create_response(False, error=f'Face login failed: {str(e)}', status_code=500)

@face_auth_bp.route('/face-attendance', methods=['POST'])
@require_internal_network
def face_attendance():
    """Face-based attendance check-in/out for internal network only"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return create_response(False, error='Face image is required', status_code=400)
        
        action = data.get('action', 'check_in')  # check_in or check_out
        
        # Same face recognition logic as face_login
        import base64
        import cv2
        
        image_data = data['image']
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        face_locations = face_recognition.face_locations(rgb_image)
        if not face_locations:
            return create_response(False, error='No face detected in image', status_code=400)
        
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        if not face_encodings:
            return create_response(False, error='Could not extract face encoding', status_code=400)
        
        input_encoding = face_encodings[0]
        
        with get_db_cursor() as cursor:
            # Find matching user
            cursor.execute("""
                SELECT u.id, u.username, u.full_name, f.face_encoding
                FROM users u
                JOIN faces f ON u.id = f.user_id
                WHERE u.is_active = true AND u.allow_face_only = true AND f.is_active = true
            """)
            
            users_with_faces = cursor.fetchall()
            best_match = None
            best_distance = float('inf')
            
            for user_data in users_with_faces:
                user_id, username, full_name, stored_encoding_str = user_data
                
                try:
                    stored_encoding = np.array(eval(stored_encoding_str))
                    distance = face_recognition.face_distance([stored_encoding], input_encoding)[0]
                    
                    if distance < 0.6 and distance < best_distance:
                        best_match = {
                            'user_id': user_id,
                            'username': username,
                            'full_name': full_name,
                            'distance': distance
                        }
                        best_distance = distance
                except:
                    continue
            
            if not best_match:
                return create_response(False, error='Face not recognized for attendance', status_code=401)
            
            user_id = best_match['user_id']
            today = datetime.now().date()
            current_time = datetime.now()
            
            if action == 'check_in':
                # Check if already checked in today
                cursor.execute("""
                    SELECT id, check_in_time FROM attendance 
                    WHERE user_id = %s AND date = %s
                """, (user_id, today))
                
                existing = cursor.fetchone()
                if existing and existing[1]:  # Already checked in
                    return create_response(False, error='Already checked in today', status_code=400)
                
                if existing:
                    # Update existing record
                    cursor.execute("""
                        UPDATE attendance 
                        SET check_in_time = %s, status = 'present', updated_at = %s
                        WHERE id = %s
                    """, (current_time, current_time, existing[0]))
                else:
                    # Create new attendance record
                    cursor.execute("""
                        INSERT INTO attendance (user_id, date, check_in_time, status, created_at)
                        VALUES (%s, %s, %s, 'present', %s)
                    """, (user_id, today, current_time, current_time))
                
                message = f"Check-in successful for {best_match['full_name']}"
                
            else:  # check_out
                # Find today's attendance record
                cursor.execute("""
                    SELECT id, check_in_time FROM attendance 
                    WHERE user_id = %s AND date = %s AND check_in_time IS NOT NULL
                """, (user_id, today))
                
                attendance_record = cursor.fetchone()
                if not attendance_record:
                    return create_response(False, error='No check-in record found for today', status_code=400)
                
                # Calculate work hours
                check_in_time = attendance_record[1]
                work_duration = current_time - check_in_time
                work_hours = work_duration.total_seconds() / 3600
                
                # Update with check-out time
                cursor.execute("""
                    UPDATE attendance 
                    SET check_out_time = %s, total_hours = %s, updated_at = %s
                    WHERE id = %s
                """, (current_time, work_hours, current_time, attendance_record[0]))
                
                message = f"Check-out successful for {best_match['full_name']} (Worked: {work_hours:.2f} hours)"
            
            log_activity('INFO', f'Face attendance {action} for user {user_id} ({best_match["username"]})', 'face_attendance')
            
            return create_response(True, {
                'message': message,
                'user': {
                    'id': user_id,
                    'username': best_match['username'],
                    'full_name': best_match['full_name']
                },
                'action': action,
                'timestamp': current_time.isoformat(),
                'face_match_confidence': round((1 - best_distance) * 100, 2)
            })
            
    except Exception as e:
        log_activity('ERROR', f'Face attendance error: {str(e)}', 'face_attendance')
        return create_response(False, error=f'Face attendance failed: {str(e)}', status_code=500)

@face_auth_bp.route('/network-features', methods=['GET'])
def get_network_features():
    """Get available features based on network type"""
    try:
        # This would be determined by network detection middleware
        # For now, we'll check if it's internal network
        from ..core.utils import is_internal_network
        
        is_internal = is_internal_network(request)
        
        if is_internal:
            features = {
                'network_type': 'internal',
                'available_features': [
                    'face_login',
                    'face_attendance', 
                    'password_login',
                    'full_dashboard',
                    'leave_requests',
                    'profile_management',
                    'reports_view'
                ],
                'restricted_features': []
            }
        else:
            features = {
                'network_type': 'external',
                'available_features': [
                    'password_login',
                    'limited_dashboard',
                    'profile_view',
                    'leave_requests_view'
                ],
                'restricted_features': [
                    'face_login',
                    'face_attendance',
                    'attendance_management',
                    'real_time_features'
                ]
            }
        
        return create_response(True, features)
        
    except Exception as e:
        return create_response(False, error=f'Failed to get network features: {str(e)}', status_code=500)
