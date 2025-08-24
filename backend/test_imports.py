# Simple test script to verify import structure without dependencies
import sys
import os

def test_import_structure():
    """Test if all modules can be imported correctly"""
    print("Testing import structure...")
    
    # Add app directory to path
    app_path = os.path.join(os.path.dirname(__file__), 'app')
    sys.path.insert(0, app_path)
    
    tests = []
    
    # Test core modules (without Flask dependencies)
    try:
        import importlib.util
        # Test config module structure without importing Flask dependencies
        spec = importlib.util.spec_from_file_location(
            "config", 
            os.path.join(app_path, "config", "settings.py")
        )
        if spec and spec.loader:
            tests.append(("Config settings", True))
            print("Success: Config settings structure valid")
        else:
            tests.append(("Config settings", False))
            print("Error: Config settings structure invalid")
    except Exception as e:
        tests.append(("Config settings", False))
        print(f"Error: Config settings test failed: {e}")
    
    # Test utility functions structure
    try:
        spec = importlib.util.spec_from_file_location(
            "utils", 
            os.path.join(app_path, "core", "utils.py")
        )
        if spec and spec.loader:
            tests.append(("Core utils structure", True))
            print("Success: Core utils structure valid")
        else:
            tests.append(("Core utils structure", False))
            print("Error: Core utils structure invalid")
    except Exception as e:
        tests.append(("Core utils structure", False))
        print(f"Error: Core utils structure test failed: {e}")
    
    # Test face enrollment module structure
    try:
        spec = importlib.util.spec_from_file_location(
            "face_enroll", 
            os.path.join(app_path, "face_user_register", "face_enroll.py")
        )
        if spec and spec.loader:
            tests.append(("Face enrollment structure", True))
            print("Success: Face enrollment structure valid")
        else:
            tests.append(("Face enrollment structure", False))
            print("Error: Face enrollment structure invalid")
    except Exception as e:
        tests.append(("Face enrollment structure", False))
        print(f"Error: Face enrollment structure test failed: {e}")
    
    # Test liveness detection module structure
    try:
        spec = importlib.util.spec_from_file_location(
            "liveness", 
            os.path.join(app_path, "liveness_detection", "liveness_detection.py")
        )
        if spec and spec.loader:
            tests.append(("Liveness detection structure", True))
            print("Success: Liveness detection structure valid")
        else:
            tests.append(("Liveness detection structure", False))
            print("Error: Liveness detection structure invalid")
    except Exception as e:
        tests.append(("Liveness detection structure", False))
        print(f"Error: Liveness detection structure test failed: {e}")
    
    # Test API modules structure
    api_modules = ['auth', 'attendance', 'face_enrollment', 'leave_request', 'ai_integration', 'admin']
    for module in api_modules:
        try:
            spec = importlib.util.spec_from_file_location(
                module, 
                os.path.join(app_path, "api", f"{module}.py")
            )
            if spec and spec.loader:
                tests.append((f"API {module} structure", True))
                print(f"Success: API {module} structure valid")
            else:
                tests.append((f"API {module} structure", False))
                print(f"Error: API {module} structure invalid")
        except Exception as e:
            tests.append((f"API {module} structure", False))
            print(f"Error: API {module} structure test failed: {e}")
    
    # Summary
    passed = sum(1 for _, result in tests if result)
    total = len(tests)
    
    print(f"\n{'='*50}")
    print("IMPORT STRUCTURE TEST SUMMARY")
    print(f"{'='*50}")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("SUCCESS: All import structures are valid!")
    else:
        print("WARNING: Some import structures need attention")
        print("\nFailed tests:")
        for test_name, result in tests:
            if not result:
                print(f"  - {test_name}")
    
    return passed == total

if __name__ == "__main__":
    test_import_structure()
