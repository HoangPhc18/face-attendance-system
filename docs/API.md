# TÀI LIỆU API NGẮN GỌN HỆ THỐNG CHẤM CÔNG BẰNG KHUÔN MẶT

---

## 1. Xác thực & Phân quyền
- **POST /api/auth/login**: Đăng nhập, nhận JWT token (Tất cả người dùng)

## 2. Quản lý người dùng
- **POST /api/users/register**: Đăng ký người dùng mới (Admin)
- **GET /api/users**: Lấy danh sách người dùng (Admin)

## 3. Chấm công & Liveness
- **POST /api/attendance/check**: Chấm công bằng khuôn mặt, kiểm tra liveness (Nhân viên)
- **POST /api/liveness/check**: Kiểm tra liveness khuôn mặt (Nhân viên)

## 4. Lịch sử & Báo cáo
- **GET /api/attendance/history**: Lấy lịch sử chấm công cá nhân (Nhân viên, Admin)
- **GET /api/report/attendance**: Xuất báo cáo tổng hợp (Admin)

## 5. Quản lý nghỉ phép
- **POST /api/leave/request**: Gửi yêu cầu nghỉ phép (Nhân viên)
- **POST /api/leave/approve/<request_id>**: Duyệt yêu cầu nghỉ phép (Admin)

## 6. AI & Chatbot (Tùy chọn)
- **POST /api/ai/calculate_salary**: Tính lương tự động qua AI (Admin)
- **POST /api/ai/chatbot**: Chatbot tra cứu thông tin (Nhân viên, Admin)

---

**Lưu ý:**
- Các API (trừ login) yêu cầu JWT token trong header.
- Upload ảnh sử dụng `multipart/form-data`.
- Phân quyền rõ ràng giữa nhân viên và admin.

