# TÀI LIỆU THIẾT KẾ HỆ THỐNG CHẤM CÔNG BẰNG KHUÔN MẶT

## 1. Kiến trúc tổng thể

- Hệ thống gồm 3 thành phần chính:
  - **Frontend**: ReactJS (giao diện web cho nhân viên và quản lý)
  - **Backend**: Python Flask (RESTful API, xử lý nhận diện khuôn mặt, liveness, quản lý dữ liệu)
  - **Database**: PostgreSQL (lưu trữ thông tin nhân viên, lịch sử chấm công, phân quyền)

- Mô hình hoạt động:

```mermaid
graph TD
  A[Camera/Webcam] --> B[Giao diện Web (Frontend)]
  B -->|REST API| C[Backend (Flask)]
  C --> D[(Database - PostgreSQL)]
  C --> E[Face Recognition & Liveness Detection]
  C --> F[AI Module (Tùy chọn)]
```

## 2. Mô tả các thành phần

### 2.1 Frontend
- Giao diện đăng nhập, đăng ký, chấm công, xem lịch sử, báo cáo.
- Tích hợp webcam để chụp ảnh khuôn mặt.
- Gửi ảnh/video lên backend để nhận diện và xác thực liveness.
- Hiển thị thông báo, cảnh báo, nhắc nhở.

### 2.2 Backend
- Xử lý API: đăng ký, điểm danh, quản lý người dùng, xuất báo cáo.
- Tích hợp module nhận diện khuôn mặt (OpenCV, dlib, FaceNet/MTCNN).
- Tích hợp liveness detection (CNN nhỏ, TensorFlow/PyTorch).
- Tính toán giờ làm việc, làm thêm, nghỉ phép.
- Tích hợp AI (tùy chọn): tính lương, chatbot, phân tích dữ liệu.
- Quản lý phân quyền, xác thực JWT.

### 2.3 Database
- **users**: id, name, face_encoding, role, ...
- **attendance**: id, user_id, checkin_time, checkout_time, status, ...
- **leave_requests**: id, user_id, start_date, end_date, status
- **ai_reports**: id, user_id, report_type, content

## 3. Luồng hoạt động chính

### 3.1 Đăng ký người dùng
1. Nhân viên nhập thông tin, chụp ảnh khuôn mặt trên frontend.
2. Ảnh gửi lên backend, xử lý và lưu face encoding vào database.

### 3.2 Chấm công
1. Nhân viên truy cập giao diện chấm công, chụp ảnh/video.
2. Backend kiểm tra liveness.
3. Nếu hợp lệ, nhận diện khuôn mặt, ghi nhận thời gian vào/ra.
4. Cập nhật lịch sử chấm công, gửi thông báo nếu có bất thường.

### 3.3 Quản lý & báo cáo
- Quản lý xem lịch sử, xuất báo cáo Excel/CSV, phê duyệt nghỉ phép.
- AI tự động tính lương, phân tích dữ liệu (nếu tích hợp).

## 4. Thiết kế cơ sở dữ liệu (ERD)

```mermaid
erDiagram
  USERS {
    int id PK
    string name
    string face_encoding
    string role
    ...
  }
  ATTENDANCE {
    int id PK
    int user_id FK
    datetime checkin_time
    datetime checkout_time
    string status
  }
  LEAVE_REQUESTS {
    int id PK
    int user_id FK
    date start_date
    date end_date
    string status
  }
  AI_REPORTS {
    int id PK
    int user_id FK
    string report_type
    string content
  }
  USERS ||--o{ ATTENDANCE : "user_id"
  USERS ||--o{ LEAVE_REQUESTS : "user_id"
  USERS ||--o{ AI_REPORTS : "user_id"
```

## 5. Bảo mật & hiệu năng
- Giao tiếp HTTPS toàn hệ thống.
- Mã hóa dữ liệu sinh trắc học khi lưu trữ.
- Xác thực và phân quyền bằng JWT.
- Sao lưu dữ liệu định kỳ, đảm bảo khả năng khôi phục.
- Tối ưu nhận diện khuôn mặt <1 giây, hỗ trợ xử lý đồng thời nhiều yêu cầu.

## 6. Giao diện người dùng
- Trang đăng nhập/đăng ký.
- Trang chấm công (hiển thị camera, trạng thái nhận diện/liveness).
- Trang lịch sử chấm công, báo cáo.
- Trang quản lý nhân viên, phê duyệt nghỉ phép, xuất báo cáo.

## 7. Quyết định thiết kế
- Sử dụng Docker để triển khai, dễ mở rộng.
- Tách biệt frontend-backend qua RESTful API.
- Sử dụng các thư viện nhận diện khuôn mặt và liveness detection phổ biến, dễ bảo trì.
- Hỗ trợ tích hợp AI module trong tương lai.
