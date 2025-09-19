#!/usr/bin/env python3
"""
Quick setup script để tạo database và admin user
"""

import psycopg2
import bcrypt
from datetime import datetime
import os

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'face_attendance',
    'user': 'postgres',
    'password': 'postgres'
}

def create_admin_user():
    """Tạo admin user"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Kiểm tra xem admin đã tồn tại chưa
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        if cursor.fetchone():
            print("✅ Admin user đã tồn tại")
            cursor.close()
            conn.close()
            return
        
        # Tạo admin user
        hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        
        cursor.execute("""
            INSERT INTO users (username, full_name, email, password_hash, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            'admin',
            'Administrator',
            'admin@company.com',
            hashed_password.decode('utf-8'),
            'admin',
            datetime.now()
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Tạo admin user thành công!")
        print("   Username: admin")
        print("   Password: admin123")
        
    except Exception as e:
        print(f"❌ Lỗi tạo admin user: {e}")

def create_sample_users():
    """Tạo một vài user mẫu"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        sample_users = [
            ('user1', 'Nguyễn Văn A', 'user1@company.com', 'user'),
            ('user2', 'Trần Thị B', 'user2@company.com', 'user'),
            ('user3', 'Lê Văn C', 'user3@company.com', 'user'),
        ]
        
        for username, full_name, email, role in sample_users:
            # Kiểm tra user đã tồn tại chưa
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                continue
            
            hashed_password = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt())
            
            cursor.execute("""
                INSERT INTO users (username, full_name, email, password_hash, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                username,
                full_name,
                email,
                hashed_password.decode('utf-8'),
                role,
                datetime.now()
            ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Tạo sample users thành công!")
        
    except Exception as e:
        print(f"❌ Lỗi tạo sample users: {e}")

def check_database():
    """Kiểm tra database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Kiểm tra tables
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = [row[0] for row in cursor.fetchall()]
        print(f"✅ Database connected. Found tables: {', '.join(tables)}")
        
        if 'users' not in tables:
            print("❌ Table 'users' không tồn tại. Cần chạy database setup trước.")
            return False
        
        # Đếm users
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"✅ Found {user_count} users in database")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        print("Hãy đảm bảo PostgreSQL đang chạy và database 'face_attendance' đã được tạo")
        return False

def main():
    print("=== QUICK SETUP FOR FACE ATTENDANCE SYSTEM ===")
    
    if not check_database():
        return
    
    create_admin_user()
    create_sample_users()
    
    print("\n=== SETUP COMPLETED ===")
    print("Bây giờ bạn có thể:")
    print("1. Chạy backend: python run.py")
    print("2. Login với admin/admin123")
    print("3. Truy cập admin panel: http://localhost:3000/admin/users")

if __name__ == "__main__":
    main()
