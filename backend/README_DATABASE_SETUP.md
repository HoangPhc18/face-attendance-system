# Database Setup Guide

## 🚀 Thiết lập Database - Quy trình đơn giản

### Bước 1: Tạo database PostgreSQL
```bash
# Tạo database (chỉ cần làm một lần)
createdb face_attendance_db

# Hoặc qua psql
psql -U postgres -c "CREATE DATABASE face_attendance_db;"
```

### Bước 2: Cấu hình môi trường
```bash
# Copy file cấu hình mẫu
copy .env.example .env

# Chỉnh sửa .env với thông tin của bạn:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=face_attendance_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# ADMIN_USERNAME=admin
# ADMIN_EMAIL=admin@company.com
# ADMIN_PASSWORD=your_secure_password
```

### Bước 3: Setup database schema và admin
```bash
python setup_database.py
```

**Kết quả:**
- ✅ Tất cả bảng database được tạo
- ✅ Indexes tối ưu performance
- ✅ Admin user từ biến môi trường (bảo mật)
- ✅ Dữ liệu mẫu (nếu bật CREATE_SAMPLE_DATA=true)

### Bước 4: Khởi động server
```bash
python run.py
```

**Hoàn thành!** Truy cập http://localhost:5000 và đăng nhập với admin credentials.

## 🔒 Bảo mật Admin

### Cách cũ (không an toàn):
- Mật khẩu admin hardcode trong `seed_data.py`
- Ai cũng có thể xem được

### Cách mới (bảo mật):
```bash
# Đặt biến môi trường
export ADMIN_USERNAME=your_admin
export ADMIN_EMAIL=admin@yourcompany.com
export ADMIN_PASSWORD=your_secure_password

# Hoặc trong file .env
ADMIN_USERNAME=your_admin
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your_secure_password
```

## 📋 So sánh quy trình

### Trước (phức tạp):
```bash
# 1. Tạo database thủ công
psql -U postgres -c "CREATE DATABASE face_attendance_db"

# 2. Import schema cơ bản
psql -U postgres -d face_attendance_db -f database/init.sql

# 3. Khởi động server để tạo bảng bổ sung
python run.py  # Tạo thêm bảng từ database.py và database_schema.py

# 4. Tạo admin user riêng
python seed_data.py

# 5. Restart server
python run.py
```

### Sau (đơn giản):
```bash
# 1. Setup toàn bộ
python setup_database.py

# 2. Khởi động server
python run.py
```

## ⚙️ Tùy chọn nâng cao

### Tạo dữ liệu mẫu:
```bash
# Trong .env
CREATE_SAMPLE_DATA=true

# Hoặc biến môi trường
export CREATE_SAMPLE_DATA=true
python setup_database.py
```

### Kiểm tra database:
```python
from setup_database import check_database_connection
check_database_connection()
```

## 🔧 Troubleshooting

### Lỗi kết nối database:
1. Kiểm tra PostgreSQL đang chạy
2. Xác nhận thông tin trong `.env`
3. Tạo database nếu chưa có:
   ```bash
   createdb face_attendance_db
   ```

### Reset database:
```bash
# Xóa và tạo lại
dropdb face_attendance_db
createdb face_attendance_db
python setup_database.py
```

## 📁 File Structure

```
backend/
├── setup_database.py      # Script setup tổng hợp (MỚI)
├── .env.example           # Template cấu hình (CẬP NHẬT)
├── seed_data.py           # Deprecated - dùng setup_database.py
├── database/
│   └── init.sql           # Deprecated - đã tích hợp vào setup_database.py
└── app/
    └── core/
        ├── database.py         # Vẫn dùng cho runtime
        └── database_schema.py  # Đã tích hợp vào setup_database.py
```

## 🎯 Lợi ích

1. **Đơn giản**: Một lệnh thay vì nhiều bước
2. **Bảo mật**: Admin credentials từ environment variables
3. **Toàn diện**: Tất cả bảng + indexes trong một script
4. **Linh hoạt**: Tùy chọn tạo sample data
5. **An toàn**: Kiểm tra kết nối trước khi setup
