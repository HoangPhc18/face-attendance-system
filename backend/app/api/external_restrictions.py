# External network restrictions API
from flask import Blueprint, request, jsonify, g
from ..core.database import get_db_cursor
from ..core.utils import create_response, require_external_auth, log_activity

external_restrictions_bp = Blueprint('external_restrictions', __name__)

@external_restrictions_bp.route('/features', methods=['GET'])
def get_available_features():
    """Get available features based on network type"""
    try:
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            from ..middleware.network_detection import detect_network
            detect_network()
        
        if g.is_internal_network:
            # Internal network - full feature access
            features = {
                'face_attendance': True,
                'no_login_required': True,
                'face_enrollment': False,  # Admin only
                'leave_requests': True,
                'reports': True,
                'admin_panel': False,  # Admin only
                'user_management': False,  # Admin only
                'network_type': 'internal'
            }
        else:
            # External network - NO face attendance, limited features only
            features = {
                'face_attendance': False,  # Completely blocked for external network
                'no_login_required': False,
                'face_enrollment': False,  # Admin only
                'leave_requests': True,  # With login required
                'attendance_history': True,  # With login required
                'reports': True,  # With login required
                'admin_panel': False,  # Admin only
                'user_management': False,  # Admin only
                'network_type': 'external',
                'login_required': True,
                'blocked_features': ['face_attendance', 'check_in', 'check_out']
            }
        
        return create_response(True, {
            'features': features,
            'client_ip': g.client_ip,
            'network_type': 'internal' if g.is_internal_network else 'external'
        })
        
    except Exception as e:
        return create_response(False, error=f'Failed to get features: {str(e)}', status_code=500)

@external_restrictions_bp.route('/access-policy', methods=['GET'])
def get_access_policy():
    """Get access policy information"""
    try:
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            from ..middleware.network_detection import detect_network
            detect_network()
        
        policy = {
            'network_type': 'internal' if g.is_internal_network else 'external',
            'client_ip': g.client_ip,
            'policies': {
                'internal_network': {
                    'description': 'Full access to attendance features without login',
                    'attendance': 'Face recognition only - no login required',
                    'leave_requests': 'Available with any valid account',
                    'reports': 'Available with any valid account',
                    'face_enrollment': 'Admin only',
                    'admin_functions': 'Admin only'
                },
                'external_network': {
                    'description': 'Limited access - face attendance completely blocked',
                    'attendance': 'BLOCKED - Internal network only for security',
                    'leave_requests': 'Authentication required',
                    'attendance_history': 'Authentication required (own records only)',
                    'reports': 'Authentication required (own data only)',
                    'face_enrollment': 'Admin only',
                    'admin_functions': 'Admin only'
                }
            }
        }
        
        return create_response(True, policy)
        
    except Exception as e:
        return create_response(False, error=f'Failed to get access policy: {str(e)}', status_code=500)

@external_restrictions_bp.route('/check-access/<feature>', methods=['GET'])
@require_external_auth
def check_feature_access(current_user_id, feature):
    """Check if user has access to specific feature"""
    try:
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            from ..middleware.network_detection import detect_network
            detect_network()
        
        with get_db_cursor() as cursor:
            cursor.execute("SELECT role FROM users WHERE id = %s", (current_user_id,))
            user_role = cursor.fetchone()
            
            if not user_role:
                return create_response(False, error='User not found', status_code=404)
            
            role = user_role[0]
            is_admin = role == 'admin'
            
            # Define feature access rules based on network type
            if g.is_internal_network:
                # Internal network - full access
                feature_rules = {
                    'attendance': True,  # Face recognition without auth
                    'leave_requests': True,  # All users
                    'reports': True,  # All users
                    'face_enrollment': is_admin,  # Admin only
                    'admin_panel': is_admin,  # Admin only
                    'user_management': is_admin  # Admin only
                }
            else:
                # External network - limited access, no attendance
                feature_rules = {
                    'attendance': False,  # BLOCKED for external network
                    'leave_requests': True,  # Authenticated users only
                    'attendance_history': True,  # Authenticated users (own records)
                    'reports': True,  # Authenticated users (own data)
                    'face_enrollment': is_admin,  # Admin only
                    'admin_panel': is_admin,  # Admin only
                    'user_management': is_admin  # Admin only
                }
            
            has_access = feature_rules.get(feature, False)
            
            return create_response(True, {
                'feature': feature,
                'has_access': has_access,
                'user_role': role,
                'network_type': 'internal' if g.is_internal_network else 'external',
                'requires_auth': not g.is_internal_network or feature in ['face_enrollment', 'admin_panel', 'user_management']
            })
            
    except Exception as e:
        return create_response(False, error=f'Failed to check feature access: {str(e)}', status_code=500)
