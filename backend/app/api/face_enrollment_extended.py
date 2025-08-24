# Extended face enrollment API with additional admin features
from flask import Blueprint, request, jsonify, g
from datetime import datetime
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_admin, validate_required_fields, decode_base64_image, log_activity
from ..face_user_register.face_enroll import capture_and_store_face_temp
import json

face_enrollment_extended_bp = Blueprint('face_enrollment_extended', __name__)

@face_enrollment_extended_bp.route('/enroll-base64', methods=['POST'])
@require_admin
def enroll_face_base64(current_user_id):
    """Face enrollment with base64 image (admin only)"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['image'])
        
        # Decode base64 image
        image = decode_base64_image(data['image'])
        
        # Process face enrollment (admin only)
        pending_id = capture_and_store_face_temp(image)
        
        log_activity('INFO', f'Face enrolled via base64, pending_id: {pending_id} by admin {current_user_id}', 'face_enrollment')
        
        return create_response(True, {
            'pending_id': pending_id,
            'message': 'Face enrolled successfully. Please complete user registration.',
            'network_type': 'internal' if hasattr(g, 'is_internal_network') and g.is_internal_network else 'external'
        })
        
    except ValueError as e:
        log_activity('WARNING', f'Base64 face enrollment failed: {str(e)}', 'face_enrollment')
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        log_activity('ERROR', f'Base64 face enrollment error: {str(e)}', 'face_enrollment')
        return create_response(False, error=f'Face enrollment failed: {str(e)}', status_code=500)

@face_enrollment_extended_bp.route('/bulk-register', methods=['POST'])
@require_admin
def bulk_register_users(current_user_id):
    """Bulk user registration (admin only)"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['users'])
        
        users = data['users']
        if not isinstance(users, list):
            return create_response(False, error='Users must be an array', status_code=400)
        
        registered_users = []
        errors = []
        
        with get_db_cursor() as cursor:
            for i, user_data in enumerate(users):
                try:
                    validate_required_fields(user_data, ['username', 'full_name', 'email', 'pending_id'])
                    
                    username = user_data['username']
                    full_name = user_data['full_name']
                    email = user_data['email']
                    pending_id = user_data['pending_id']
                    role = user_data.get('role', 'user')
                    
                    # Check if pending face exists
                    cursor.execute(
                        "SELECT face_encoding FROM pending_faces WHERE id = %s",
                        (pending_id,)
                    )
                    pending_face = cursor.fetchone()
                    
                    if not pending_face:
                        errors.append(f'User {i+1}: Pending face not found')
                        continue
                    
                    # Check if username or email already exists
                    cursor.execute(
                        "SELECT id FROM users WHERE username = %s OR email = %s",
                        (username, email)
                    )
                    existing_user = cursor.fetchone()
                    
                    if existing_user:
                        errors.append(f'User {i+1}: Username or email already exists')
                        continue
                    
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
                    
                    registered_users.append({
                        'user_id': user_id,
                        'username': username,
                        'full_name': full_name,
                        'email': email,
                        'role': role
                    })
                    
                except Exception as e:
                    errors.append(f'User {i+1}: {str(e)}')
        
        log_activity('INFO', f'Bulk registration: {len(registered_users)} users by admin {current_user_id}', 'face_enrollment')
        
        result = {
            'registered_users': registered_users,
            'success_count': len(registered_users),
            'total_count': len(users)
        }
        
        if errors:
            result['errors'] = errors
        
        return create_response(True, result, 
                             message=f'Bulk registration completed: {len(registered_users)}/{len(users)} users registered')
        
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        return create_response(False, error=f'Bulk registration failed: {str(e)}', status_code=500)

@face_enrollment_extended_bp.route('/pending/<int:pending_id>', methods=['DELETE'])
@require_admin
def delete_pending_face(current_user_id, pending_id):
    """Delete pending face enrollment (admin only)"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("DELETE FROM pending_faces WHERE id = %s", (pending_id,))
            
            if cursor.rowcount == 0:
                return create_response(False, error='Pending face not found', status_code=404)
            
            log_activity('INFO', f'Pending face {pending_id} deleted by admin {current_user_id}', 'face_enrollment')
            
            return create_response(True, message='Pending face deleted successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to delete pending face: {str(e)}', status_code=500)

@face_enrollment_extended_bp.route('/user/<int:user_id>/faces', methods=['GET'])
@require_admin
def get_user_faces(current_user_id, user_id):
    """Get all faces for a specific user (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Get user info
            cursor.execute("""
                SELECT username, full_name, email, role FROM users WHERE id = %s
            """, (user_id,))
            
            user_info = cursor.fetchone()
            if not user_info:
                return create_response(False, error='User not found', status_code=404)
            
            # Get user's faces
            cursor.execute("""
                SELECT id, created_at, updated_at FROM faces WHERE user_id = %s
            """, (user_id,))
            
            faces = cursor.fetchall()
            
            face_data = []
            for face in faces:
                face_data.append({
                    'id': face[0],
                    'created_at': face[1].isoformat() if face[1] else None,
                    'updated_at': face[2].isoformat() if face[2] else None
                })
            
            return create_response(True, {
                'user': {
                    'id': user_id,
                    'username': user_info[0],
                    'full_name': user_info[1],
                    'email': user_info[2],
                    'role': user_info[3]
                },
                'faces': face_data,
                'face_count': len(face_data)
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to get user faces: {str(e)}', status_code=500)

@face_enrollment_extended_bp.route('/user/<int:user_id>/faces/<int:face_id>', methods=['DELETE'])
@require_admin
def delete_user_face(current_user_id, user_id, face_id):
    """Delete a specific face for a user (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Verify face belongs to user
            cursor.execute("""
                SELECT id FROM faces WHERE id = %s AND user_id = %s
            """, (face_id, user_id))
            
            face = cursor.fetchone()
            if not face:
                return create_response(False, error='Face not found for this user', status_code=404)
            
            # Delete the face
            cursor.execute("DELETE FROM faces WHERE id = %s", (face_id,))
            
            log_activity('INFO', f'Face {face_id} deleted for user {user_id} by admin {current_user_id}', 'face_enrollment')
            
            return create_response(True, message='Face deleted successfully')
            
    except Exception as e:
        return create_response(False, error=f'Failed to delete face: {str(e)}', status_code=500)

@face_enrollment_extended_bp.route('/statistics', methods=['GET'])
@require_admin
def get_enrollment_statistics(current_user_id):
    """Get face enrollment statistics (admin only)"""
    try:
        with get_db_cursor() as cursor:
            # Get total users
            cursor.execute("SELECT COUNT(*) FROM users")
            total_users = cursor.fetchone()[0]
            
            # Get users with faces
            cursor.execute("SELECT COUNT(DISTINCT user_id) FROM faces")
            users_with_faces = cursor.fetchone()[0]
            
            # Get pending faces
            cursor.execute("SELECT COUNT(*) FROM pending_faces")
            pending_faces = cursor.fetchone()[0]
            
            # Get total faces
            cursor.execute("SELECT COUNT(*) FROM faces")
            total_faces = cursor.fetchone()[0]
            
            # Get recent enrollments (last 30 days)
            cursor.execute("""
                SELECT COUNT(*) FROM faces 
                WHERE created_at >= NOW() - INTERVAL '30 days'
            """)
            recent_enrollments = cursor.fetchone()[0]
            
            statistics = {
                'total_users': total_users,
                'users_with_faces': users_with_faces,
                'users_without_faces': total_users - users_with_faces,
                'pending_faces': pending_faces,
                'total_faces': total_faces,
                'recent_enrollments_30d': recent_enrollments,
                'enrollment_rate': round((users_with_faces / max(total_users, 1)) * 100, 2)
            }
            
            return create_response(True, statistics)
            
    except Exception as e:
        return create_response(False, error=f'Failed to get statistics: {str(e)}', status_code=500)
