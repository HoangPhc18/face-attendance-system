-- Face Attendance System Database Schema
-- Complete database setup with admin user included
-- Import this file directly into MySQL

-- Create database (run this separately if needed)
-- CREATE DATABASE face_attendance_db;

-- Connect to the database and run the following:

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL, -- NULL cho face-only users
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    -- Network access control
    allow_password_login BOOLEAN DEFAULT FALSE, -- Cho phép login bằng password
    allow_face_only BOOLEAN DEFAULT TRUE, -- Cho phép chấm công chỉ bằng face (mạng nội bộ)
    require_password_for_external BOOLEAN DEFAULT TRUE, -- Yêu cầu password khi truy cập từ mạng ngoại bộ
    -- Metadata
    employee_id VARCHAR(50) UNIQUE, -- Mã nhân viên
    department VARCHAR(100),
    position VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create faces table
CREATE TABLE IF NOT EXISTS faces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    face_encoding TEXT NOT NULL,
    image_path VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create pending_faces table
CREATE TABLE IF NOT EXISTS pending_faces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    face_encoding TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    date DATE NOT NULL,
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    total_hours DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 6. Create ai_reports table
CREATE TABLE IF NOT EXISTS ai_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    report_type VARCHAR(50) NOT NULL,
    content TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Create file_references table
CREATE TABLE IF NOT EXISTS file_references (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_id INT,
    reference_type VARCHAR(50) NOT NULL,
    reference_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE
);

-- 11. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_faces_user_id ON faces(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_upload_date ON uploaded_files(upload_date);
CREATE INDEX IF NOT EXISTS idx_file_references_file_id ON file_references(file_id);
CREATE INDEX IF NOT EXISTS idx_file_references_reference ON file_references(reference_type, reference_id);

-- 12. Insert default admin user
-- Password: admin123 (bcrypt hashed)
-- IMPORTANT: Change this password after first login!
INSERT INTO users (
    username, full_name, email, password_hash, role, 
    allow_password_login, allow_face_only, require_password_for_external,
    employee_id, department, position, created_at, updated_at
)
VALUES (
    'admin',
    'System Administrator',
    'admin@company.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq8Kfq2',
    'admin',
    TRUE, -- Admin có thể login bằng password
    TRUE, -- Admin cũng có thể dùng face
    FALSE, -- Admin không bị hạn chế mạng ngoại bộ
    'ADMIN001',
    'IT Department',
    'System Administrator',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON DUPLICATE KEY UPDATE username = username;

-- 13. Insert sample users với các loại access khác nhau
INSERT INTO users (
    username, full_name, email, password_hash, role,
    allow_password_login, allow_face_only, require_password_for_external,
    employee_id, department, position, created_at, updated_at
)
VALUES 
    -- User chỉ dùng face (mạng nội bộ only)
    ('john_doe', 'John Doe', 'john.doe@company.com', NULL, 'user', 
     FALSE, TRUE, TRUE, 'EMP001', 'Sales', 'Sales Executive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    
    -- User có thể login và dùng face (hybrid)
    ('jane_smith', 'Jane Smith', 'jane.smith@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq8Kfq2', 'user',
     TRUE, TRUE, TRUE, 'EMP002', 'Marketing', 'Marketing Manager', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
     
    -- User chỉ dùng face, không cần password cho external
    ('mike_wilson', 'Mike Wilson', 'mike.wilson@company.com', NULL, 'user',
     FALSE, TRUE, FALSE, 'EMP003', 'Operations', 'Operations Staff', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE username = username;

-- Database setup completed
-- Default admin credentials:
-- Username: admin
-- Password: admin123
-- Email: admin@company.com
-- 
-- SECURITY WARNING: Please change the admin password immediately after first login!
-- 
-- NETWORK-BASED ACCESS CONTROL LOGIC:
-- 
-- MẠNG NỘI BỘ (Internal Network):
-- - Đăng nhập: Face encoding (không cần password)
-- - Chấm công: Face encoding 
-- - Chức năng: Đầy đủ (attendance, leave requests, profile)
-- 
-- MẠNG NGOẠI BỘ (External Network):
-- - Đăng nhập: Username/Password (bắt buộc)
-- - Chấm công: KHÔNG THỂ (vì không có camera/face recognition)
-- - Chức năng: Giới hạn (chỉ xem thông tin, không chấm công)
-- 
-- 1. FACE-ONLY USERS (Chỉ face encoding):
--    - password_hash: NULL
--    - allow_password_login: FALSE
--    - allow_face_only: TRUE
--    - require_password_for_external: TRUE
--    - Mạng nội bộ: Face login + Face attendance + Full features
--    - Mạng ngoại bộ: KHÔNG THỂ TRUY CẬP (vì không có password)
-- 
-- 2. HYBRID USERS (Face + Password):
--    - password_hash: có giá trị
--    - allow_password_login: TRUE
--    - allow_face_only: TRUE
--    - require_password_for_external: TRUE
--    - Mạng nội bộ: Face login + Face attendance + Full features
--    - Mạng ngoại bộ: Password login + Limited features (NO attendance)
-- 
-- 3. ADMIN USERS:
--    - password_hash: có giá trị
--    - allow_password_login: TRUE
--    - allow_face_only: TRUE
--    - require_password_for_external: FALSE
--    - Mạng nội bộ: Face/Password login + Full admin features
--    - Mạng ngoại bộ: Password login + Full admin features
-- 
-- WORKFLOW:
-- 1. Admin tạo user với face encoding (không cần password cho face-only)
-- 2. Mạng nội bộ: User dùng face để login và chấm công
-- 3. Mạng ngoại bộ: User dùng password để login (chỉ xem thông tin)
-- 4. Chấm công CHỈ KHI Ở MẠNG NỘI BỘ với face encoding
-- 
-- To import this file:
-- psql -U postgres -d face_attendance_db -f database.sql
