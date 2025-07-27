# Backend Instructions

Hệ thống backend sử dụng Python Flask, cung cấp RESTful API cho các chức năng:

- Nhận diện khuôn mặt (`face_recognition.py`)
- Liveness detection (`liveness_detection.py`)
- Chấm công, quản lý dữ liệu, phân quyền
- Tích hợp AI (GPT, Gemini) qua `ai_integration.py`

**Yêu cầu đặc biệt:**
- API `/api/attendance/check` chỉ cho phép truy cập từ IP mạng nội bộ (backend kiểm tra IP), **không yêu cầu đăng nhập/JWT**.
- Các API khác (lịch sử, xin nghỉ phép, báo cáo...) phải xác thực JWT như bình thường và có thể truy cập từ xa.

Sử dụng PostgreSQL qua SQLAlchemy, xác thực JWT, truyền dữ liệu qua HTTPS, mã hóa dữ liệu sinh trắc học.
