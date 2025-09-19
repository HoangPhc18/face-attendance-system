#!/usr/bin/env python3
"""
Simple face detection test without external dependencies
"""

import cv2
import numpy as np
import base64
import json
import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.core.utils import decode_base64_image
    import face_recognition
    print("✅ All required modules imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def create_realistic_face_image():
    """Create a realistic test face image"""
    print("🖼️ Creating realistic test face image...")
    
    # Create a higher resolution image
    img = np.ones((600, 800, 3), dtype=np.uint8) * 250
    
    # Face parameters
    face_center = (400, 300)
    face_width = 120
    face_height = 160
    
    # Draw face shape
    cv2.ellipse(img, face_center, (face_width, face_height), 0, 0, 360, (220, 190, 170), -1)
    cv2.ellipse(img, face_center, (face_width-10, face_height-10), 0, 0, 360, (210, 180, 160), -1)
    
    # Eyes
    left_eye = (face_center[0] - 35, face_center[1] - 30)
    right_eye = (face_center[0] + 35, face_center[1] - 30)
    
    # Eye sockets and eyeballs
    cv2.ellipse(img, left_eye, (25, 15), 0, 0, 360, (200, 170, 150), -1)
    cv2.ellipse(img, right_eye, (25, 15), 0, 0, 360, (200, 170, 150), -1)
    cv2.circle(img, left_eye, 12, (255, 255, 255), -1)
    cv2.circle(img, right_eye, 12, (255, 255, 255), -1)
    cv2.circle(img, left_eye, 6, (50, 50, 50), -1)
    cv2.circle(img, right_eye, 6, (50, 50, 50), -1)
    
    # Eyebrows
    cv2.ellipse(img, (left_eye[0], left_eye[1]-20), (20, 5), 0, 0, 180, (100, 80, 60), -1)
    cv2.ellipse(img, (right_eye[0], right_eye[1]-20), (20, 5), 0, 0, 180, (100, 80, 60), -1)
    
    # Nose
    nose_tip = (face_center[0], face_center[1] + 10)
    nose_pts = np.array([
        [nose_tip[0], nose_tip[1] - 25],
        [nose_tip[0] - 8, nose_tip[1]],
        [nose_tip[0] + 8, nose_tip[1]],
        [nose_tip[0], nose_tip[1] + 5]
    ], np.int32)
    cv2.fillPoly(img, [nose_pts], (200, 170, 150))
    cv2.circle(img, (nose_tip[0] - 5, nose_tip[1]), 2, (150, 120, 100), -1)
    cv2.circle(img, (nose_tip[0] + 5, nose_tip[1]), 2, (150, 120, 100), -1)
    
    # Mouth
    mouth_center = (face_center[0], face_center[1] + 50)
    cv2.ellipse(img, mouth_center, (25, 8), 0, 0, 180, (180, 120, 120), -1)
    cv2.line(img, (mouth_center[0] - 25, mouth_center[1]), 
             (mouth_center[0] + 25, mouth_center[1]), (150, 100, 100), 2)
    
    # Hair
    cv2.ellipse(img, (face_center[0], face_center[1] - 120), (100, 60), 0, 0, 180, (80, 60, 40), -1)
    
    # Add texture
    noise = np.random.normal(0, 5, img.shape).astype(np.int8)
    img = cv2.add(img, noise.astype(np.uint8))
    img = np.clip(img, 0, 255).astype(np.uint8)
    
    return img

def test_face_detection():
    """Test face detection with our image"""
    print("🧪 FACE DETECTION TEST")
    print("=" * 50)
    
    # Create test image
    img = create_realistic_face_image()
    
    # Save for debugging
    cv2.imwrite('test_face_debug.jpg', img)
    print("💾 Test image saved as 'test_face_debug.jpg'")
    
    # Test 1: Direct face_recognition test
    print("\n🔍 Test 1: Direct face_recognition test")
    try:
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_img)
        print(f"Face locations found: {len(face_locations)}")
        
        if len(face_locations) > 0:
            print(f"✅ Face detected at: {face_locations[0]}")
            
            # Test face encodings
            face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
            if len(face_encodings) > 0:
                print(f"✅ Face encoding generated: {len(face_encodings[0])} features")
            else:
                print("❌ Could not generate face encoding")
        else:
            print("❌ No faces detected")
            
    except Exception as e:
        print(f"❌ Face recognition error: {e}")
    
    # Test 2: Base64 conversion and decode test
    print("\n🔄 Test 2: Base64 conversion test")
    try:
        # Convert to base64
        _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        img_data_url = f"data:image/jpeg;base64,{img_base64}"
        
        print(f"Base64 size: {len(img_data_url)} characters")
        
        # Test decode
        decoded_img = decode_base64_image(img_data_url)
        print(f"✅ Image decoded successfully: {decoded_img.shape}")
        
        # Test face detection on decoded image
        rgb_decoded = cv2.cvtColor(decoded_img, cv2.COLOR_BGR2RGB)
        face_locations_decoded = face_recognition.face_locations(rgb_decoded)
        print(f"Faces in decoded image: {len(face_locations_decoded)}")
        
        if len(face_locations_decoded) > 0:
            print("✅ Face detection works on decoded image")
        else:
            print("❌ Face detection failed on decoded image")
            
    except Exception as e:
        print(f"❌ Base64 test error: {e}")
    
    # Test 3: Different face detection models
    print("\n🤖 Test 3: Different detection models")
    try:
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Test HOG model (default)
        faces_hog = face_recognition.face_locations(rgb_img, model="hog")
        print(f"HOG model: {len(faces_hog)} faces")
        
        # Test CNN model (more accurate but slower)
        faces_cnn = face_recognition.face_locations(rgb_img, model="cnn")
        print(f"CNN model: {len(faces_cnn)} faces")
        
    except Exception as e:
        print(f"❌ Model test error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 RECOMMENDATIONS:")
    print("1. Check if the generated face image looks realistic")
    print("2. Try different face_recognition models (HOG vs CNN)")
    print("3. Adjust image quality and size")
    print("4. Ensure proper lighting and contrast in real images")

if __name__ == "__main__":
    test_face_detection()
