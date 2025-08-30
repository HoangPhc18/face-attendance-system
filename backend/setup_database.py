#!/usr/bin/env python3
"""
Database Setup Script - Tối ưu hóa khởi tạo database một lần duy nhất
Thay thế cho việc phải chạy init.sql riêng biệt
"""
import os
import sys
import bcrypt
from datetime import datetime
from pathlib import Path

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_db_cursor

def create_complete_database_schema():
    """Tạo toàn bộ schema database một lần"""
    print("🗄️ Creating complete database schema...")
    
    try:
        with get_db_cursor() as cursor:
            # 1. Tạo bảng users cơ bản
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255),
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 2. Tạo bảng faces
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS faces (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    face_encoding TEXT NOT NULL,
                    image_path VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 3. Tạo bảng attendance
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS attendance (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    date DATE NOT NULL,
                    check_in_time TIMESTAMP,
                    check_out_time TIMESTAMP,
                    total_hours DECIMAL(4,2),
                    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave')),
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, date)
                );
            """)
            
            # 4. Tạo bảng leave_requests
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS leave_requests (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    reason TEXT NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                    approved_by INTEGER REFERENCES users(id),
                    approved_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 5. Tạo bảng notifications
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 6. Tạo bảng uploaded_files
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS uploaded_files (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    original_filename VARCHAR(255) NOT NULL,
                    file_path VARCHAR(500) NOT NULL,
                    file_size INTEGER,
                    mime_type VARCHAR(100),
                    uploaded_by INTEGER REFERENCES users(id),
                    upload_purpose VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 7. Tạo bảng file_references
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS file_references (
                    id SERIAL PRIMARY KEY,
                    file_id INTEGER REFERENCES uploaded_files(id) ON DELETE CASCADE,
                    reference_type VARCHAR(50) NOT NULL,
                    reference_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # 8. Tạo indexes để tối ưu performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_faces_user_id ON faces(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);")
            
            print("✅ Database schema created successfully")
            
    except Exception as e:
        print(f"❌ Error creating database schema: {e}")
        raise

def create_admin_user_from_env():
    """Tạo admin user từ biến môi trường (bảo mật hơn)"""
    print("👤 Creating admin user from environment variables...")
    
    # Lấy thông tin admin từ biến môi trường
    admin_username = os.getenv('ADMIN_USERNAME', 'admin')
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@company.com')
    admin_password = os.getenv('ADMIN_PASSWORD')
    admin_fullname = os.getenv('ADMIN_FULLNAME', 'System Administrator')
    
    if not admin_password:
        print("⚠️ ADMIN_PASSWORD environment variable not set. Using default password 'admin123'")
        print("⚠️ Please set ADMIN_PASSWORD environment variable for production!")
        admin_password = 'admin123'
    
    try:
        with get_db_cursor() as cursor:
            # Kiểm tra admin đã tồn tại chưa
            cursor.execute("SELECT id FROM users WHERE username = %s", (admin_username,))
            existing_admin = cursor.fetchone()
            
            if existing_admin:
                print(f"ℹ️ Admin user '{admin_username}' already exists")
                print("🔐 Updating admin password with current .env value...")
                
                # Mã hóa mật khẩu mới
                hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
                
                # Cập nhật mật khẩu admin
                cursor.execute("""
                    UPDATE users 
                    SET password_hash = %s, updated_at = %s 
                    WHERE username = %s
                """, (hashed_password.decode('utf-8'), datetime.now(), admin_username))
                
                print(f"✅ Admin password updated successfully")
                return
            
            # Mã hóa mật khẩu
            hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
            
            # Tạo admin user
            cursor.execute("""
                INSERT INTO users (username, full_name, email, password_hash, role, created_at, updated_at)
                VALUES (%s, %s, %s, %s, 'admin', %s, %s)
                RETURNING id
            """, (admin_username, admin_fullname, admin_email, hashed_password.decode('utf-8'), 
                  datetime.now(), datetime.now()))
            
            admin_id = cursor.fetchone()[0]
            
            print(f"✅ Admin user created successfully!")
            print(f"   ID: {admin_id}")
            print(f"   Username: {admin_username}")
            print(f"   Email: {admin_email}")
            print(f"   Full Name: {admin_fullname}")
            
            # Chỉ hiển thị password nếu là default (để nhắc nhở thay đổi)
            if admin_password == 'admin123':
                print(f"   Password: {admin_password} (⚠️ Please change this!)")
            else:
                print(f"   Password: [Set from environment variable]")
            
            return admin_id
            
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        raise

def create_sample_data():
    """Tạo dữ liệu mẫu (tùy chọn)"""
    create_sample = os.getenv('CREATE_SAMPLE_DATA', 'false').lower() == 'true'
    
    if not create_sample:
        print("ℹ️ Skipping sample data creation (set CREATE_SAMPLE_DATA=true to enable)")
        return
    
    print("📊 Creating sample data...")
    
    try:
        with get_db_cursor() as cursor:
            # Tạo 2 user mẫu
            sample_users = [
                ('john_doe', 'John Doe', 'john.doe@company.com'),
                ('jane_smith', 'Jane Smith', 'jane.smith@company.com')
            ]
            
            for username, fullname, email in sample_users:
                cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cursor.fetchone():
                    continue
                
                # Mật khẩu mặc định cho user mẫu
                default_password = bcrypt.hashpw('user123'.encode('utf-8'), bcrypt.gensalt())
                
                cursor.execute("""
                    INSERT INTO users (username, full_name, email, password_hash, role, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, 'user', %s, %s)
                """, (username, fullname, email, default_password.decode('utf-8'), 
                      datetime.now(), datetime.now()))
                
                print(f"✅ Sample user created: {username}")
            
            print("✅ Sample data created successfully")
            
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")

def check_database_connection():
    """Kiểm tra kết nối database"""
    print("🔌 Testing database connection...")
    
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
            print(f"✅ Database connected successfully")
            print(f"   PostgreSQL version: {version}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Please check your database configuration in .env file")
        return False

def main():
    """Main setup function"""
    print("🚀 Face Attendance System - Database Setup")
    print("=" * 60)
    
    # 1. Kiểm tra kết nối database
    if not check_database_connection():
        return False
    
    # 2. Tạo toàn bộ schema
    create_complete_database_schema()
    
    # 3. Tạo admin user từ environment variables
    create_admin_user_from_env()
    
    # 4. Tạo dữ liệu mẫu (nếu được yêu cầu)
    create_sample_data()
    
    print("\n" + "=" * 60)
    print("🎉 Database setup completed successfully!")
    print("\n📋 Next steps:")
    print("   1. Set environment variables for production:")
    print("      - ADMIN_USERNAME=your_admin_username")
    print("      - ADMIN_EMAIL=your_admin_email")
    print("      - ADMIN_PASSWORD=your_secure_password")
    print("   2. Start the backend server: python run.py")
    print("   3. Access the system with your admin credentials")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
