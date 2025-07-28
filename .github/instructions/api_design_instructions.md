# API Design Instructions for Face Attendance System

This document defines the API design constraints and requirements for the project, based on the official API documentation and project functionality.

---

## General Principles
- All endpoints (except login) require JWT authentication via the Authorization header.
- Use RESTful conventions for resource management (users, attendance, leave, etc.).
- Use clear role-based access control: Admin vs. Employee.
- All image uploads must use `multipart/form-data`.
- Return JSON responses with clear status and error messages.
- Use appropriate HTTP status codes for all responses.

---

## Endpoint Requirements


### 1. Authentication & Authorization
- `POST /api/auth/login`: Accepts username/password, returns JWT token. Accessible to all users.

### 2. User Management
- `POST /api/users/register`: Register a new user. Admin only.
- `GET /api/users`: List all users. Admin only.


### 3. Attendance, Enroll & Liveness
- `POST /api/enroll-face`: Register new face (enroll). **Requires JWT, only for user with permission (admin/user được phép)**
- `POST /api/attendance/check`: Employee checks in/out using face recognition and liveness detection. Requires image upload.
  - **No JWT required**
  - **Only accessible from internal network (backend checks IP)**
- `POST /api/liveness/check`: Check liveness of a face. Requires image upload and JWT.

### 4. History & Reports
- `GET /api/attendance/history`: Get personal attendance history. Employee/Admin. **Requires JWT**
- `GET /api/report/attendance`: Get overall attendance report. Admin only. **Requires JWT**

### 5. Leave Management
- `POST /api/leave/request`: Employee requests leave. **Requires JWT**
- `POST /api/leave/approve/<request_id>`: Admin approves leave request. **Requires JWT**

### 6. AI & Chatbot (Optional)
- `POST /api/ai/calculate_salary`: Admin calculates salary using AI. **Requires JWT**
- `POST /api/ai/chatbot`: Chatbot for information lookup. Employee/Admin. **Requires JWT**

---

## Security & Validation
- All sensitive actions require proper authentication and authorization.
- Validate all input data (including file types for uploads).
- Ensure clear error handling and informative error messages.

---

## Notes
- Follow the API.md documentation strictly for endpoint names, methods, and roles.
- Any changes to API design must be reflected in this document and API.md.
