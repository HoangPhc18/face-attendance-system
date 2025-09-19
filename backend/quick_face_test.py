#!/usr/bin/env python3
"""
Quick face detection test - no external dependencies
"""

import cv2
import numpy as np
import os
import sys

def create_simple_face():
    """Create a simple but detectable face"""
    print("Creating simple face image...")
    
    # Create white background
    img = np.ones((480, 640, 3), dtype=np.uint8) * 255
    
    # Face oval (skin color)
    cv2.ellipse(img, (320, 240), (100, 130), 0, 0, 360, (220, 180, 160), -1)
    
    # Eyes (dark circles)
    cv2.circle(img, (280, 200), 20, (50, 50, 50), -1)  # Left eye
    cv2.circle(img, (360, 200), 20, (50, 50, 50), -1)  # Right eye
    
    # Eye highlights
    cv2.circle(img, (280, 200), 8, (255, 255, 255), -1)
    cv2.circle(img, (360, 200), 8, (255, 255, 255), -1)
    
    # Pupils
    cv2.circle(img, (280, 200), 4, (0, 0, 0), -1)
    cv2.circle(img, (360, 200), 4, (0, 0, 0), -1)
    
    # Nose
    cv2.circle(img, (320, 240), 8, (200, 160, 140), -1)
    
    # Mouth
    cv2.ellipse(img, (320, 280), (30, 15), 0, 0, 180, (150, 100, 100), -1)
    
    return img

def test_opencv_face_detection():
    """Test OpenCV's built-in face detection"""
    print("\n=== OpenCV Face Detection Test ===")
    
    img = create_simple_face()
    cv2.imwrite('opencv_test_face.jpg', img)
    print("✅ Test image saved as 'opencv_test_face.jpg'")
    
    # Load OpenCV face cascade
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    if not os.path.exists(cascade_path):
        print("❌ OpenCV face cascade not found")
        return False
    
    face_cascade = cv2.CascadeClassifier(cascade_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    print(f"OpenCV detected {len(faces)} faces")
    
    if len(faces) > 0:
        print("✅ OpenCV face detection works")
        return True
    else:
        print("❌ OpenCV face detection failed")
        return False

def test_face_recognition_lib():
    """Test face_recognition library"""
    print("\n=== face_recognition Library Test ===")
    
    try:
        import face_recognition
        print("✅ face_recognition library imported")
    except ImportError:
        print("❌ face_recognition library not installed")
        return False
    
    img = create_simple_face()
    cv2.imwrite('face_recognition_test.jpg', img)
    
    # Convert to RGB for face_recognition
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Test HOG model
    try:
        face_locations = face_recognition.face_locations(rgb_img, model="hog")
        print(f"HOG model detected {len(face_locations)} faces")
        
        if len(face_locations) > 0:
            print(f"✅ Face found at: {face_locations[0]}")
            
            # Test face encodings
            face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
            if len(face_encodings) > 0:
                print(f"✅ Face encoding generated: {len(face_encodings[0])} features")
                return True
            else:
                print("❌ Could not generate face encoding")
                return False
        else:
            print("❌ No faces detected with HOG model")
            
    except Exception as e:
        print(f"❌ face_recognition error: {e}")
        return False
    
    return False

def create_better_face():
    """Create a more realistic face for better detection"""
    print("Creating better face image...")
    
    # Larger image for better detection
    img = np.ones((600, 800, 3), dtype=np.uint8) * 240
    
    # Face shape
    center = (400, 300)
    cv2.ellipse(img, center, (120, 150), 0, 0, 360, (220, 190, 170), -1)
    
    # Face shading
    cv2.ellipse(img, center, (110, 140), 0, 0, 360, (210, 180, 160), -1)
    
    # Eyes with more detail
    left_eye = (360, 260)
    right_eye = (440, 260)
    
    # Eye sockets
    cv2.circle(img, left_eye, 25, (200, 170, 150), -1)
    cv2.circle(img, right_eye, 25, (200, 170, 150), -1)
    
    # Eyeballs
    cv2.circle(img, left_eye, 15, (255, 255, 255), -1)
    cv2.circle(img, right_eye, 15, (255, 255, 255), -1)
    
    # Pupils
    cv2.circle(img, left_eye, 7, (50, 50, 50), -1)
    cv2.circle(img, right_eye, 7, (50, 50, 50), -1)
    
    # Eyebrows
    cv2.ellipse(img, (left_eye[0], left_eye[1]-25), (20, 8), 0, 0, 180, (100, 80, 60), -1)
    cv2.ellipse(img, (right_eye[0], right_eye[1]-25), (20, 8), 0, 0, 180, (100, 80, 60), -1)
    
    # Nose
    nose_pts = np.array([
        [400, 280],
        [390, 320],
        [400, 325],
        [410, 320]
    ], np.int32)
    cv2.fillPoly(img, [nose_pts], (200, 170, 150))
    
    # Nostrils
    cv2.circle(img, (395, 320), 3, (150, 120, 100), -1)
    cv2.circle(img, (405, 320), 3, (150, 120, 100), -1)
    
    # Mouth
    cv2.ellipse(img, (400, 360), (25, 12), 0, 0, 180, (180, 120, 120), -1)
    cv2.line(img, (375, 360), (425, 360), (150, 100, 100), 2)
    
    # Hair
    cv2.ellipse(img, (400, 200), (100, 50), 0, 0, 180, (80, 60, 40), -1)
    
    return img

def main():
    print("🧪 QUICK FACE DETECTION TEST")
    print("=" * 50)
    
    # Test 1: OpenCV built-in detection
    opencv_works = test_opencv_face_detection()
    
    # Test 2: face_recognition library
    face_rec_works = test_face_recognition_lib()
    
    # Test 3: Better face image
    if not face_rec_works:
        print("\n=== Testing with Better Face Image ===")
        better_img = create_better_face()
        cv2.imwrite('better_face_test.jpg', better_img)
        print("✅ Better face image saved as 'better_face_test.jpg'")
        
        try:
            import face_recognition
            rgb_img = cv2.cvtColor(better_img, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_img, model="hog")
            print(f"Better image: {len(face_locations)} faces detected")
            
            if len(face_locations) > 0:
                print("✅ Better face image works!")
                face_rec_works = True
            
        except Exception as e:
            print(f"❌ Better face test error: {e}")
    
    print("\n" + "=" * 50)
    print("📊 RESULTS:")
    print(f"OpenCV Detection: {'✅ PASS' if opencv_works else '❌ FAIL'}")
    print(f"face_recognition Library: {'✅ PASS' if face_rec_works else '❌ FAIL'}")
    
    if not face_rec_works:
        print("\n💡 SUGGESTIONS:")
        print("1. Check if face_recognition is properly installed")
        print("2. Try using real photos instead of generated images")
        print("3. Ensure proper lighting and image quality")
        print("4. Consider using OpenCV's face detection as fallback")

if __name__ == "__main__":
    main()
