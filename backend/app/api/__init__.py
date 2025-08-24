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
    from .reports import reports_bp
    from .statistics import statistics_bp
    from .uploads import uploads_bp
    from .notifications import notifications_bp
    from .network import network_bp
    from .external_restrictions import external_restrictions_bp
    from .attendance_extended import attendance_extended_bp
    from .face_enrollment_extended import face_enrollment_extended_bp
    from ..liveness_detection import liveness_bp
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(face_enrollment_bp, url_prefix='/api/face_enrollment')
    app.register_blueprint(leave_request_bp, url_prefix='/api/leave')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(statistics_bp, url_prefix='/api/statistics')
    app.register_blueprint(uploads_bp, url_prefix='/api/uploads')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(network_bp, url_prefix='/api/network')
    app.register_blueprint(external_restrictions_bp, url_prefix='/api/restrictions')
    app.register_blueprint(attendance_extended_bp, url_prefix='/api/attendance/extended')
    app.register_blueprint(face_enrollment_extended_bp, url_prefix='/api/face_enrollment/extended')
    app.register_blueprint(liveness_bp, url_prefix='/api/liveness')
