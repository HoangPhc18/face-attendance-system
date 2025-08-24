# Error handling middleware
from flask import jsonify
from ..core.utils import create_response, log_activity

def register_error_handlers(app):
    """Register error handlers for the Flask app"""
    
    @app.errorhandler(400)
    def bad_request(error):
        log_activity('WARNING', f'Bad request: {str(error)}', 'error_handler')
        return create_response(False, error='Bad request', status_code=400)
    
    @app.errorhandler(401)
    def unauthorized(error):
        log_activity('WARNING', f'Unauthorized access: {str(error)}', 'error_handler')
        return create_response(False, error='Unauthorized access', status_code=401)
    
    @app.errorhandler(403)
    def forbidden(error):
        log_activity('WARNING', f'Forbidden access: {str(error)}', 'error_handler')
        return create_response(False, error='Access forbidden', status_code=403)
    
    @app.errorhandler(404)
    def not_found(error):
        return create_response(False, error='Resource not found', status_code=404)
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return create_response(False, error='Method not allowed', status_code=405)
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return create_response(False, error='File too large', status_code=413)
    
    @app.errorhandler(500)
    def internal_server_error(error):
        log_activity('ERROR', f'Internal server error: {str(error)}', 'error_handler')
        return create_response(False, error='Internal server error', status_code=500)
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        log_activity('ERROR', f'Unhandled exception: {str(error)}', 'error_handler')
        return create_response(False, error='An unexpected error occurred', status_code=500)
