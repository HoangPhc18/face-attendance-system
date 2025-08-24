# Face Attendance System - Setup Guide

## 🚀 Thiết lập hệ thống từ đầu

### Bước 1: Chuẩn bị môi trường
```bash
# Clone repository (nếu chưa có)
git clone <repository-url>
cd face-attendance-system

# Tạo virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Cài đặt dependencies
cd backend
pip install -r requirements.txt
```

### Bước 2: Cấu hình database
```bash
# Tạo PostgreSQL database
createdb face_attendance_db

# Hoặc qua psql
psql -U postgres -c "CREATE DATABASE face_attendance_db;"
```

### Bước 3: Cấu hình môi trường
```bash
# Copy file cấu hình
copy .env.example .env

# Chỉnh sửa .env với thông tin của bạn
notepad .env
```

**Nội dung .env cần thiết:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=face_attendance_db
DB_USER=postgres
DB_PASSWORD=your_password

# Admin (bảo mật)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=your_secure_password

# Application
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
```

### Bước 4: Khởi tạo database
```bash
python setup_database.py
```

**Kết quả:**
- ✅ Tạo tất cả bảng database
- ✅ Tạo admin user từ .env (bảo mật)
- ✅ Tạo indexes tối ưu
- ✅ Sẵn sàng sử dụng

### Bước 5: Khởi động backend
```bash
python run.py
```

### Bước 6: Khởi động frontend
```bash
# Terminal mới
cd ../frontend
npm install
npm start
```

## 🎯 Truy cập hệ thống

- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:3000
- **Admin Login:** Sử dụng credentials từ .env

## 🔧 Troubleshooting

### Lỗi database connection:
```bash
# Kiểm tra PostgreSQL đang chạy
pg_ctl status

# Kiểm tra database tồn tại
psql -U postgres -l | grep face_attendance
```

### Reset database:
```bash
dropdb face_attendance_db
createdb face_attendance_db
python setup_database.py
```

### Lỗi import modules:
```bash
# Cài lại dependencies
pip install -r requirements.txt

# Kiểm tra bcrypt
pip install bcrypt==4.0.1
```

## 📁 Cấu trúc project sau setup

```
face-attendance-system/
├── backend/
│   ├── setup_database.py     # Setup database (SỬ DỤNG)
│   ├── .env                  # Cấu hình bảo mật
│   ├── run.py               # Khởi động server
│   └── app/                 # Backend code
├── frontend/                # React frontend
└── SETUP_GUIDE.md          # Hướng dẫn này
```

## ✅ Files đã được tối ưu

- **Đã xóa:** `seed_data.py` (thay bằng setup_database.py)
- **Đã xóa:** `database/init.sql` (tích hợp vào setup_database.py)
- **Đã sửa:** `app/__init__.py` (không tự động tạo bảng)
- **Đã tạo:** `setup_database.py` (script setup tổng hợp)

## 🎉 Hoàn thành!

Hệ thống đã sẵn sàng với:
- Database được thiết lập đúng cách
- Admin user bảo mật
- Backend và frontend hoạt động
- Tất cả tính năng có sẵn
