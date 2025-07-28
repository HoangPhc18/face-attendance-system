# Frontend Instructions

Frontend sử dụng React.js, tích hợp webcam, phân quyền giao diện cho nhân viên và quản lý.


**Yêu cầu đặc biệt:**
- Khi truy cập từ mạng nội bộ: hiển thị giao diện chấm công **không cần đăng nhập** (gửi ảnh lên API `/api/attendance/check`), đồng thời cho phép truy cập các chức năng khác.
- Khi truy cập từ ngoài: chỉ hiển thị giao diện đăng nhập và các chức năng khác (không cho phép chấm công).
- Giao diện đăng ký khuôn mặt mới (enroll) chỉ hiển thị cho user có quyền (admin/user được phép), gọi API `/api/enroll-face` (yêu cầu đăng nhập và phân quyền).
- Khi gửi request chấm công, frontend xử lý phản hồi backend: nếu trả về lỗi "không phải mạng nội bộ" thì ẩn hoặc khóa chức năng chấm công.

Các chức năng khác (lịch sử, xin nghỉ phép, báo cáo...) yêu cầu đăng nhập tài khoản.

Entry point: `index.js`, component chính: `App.js`.
