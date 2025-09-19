# Face Attendance System - Backend

## 🎯 Tổng Quan

Hệ thống chấm công bằng nhận diện khuôn mặt với Flask backend, hỗ trợ MySQL/PostgreSQL và tích hợp AI.

## 🚀 Cài Đặt Nhanh

### 1. Cài Đặt Dependencies
```bash
pip install -r requirements.txt
```

### 2. Cấu Hình Database
```bash
# Copy file cấu hình
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
# Cho MySQL (mặc định):
DB_HOST=localhost
DB_PORT=3306
DB_NAME=face_attendance_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# Cho PostgreSQL:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=face_attendance_db
# DB_USER=postgres
# DB_PASSWORD=your_postgres_password
```

### 3. Tạo Database
```bash
# MySQL
mysql -u root -p
CREATE DATABASE face_attendance_db;
mysql -u root -p face_attendance_db < database.sql

# PostgreSQL
psql -U postgres
CREATE DATABASE face_attendance_db;
# Schema sẽ được tạo tự động khi chạy server
```

### 4. Kiểm Tra Hệ Thống (Khuyến nghị)
```bash
python verify_system.py
```

### 5. Khởi Động Server
```bash
python run.py
```

## 🔑 Đăng Nhập Mặc Định

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@company.com`

⚠️ **Lưu ý**: Đổi password sau khi đăng nhập lần đầu!

## 📁 Cấu Trúc Project

```
backend/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── auth.py         # Authentication
│   │   ├── attendance.py   # Attendance management
│   │   ├── face_enrollment.py # Face registration
│   │   └── ...
│   ├── core/               # Core functionality
│   │   ├── database.py     # Database connections
│   │   └── utils.py        # Utility functions
│   ├── config/             # Configuration
│   │   └── settings.py     # App settings
│   ├── middleware/         # Middleware
│   │   ├── network_detection.py # Network security
│   │   └── error_handler.py     # Error handling
│   └── liveness_detection/ # Anti-spoofing
├── .env.example           # Environment template
├── database.sql          # Database schema
├── requirements.txt      # Python dependencies
└── run.py               # Application entry point
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification
- `GET /api/auth/network-status` - Network detection

### Face Enrollment (Admin only) - NEW WORKFLOW
- `POST /api/face_enrollment/create-user` - Step 1: Create user account
- `POST /api/face_enrollment/capture-face` - Step 2: Capture face from camera
- `GET /api/face_enrollment/users-without-face` - View users without face
- `GET /api/face_enrollment/user-status/<user_id>` - Check enrollment status

### Attendance
- `POST /api/attendance/check-in` - Face attendance check-in
- `GET /api/attendance/history` - Attendance history

### Admin Features
- `GET /api/admin/users` - User management
- `GET /api/admin/stats` - System statistics

## 🛡️ Bảo Mật

### Network-Based Security
- **Internal Network**: Face attendance không cần đăng nhập
- **External Network**: Yêu cầu authentication cho tất cả features
- **Admin Functions**: Luôn yêu cầu admin role

### Authentication
- JWT tokens với 24h expiration
- Bcrypt password hashing
- Role-based access control (admin/user)

## 🔧 Cấu Hình

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=face_attendance_db
DB_USER=root
DB_PASSWORD=

# Security
SECRET_KEY=your_flask_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# Network Security
INTERNAL_IP_RANGES=127.0.0.1/32,192.168.0.0/16,10.0.0.0/8

# AI Integration (Optional)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

## 🚨 Troubleshooting

### Database Connection Issues
1. Kiểm tra MySQL/PostgreSQL service đang chạy
2. Verify credentials trong file `.env`
3. Đảm bảo database đã được tạo

### Login Issues
1. Kiểm tra admin user tồn tại trong database
2. Verify password hash trong database
3. Kiểm tra JWT_SECRET_KEY trong `.env`

### Network Detection Issues
1. Kiểm tra INTERNAL_IP_RANGES trong `.env`
2. Verify client IP detection
3. Test với `/api/auth/network-status`

## 📊 Features

- ✅ Face recognition attendance
- ✅ Liveness detection (anti-spoofing)
- ✅ Network-based security
- ✅ Role-based access control
- ✅ Real-time statistics
- ✅ Leave request management
- ✅ File upload system
- ✅ AI integration (salary calculation)
- ✅ Comprehensive reporting

## 🔄 Development

### Running in Development
```bash
# Set environment
FLASK_ENV=development
DEBUG=True

# Start server
python run.py
```

### Testing
```bash
# Test API endpoints
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 📝 License

Face Attendance System - Internal Use Only
