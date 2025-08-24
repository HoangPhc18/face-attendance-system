# API routes package
from flask import Blueprint

def register_blueprints(app):
    """Register all API blueprints"""
    from .auth import auth_bp
    from .attendance import attendance_bp
    from .face_enrollment import face_enrollment_bp
    from .leave_request import leave_request_bp
    from .ai_integration import ai_bp
    from .admin import admin_bp
    from ..liveness_detection import liveness_bp
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(face_enrollment_bp, url_prefix='/api/face')
    app.register_blueprint(leave_request_bp, url_prefix='/api/leave')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(liveness_bp, url_prefix='/api/liveness')
