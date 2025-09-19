# Authentication API routes
from flask import Blueprint, request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from ..core.database import get_db_cursor
from ..core.utils import create_response, validate_required_fields, require_external_auth, require_auth, log_activity
from ..config.settings import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint - works for all network types"""
    try:
        # Simple network detection for debugging
        from flask import g
        
        # Set default network info if not present
        if not hasattr(g, 'network_info'):
            g.network_info = {
                'type': 'internal',  # Default to internal for now
                'ip': request.remote_addr or '127.0.0.1',
                'timestamp': datetime.now()
            }
        
        data = request.get_json()
        if not data:
            return create_response(False, error='No JSON data provided', status_code=400)
            
        validate_required_fields(data, ['username', 'password'])
        
        username = data['username']
        password = data['password']
        
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT id, username, full_name, email, role, password_hash FROM users WHERE username = %s AND is_active = TRUE",
                (username,)
            )
            user = cursor.fetchone()
            
            if not user:
                return create_response(False, error='Invalid username or password', status_code=401)
            
            # Check if password_hash exists
            if not user[5]:
                return create_response(False, error='Account setup incomplete. Please contact administrator.', status_code=401)
            
            # Verify password with bcrypt
            try:
                if not bcrypt.checkpw(password.encode('utf-8'), user[5].encode('utf-8')):
                    return create_response(False, error='Invalid username or password', status_code=401)
            except Exception:
                return create_response(False, error='Password verification failed', status_code=500)
            
            # Create JWT token
            try:
                payload = {
                    'user_id': user[0],
                    'username': user[1],
                    'role': user[4],
                    'exp': datetime.utcnow() + timedelta(hours=24)
                }
                
                token = jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
            except Exception as e:
                print(f"JWT creation error: {e}")
                return create_response(False, error='Token creation failed', status_code=500)
            
            try:
                log_activity('INFO', f'User login successful: {username}', 'auth')
            except Exception as e:
                print(f"Logging error: {e}")
                # Continue even if logging fails
            
            return create_response(True, {
                'token': token,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'full_name': user[2],
                    'email': user[3],
                    'role': user[4]
                },
                'network_info': g.network_info
            })
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        return create_response(False, error='Login failed', status_code=500)

@auth_bp.route('/verify', methods=['GET'])
@require_auth
def verify_token(current_user_id):
    """Verify JWT token"""
    try:
        token = request.headers.get('Authorization')
        
        if not token:
            return create_response(False, error='Token is missing', status_code=401)
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        jwt_secret = Config.JWT_SECRET_KEY or Config.SECRET_KEY
        if not jwt_secret or jwt_secret == 'your-jwt-secret':
            jwt_secret = 'fallback-jwt-secret-key-change-in-production'
        
        data = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        
        return create_response(True, {
            'user_id': data['user_id'],
            'username': data['username'],
            'role': data['role']
        })
        
    except jwt.ExpiredSignatureError:
        return create_response(False, error='Token has expired', status_code=401)
    except jwt.InvalidTokenError:
        return create_response(False, error='Token is invalid', status_code=401)
    except Exception as e:
        return create_response(False, error=f'Token verification failed: {str(e)}', status_code=500)

@auth_bp.route('/profile', methods=['GET'])
@require_auth
def get_profile(current_user_id):
    """Get user profile"""
    try:
        with get_db_cursor() as cursor:
            # Try to get full profile with new schema
            try:
                cursor.execute("""
                    SELECT u.id, u.username, u.full_name, u.email, u.role, u.created_at, u.updated_at,
                           u.employee_id, u.department, u.position, u.phone, u.address,
                           u.allow_password_login, u.allow_face_only, u.require_password_for_external,
                           CASE WHEN f.id IS NOT NULL THEN true ELSE false END as has_face
                    FROM users u
                    LEFT JOIN faces f ON u.id = f.user_id
                    WHERE u.id = %s
                """, (current_user_id,))
            except Exception:
                # Fallback to basic profile
                cursor.execute("""
                    SELECT u.id, u.username, u.full_name, u.email, u.role, u.created_at, u.updated_at,
                           CASE WHEN f.id IS NOT NULL THEN true ELSE false END as has_face
                    FROM users u
                    LEFT JOIN faces f ON u.id = f.user_id
                    WHERE u.id = %s
                """, (current_user_id,))
            
            user = cursor.fetchone()
            
            if not user:
                return create_response(False, error='User not found', status_code=404)
            
            # Build profile data based on available columns
            profile_data = {
                'id': user[0],
                'username': user[1],
                'full_name': user[2],
                'email': user[3],
                'role': user[4],
                'created_at': user[5].isoformat() if user[5] else None,
                'updated_at': user[6].isoformat() if user[6] else None,
                'has_face': user[7] if len(user) > 7 else False
            }
            
            # Add extended fields if available
            if len(user) > 8:
                profile_data.update({
                    'employee_id': user[7],
                    'department': user[8],
                    'position': user[9],
                    'phone': user[10],
                    'address': user[11],
                    'allow_password_login': user[12],
                    'allow_face_only': user[13],
                    'require_password_for_external': user[14],
                    'has_face': user[15]
                })
            
            return create_response(True, profile_data)
            
    except Exception as e:
        return create_response(False, error=f'Failed to get profile: {str(e)}', status_code=500)

@auth_bp.route('/profile', methods=['PUT'])
@require_auth
def update_profile(current_user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        
        with get_db_cursor() as cursor:
            # Build update query based on provided fields
            update_fields = []
            update_values = []
            
            if 'full_name' in data:
                update_fields.append('full_name = %s')
                update_values.append(data['full_name'])
            
            if 'email' in data:
                update_fields.append('email = %s')
                update_values.append(data['email'])
            
            if 'phone' in data:
                update_fields.append('phone = %s')
                update_values.append(data['phone'])
            
            if 'address' in data:
                update_fields.append('address = %s')
                update_values.append(data['address'])
            
            if not update_fields:
                return create_response(False, error='No fields to update', status_code=400)
            
            update_fields.append('updated_at = %s')
            update_values.append(datetime.now())
            update_values.append(current_user_id)
            
            try:
                cursor.execute(f"""
                    UPDATE users SET {', '.join(update_fields)}
                    WHERE id = %s
                """, update_values)
            except Exception:
                # Fallback for basic schema
                basic_fields = []
                basic_values = []
                
                if 'full_name' in data:
                    basic_fields.append('full_name = %s')
                    basic_values.append(data['full_name'])
                
                if 'email' in data:
                    basic_fields.append('email = %s')
                    basic_values.append(data['email'])
                
                if basic_fields:
                    basic_fields.append('updated_at = %s')
                    basic_values.append(datetime.now())
                    basic_values.append(current_user_id)
                    
                    cursor.execute(f"""
                        UPDATE users SET {', '.join(basic_fields)}
                        WHERE id = %s
                    """, basic_values)
            
            log_activity('INFO', f'Profile updated for user {current_user_id}', 'auth')
            return create_response(True, {'message': 'Profile updated successfully'})
            
    except Exception as e:
        return create_response(False, error=f'Failed to update profile: {str(e)}', status_code=500)

@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password(current_user_id):
    """Change user password"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['current_password', 'new_password'])
        
        with get_db_cursor() as cursor:
            # Get current password hash
            cursor.execute("SELECT password_hash FROM users WHERE id = %s", (current_user_id,))
            user = cursor.fetchone()
            
            if not user:
                return create_response(False, error='User not found', status_code=404)
            
            # Verify current password
            if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user[0].encode('utf-8')):
                return create_response(False, error='Current password is incorrect', status_code=400)
            
            # Hash new password
            new_password_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update password
            cursor.execute("""
                UPDATE users SET password_hash = %s, updated_at = %s
                WHERE id = %s
            """, (new_password_hash, datetime.now(), current_user_id))
            
            log_activity('INFO', f'Password changed for user {current_user_id}', 'auth')
            return create_response(True, {'message': 'Password changed successfully'})
            
    except Exception as e:
        return create_response(False, error=f'Failed to change password: {str(e)}', status_code=500)

@auth_bp.route('/network-status', methods=['GET'])
def network_status():
    """Get current network status for debugging"""
    try:
        from flask import g
        from ..middleware.network_detection import detect_network
        
        # Ensure network detection
        if not hasattr(g, 'network_info'):
            detect_network()
        
        return create_response(True, {
            'network_info': g.network_info,
            'message': 'Network detection working properly'
        })
        
    except Exception as e:
        return create_response(False, error=f'Network status failed: {str(e)}', status_code=500)
