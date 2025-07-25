# TÀI LIỆU ĐẶC TẢ DỰ ÁN (Project Description)

## HỆ THỐNG CHẤM CÔNG BẰNG KHUÔN MẶT

---

## 1. Giới thiệu dự án

### 1.1 Bối cảnh

Việc quản lý thời gian làm việc của nhân viên là một phần quan trọng trong hoạt động của doanh nghiệp. Các phương pháp chấm công truyền thống như sử dụng thẻ, vân tay hoặc đăng nhập thủ công có thể dẫn đến các vấn đề như gian lận, tốn thời gian và không chính xác.

Hệ thống chấm công bằng khuôn mặt ứng dụng công nghệ nhận diện sinh trắc học là giải pháp hiện đại, tiện lợi, chính xác và tăng cường bảo mật cho doanh nghiệp.

### 1.2 Mục tiêu dự án

- Xây dựng hệ thống chấm công bằng khuôn mặt tích hợp nhận diện khuôn mặt và chống giả mạo (liveness detection).
- Quản lý dữ liệu chấm công, tự động tính toán giờ làm việc và hỗ trợ xuất báo cáo.
- Mở rộng tích hợp AI để tự động tính lương và hỗ trợ bộ phận nhân sự.

### 1.3 Phạm vi áp dụng

- Hệ thống hoạt động trong mạng nội bộ công ty.
- Nhân viên chỉ có thể chấm công khi kết nối mạng nội bộ.
- Hỗ trợ đa nền tảng: giao diện web, có thể mở rộng sang thiết bị kiosk.

---

## 2. Chức năng chính của hệ thống

### 2.1 Nhận diện khuôn mặt và chấm công

- Thu thập hình ảnh khuôn mặt qua camera.
- Nhận diện và xác thực nhân viên dựa trên dữ liệu khuôn mặt đã đăng ký.
- Ghi nhận thời gian chấm công vào hệ thống.

### 2.2 Liveness detection (chống giả mạo)

- Kiểm tra dấu hiệu sống như nháy mắt, chuyển động đầu.
- Ngăn chặn gian lận bằng hình ảnh, video giả mạo.

### 2.3 Quản lý dữ liệu chấm công

- Lưu trữ lịch sử giờ công, ngày công của nhân viên.
- Hỗ trợ tìm kiếm, lọc và chỉnh sửa dữ liệu.

### 2.4 Giao diện người dùng

- Giao diện web cho nhân viên và quản lý.
- Hiển thị lịch sử chấm công, thống kê cơ bản.
- Tích hợp webcam để chấm công trực tiếp qua trình duyệt.

### 2.5 Báo cáo và xuất dữ liệu

- Xuất dữ liệu chấm công ra file Excel, CSV.
- Báo cáo tổng hợp giờ làm việc, làm thêm, nghỉ phép.

### 2.6 Tự động tính giờ làm việc

- Tính tổng giờ công hàng ngày, làm thêm giờ.
- Tự động tính ngày nghỉ phép, nghỉ không lương.

### 2.7 Cảnh báo và nhắc nhở

- Thông báo nhân viên chưa chấm công, chấm công muộn.
- Cảnh báo quản lý khi phát hiện bất thường.

### 2.8 Phân quyền và quản lý người dùng

- Phân quyền nhân viên, quản lý.
- Truy cập và thao tác theo vai trò.

### 2.9 (Mở rộng) Tích hợp AI tự động

- Tự động tính lương, thưởng, phạt qua API AI (GPT/Gemini).
- Chatbot hỗ trợ tra cứu thông tin chấm công.
- Phân tích dữ liệu chấm công, dự báo và phát hiện gian lận.

---

## 3. Công nghệ sử dụng

| Thành phần          | Công nghệ đề xuất                        |
| ------------------- | ---------------------------------------- |
| Nhận diện khuôn mặt | OpenCV, dlib, FaceNet, hoặc MTCNN        |
| Liveness detection  | OpenCV, TensorFlow/PyTorch (model CNN)   |
| Backend             | Python Flask, Restful API                 |
| Frontend            | React.js                                 |
| Cơ sở dữ liệu       | PostgreSQL                              |
| AI tích hợp         | OpenAI GPT API, Google Gemini API        |
| Xuất báo cáo        | pandas (Python)                          |
| Mạng                | Mạng nội bộ công ty (LAN/WiFi bảo mật)   |
| Bảo mật             | HTTPS, JWT, mã hóa dữ liệu sinh trắc học |

---

## 4. Yêu cầu kỹ thuật và vận hành

### 4.1 Môi trường mạng

- Hệ thống chỉ hoạt động khi thiết bị kết nối vào mạng nội bộ của công ty.
- Giới hạn truy cập từ bên ngoài để tránh gian lận và rò rỉ dữ liệu.
- Tối ưu tốc độ xử lý trên mạng LAN để đảm bảo độ trễ thấp khi nhận diện khuôn mặt.

### 4.2 Bảo mật

- Mã hóa dữ liệu cá nhân và sinh trắc học.
- Quản lý phân quyền truy cập nghiêm ngặt.
- Lưu trữ và xử lý dữ liệu tuân thủ các quy định về bảo vệ thông tin cá nhân.

### 4.3 Hiệu năng

- Nhận diện khuôn mặt nhanh (<1 giây) để tránh ùn tắc khi chấm công đông người.
- Hệ thống có khả năng xử lý đồng thời nhiều yêu cầu.

### 4.4 Khả năng mở rộng

- Dễ dàng tích hợp các tính năng AI mới như tính lương tự động, chatbot.
- Hỗ trợ đa nền tảng, dễ nâng cấp và bảo trì.

---

## 5. Kiến trúc hệ thống (mô hình tổng quan)

[Camera/Webcam]
    ↓
[Giao diện web (Frontend)] ↔ [Backend API] ↔ [Cơ sở dữ liệu]
    ↓
[Mô hình nhận diện khuôn mặt + liveness detection]
    ↓
[API AI tính lương, chatbot (nếu có)]


---

## 6. Kế hoạch triển khai (gợi ý)

| Giai đoạn                | Nội dung chính                          
| ------------------------ | --------------------------------------- 
| 1. Phân tích & thiết kế  | Lập đặc tả yêu cầu, chọn công nghệ      
| 2. Phát triển cơ bản     | Nhận diện khuôn mặt, lưu trữ, giao diện 
| 3. Phát triển mở rộng    | Liveness detection, tính giờ làm việc   
| 4. Tích hợp AI           | Tính lương tự động, chatbot             
| 5. Kiểm thử & hiệu chỉnh | Kiểm thử toàn hệ thống, bảo mật         
| 6. Triển khai & bàn giao | Cài đặt thực tế, đào tạo người dùng     

---

# Kết luận

Hệ thống chấm công bằng khuôn mặt sẽ giúp doanh nghiệp nâng cao hiệu quả quản lý nhân sự, giảm thiểu gian lận, tự động hóa quy trình tính lương và báo cáo. Việc thiết kế và triển khai dự án cần tuân thủ các yêu cầu về bảo mật và vận hành trong mạng nội bộ để đảm bảo an toàn thông tin.
