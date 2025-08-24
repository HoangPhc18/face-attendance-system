# Flask app initialization
from flask import Flask
from flask_cors import CORS
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Initialize database
    from .core.database import DatabaseModels
    try:
        DatabaseModels.create_tables()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")
    
    # Register error handlers
    from .middleware.error_handler import register_error_handlers
    register_error_handlers(app)
    
    # Register all API blueprints
    from .api import register_blueprints
    register_blueprints(app)
    
    return app