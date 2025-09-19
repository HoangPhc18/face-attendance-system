# Test API endpoints without database dependency
from flask import Blueprint, jsonify
from datetime import datetime
from ..core.utils import create_response

test_bp = Blueprint('test', __name__)

@test_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return create_response(True, {
        'status': 'healthy',
        'message': 'Face Attendance System Backend is running',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@test_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint"""
    return jsonify({'message': 'pong'})

@test_bp.route('/endpoints', methods=['GET'])
def list_endpoints():
    """List available API endpoints"""
    endpoints = {
        'authentication': [
            'POST /api/auth/login',
            'GET /api/auth/verify',
            'GET /api/auth/network-status'
        ],
        'attendance': [
            'POST /api/attendance/check-in',
            'GET /api/attendance/history',
            'GET /api/attendance/stats'
        ],
        'face_enrollment': [
            'POST /api/face_enrollment/create-user (admin only)',
            'POST /api/face_enrollment/capture-face (admin only)',
            'GET /api/face_enrollment/users-without-face (admin only)',
            'GET /api/face_enrollment/user-status/<user_id> (admin only)'
        ],
        'admin': [
            'GET /api/admin/users (admin only)',
            'GET /api/admin/stats (admin only)',
            'POST /api/admin/users (admin only)'
        ],
        'reports': [
            'GET /api/reports/attendance',
            'GET /api/reports/salary',
            'GET /api/reports/dashboard'
        ],
        'liveness': [
            'GET /api/liveness/status',
            'POST /api/liveness/check_image',
            'POST /api/liveness/check_frames'
        ],
        'system': [
            'GET /api/test/health',
            'GET /api/test/ping',
            'GET /api/test/endpoints'
        ]
    }
    return create_response(True, {
        'message': 'Face Attendance System API Endpoints',
        'total_endpoints': sum(len(v) for v in endpoints.values()),
        'endpoints': endpoints,
        'documentation': '/api/docs (if available)'
    })
