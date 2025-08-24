# Test script to verify liveness detection model path
import os

def test_model_path():
    """Test if the model path is correctly resolved"""
    # Simulate the path resolution from liveness_detection.py
    liveness_file = os.path.join('app', 'liveness_detection', 'liveness_detection.py')
    model_path = os.path.join(os.path.dirname(liveness_file), 'models', 'shape_predictor_68_face_landmarks.dat')
    
    print(f"Liveness detection file: {liveness_file}")
    print(f"Expected model path: {model_path}")
    print(f"Absolute model path: {os.path.abspath(model_path)}")
    print(f"Model exists: {os.path.exists(model_path)}")
    
    # Check if models directory exists
    models_dir = os.path.dirname(model_path)
    print(f"Models directory: {models_dir}")
    print(f"Models directory exists: {os.path.exists(models_dir)}")
    
    if not os.path.exists(models_dir):
        print(f"\nCreating models directory: {models_dir}")
        os.makedirs(models_dir, exist_ok=True)
        print("Models directory created")
    
    if not os.path.exists(model_path):
        print(f"\nModel file not found. Run: python download_liveness_model.py")
        return False
    else:
        print(f"\nModel file found at: {model_path}")
        print("Liveness detection setup is correct!")
    
    return True

if __name__ == "__main__":
    test_model_path()
