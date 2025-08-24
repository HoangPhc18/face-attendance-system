# Network status API endpoints
from flask import Blueprint, jsonify, g
from ..middleware.network_detection import detect_network, get_network_status, network_detector
from ..core.utils import create_response

network_bp = Blueprint('network', __name__)

@network_bp.route('/status', methods=['GET'])
def check_network_status():
    """Get current network status and client information"""
    try:
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            detect_network()
        
        network_info = get_network_status()
        
        return create_response(True, {
            'client_ip': network_info['client_ip'],
            'network_type': network_info['network_type'],
            'is_internal': network_info['is_internal'],
            'access_level': 'full' if network_info['is_internal'] else 'restricted',
            'message': 'Internal network access' if network_info['is_internal'] else 'External network - authentication required'
        })
        
    except Exception as e:
        return create_response(False, error=f'Network detection failed: {str(e)}', status_code=500)

@network_bp.route('/config', methods=['GET'])
def get_network_config():
    """Get network configuration (for debugging)"""
    try:
        config = {
            'internal_ranges': network_detector.internal_ranges,
            'default_ranges': network_detector.default_internal_ranges
        }
        
        return create_response(True, config)
        
    except Exception as e:
        return create_response(False, error=f'Failed to get network config: {str(e)}', status_code=500)

@network_bp.route('/test/<ip_address>', methods=['GET'])
def test_ip_detection(ip_address):
    """Test IP detection for a specific IP address (for debugging)"""
    try:
        is_internal = network_detector.is_internal_network(ip_address)
        
        return create_response(True, {
            'ip_address': ip_address,
            'is_internal': is_internal,
            'network_type': 'internal' if is_internal else 'external'
        })
        
    except Exception as e:
        return create_response(False, error=f'IP test failed: {str(e)}', status_code=500)
