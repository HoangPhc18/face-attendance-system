# Database schema for new tables
from ..core.database import get_db_cursor

def create_additional_tables():
    """Tạo các bảng bổ sung cho hệ thống"""
    
    tables = [
        # Bảng uploaded_files
        """
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            original_filename VARCHAR(255) NOT NULL,
            stored_filename VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size BIGINT NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Bảng notifications
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP
        )
        """,
        
        # Bảng file_references (để track files được sử dụng ở đâu)
        """
        CREATE TABLE IF NOT EXISTS file_references (
            id SERIAL PRIMARY KEY,
            file_id INTEGER REFERENCES uploaded_files(id) ON DELETE CASCADE,
            reference_type VARCHAR(50) NOT NULL,
            reference_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        
        # Indexes cho performance
        """
        CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_uploaded_files_upload_date ON uploaded_files(upload_date);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_file_references_file_id ON file_references(file_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_file_references_reference ON file_references(reference_type, reference_id);
        """
    ]
    
    try:
        with get_db_cursor() as cursor:
            for table_sql in tables:
                cursor.execute(table_sql)
        
        print("Additional database tables created successfully")
        return True
        
    except Exception as e:
        print(f"Error creating additional tables: {e}")
        return False

if __name__ == "__main__":
    create_additional_tables()
