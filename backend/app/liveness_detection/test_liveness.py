# Test script for liveness detection functionality
import cv2
import numpy as np
import os
import sys
import json
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .liveness_detection import (
    get_liveness_detector, 
    check_liveness_from_image, 
    check_liveness_from_frames
)

def test_liveness_detector_initialization():
    """Test if liveness detector can be initialized properly"""
    print("Testing liveness detector initialization...")
    try:
        detector = get_liveness_detector()
        print("✓ Liveness detector initialized successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize liveness detector: {e}")
        return False

def test_single_image_liveness():
    """Test liveness detection on a single image"""
    print("\nTesting single image liveness detection...")
    
    # Create a simple test image (black image with white rectangle as face)
    test_image = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(test_image, (200, 150), (440, 330), (255, 255, 255), -1)
    
    try:
        is_live, score, message = check_liveness_from_image(test_image)
        print(f"✓ Single image test completed")
        print(f"  Result: {'Live' if is_live else 'Not Live'}")
        print(f"  Score: {score:.3f}")
        print(f"  Message: {message}")
        return True
    except Exception as e:
        print(f"✗ Single image test failed: {e}")
        return False

def test_multi_frame_liveness():
    """Test liveness detection on multiple frames"""
    print("\nTesting multi-frame liveness detection...")
    
    # Create multiple test frames
    frames = []
    for i in range(5):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Simulate slight variations in face position
        offset = i * 5
        cv2.rectangle(frame, (200 + offset, 150), (440 + offset, 330), (255, 255, 255), -1)
        frames.append(frame)
    
    try:
        is_live, score, message = check_liveness_from_frames(frames)
        print(f"✓ Multi-frame test completed")
        print(f"  Result: {'Live' if is_live else 'Not Live'}")
        print(f"  Score: {score:.3f}")
        print(f"  Message: {message}")
        print(f"  Frames analyzed: {len(frames)}")
        return True
    except Exception as e:
        print(f"✗ Multi-frame test failed: {e}")
        return False

def test_webcam_liveness(duration=10):
    """Test liveness detection with webcam (optional)"""
    print(f"\nTesting webcam liveness detection for {duration} seconds...")
    print("Press 'q' to quit early, 's' to capture frames for testing")
    
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("✗ Could not open webcam")
            return False
        
        frames_captured = []
        start_time = datetime.now()
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Display frame
            cv2.imshow('Liveness Test - Press S to capture, Q to quit', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                frames_captured.append(frame.copy())
                print(f"Frame captured ({len(frames_captured)}/5)")
                
                if len(frames_captured) >= 5:
                    print("Testing captured frames...")
                    is_live, score, message = check_liveness_from_frames(frames_captured)
                    print(f"  Result: {'Live' if is_live else 'Not Live'}")
                    print(f"  Score: {score:.3f}")
                    print(f"  Message: {message}")
                    frames_captured = []
            
            # Auto-quit after duration
            if (datetime.now() - start_time).seconds >= duration:
                break
        
        cap.release()
        cv2.destroyAllWindows()
        print("✓ Webcam test completed")
        return True
        
    except Exception as e:
        print(f"✗ Webcam test failed: {e}")
        return False

def run_performance_test():
    """Test performance of liveness detection"""
    print("\nRunning performance test...")
    
    # Create test image
    test_image = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(test_image, (200, 150), (440, 330), (255, 255, 255), -1)
    
    # Test single image performance
    start_time = datetime.now()
    num_tests = 10
    
    for i in range(num_tests):
        check_liveness_from_image(test_image)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    avg_time = duration / num_tests
    
    print(f"✓ Performance test completed")
    print(f"  Average time per image: {avg_time:.3f} seconds")
    print(f"  Images per second: {1/avg_time:.1f}")
    
    return True

def generate_test_report():
    """Generate a comprehensive test report"""
    print("\n" + "="*50)
    print("LIVENESS DETECTION TEST REPORT")
    print("="*50)
    
    tests = [
        ("Detector Initialization", test_liveness_detector_initialization),
        ("Single Image Detection", test_single_image_liveness),
        ("Multi-Frame Detection", test_multi_frame_liveness),
        ("Performance Test", run_performance_test),
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"✗ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Liveness detection is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
    
    return results

if __name__ == "__main__":
    print("Liveness Detection Test Suite")
    print("============================")
    
    # Check if webcam test should be included
    import sys
    include_webcam = "--webcam" in sys.argv
    
    if include_webcam:
        print("Note: Webcam test included. Make sure your camera is connected.")
    
    # Run tests
    results = generate_test_report()
    
    # Optional webcam test
    if include_webcam:
        print("\n--- Webcam Test (Optional) ---")
        test_webcam_liveness()
    
    print("\nTest suite completed!")
