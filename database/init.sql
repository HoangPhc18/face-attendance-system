-- Script tạo DB ban đầu

-- Bảng người dùng
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu thông tin khuôn mặt (embedding)
CREATE TABLE faces (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    face_encoding TEXT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng điểm danh
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    checkin_time TIMESTAMP NOT NULL,
    checkout_time TIMESTAMP,
    liveness_passed BOOLEAN DEFAULT TRUE,
    device_info VARCHAR(100),
    image_url VARCHAR(255),
    log_ip VARCHAR(45), -- Lưu IP client khi chấm công
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng log hệ thống
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100),
    detail TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng yêu cầu nghỉ phép
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lưu báo cáo AI (tính lương, phân tích, chatbot...)
CREATE TABLE ai_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL, -- salary, analysis, chatbot...
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_faces_user_id ON faces(user_id);
CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_ai_reports_user_id ON ai_reports(user_id);
