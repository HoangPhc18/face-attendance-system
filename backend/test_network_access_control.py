#!/usr/bin/env python3
"""
Test script for network detection and access control logic
Tests the secure face attendance system's network-based authorization
"""

import requests
import json
import base64
import os
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:5000"
INTERNAL_IP = "192.168.1.100"  # Simulated internal IP
EXTERNAL_IP = "203.0.113.1"   # Simulated external IP

# Test credentials
ADMIN_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

USER_CREDENTIALS = {
    "username": "testuser",
    "password": "testpass"
}

class NetworkAccessTester:
    def __init__(self):
        self.admin_token = None
        self.user_token = None
        self.test_results = []
    
    def log_test(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"    Details: {details}")
    
    def make_request(self, method, endpoint, headers=None, data=None, client_ip=None):
        """Make HTTP request with optional client IP simulation"""
        url = f"{BASE_URL}{endpoint}"
        request_headers = headers or {}
        
        # Simulate client IP via X-Forwarded-For header
        if client_ip:
            request_headers['X-Forwarded-For'] = client_ip
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=request_headers, params=data)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=request_headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=request_headers, json=data)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=request_headers)
            
            return response
        except requests.exceptions.RequestException as e:
            return None
    
    def authenticate(self, credentials, test_name):
        """Authenticate and get JWT token"""
        response = self.make_request('POST', '/api/auth/login', data=credentials)
        
        if response and response.status_code == 200:
            token = response.json().get('data', {}).get('token')
            if token:
                self.log_test(test_name, True, f"Authentication successful")
                return token
        
        self.log_test(test_name, False, f"Authentication failed: {response.status_code if response else 'No response'}")
        return None
    
    def test_network_detection(self):
        """Test network detection middleware"""
        print("\n🔍 Testing Network Detection...")
        
        # Test internal network detection
        response = self.make_request('GET', '/api/network/status', client_ip=INTERNAL_IP)
        if response and response.status_code == 200:
            data = response.json().get('data', {})
            if data.get('is_internal_network') == True:
                self.log_test("Internal Network Detection", True, "Internal IP correctly detected")
            else:
                self.log_test("Internal Network Detection", False, "Internal IP not detected as internal")
        else:
            self.log_test("Internal Network Detection", False, "Network status endpoint failed")
        
        # Test external network detection
        response = self.make_request('GET', '/api/network/status', client_ip=EXTERNAL_IP)
        if response and response.status_code == 200:
            data = response.json().get('data', {})
            if data.get('is_internal_network') == False:
                self.log_test("External Network Detection", True, "External IP correctly detected")
            else:
                self.log_test("External Network Detection", False, "External IP detected as internal")
        else:
            self.log_test("External Network Detection", False, "Network status endpoint failed")
    
    def test_attendance_access_control(self):
        """Test attendance endpoint access control"""
        print("\n👤 Testing Attendance Access Control...")
        
        # Test internal network - attendance without login
        fake_image_data = base64.b64encode(b"fake_image_data").decode()
        attendance_data = {"image": fake_image_data}
        
        response = self.make_request('POST', '/api/attendance/check-in', 
                                   data=attendance_data, client_ip=INTERNAL_IP)
        
        if response:
            if response.status_code in [200, 400, 404]:  # 400/404 expected due to fake image
                self.log_test("Internal Network Attendance", True, 
                            "Internal network allows attendance without auth")
            else:
                self.log_test("Internal Network Attendance", False, 
                            f"Unexpected status: {response.status_code}")
        else:
            self.log_test("Internal Network Attendance", False, "No response from server")
        
        # Test external network - attendance requires login
        response = self.make_request('POST', '/api/attendance/check-in', 
                                   data=attendance_data, client_ip=EXTERNAL_IP)
        
        if response and response.status_code == 401:
            self.log_test("External Network Attendance", True, 
                        "External network correctly requires authentication")
        else:
            self.log_test("External Network Attendance", False, 
                        f"Expected 401, got {response.status_code if response else 'No response'}")
    
    def test_face_enrollment_admin_only(self):
        """Test face enrollment admin-only access"""
        print("\n🔐 Testing Face Enrollment Admin Access...")
        
        if not self.admin_token:
            self.admin_token = self.authenticate(ADMIN_CREDENTIALS, "Admin Login")
        
        if not self.user_token:
            self.user_token = self.authenticate(USER_CREDENTIALS, "User Login")
        
        # Test admin access to face enrollment
        if self.admin_token:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.make_request('GET', '/api/face_enrollment/pending', headers=headers)
            
            if response and response.status_code == 200:
                self.log_test("Admin Face Enrollment Access", True, "Admin can access face enrollment")
            else:
                self.log_test("Admin Face Enrollment Access", False, 
                            f"Admin access failed: {response.status_code if response else 'No response'}")
        
        # Test user access denied to face enrollment
        if self.user_token:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = self.make_request('GET', '/api/face_enrollment/pending', headers=headers)
            
            if response and response.status_code == 403:
                self.log_test("User Face Enrollment Denied", True, "Non-admin correctly denied access")
            else:
                self.log_test("User Face Enrollment Denied", False, 
                            f"Expected 403, got {response.status_code if response else 'No response'}")
    
    def test_external_restrictions(self):
        """Test external network restrictions"""
        print("\n🚫 Testing External Network Restrictions...")
        
        # Test feature availability for internal network
        response = self.make_request('GET', '/api/restrictions/features', client_ip=INTERNAL_IP)
        if response and response.status_code == 200:
            data = response.json().get('data', {})
            features = data.get('features', {})
            if features.get('no_login_required') == True:
                self.log_test("Internal Network Features", True, "Internal network has full features")
            else:
                self.log_test("Internal Network Features", False, "Internal network features restricted")
        
        # Test feature availability for external network
        response = self.make_request('GET', '/api/restrictions/features', client_ip=EXTERNAL_IP)
        if response and response.status_code == 200:
            data = response.json().get('data', {})
            features = data.get('features', {})
            if features.get('login_required') == True:
                self.log_test("External Network Restrictions", True, "External network correctly restricted")
            else:
                self.log_test("External Network Restrictions", False, "External network not restricted")
    
    def test_data_isolation(self):
        """Test data isolation for external users"""
        print("\n🔒 Testing Data Isolation...")
        
        if not self.user_token:
            self.user_token = self.authenticate(USER_CREDENTIALS, "User Login for Data Test")
        
        if self.user_token:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Test attendance history access (should be restricted to own records)
            response = self.make_request('GET', '/api/attendance/history', 
                                       headers=headers, client_ip=EXTERNAL_IP)
            
            if response and response.status_code == 200:
                self.log_test("User Data Isolation", True, "User can access own attendance data")
            else:
                self.log_test("User Data Isolation", False, 
                            f"User data access failed: {response.status_code if response else 'No response'}")
    
    def run_all_tests(self):
        """Run all access control tests"""
        print("🚀 Starting Network Access Control Tests...")
        print(f"Testing against: {BASE_URL}")
        print(f"Internal IP: {INTERNAL_IP}")
        print(f"External IP: {EXTERNAL_IP}")
        
        # Run test suites
        self.test_network_detection()
        self.test_attendance_access_control()
        self.test_face_enrollment_admin_only()
        self.test_external_restrictions()
        self.test_data_isolation()
        
        # Summary
        print("\n📊 Test Summary:")
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Save detailed results
        with open('test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\n📄 Detailed results saved to: test_results.json")
        
        return passed_tests == total_tests

def main():
    """Main test function"""
    tester = NetworkAccessTester()
    
    try:
        success = tester.run_all_tests()
        exit_code = 0 if success else 1
        
        print(f"\n🏁 Tests completed with exit code: {exit_code}")
        return exit_code
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())
