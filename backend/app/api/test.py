# Test API endpoints without database dependency
from flask import Blueprint, jsonify
from ..core.utils import create_response

test_bp = Blueprint('test', __name__)

@test_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return create_response(True, {
        'status': 'healthy',
        'message': 'Backend server is running',
        'timestamp': '2025-09-12T16:33:29+07:00'
    })

@test_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint"""
    return jsonify({'message': 'pong'})

@test_bp.route('/endpoints', methods=['GET'])
def list_endpoints():
    """List available API endpoints"""
    endpoints = {
        'auth': [
            '/api/auth/login',
            '/api/auth/network-status',
            '/api/auth/verify'
        ],
        'liveness': [
            '/api/liveness/status',
            '/api/liveness/check_image',
            '/api/liveness/check_frames'
        ],
        'test': [
            '/api/test/health',
            '/api/test/ping',
            '/api/test/endpoints'
        ],
        'admin': [
            '/api/admin/users (requires auth)',
            '/api/admin/stats (requires auth)'
        ]
    }
    return create_response(True, {
        'message': 'Available API endpoints',
        'endpoints': endpoints
    })
