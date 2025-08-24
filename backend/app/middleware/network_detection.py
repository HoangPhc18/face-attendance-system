# Network detection middleware
import os
import ipaddress
from flask import request, g
from functools import wraps

class NetworkDetector:
    """Network detection utility class"""
    
    def __init__(self):
        # Default internal IP ranges
        self.default_internal_ranges = [
            '192.168.0.0/16',    # Private Class C
            '10.0.0.0/8',        # Private Class A  
            '172.16.0.0/12',     # Private Class B
            '127.0.0.0/8',       # Localhost
            '::1/128',           # IPv6 localhost
            'fc00::/7',          # IPv6 unique local
        ]
        
        # Load custom ranges from environment
        self.internal_ranges = self._load_internal_ranges()
    
    def _load_internal_ranges(self):
        """Load internal IP ranges from environment variables"""
        custom_ranges = os.getenv('INTERNAL_IP_RANGES', '').strip()
        
        if custom_ranges:
            try:
                # Parse comma-separated ranges
                ranges = [r.strip() for r in custom_ranges.split(',') if r.strip()]
                # Validate each range
                validated_ranges = []
                for range_str in ranges:
                    try:
                        ipaddress.ip_network(range_str, strict=False)
                        validated_ranges.append(range_str)
                    except ValueError:
                        print(f"Warning: Invalid IP range in config: {range_str}")
                
                if validated_ranges:
                    return validated_ranges
            except Exception as e:
                print(f"Error parsing INTERNAL_IP_RANGES: {e}")
        
        return self.default_internal_ranges
    
    def get_client_ip(self):
        """Get client IP address from request"""
        # Check for forwarded headers (proxy/load balancer)
        forwarded_for = request.headers.get('X-Forwarded-For')
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(',')[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        
        # Fall back to remote address
        return request.remote_addr or '127.0.0.1'
    
    def is_internal_network(self, ip_address):
        """Check if IP address is from internal network"""
        if not ip_address:
            return False
        
        try:
            client_ip = ipaddress.ip_address(ip_address)
            
            for range_str in self.internal_ranges:
                try:
                    network = ipaddress.ip_network(range_str, strict=False)
                    if client_ip in network:
                        return True
                except ValueError:
                    continue
            
            return False
            
        except ValueError:
            # Invalid IP address
            return False
    
    def get_network_info(self):
        """Get complete network information"""
        client_ip = self.get_client_ip()
        is_internal = self.is_internal_network(client_ip)
        
        return {
            'client_ip': client_ip,
            'is_internal': is_internal,
            'network_type': 'internal' if is_internal else 'external',
            'internal_ranges': self.internal_ranges
        }

# Global network detector instance
network_detector = NetworkDetector()

def detect_network():
    """Middleware function to detect network and store in Flask g"""
    network_info = network_detector.get_network_info()
    g.network_info = network_info
    g.client_ip = network_info['client_ip']
    g.is_internal_network = network_info['is_internal']

def require_internal_network(f):
    """Decorator to require internal network access"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            detect_network()
        
        if not g.is_internal_network:
            from flask import jsonify
            return jsonify({
                'error': 'Access denied. Internal network required.',
                'message': 'This endpoint is only accessible from internal network.',
                'client_ip': g.client_ip,
                'network_type': 'external'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated

def require_external_auth(f):
    """Decorator to require authentication for external network users"""
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import jsonify
        from ..core.utils import require_auth
        
        # Ensure network detection has run
        if not hasattr(g, 'network_info'):
            detect_network()
        
        # If internal network, allow without auth
        if g.is_internal_network:
            return f(*args, **kwargs)
        
        # If external network, require authentication
        return require_auth(f)(*args, **kwargs)
    
    return decorated

def get_network_status():
    """Get current network status"""
    if not hasattr(g, 'network_info'):
        detect_network()
    
    return g.network_info
