// Network Detection Service - Determines if user is on internal or external network
class NetworkService {
  constructor() {
    this.networkType = null;
    this.clientIP = null;
    this.internalRanges = [
      '192.168.0.0/16',
      '10.0.0.0/8', 
      '172.16.0.0/12',
      '127.0.0.0/8'
    ];
  }

  // Check if IP is in internal network ranges
  isInternalIP(ip) {
    if (!ip) return false;
    
    // Convert IP to number for comparison
    const ipToNumber = (ip) => {
      return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
    };

    // Check CIDR ranges
    const checkCIDR = (ip, cidr) => {
      const [range, bits] = cidr.split('/');
      const mask = ~(2 ** (32 - bits) - 1);
      return (ipToNumber(ip) & mask) === (ipToNumber(range) & mask);
    };

    return this.internalRanges.some(range => checkCIDR(ip, range));
  }

  // Detect network type by calling backend
  async detectNetworkType() {
    try {
      const response = await fetch('/api/network/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.networkType = data.network_type; // 'internal' or 'external'
        this.clientIP = data.client_ip;
        return data;
      }
    } catch (error) {
      console.error('Network detection failed:', error);
      // Fallback to external network for security
      this.networkType = 'external';
    }

    return {
      network_type: this.networkType || 'external',
      client_ip: this.clientIP,
      is_internal: this.networkType === 'internal'
    };
  }

  // Get current network status
  getNetworkStatus() {
    return {
      type: this.networkType,
      ip: this.clientIP,
      isInternal: this.networkType === 'internal',
      isExternal: this.networkType === 'external'
    };
  }

  // Check if feature is available based on network and role
  isFeatureAvailable(feature, userRole = null) {
    const status = this.getNetworkStatus();
    
    switch (feature) {
      case 'face_attendance':
        // Face attendance only available on internal network
        return status.isInternal;
        
      case 'face_enrollment':
        // Face enrollment requires admin role regardless of network
        return userRole === 'admin';
        
      case 'admin_panel':
        // Admin panel requires admin role regardless of network
        return userRole === 'admin';
        
      case 'leave_requests':
      case 'reports':
      case 'statistics':
        // These features available on internal network without auth
        // External network requires authentication
        return status.isInternal || (status.isExternal && userRole);
        
      default:
        return true;
    }
  }

  // Get security warnings for current network
  getSecurityWarnings() {
    const status = this.getNetworkStatus();
    const warnings = [];

    if (status.isExternal) {
      warnings.push({
        type: 'network_security',
        level: 'warning',
        message: 'Bạn đang truy cập từ mạng bên ngoài. Một số tính năng bị hạn chế.',
        details: 'Face attendance không khả dụng từ mạng external.'
      });
    }

    return warnings;
  }
}

export default new NetworkService();
