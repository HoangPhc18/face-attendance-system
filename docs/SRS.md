# TÀI LIỆU THIẾT KẾ KỸ THUẬT (Technical Design)

## 1. Kiến trúc hệ thống

* **Kiến trúc 3 tầng:**
  - Tầng giao diện người dùng (Frontend): React.js hoặc Vue.js.
  - Tầng xử lý backend: Flask/Django (Python) hoặc Node.js.
  - Tầng cơ sở dữ liệu: PostgreSQL hoặc SQLite.

* **Mô hình hoạt động:**

[Camera/Webcam] → [Frontend Web] ↔ [Backend API] ↔ [Database]
↘
[Face Recognition + Liveness Detection Module]
↘
[AI Module (tùy chọn)]


---

## 2. Mô-đun chính

### 2.1 Mô-đun Nhận diện khuôn mặt & Đăng ký khuôn mặt

* Sử dụng OpenCV kết hợp FaceNet hoặc MTCNN.
* Xử lý ảnh từ webcam.
* Tách riêng 2 module:
  - `face_enroll.py`: Đăng ký khuôn mặt mới, chỉ cho phép user có quyền (admin/user được phép), xác thực JWT, kiểm tra role.
  - `face_attendance.py`: Chấm công, chỉ xử lý nhận diện, so sánh với embedding đã lưu, ghi nhận check-in/out.
* API `/api/enroll-face`: Đăng ký khuôn mặt mới, yêu cầu xác thực và phân quyền.
* API `/api/attendance/check`: Chấm công, chỉ cho phép từ mạng nội bộ, không yêu cầu đăng nhập.

### 2.2 Mô-đun Liveness detection

* Kiểm tra chuyển động mắt, đầu để phát hiện khuôn mặt thật.
* Sử dụng mô hình CNN nhỏ chạy trên TensorFlow hoặc PyTorch.
* Từ chối các khuôn mặt giả mạo như ảnh tĩnh, video hay mặt nạ.

### 2.3 Mô-đun Quản lý dữ liệu

* Lưu trữ thông tin nhân viên, dữ liệu khuôn mặt, lịch sử chấm công.
* Cung cấp API CRUD (Create, Read, Update, Delete) cho dữ liệu.
* Đăng ký khuôn mặt mới và chấm công được tách thành 2 API/module riêng biệt, phân quyền rõ ràng.
* Các chức năng ngoài chấm công (lịch sử, xin nghỉ phép, báo cáo...) yêu cầu đăng nhập và có thể truy cập từ xa.

### 2.4 Mô-đun Tính toán giờ làm việc

* Tính toán giờ công dựa trên thời gian vào ra.
* Xử lý các trường hợp ca làm việc, làm thêm giờ và nghỉ phép.

### 2.5 Mô-đun AI (tùy chọn)

* Gọi API AI (GPT, Gemini...) để tự động tính lương và tạo báo cáo.
* Chatbot hỗ trợ trả lời thắc mắc nhân viên.

---

## 3. Thiết kế cơ sở dữ liệu (ví dụ)

| Bảng         | Mô tả                             | Các trường chính                                        |
| ------------ | --------------------------------- | ------------------------------------------------------- |
| Employee     | Thông tin nhân viên               | ID, tên, ảnh khuôn mặt, bộ phận                         |
| Attendance   | Lịch sử chấm công                 | ID, EmployeeID, thời gian vào, thời gian ra            |
| User         | Thông tin đăng nhập và phân quyền | UserID, EmployeeID, username, role                      |
| LeaveRequest | Yêu cầu nghỉ phép                 | ID, EmployeeID, ngày bắt đầu, ngày kết thúc, trạng thái |
| AIReports    | Lưu báo cáo AI                    | ID, EmployeeID, loại báo cáo, nội dung                  |

---

## 4. Bảo mật

* Giao tiếp HTTPS toàn hệ thống.
* Mã hóa dữ liệu khuôn mặt khi lưu trữ.
* Chấm công không yêu cầu đăng nhập nhưng chỉ cho phép từ mạng nội bộ (backend kiểm tra IP).
* Các chức năng khác (lịch sử, xin nghỉ phép, báo cáo...) yêu cầu đăng nhập tài khoản.
* Xác thực người dùng và phân quyền bằng JWT cho các chức năng ngoài chấm công.
* Sao lưu dữ liệu định kỳ, đảm bảo khả năng khôi phục.

---

## 5. Yêu cầu phần cứng

* Camera/webcam độ phân giải tối thiểu 720p.
* Máy chủ backend hỗ trợ xử lý đa luồng.
* Mạng nội bộ có băng thông và độ trễ thấp, ổn định.

---

## 6. Giao diện người dùng

* Trang đăng nhập.
* Trang chấm công: hiển thị camera, trạng thái nhận diện khuôn mặt.
* Trang lịch sử chấm công.
* Trang quản lý nhân viên và báo cáo dành cho quản lý.
