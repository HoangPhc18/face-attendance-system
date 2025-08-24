# Face Attendance System - Backend

## Cấu trúc thư mục tối ưu hóa
```
backend/
├── app/
│   ├── __init__.py                 # Khởi tạo ứng dụng Flask
│   ├── api/                        # Các route API (tổ chức theo chức năng)
│   │   ├── __init__.py
│   │   ├── auth.py                 # API xác thực người dùng
│   │   ├── attendance.py           # Điểm danh (check-in/check-out)
│   │   ├── face_enrollment.py      # Đăng ký khuôn mặt
│   │   ├── leave_request.py        # Quản lý đơn xin nghỉ
│   │   ├── ai_integration.py       # Tính năng AI
│   │   └── admin.py                # Chức năng quản trị
│   ├── core/                       # Các chức năng cốt lõi
│   │   ├── __init__.py
│   │   ├── database.py             # Kết nối & mô hình cơ sở dữ liệu
│   │   └── utils.py                # Các hàm tiện ích dùng chung
│   ├── config/                     # Cấu hình ứng dụng
│   │   ├── __init__.py
│   │   └── settings.py             # Thiết lập cấu hình
│   ├── middleware/                 # Thành phần middleware
│   │   ├── __init__.py
│   │   └── error_handler.py        # Xử lý lỗi tập trung
│   ├── liveness_detection/         # Module kiểm tra sống (chống giả mạo)
│   │   ├── __init__.py
│   │   ├── liveness_detection.py   # Logic kiểm tra sống
│   │   ├── routes.py               # API liveness
│   │   ├── config.py               # Cấu hình liveness
│   │   └── test_liveness.py        # Bộ kiểm thử
│   ├── attendance/                 # Xử lý điểm danh
│   │   ├── __init__.py
│   │   ├── attendance.py           # Logic nhận diện khuôn mặt
│   │   └── test_attendance.py      # Kiểm thử
│   ├── face_user_register/         # Đăng ký người dùng bằng khuôn mặt
│   │   ├── __init__.py
│   │   ├── face_enroll.py          # Logic đăng ký khuôn mặt
│   │   ├── routes.py               # Các route cũ (đã lỗi thời)
│   │   ├── test_enroll.py          # Kiểm thử
│   │   └── utils.py                # Tiện ích hỗ trợ
│   ├── ai_integration/             # Tích hợp AI
│   │   ├── __init__.py
│   │   └── ai_integration.py       # Logic AI
│   ├── leave_request/              # Quản lý đơn nghỉ phép
│   │   ├── __init__.py
│   │   └── leave_request.py        # Xử lý logic đơn nghỉ
│   ├── user/                       # Quản lý người dùng
│   │   ├── __init__.py
│   │   └── models.py               # Mô hình người dùng
│   ├── report/                     # Báo cáo
│   │   ├── __init__.py
│   │   └── report.py               # Tạo báo cáo
│   └── tests/                      # Bộ kiểm thử tổng hợp
│       └── __init__.py
├── requirements.txt                # Danh sách thư viện phụ thuộc
├── run.py                          # Điểm khởi chạy ứng dụng
├── .env                            # Biến môi trường
└── README.md                       # Tài liệu hướng dẫn

```

## Cải tiến chính

### 1. **API Routes tập trung**
- Tất cả API endpoints được tổ chức trong `/api/`
- Mỗi module có chức năng riêng biệt
- URL prefix nhất quán: `/api/{module}`

### 2. **Core utilities**
- Database connection tập trung
- Common utilities (auth, validation, logging)
- Standardized response format

### 3. **Configuration quản lý**
- Environment-based configuration
- Development/Production/Testing configs
- Centralized settings management

### 4. **Error handling**
- Centralized error handling middleware
- Consistent error responses
- Proper logging integration

### 5. **Database optimization**
- Connection pooling với context manager
- Automatic table creation
- Proper transaction management

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification

### Attendance
- `POST /api/attendance/check-in` - Face check-in/out (internal network only)
- `GET /api/attendance/history` - Attendance history

### Face Enrollment
- `POST /api/face/enroll` - Face enrollment (requires auth)
- `POST /api/face/register` - Complete user registration
- `GET /api/face/pending` - Get pending faces

### Leave Requests
- `POST /api/leave/submit` - Submit leave request
- `GET /api/leave/list` - Get user's leave requests
- `POST /api/leave/approve/{id}` - Approve leave (admin only)

### AI Integration
- `POST /api/ai/calculate-salary` - Calculate salary using AI
- `POST /api/ai/chatbot` - AI chatbot interaction

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/{id}` - Update user (admin only)
- `DELETE /api/admin/users/{id}` - Delete user (admin only)
- `GET /api/admin/leave-requests` - Get all leave requests (admin only)

### Liveness Detection
- `POST /api/liveness/check_image` - Single image liveness check
- `POST /api/liveness/check_frames` - Multi-frame liveness check
- `GET /api/liveness/status` - Service status

## Chạy ứng dụng

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your settings

# Run application
python run.py
```

## Testing

```bash
# Run liveness detection tests
python -m app.liveness_detection.test_liveness

# Run with webcam test
python -m app.liveness_detection.test_liveness --webcam
```

## Security Features

- JWT authentication for protected endpoints
- Internal network restriction for attendance
- Liveness detection anti-spoofing
- Role-based access control
- Input validation and sanitization
- Proper error handling without information leakage
