# Face Enrollment Workflow - New Implementation

## 🎯 Overview

Workflow mới cho việc đăng ký khuôn mặt nhân viên:
1. **Admin tạo tài khoản** cho nhân viên mới
2. **Admin mở camera** để quét khuôn mặt và tạo face embedding
3. **Hệ thống link** face embedding với tài khoản user

## 🔄 Workflow Steps

### Step 1: Create User Account
**Endpoint**: `POST /api/face_enrollment/create-user`

**Admin tạo tài khoản cho nhân viên mới:**

```json
{
  "username": "john_doe",
  "full_name": "John Doe",
  "email": "john.doe@company.com",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john.doe@company.com",
    "role": "user",
    "temp_password": "temp123",
    "message": "User account created successfully. Now proceed to capture face.",
    "next_step": "capture_face"
  }
}
```

### Step 2: Capture Face from Camera
**Endpoint**: `POST /api/face_enrollment/capture-face`

**Admin sử dụng camera để quét khuôn mặt:**

```json
{
  "user_id": 123,
  "face_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": 123,
    "username": "john_doe",
    "full_name": "John Doe",
    "message": "Face captured and registered successfully!",
    "status": "completed"
  }
}
```

## 📋 API Endpoints

### 1. Create User Account
- **Method**: POST
- **URL**: `/api/face_enrollment/create-user`
- **Auth**: Admin only
- **Purpose**: Tạo tài khoản user mới

### 2. Capture Face
- **Method**: POST  
- **URL**: `/api/face_enrollment/capture-face`
- **Auth**: Admin only
- **Purpose**: Quét khuôn mặt từ camera và link với user

### 3. Get Users Without Face
- **Method**: GET
- **URL**: `/api/face_enrollment/users-without-face`
- **Auth**: Admin only
- **Purpose**: Lấy danh sách user chưa có face

### 4. Get User Status
- **Method**: GET
- **URL**: `/api/face_enrollment/user-status/{user_id}`
- **Auth**: Admin only
- **Purpose**: Kiểm tra trạng thái enrollment của user

## 🖥️ Frontend Implementation

### Step 1: User Creation Form
```javascript
const createUser = async (userData) => {
  const response = await fetch('/api/face_enrollment/create-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  if (result.success) {
    // Proceed to face capture
    openFaceCapture(result.data.user_id);
  }
};
```

### Step 2: Camera Face Capture
```javascript
const captureFace = async (userId) => {
  // Get camera stream
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const video = document.createElement('video');
  video.srcObject = stream;
  
  // Capture frame from video
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Convert to base64
  const imageData = canvas.toDataURL('image/jpeg');
  
  // Send to backend
  const response = await fetch('/api/face_enrollment/capture-face', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      user_id: userId,
      face_image: imageData
    })
  });
  
  const result = await response.json();
  if (result.success) {
    alert('Face registered successfully!');
  }
};
```

## 🔒 Security Features

1. **Admin Only**: Chỉ admin mới có thể tạo user và capture face
2. **Face Validation**: Kiểm tra chỉ có 1 khuôn mặt trong ảnh
3. **Duplicate Prevention**: Không cho phép user có nhiều face
4. **Active User Check**: Chỉ user active mới có thể đăng ký face

## 🧪 Testing

### Manual Test
```bash
# 1. Start server
python run.py

# 2. Run test script
python test_new_enrollment.py
```

### API Test với curl
```bash
# 1. Login admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# 2. Create user
curl -X POST http://localhost:5000/api/face_enrollment/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"username": "test_user", "full_name": "Test User", "email": "test@company.com"}'

# 3. Capture face (with base64 image)
curl -X POST http://localhost:5000/api/face_enrollment/capture-face \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"user_id": 123, "face_image": "data:image/jpeg;base64,..."}'
```

## 📊 Database Changes

### Users Table
- Tạo user với `password_hash` tạm thời
- `is_active = TRUE` ngay từ đầu

### Faces Table  
- Lưu face encoding dưới dạng JSON
- Link trực tiếp với `user_id`
- Không cần `pending_faces` table nữa

## 🔄 Migration from Old Workflow

### Old Workflow (Deprecated)
1. Upload ảnh → pending_faces
2. Tạo user → link với pending face

### New Workflow (Current)
1. Tạo user account trước
2. Capture face từ camera → link trực tiếp

### Backward Compatibility
- Endpoint `/api/face_enrollment/pending` vẫn hoạt động
- Redirect đến `/api/face_enrollment/users-without-face`

## 🎯 Benefits

1. **Better UX**: Workflow rõ ràng, từng bước một
2. **Real-time Capture**: Sử dụng camera thay vì upload file
3. **Better Security**: Admin control toàn bộ quá trình
4. **Easier Management**: Dễ track user nào chưa có face
5. **No Orphan Data**: Không có pending faces không được sử dụng

## 🚀 Next Steps

1. **Frontend Implementation**: Tạo UI cho workflow mới
2. **Camera Integration**: Implement camera capture component
3. **Face Quality Check**: Thêm validation cho chất lượng ảnh
4. **Bulk Enrollment**: Hỗ trợ đăng ký nhiều user cùng lúc
5. **Face Re-registration**: Cho phép đăng ký lại face nếu cần
