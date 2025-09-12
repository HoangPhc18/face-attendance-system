# Common utility functions
import os
import json
import base64
import cv2
import numpy as np
from PIL import Image
import io
from datetime import datetime, date
from functools import wraps
import jwt
from flask import request, jsonify, current_app

def decode_base64_image(base64_string):
    """Decode base64 string to OpenCV image"""
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

def encode_image_to_base64(image):
    """Encode OpenCV image to base64 string"""
    try:
        # Convert to PIL Image
        pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        # Convert to base64
        buffer = io.BytesIO()
        pil_image.save(buffer, format='JPEG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        raise ValueError(f"Failed to encode image: {str(e)}")

def is_internal_network(ip_address):
    """Check if IP address is from internal network"""
    internal_ranges = [
        '192.168.',
        '10.',
        '172.16.',
        '172.17.',
        '172.18.',
        '172.19.',
        '172.20.',
        '172.21.',
        '172.22.',
        '172.23.',
        '172.24.',
        '172.25.',
        '172.26.',
        '172.27.',
        '172.28.',
        '172.29.',
        '172.30.',
        '172.31.',
        '127.0.0.1',
        'localhost'
    ]
    
    return any(ip_address.startswith(range_) for range_ in internal_ranges)

def get_client_ip():
    """Get client IP address from request"""
    if request.environ.get('HTTP_X_FORWARDED_FOR') is None:
        return request.environ['REMOTE_ADDR']
    else:
        return request.environ['HTTP_X_FORWARDED_FOR']

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY', current_app.config['SECRET_KEY']), algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

def require_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        from .database import get_db_cursor
        
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY', current_app.config['SECRET_KEY']), algorithms=['HS256'])
            current_user_id = data['user_id']
            
            # Check if user is admin
            with get_db_cursor() as cursor:
                cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
                result = cursor.fetchone()
                
                if not result:
                    return jsonify({'error': 'User not found'}), 404
                
                user_role = result[0]
                if user_role != 'admin':
                    return jsonify({
                        'error': 'Admin access required',
                        'message': 'Only administrators can perform this action'
                    }), 403
                    
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'error': f'Authorization failed: {str(e)}'}), 500
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

def require_internal_network(f):
    """Decorator to require internal network access"""
    @wraps(f)
    def decorated(*args, **kwargs):
        client_ip = get_client_ip()
        
        if not is_internal_network(client_ip):
            return jsonify({
                'error': 'Access denied. Internal network required.',
                'client_ip': client_ip
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated

def require_external_auth(f):
    """Decorator to require authentication for external network users"""
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import jsonify, g
        
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            from ..middleware.network_detection import detect_network
            detect_network()
        
        # If internal network, allow without auth
        if g.is_internal_network:
            return f(*args, **kwargs)
        
        # If external network, require authentication
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({
                'error': 'Authentication required for external network access',
                'message': 'Please provide valid JWT token',
                'network_type': 'external'
            }), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY', current_app.config['SECRET_KEY']), algorithms=['HS256'])
            current_user_id = data['user_id']
            
            return f(current_user_id, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
    
    return decorated

def require_internal_network_only(f):
    """Decorator to require internal network access only - no external network allowed"""
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import jsonify, g
        
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            from ..middleware.network_detection import detect_network
            detect_network()
        
        # Only allow internal network access
        if not g.is_internal_network:
            return jsonify({
                'error': 'Access denied. This feature is only available from internal network.',
                'message': 'Face attendance is restricted to internal network only for security.',
                'network_type': 'external',
                'client_ip': g.client_ip,
                'allowed_features': ['leave_requests', 'attendance_history', 'reports']
            }), 403
        
        # Internal network - allow without authentication
        return f(*args, **kwargs)
    
    return decorated

def external_network_limited_auth(f):
    """Decorator for external network with limited functionality - requires auth"""
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import jsonify, g
        
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            from ..middleware.network_detection import detect_network
            detect_network()
        
        # If internal network, allow without auth
        if g.is_internal_network:
            return f(*args, **kwargs)
        
        # External network - require authentication for limited features
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({
                'error': 'Authentication required for external network access',
                'message': 'External network requires login for limited features only.',
                'network_type': 'external',
                'client_ip': g.client_ip,
                'available_features': ['leave_requests', 'attendance_history', 'reports']
            }), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, current_app.config.get('JWT_SECRET_KEY', current_app.config['SECRET_KEY']), algorithms=['HS256'])
            current_user_id = data['user_id']
            
            # Pass user_id as first argument for external network users
            return f(current_user_id, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
    
    return decorated

def log_activity(level, message, module=None):
    """Log activity to database"""
    from .database import get_db_cursor
    
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO logs (level, message, module) VALUES (%s, %s, %s)",
                (level, message, module)
            )
    except Exception as e:
        print(f"Failed to log activity: {e}")

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def create_response(success=True, data=None, error=None, message=None, status_code=200):
    """Create standardized API response"""
    response = {
        'success': success,
        'timestamp': datetime.now().isoformat()
    }
    
    if data is not None:
        response['data'] = data
    
    if error is not None:
        response['error'] = error
    
    if message is not None:
        response['message'] = message
    
    return jsonify(response), status_code

def validate_required_fields(data, required_fields):
    """Validate required fields in request data"""
    missing_fields = []
    
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing_fields.append(field)
    
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
    
    return True
