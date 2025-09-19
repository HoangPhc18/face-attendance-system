# Database connection and models
import mysql.connector
import psycopg2
from urllib.parse import urlparse
from ..config.settings import Config
from contextlib import contextmanager

def get_db_connection():
    """Get database connection - supports both MySQL and PostgreSQL"""
    result = urlparse(Config.SQLALCHEMY_DATABASE_URI)
    
    # Determine database type from scheme
    if result.scheme.startswith('mysql'):
        return mysql.connector.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password or '',
            host=result.hostname,
            port=result.port or 3306,
            autocommit=True
        )
    elif result.scheme.startswith('postgresql'):
        return psycopg2.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port or 5432
        )
    else:
        raise ValueError(f"Unsupported database scheme: {result.scheme}")

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
    except Exception:
        return False