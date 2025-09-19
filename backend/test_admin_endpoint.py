#!/usr/bin/env python3
"""
Test script để kiểm tra admin endpoint
"""

import requests
import json

def test_admin_api():
    """Test admin API endpoints"""
    base_url = "http://localhost:5000"
    
    print("=== TESTING ADMIN API ===")
    
    # 1. Test login để lấy token
    print("\n1. Testing Login...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            print(f"Login Success: {login_result.get('success')}")
            
            if login_result.get('success') and login_result.get('token'):
                token = login_result['token']
                print(f"Token received: {token[:50]}...")
                
                # 2. Test get users với token
                print("\n2. Testing Get Users...")
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                users_response = requests.get(f"{base_url}/api/admin/users", headers=headers)
                print(f"Users API Status: {users_response.status_code}")
                
                if users_response.status_code == 200:
                    users_result = users_response.json()
                    print(f"Users API Success: {users_result.get('success')}")
                    
                    if users_result.get('success'):
                        users_data = users_result.get('data', {})
                        users_list = users_data.get('users', [])
                        print(f"Found {len(users_list)} users")
                        
                        for user in users_list:
                            print(f"  - {user.get('username')} ({user.get('full_name')}) - Role: {user.get('role')} - Has Face: {user.get('has_face')}")
                    else:
                        print(f"Users API Error: {users_result.get('error')}")
                else:
                    print(f"Users API Failed: {users_response.text}")
            else:
                print(f"Login failed: {login_result.get('error')}")
        else:
            print(f"Login request failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Is it running on http://localhost:5000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_admin_api()
