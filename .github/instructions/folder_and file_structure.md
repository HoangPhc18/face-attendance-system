# CẤU TRÚC THƯ MỤC & FILE DỰ ÁN: FACE-ATTENDANCE-SYSTEM

face-attendance-system/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py                # Khởi tạo Flask app
│   │   ├── routes.py                  # Định nghĩa API endpoints (đăng nhập, chấm công, báo cáo...)
│   │   ├── models.py                  # Định nghĩa các model DB (User, Attendance, LeaveRequest...)
│   │   ├── face_recognition.py        # Module nhận diện khuôn mặt
│   │   ├── liveness_detection.py      # Module chống giả mạo (liveness detection)
│   │   ├── ai_integration.py          # Tích hợp AI (GPT/Gemini) cho tính lương, chatbot, phân tích dữ liệu
│   │   ├── utils.py                   # Các hàm hỗ trợ chung (xử lý ảnh, mã hóa...)
│   │   ├── auth.py                    # Xác thực, phân quyền JWT
│   │   └── config.py                  # Cấu hình ứng dụng (biến môi trường, DB...)
│   │
│   ├── migrations/                    # Quản lý migrations DB
│   ├── requirements.txt               # Thư viện Python backend
│   └── run.py                         # Entry point backend server
│
├── frontend/
│   ├── public/
│   │   └── index.html                 # HTML gốc
│   ├── src/
│   │   ├── components/                # Các component React (Camera, AttendanceForm, Alert...)
│   │   ├── pages/                     # Các trang chính (Login, Dashboard, Attendance, Report...)
│   │   ├── services/                  # Gọi API backend (auth, attendance, report...)
│   │   ├── utils/                     # Tiện ích JS (xử lý ảnh, validate...)
│   │   ├── App.js                     # Component chính
│   │   └── index.js                   # Entry point React
│   ├── package.json                   # Thư viện frontend
│   └── .env                           # Biến môi trường frontend
│
├── database/
│   └── init.sql                       # Script khởi tạo DB ban đầu (bảng users, attendance, leave_requests...)
│
├── docs/
│   ├── description.md                 # Mô tả dự án tổng quan
│   ├── SRS.md                         # Đặc tả yêu cầu phần mềm
│   └── design.md                      # Thiết kế kỹ thuật hệ thống
│
├── tests/
│   ├── backend_tests/                 # Unit test, integration test cho backend
│   └── frontend_tests/                # Unit test, integration test cho frontend
│
├── docker-compose.yml                 # Docker Compose cho toàn hệ thống
├── Dockerfile.backend                 # Dockerfile backend
├── Dockerfile.frontend                # Dockerfile frontend
├── README.md                          # Hướng dẫn sử dụng, cài đặt dự án
└── .gitignore                         # Các file/thư mục ignore git

# Ghi chú:
# - Đảm bảo module nhận diện khuôn mặt, liveness detection, AI, phân quyền, báo cáo đều có file/module riêng biệt.
# - Cấu trúc này hỗ trợ mở rộng, bảo trì, kiểm thử và triển khai CI/CD dễ dàng.


