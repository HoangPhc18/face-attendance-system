# Backend Instructions

This is the backend of a face attendance system built with Python and Flask.  
It provides RESTful APIs for:

- Face recognition (via `face_recognition.py`)
- Liveness detection (via `liveness_detection.py`)
- Attendance tracking and storage
- Role-based access (Admin, Manager, Employee)
- AI integration with GPT and Gemini via `ai_integration.py`

It uses PostgreSQL as the main database via SQLAlchemy.  
JWT is used for authentication.  
Data is transmitted over HTTPS and biometric data is encrypted.
