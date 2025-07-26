# Cấu hình ứng dụng backend Flask
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask/Backend
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret')

    # Database (PostgreSQL mặc định)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost:5432/attendance_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Uploads
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '../uploads')
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg').split(','))

    # AI Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

    # Face recognition
    FACE_MATCH_THRESHOLD = float(os.getenv('FACE_MATCH_THRESHOLD', 0.5))

    # Liveness detection
    LIVENESS_MODEL_PATH = os.getenv('LIVENESS_MODEL_PATH', '../models/liveness.model')

    # Security
    ENCRYPT_KEY = os.getenv('ENCRYPT_KEY', 'your-encrypt-key')

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

