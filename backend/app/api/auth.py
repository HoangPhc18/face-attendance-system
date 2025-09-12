# Authentication API routes
from flask import Blueprint, request, jsonify
import jwt
import bcrypt
from datetime import datetime, timedelta
from ..core.database import get_db_cursor
from ..core.utils import create_response, validate_required_fields, require_external_auth
from ..config.settings import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint - works for all network types"""
    try:
        # Add network info for debugging
        from flask import g
        from ..middleware.network_detection import detect_network
        
        # Ensure network detection
        if not hasattr(g, 'network_info'):
            detect_network()
        
        data = request.get_json()
        if not data:
            return create_response(False, error='No JSON data provided', status_code=400)
            
        validate_required_fields(data, ['username', 'password'])
        
        username = data['username']
        password = data['password']
        
        # Debug info
        print(f"Login attempt - Username: {username}, Network: {g.network_info['network_type']}, IP: {g.client_ip}")
        
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT id, username, full_name, email, role, password_hash FROM users WHERE username = %s AND is_active = TRUE",
                (username,)
            )
            user = cursor.fetchone()
            
            if not user:
                print(f"User not found: {username}")
                return create_response(False, error='Invalid username or password', status_code=401)
            
            # Check if password_hash exists
            if not user[5]:
                print(f"No password hash for user: {username}")
                return create_response(False, error='Account setup incomplete. Please contact administrator.', status_code=401)
            
            # Verify password with bcrypt
            try:
                if not bcrypt.checkpw(password.encode('utf-8'), user[5].encode('utf-8')):
                    print(f"Password mismatch for user: {username}")
                    return create_response(False, error='Invalid username or password', status_code=401)
            except Exception as pwd_error:
                print(f"Password verification error: {pwd_error}")
                return create_response(False, error='Password verification failed', status_code=500)
            
            # Generate JWT token
            token_payload = {
                'user_id': user[0],
                'username': user[1],
                'role': user[4],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }
            
            try:
                token = jwt.encode(token_payload, Config.JWT_SECRET_KEY, algorithm='HS256')
            except Exception as jwt_error:
                print(f"JWT encoding error: {jwt_error}")
                return create_response(False, error='Token generation failed', status_code=500)
            
            print(f"Login successful for user: {username}")
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
        print(f"Validation error: {e}")
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
        print(f"Login error: {e}")
        return create_response(False, error=f'Login failed: {str(e)}', status_code=500)

@auth_bp.route('/verify', methods=['GET', 'POST'])
def verify_token():
    """Verify JWT token"""
    try:
        token = request.headers.get('Authorization')
        
        if not token:
            return create_response(False, error='Token is missing', status_code=401)
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        
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
