#!/usr/bin/env python3
"""
System Verification Script for Face Attendance System
Checks if all components are properly configured and working
"""

import os
import sys
import importlib.util
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_environment():
    """Check environment variables"""
    print("🔍 CHECKING ENVIRONMENT VARIABLES")
    print("-" * 40)
    
    required_vars = [
        'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
        'SECRET_KEY', 'JWT_SECRET_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if var == 'DB_PASSWORD':
            if value is not None:
                print(f"✅ {var}: {'(empty)' if value == '' else '(set)'}")
            else:
                print(f"❌ {var}: NOT SET")
                missing_vars.append(var)
        elif value:
            if 'PASSWORD' in var or 'KEY' in var:
                print(f"✅ {var}: {'*' * min(len(value), 10)}")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"❌ {var}: NOT SET")
            missing_vars.append(var)
    
    return len(missing_vars) == 0

def check_dependencies():
    """Check if required packages are installed"""
    print("\n🔍 CHECKING DEPENDENCIES")
    print("-" * 40)
    
    required_packages = [
        'flask', 'flask_cors', 'mysql.connector', 'psycopg2', 
        'bcrypt', 'jwt', 'cv2', 'face_recognition', 'PIL', 'numpy'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            if package == 'mysql.connector':
                import mysql.connector
            elif package == 'cv2':
                import cv2
            elif package == 'PIL':
                from PIL import Image
            else:
                __import__(package)
            print(f"✅ {package}: Available")
        except ImportError:
            print(f"❌ {package}: Missing")
            missing_packages.append(package)
    
    return len(missing_packages) == 0

def check_file_structure():
    """Check if all required files exist"""
    print("\n🔍 CHECKING FILE STRUCTURE")
    print("-" * 40)
    
    required_files = [
        '.env',
        'run.py',
        'requirements.txt',
        'database.sql',
        'app/__init__.py',
        'app/config/settings.py',
        'app/core/database.py',
        'app/core/utils.py',
        'app/api/__init__.py',
        'app/api/auth.py',
        'app/middleware/network_detection.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}: Exists")
        else:
            print(f"❌ {file_path}: Missing")
            missing_files.append(file_path)
    
    return len(missing_files) == 0

def check_database_connection():
    """Check database connection"""
    print("\n🔍 CHECKING DATABASE CONNECTION")
    print("-" * 40)
    
    try:
        from app.core.database import test_connection
        if test_connection():
            print("✅ Database connection: Success")
            return True
        else:
            print("❌ Database connection: Failed")
            return False
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

def check_imports():
    """Check if app can be imported"""
    print("\n🔍 CHECKING APP IMPORTS")
    print("-" * 40)
    
    try:
        from app import create_app
        print("✅ App import: Success")
        
        app = create_app()
        print("✅ App creation: Success")
        return True
    except Exception as e:
        print(f"❌ App import/creation error: {e}")
        return False

def check_api_endpoints():
    """Check if API blueprints are registered"""
    print("\n🔍 CHECKING API ENDPOINTS")
    print("-" * 40)
    
    try:
        from app import create_app
        app = create_app()
        
        # Get all registered routes
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append(rule.rule)
        
        required_endpoints = [
            '/api/auth/login',
            '/api/auth/verify',
            '/api/test/health',
            '/api/test/ping'
        ]
        
        all_found = True
        for endpoint in required_endpoints:
            if endpoint in routes:
                print(f"✅ {endpoint}: Registered")
            else:
                print(f"❌ {endpoint}: Missing")
                all_found = False
        
        print(f"\n📊 Total routes registered: {len(routes)}")
        return all_found
        
    except Exception as e:
        print(f"❌ API endpoint check error: {e}")
        return False

def main():
    """Main verification function"""
    print("🧪 FACE ATTENDANCE SYSTEM - VERIFICATION")
    print("=" * 50)
    
    checks = [
        ("Environment Variables", check_environment),
        ("Dependencies", check_dependencies),
        ("File Structure", check_file_structure),
        ("App Imports", check_imports),
        ("API Endpoints", check_api_endpoints),
        ("Database Connection", check_database_connection)
    ]
    
    results = []
    for check_name, check_func in checks:
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"❌ {check_name} check failed: {e}")
            results.append((check_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 VERIFICATION SUMMARY")
    print("=" * 50)
    
    passed = 0
    for check_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {check_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Results: {passed}/{len(results)} checks passed")
    
    if passed == len(results):
        print("\n🎉 ALL CHECKS PASSED!")
        print("✅ System is ready to run")
        print("\n🚀 Next steps:")
        print("1. python run.py (start server)")
        print("2. Test login: admin / admin123")
        print("3. Access: http://localhost:5000/api/test/health")
    else:
        print("\n❌ SOME CHECKS FAILED!")
        print("💡 Please fix the issues above before running the system")
        print("\n🔧 Common solutions:")
        print("1. pip install -r requirements.txt")
        print("2. Copy .env.example to .env and configure")
        print("3. Create database and import database.sql")

if __name__ == "__main__":
    main()
