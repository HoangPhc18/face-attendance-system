#!/usr/bin/env python3
"""
Test script for new face enrollment workflow
Tests the new 2-step process: Create user → Capture face
"""

import requests
import json
import base64
import cv2
import numpy as np

BASE_URL = "http://localhost:5000"

def get_admin_token():
    """Get admin JWT token"""
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        return data['data']['token']
    else:
        print(f"❌ Login failed: {response.text}")
        return None

def test_step1_create_user(token):
    """Test Step 1: Create user account"""
    print("\n🧪 TESTING STEP 1: Create User Account")
    print("-" * 40)
    
    user_data = {
        "username": "test_employee",
        "full_name": "Test Employee",
        "email": "test.employee@company.com",
        "role": "user"
    }
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f"{BASE_URL}/api/face_enrollment/create-user", 
                           json=user_data, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        data = response.json()
        user_id = data['data']['user_id']
        print(f"✅ User created successfully! User ID: {user_id}")
        return user_id
    else:
        print("❌ User creation failed!")
        return None

def create_dummy_face_image():
    """Create a dummy face image for testing"""
    # Create a simple test image (you would normally get this from camera)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Draw a simple face-like shape
    cv2.circle(img, (320, 240), 100, (255, 255, 255), -1)  # Face
    cv2.circle(img, (290, 210), 20, (0, 0, 0), -1)         # Left eye
    cv2.circle(img, (350, 210), 20, (0, 0, 0), -1)         # Right eye
    cv2.ellipse(img, (320, 270), (30, 15), 0, 0, 180, (0, 0, 0), 2)  # Mouth
    
    # Convert to base64
    _, buffer = cv2.imencode('.jpg', img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{img_base64}"

def test_step2_capture_face(token, user_id):
    """Test Step 2: Capture face from camera"""
    print("\n🧪 TESTING STEP 2: Capture Face from Camera")
    print("-" * 40)
    
    # Create dummy face image (in real app, this comes from camera)
    face_image_base64 = create_dummy_face_image()
    
    capture_data = {
        "user_id": user_id,
        "face_image": face_image_base64
    }
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f"{BASE_URL}/api/face_enrollment/capture-face", 
                           json=capture_data, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Face captured and registered successfully!")
        return True
    else:
        print("❌ Face capture failed!")
        return False

def test_get_users_without_face(token):
    """Test getting users without face"""
    print("\n🧪 TESTING: Get Users Without Face")
    print("-" * 40)
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{BASE_URL}/api/face_enrollment/users-without-face", 
                          headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_user_status(token, user_id):
    """Test getting user enrollment status"""
    print(f"\n🧪 TESTING: Get User Status (ID: {user_id})")
    print("-" * 40)
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{BASE_URL}/api/face_enrollment/user-status/{user_id}", 
                          headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def main():
    """Main test function"""
    print("🧪 FACE ENROLLMENT WORKFLOW TEST")
    print("=" * 50)
    
    # Step 0: Get admin token
    print("🔑 Getting admin token...")
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin token")
        return
    
    print("✅ Admin token obtained")
    
    # Test getting users without face (before)
    test_get_users_without_face(token)
    
    # Step 1: Create user account
    user_id = test_step1_create_user(token)
    if not user_id:
        print("❌ Cannot proceed without user ID")
        return
    
    # Check user status after creation
    test_user_status(token, user_id)
    
    # Step 2: Capture face
    success = test_step2_capture_face(token, user_id)
    if not success:
        print("❌ Face capture failed")
        return
    
    # Check user status after face capture
    test_user_status(token, user_id)
    
    # Test getting users without face (after)
    test_get_users_without_face(token)
    
    print("\n" + "=" * 50)
    print("🎉 WORKFLOW TEST COMPLETED!")
    print("\n📋 NEW WORKFLOW SUMMARY:")
    print("1. ✅ Admin creates user account")
    print("2. ✅ Admin captures face from camera")
    print("3. ✅ Face is linked to user account")
    print("4. ✅ User can now use face attendance")

if __name__ == "__main__":
    main()
