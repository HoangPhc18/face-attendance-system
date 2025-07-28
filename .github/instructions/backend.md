# Backend Instructions

Hệ thống backend sử dụng Python Flask, cung cấp RESTful API cho các chức năng:

- Nhận diện khuôn mặt, liveness detection, quản lý dữ liệu, phân quyền
- Tích hợp AI (GPT, Gemini) qua `ai_integration.py`
- **Tách riêng 2 module:**
  - `face_enroll.py`: Đăng ký khuôn mặt mới, chỉ cho phép user có quyền (admin/user được phép), xác thực JWT, kiểm tra role.
  - `face_attendance.py`: Chấm công, chỉ xử lý nhận diện, so sánh với embedding đã lưu, ghi nhận check-in/out.

**Yêu cầu đặc biệt:**
- API `/api/enroll-face`: Đăng ký khuôn mặt mới, chỉ cho phép user có quyền, xác thực JWT, kiểm tra role.
- API `/api/attendance/check`: Chấm công, chỉ cho phép từ IP mạng nội bộ (backend kiểm tra IP), không yêu cầu đăng nhập/JWT.
- Các API khác (lịch sử, xin nghỉ phép, báo cáo...) phải xác thực JWT như bình thường và có thể truy cập từ xa.

Sử dụng PostgreSQL qua SQLAlchemy, xác thực JWT, truyền dữ liệu qua HTTPS, mã hóa dữ liệu sinh trắc học.
