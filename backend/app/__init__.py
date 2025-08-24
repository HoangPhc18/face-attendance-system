# Flask app initialization
from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Database tables should be created using setup_database.py
    # Removed automatic table creation to avoid conflicts
    
    # Register network detection middleware
    @app.before_request
    def before_request():
        from .middleware.network_detection import detect_network
        detect_network()
    
    # Register error handlers
    from .middleware.error_handler import register_error_handlers
    register_error_handlers(app)
    
    # Register all API blueprints
    from .api import register_blueprints
    register_blueprints(app)
    
    return app