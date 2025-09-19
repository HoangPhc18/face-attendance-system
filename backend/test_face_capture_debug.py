#!/usr/bin/env python3
"""
Debug script for face capture endpoint
Tests the capture-face endpoint with detailed logging
"""

import requests
import json
import base64
import cv2
import numpy as np
from PIL import Image
import io

BASE_URL = "http://localhost:5000"

def get_admin_token():
    """Get admin JWT token"""
    print("🔑 Getting admin token...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login successful")
            return data['data']['token']
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def create_test_user(token):
    """Create a test user"""
    print("\n👤 Creating test user...")
    user_data = {
        "username": f"debug_user_{int(np.random.random() * 10000)}",
        "full_name": "Debug Test User",
        "email": f"debug{int(np.random.random() * 10000)}@test.com",
        "role": "user"
    }
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.post(f"{BASE_URL}/api/face_enrollment/create-user", 
                               json=user_data, headers=headers)
        print(f"Create user status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                user_id = data['data']['user_id']
                print(f"✅ User created successfully! ID: {user_id}")
                return user_id
            else:
                print(f"❌ User creation failed: {data}")
                return None
        else:
            print(f"❌ User creation failed with status {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ User creation error: {e}")
        return None

def create_test_face_image():
    """Create a realistic test face image that face_recognition can detect"""
    print("\n🖼️ Creating realistic test face image...")
    
    # Create a higher resolution image for better face detection
    img = np.ones((600, 800, 3), dtype=np.uint8) * 250  # Light background
    
    # Face parameters
    face_center = (400, 300)
    face_width = 120
    face_height = 160
    
    # Draw face shape (more oval)
    cv2.ellipse(img, face_center, (face_width, face_height), 0, 0, 360, (220, 190, 170), -1)
    
    # Add face shading for more realism
    cv2.ellipse(img, face_center, (face_width-10, face_height-10), 0, 0, 360, (210, 180, 160), -1)
    
    # Eyes (more realistic positioning)
    left_eye = (face_center[0] - 35, face_center[1] - 30)
    right_eye = (face_center[0] + 35, face_center[1] - 30)
    
    # Eye sockets
    cv2.ellipse(img, left_eye, (25, 15), 0, 0, 360, (200, 170, 150), -1)
    cv2.ellipse(img, right_eye, (25, 15), 0, 0, 360, (200, 170, 150), -1)
    
    # Eyeballs
    cv2.circle(img, left_eye, 12, (255, 255, 255), -1)
    cv2.circle(img, right_eye, 12, (255, 255, 255), -1)
    
    # Pupils
    cv2.circle(img, left_eye, 6, (50, 50, 50), -1)
    cv2.circle(img, right_eye, 6, (50, 50, 50), -1)
    
    # Eyebrows
    cv2.ellipse(img, (left_eye[0], left_eye[1]-20), (20, 5), 0, 0, 180, (100, 80, 60), -1)
    cv2.ellipse(img, (right_eye[0], right_eye[1]-20), (20, 5), 0, 0, 180, (100, 80, 60), -1)
    
    # Nose (more detailed)
    nose_tip = (face_center[0], face_center[1] + 10)
    nose_pts = np.array([
        [nose_tip[0], nose_tip[1] - 25],
        [nose_tip[0] - 8, nose_tip[1]],
        [nose_tip[0] + 8, nose_tip[1]],
        [nose_tip[0], nose_tip[1] + 5]
    ], np.int32)
    cv2.fillPoly(img, [nose_pts], (200, 170, 150))
    
    # Nostrils
    cv2.circle(img, (nose_tip[0] - 5, nose_tip[1]), 2, (150, 120, 100), -1)
    cv2.circle(img, (nose_tip[0] + 5, nose_tip[1]), 2, (150, 120, 100), -1)
    
    # Mouth (more realistic)
    mouth_center = (face_center[0], face_center[1] + 50)
    cv2.ellipse(img, mouth_center, (25, 8), 0, 0, 180, (180, 120, 120), -1)
    cv2.line(img, (mouth_center[0] - 25, mouth_center[1]), 
             (mouth_center[0] + 25, mouth_center[1]), (150, 100, 100), 2)
    
    # Add hair
    cv2.ellipse(img, (face_center[0], face_center[1] - 120), (100, 60), 0, 0, 180, (80, 60, 40), -1)
    
    # Add some texture/noise for realism
    noise = np.random.normal(0, 5, img.shape).astype(np.int8)
    img = cv2.add(img, noise.astype(np.uint8))
    
    # Ensure the image is in the right format
    img = np.clip(img, 0, 255).astype(np.uint8)
    
    # Save a copy for debugging
    cv2.imwrite('debug_face_image.jpg', img)
    print("💾 Debug image saved as 'debug_face_image.jpg'")
    
    # Test with face_recognition before sending
    try:
        import face_recognition
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        print(f"🔍 Face detection test: Found {len(face_locations)} faces")
        
        if len(face_locations) == 0:
            print("⚠️ Warning: No faces detected in test image")
        else:
            print(f"✅ Face detected at: {face_locations[0]}")
            
    except ImportError:
        print("⚠️ face_recognition not available for local testing")
    
    # Convert to base64
    _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    img_data_url = f"data:image/jpeg;base64,{img_base64}"
    
    print(f"✅ Test image created - Size: {len(img_data_url)} characters")
    return img_data_url

def test_face_capture(token, user_id, face_image):
    """Test the face capture endpoint"""
    print(f"\n📷 Testing face capture for user ID: {user_id}")
    
    capture_data = {
        "user_id": user_id,
        "face_image": face_image
    }
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print(f"Request data size: {len(json.dumps(capture_data))} bytes")
    print(f"Image data size: {len(face_image)} characters")
    
    try:
        response = requests.post(f"{BASE_URL}/api/face_enrollment/capture-face", 
                               json=capture_data, headers=headers)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Face capture successful!")
                return True
            else:
                print(f"❌ Face capture failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Face capture failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print(f"Raw error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Face capture error: {e}")
        return False

def test_backend_health():
    """Test if backend is running"""
    print("🏥 Testing backend health...")
    try:
        response = requests.get(f"{BASE_URL}/api/test/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 FACE CAPTURE DEBUG TEST")
    print("=" * 50)
    
    # Test backend health
    if not test_backend_health():
        print("❌ Backend is not accessible. Please start the backend server.")
        return
    
    # Get admin token
    token = get_admin_token()
    if not token:
        print("❌ Cannot proceed without admin token")
        return
    
    # Create test user
    user_id = create_test_user(token)
    if not user_id:
        print("❌ Cannot proceed without test user")
        return
    
    # Create test face image
    face_image = create_test_face_image()
    if not face_image:
        print("❌ Cannot proceed without test image")
        return
    
    # Test face capture
    success = test_face_capture(token, user_id, face_image)
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Face capture endpoint is working correctly")
    else:
        print("❌ TESTS FAILED!")
        print("💡 Check the error messages above for debugging")
    
    print("\n🔧 DEBUGGING TIPS:")
    print("1. Make sure backend server is running: python run.py")
    print("2. Check database connection")
    print("3. Verify face_recognition library is installed")
    print("4. Check backend logs for detailed error messages")

if __name__ == "__main__":
    main()
