# Database connection and models
import mysql.connector
from urllib.parse import urlparse
from ..config.settings import Config
from contextlib import contextmanager

def get_db_connection():
    """Get database connection"""
    result = urlparse(Config.SQLALCHEMY_DATABASE_URI)
    return mysql.connector.connect(
        database=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port
    )

@contextmanager
def get_db_cursor():
    """Context manager for database operations"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

# DatabaseModels class removed - use database.sql for schema creation

def test_connection():
    """Test database connection"""
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT 1")
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False