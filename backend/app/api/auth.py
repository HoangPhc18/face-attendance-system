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
    """User login endpoint"""
    try:
        data = request.get_json()
        validate_required_fields(data, ['username', 'password'])
        
        username = data['username']
        password = data['password']
        
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT id, username, full_name, email, role, password_hash FROM users WHERE username = %s",
                (username,)
            )
            user = cursor.fetchone()
            
            if not user:
                return create_response(False, error='Invalid username or password', status_code=401)
            
            # Verify password with bcrypt
            if not bcrypt.checkpw(password.encode('utf-8'), user[5].encode('utf-8')):
                return create_response(False, error='Invalid username or password', status_code=401)
            
            # Generate JWT token
            token_payload = {
                'user_id': user[0],
                'username': user[1],
                'role': user[4],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }
            
            token = jwt.encode(token_payload, Config.SECRET_KEY, algorithm='HS256')
            
            return create_response(True, {
                'token': token,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'full_name': user[2],
                    'email': user[3],
                    'role': user[4]
                }
            })
            
    except ValueError as e:
        return create_response(False, error=str(e), status_code=400)
    except Exception as e:
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
        
        data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        
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
