folder and file structure for project:
face-attendance-system/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes.py           # Định nghĩa API endpoints
│   │   ├── models.py           # Định nghĩa các model DB
│   │   ├── face_recognition.py # Module nhận diện khuôn mặt
│   │   ├── liveness_detection.py # Module chống giả mạo
│   │   ├── ai_integration.py   # Tích hợp AI GPT/Gemini
│   │   ├── utils.py            # Các hàm hỗ trợ chung
│   │   └── config.py           # Cấu hình ứng dụng
│   │
│   ├── migrations/             # Migrations DB
│   ├── requirements.txt        # Dependencies Python
│   └── run.py                  # Entry point backend server
│
├── frontend/
│   ├── public/
│   │   └── index.html          # HTML gốc
│   ├── src/
│   │   ├── components/         # Các component React
│   │   ├── pages/              # Các trang chính
│   │   ├── services/           # Các gọi API đến backend
│   │   ├── utils/              # Các tiện ích JS
│   │   ├── App.js              # Component chính
│   │   └── index.js            # Entry point React
│   │
│   ├── package.json            # Dependencies frontend
│   └── .env                   # Biến môi trường frontend
│
├── database/
│   └── init.sql                # Script tạo DB ban đầu
│
├── docs/
│   ├── SRS.md                  # Tài liệu yêu cầu phần mềm
│   └── design.md               # Tài liệu thiết kế kỹ thuật
│
├── tests/
│   ├── backend_tests/          # Test backend
│   └── frontend_tests/         # Test frontend
│
├── docker-compose.yml          # (Nếu dùng Docker)
├── Dockerfile.backend          # Dockerfile backend
├── Dockerfile.frontend         # Dockerfile frontend
├── README.md                  # Hướng dẫn dự án
└── .gitignore                 # Các file/thư mục ignore git


