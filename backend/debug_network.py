#!/usr/bin/env python3
"""
Debug network detection issues
"""

import os
import socket
import ipaddress
from dotenv import load_dotenv

# Load environment variables
load_dotenv('config.env')

def get_local_ip():
    """Get local IP address"""
    try:
        # Connect to a remote server to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"Error getting local IP: {e}")
        return "127.0.0.1"

def check_ip_in_ranges(ip, ranges):
    """Check if IP is in internal ranges"""
    try:
        ip_obj = ipaddress.ip_address(ip)
        for range_str in ranges:
            try:
                network = ipaddress.ip_network(range_str, strict=False)
                if ip_obj in network:
                    return True, range_str
            except Exception as e:
                print(f"Invalid range {range_str}: {e}")
        return False, None
    except Exception as e:
        print(f"Invalid IP {ip}: {e}")
        return False, None

def main():
    print("=== NETWORK DETECTION DEBUG ===\n")
    
    # Get current IP
    local_ip = get_local_ip()
    print(f"🌐 Local IP Address: {local_ip}")
    
    # Get configured ranges
    internal_ranges = os.getenv('INTERNAL_IP_RANGES', '192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,127.0.0.1/32')
    ranges_list = [r.strip() for r in internal_ranges.split(',')]
    
    print(f"📋 Configured Internal Ranges:")
    for i, range_str in enumerate(ranges_list, 1):
        print(f"   {i}. {range_str}")
    
    # Check if current IP is internal
    is_internal, matched_range = check_ip_in_ranges(local_ip, ranges_list)
    
    print(f"\n🔍 Network Detection Result:")
    if is_internal:
        print(f"   ✅ INTERNAL NETWORK")
        print(f"   📍 Matched Range: {matched_range}")
        print(f"   🎯 Expected Behavior: Face attendance allowed without login")
    else:
        print(f"   ❌ EXTERNAL NETWORK")
        print(f"   🚫 No matching range found")
        print(f"   🎯 Expected Behavior: Login required, face attendance blocked")
    
    # Test specific IPs
    print(f"\n🧪 Testing Common IP Ranges:")
    test_ips = [
        "127.0.0.1",      # Localhost
        "192.168.1.100",  # Common home network
        "192.168.0.1",    # Router IP
        "10.0.0.1",       # Private Class A
        "172.16.0.1",     # Private Class B
        "8.8.8.8",        # External (Google DNS)
        local_ip          # Current IP
    ]
    
    for test_ip in test_ips:
        is_internal_test, matched = check_ip_in_ranges(test_ip, ranges_list)
        status = "✅ INTERNAL" if is_internal_test else "❌ EXTERNAL"
        range_info = f" (matches {matched})" if matched else ""
        print(f"   {test_ip:<15} → {status}{range_info}")
    
    # Recommendations
    print(f"\n💡 RECOMMENDATIONS:")
    
    if not is_internal:
        print(f"   1. Add your IP range to config.env:")
        
        # Suggest IP range based on current IP
        try:
            ip_obj = ipaddress.ip_address(local_ip)
            if local_ip.startswith('192.168.'):
                suggested_range = f"{local_ip.rsplit('.', 1)[0]}.0/24"
            elif local_ip.startswith('10.'):
                suggested_range = f"{local_ip.rsplit('.', 1)[0]}.0/24"
            elif local_ip.startswith('172.'):
                suggested_range = f"{local_ip.rsplit('.', 1)[0]}.0/24"
            else:
                suggested_range = f"{local_ip}/32"
            
            current_ranges = internal_ranges
            new_ranges = f"{current_ranges},{suggested_range}"
            
            print(f"      INTERNAL_IP_RANGES={new_ranges}")
            
        except:
            print(f"      INTERNAL_IP_RANGES={internal_ranges},{local_ip}/32")
    
    print(f"   2. Restart backend server after config change")
    print(f"   3. Clear browser cache and reload frontend")
    print(f"   4. Check browser network tab for API calls to /api/network/status")
    
    print(f"\n🔧 QUICK FIX:")
    print(f"   If you want to force internal network for testing:")
    print(f"   Add this to config.env: INTERNAL_IP_RANGES=0.0.0.0/0")
    print(f"   (This allows ALL IPs as internal - use only for testing!)")

if __name__ == "__main__":
    main()
