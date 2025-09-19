# 🔐 NETWORK ACCESS CONTROL UPDATE

## 🎯 **VẤN ĐỀ ĐÃ GIẢI QUYẾT**

### **Vấn đề ban đầu:**
- Hệ thống chấm công bằng khuôn mặt với mạng nội bộ
- Khi đăng ký khuôn mặt mới cho nhân viên không cho tạo mật khẩu
- Mật khẩu và vector embedding (face encoding) là khác nhau
- Cần phân biệt access control cho mạng nội bộ vs ngoại bộ

### **Logic yêu cầu:**
- **Mạng nội bộ**: Chỉ cần face recognition để chấm công
- **Mạng ngoại bộ**: Cần đăng nhập + hạn chế chức năng
- **Admin**: Có thể tạo nhân viên chỉ dùng face (không cần password)

## 🔧 **CÁC THAY ĐỔI ĐÃ THỰC HIỆN**

### **1. Database Schema Updates**

#### **Users Table - New Columns:**
```sql
-- Network access control flags
allow_password_login BOOLEAN DEFAULT FALSE,     -- Cho phép login bằng password
allow_face_only BOOLEAN DEFAULT TRUE,           -- Cho phép chấm công chỉ bằng face
require_password_for_external BOOLEAN DEFAULT TRUE, -- Yêu cầu password khi từ mạng ngoại bộ

-- Employee metadata
employee_id VARCHAR(50) UNIQUE,                 -- Mã nhân viên
department VARCHAR(100),                        -- Phòng ban
position VARCHAR(100),                          -- Chức vụ

-- Password is now nullable
password_hash VARCHAR(255) NULL                 -- NULL cho face-only users
```

### **2. User Access Types**

#### **FACE_ONLY Users (Mạng nội bộ only):**
```sql
password_hash: NULL
allow_password_login: FALSE
allow_face_only: TRUE
require_password_for_external: TRUE
```
- ✅ Chấm công bằng face từ mạng nội bộ
- ❌ Không thể truy cập từ mạng ngoại bộ
- ❌ Không có password để login

#### **HYBRID Users (Password + Face):**
```sql
password_hash: có giá trị
allow_password_login: TRUE
allow_face_only: TRUE
require_password_for_external: TRUE
```
- ✅ Mạng nội bộ: Face hoặc password
- ✅ Mạng ngoại bộ: Login password → sau đó dùng face
- ✅ Có thể truy cập từ mọi nơi

#### **ADMIN Users:**
```sql
password_hash: có giá trị
allow_password_login: TRUE
allow_face_only: TRUE
require_password_for_external: FALSE
```
- ✅ Truy cập từ mọi nơi với đầy đủ quyền
- ✅ Không bị hạn chế mạng ngoại bộ

### **3. Face Enrollment Workflow**

#### **Workflow mới:**
1. **Admin tạo user** với thông tin cơ bản (không bắt buộc password)
2. **Admin đăng ký face encoding** cho user
3. **User chấm công** bằng face từ mạng nội bộ
4. **Nếu cần external access**, admin có thể set password sau

#### **API Changes:**
```javascript
// Create face-only user (no password required)
POST /api/admin/users
{
  "username": "john_doe",
  "full_name": "John Doe",
  "email": "john@company.com",
  "access_type": "FACE_ONLY",  // No password needed
  "department": "Sales",
  "position": "Sales Executive"
}

// Create hybrid user (password required)
POST /api/admin/users
{
  "username": "jane_smith",
  "full_name": "Jane Smith", 
  "email": "jane@company.com",
  "access_type": "HYBRID",
  "password": "secure123",     // Password required
  "department": "Marketing"
}
```

### **4. Enhanced Admin API**

#### **Get Users Response:**
```javascript
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "john_doe",
        "full_name": "John Doe",
        "email": "john@company.com",
        "role": "user",
        "employee_id": "EMP001",
        "department": "Sales",
        "position": "Sales Executive",
        "has_face": true,
        "access_type": "FACE_ONLY",           // New field
        "allow_password_login": false,        // New field
        "allow_face_only": true,              // New field
        "require_password_for_external": true // New field
      }
    ]
  }
}
```

## 📁 **FILES UPDATED**

### **1. Database Files:**
- ✅ `database.sql` - Updated schema với network access control
- ✅ `migrate_network_access.sql` - Migration script cho existing database

### **2. Backend API:**
- ✅ `app/api/admin.py` - Enhanced user management với access types
- ✅ Updated `get_users()` - Include access control fields
- ✅ Updated `create_user()` - Support face-only users

### **3. Documentation:**
- ✅ `NETWORK_ACCESS_CONTROL_UPDATE.md` - This document
- ✅ Database comments explaining access control logic

## 🚀 **DEPLOYMENT STEPS**

### **For New Database:**
```bash
# Use updated database.sql
psql -U postgres -d face_attendance_db -f database.sql
```

### **For Existing Database:**
```bash
# Run migration script
psql -U postgres -d face_attendance_db -f migrate_network_access.sql
```

### **Verify Migration:**
```sql
-- Check user types after migration
SELECT 
    username, access_type, 
    allow_password_login, allow_face_only, require_password_for_external
FROM users;
```

## 🎯 **USAGE EXAMPLES**

### **1. Create Face-Only Employee:**
```javascript
// Admin creates employee for internal network only
const newEmployee = {
  username: 'emp001',
  full_name: 'Nguyễn Văn A',
  email: 'nva@company.com',
  access_type: 'FACE_ONLY',  // No password needed
  department: 'Production',
  position: 'Worker'
};

// Employee can only:
// ✅ Check-in/out via face recognition (internal network)
// ❌ Cannot login to web interface
// ❌ Cannot access from external network
```

### **2. Create Hybrid Employee:**
```javascript
// Admin creates employee with both face and password
const hybridEmployee = {
  username: 'manager01',
  full_name: 'Trần Thị B',
  email: 'ttb@company.com',
  access_type: 'HYBRID',
  password: 'secure123',     // Password required
  department: 'Management',
  position: 'Team Leader'
};

// Employee can:
// ✅ Check-in/out via face (internal network)
// ✅ Login to web interface (any network)
// ✅ Access limited features from external network
```

### **3. Upgrade Face-Only to Hybrid:**
```javascript
// Admin can later add password to face-only user
PUT /api/admin/users/123
{
  "access_type": "HYBRID",
  "password": "newpassword123"
}
```

## 🔒 **SECURITY BENEFITS**

1. **Clear Separation**: Face encoding ≠ Password authentication
2. **Network-Based Control**: Internal vs external access logic
3. **Flexible User Types**: Face-only, Hybrid, Admin options
4. **Gradual Upgrade Path**: Can upgrade face-only to hybrid later
5. **Audit Trail**: Track user access types and changes

## ✅ **VERIFICATION CHECKLIST**

- [ ] Database schema updated with new columns
- [ ] Migration script tested on existing data
- [ ] Admin API returns new access control fields
- [ ] Can create face-only users without password
- [ ] Can create hybrid users with password
- [ ] Frontend handles new user types correctly
- [ ] Network detection logic works with new access types

Hệ thống giờ đây hỗ trợ đầy đủ network-based access control với phân biệt rõ ràng giữa password authentication và face recognition! 🎉
