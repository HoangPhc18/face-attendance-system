# Database initialization script
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database import DatabaseModels, get_db_cursor
from config.settings import Config

def init_database():
    """Initialize database with tables and sample data"""
    print("Initializing database...")
    
    try:
        # Create tables
        DatabaseModels.create_tables()
        print("✓ Database tables created successfully")
        
        # Test connection
        if DatabaseModels.test_connection():
            print("✓ Database connection test passed")
        else:
            print("✗ Database connection test failed")
            return False
        
        # Create default admin user
        create_default_admin()
        
        print("✓ Database initialization completed successfully")
        return True
        
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        return False

def create_default_admin():
    """Create default admin user"""
    try:
        with get_db_cursor() as cursor:
            # Check if admin user already exists
            cursor.execute("SELECT id FROM users WHERE username = 'admin'")
            if cursor.fetchone():
                print("✓ Default admin user already exists")
                return
            
            # Create admin user
            cursor.execute("""
                INSERT INTO users (username, full_name, email, role) 
                VALUES ('admin', 'System Administrator', 'admin@company.com', 'admin')
            """)
            
            print("✓ Default admin user created (username: admin)")
            
    except Exception as e:
        print(f"✗ Failed to create default admin user: {e}")

def reset_database():
    """Reset database by dropping and recreating all tables"""
    print("WARNING: This will delete all data!")
    confirm = input("Are you sure you want to reset the database? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("Database reset cancelled")
        return
    
    try:
        with get_db_cursor() as cursor:
            # Drop all tables
            tables = [
                'ai_reports', 'logs', 'attendance', 'leave_requests', 
                'faces', 'pending_faces', 'users'
            ]
            
            for table in tables:
                cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
            
            print("✓ All tables dropped")
        
        # Recreate tables
        init_database()
        
    except Exception as e:
        print(f"✗ Database reset failed: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Database management script')
    parser.add_argument('--reset', action='store_true', help='Reset database (WARNING: deletes all data)')
    parser.add_argument('--test', action='store_true', help='Test database connection only')
    
    args = parser.parse_args()
    
    if args.reset:
        reset_database()
    elif args.test:
        if DatabaseModels.test_connection():
            print("✓ Database connection successful")
        else:
            print("✗ Database connection failed")
    else:
        init_database()
