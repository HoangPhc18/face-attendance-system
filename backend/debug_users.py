#!/usr/bin/env python3
"""
Debug script để kiểm tra users trong database
"""

import psycopg2
from app.config.settings import Config

def check_users():
    """Kiểm tra users trong database"""
    try:
        # Kết nối database
        conn = psycopg2.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD
        )
        
        cursor = conn.cursor()
        
        print("=== KIỂM TRA USERS TRONG DATABASE ===")
        
        # Đếm tổng số users
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        print(f"Tổng số users: {total_users}")
        
        if total_users == 0:
            print("❌ Không có users nào trong database!")
            return
        
        # Lấy danh sách users
        cursor.execute("""
            SELECT u.id, u.username, u.full_name, u.email, u.role, u.created_at,
                   CASE WHEN f.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_face
            FROM users u
            LEFT JOIN faces f ON u.id = f.user_id
            ORDER BY u.created_at DESC
        """)
        
        users = cursor.fetchall()
        
        print("\n=== DANH SÁCH USERS ===")
        print(f"{'ID':<5} {'Username':<15} {'Full Name':<20} {'Email':<25} {'Role':<8} {'Has Face':<10} {'Created':<20}")
        print("-" * 110)
        
        for user in users:
            user_id, username, full_name, email, role, created_at, has_face = user
            created_str = created_at.strftime('%Y-%m-%d %H:%M') if created_at else 'N/A'
            print(f"{user_id:<5} {username:<15} {full_name or 'N/A':<20} {email or 'N/A':<25} {role:<8} {has_face:<10} {created_str:<20}")
        
        # Kiểm tra faces table
        cursor.execute("SELECT COUNT(*) FROM faces")
        total_faces = cursor.fetchone()[0]
        print(f"\nTổng số faces: {total_faces}")
        
        # Kiểm tra attendance table
        cursor.execute("SELECT COUNT(*) FROM attendance")
        total_attendance = cursor.fetchone()[0]
        print(f"Tổng số attendance records: {total_attendance}")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Kiểm tra database thành công!")
        
    except Exception as e:
        print(f"❌ Lỗi kết nối database: {e}")

if __name__ == "__main__":
    check_users()
