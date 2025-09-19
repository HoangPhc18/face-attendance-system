# Entry point for Face Attendance System Backend
from app import create_app
from app.config.settings import Config

if __name__ == '__main__':
    app = create_app()
    
    print("🚀 Starting Face Attendance System Backend")
    print(f"📍 Server: http://{Config.HOST}:{Config.PORT}")
    print(f"🔧 Environment: {Config.FLASK_ENV}")
    print(f"🐛 Debug Mode: {Config.DEBUG}")
    print("=" * 50)
    
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
