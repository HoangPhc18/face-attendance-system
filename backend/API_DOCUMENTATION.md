# Face Attendance System API Documentation

## Network-Based Access Control

The Face Attendance System implements sophisticated network-based access control with different authorization levels based on client location and user roles.

### Network Types

- **Internal Network**: Clients from configured IP ranges (192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 127.0.0.1/32)
- **External Network**: All other clients

### Authorization Matrix

| Feature | Internal Network | External Network | Admin Only |
|---------|------------------|------------------|------------|
| Face Attendance | No auth required | Login + Face required | No |
| Leave Requests | Available | Auth required | No |
| Reports & Statistics | Available | Auth required | No |
| Face Enrollment | Admin only | Admin only | Yes |
| User Management | Admin only | Admin only | Yes |
| System Admin | Admin only | Admin only | Yes |

## API Endpoints

### Authentication

#### POST /api/auth/login
Login to get JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "user",
      "full_name": "Full Name",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### POST /api/auth/verify
Verify JWT token validity.

**Headers:** `Authorization: Bearer <token>`

### Network Detection

#### GET /api/network/status
Get current network detection status.

**Response:**
```json
{
  "success": true,
  "data": {
    "client_ip": "192.168.1.100",
    "is_internal_network": true,
    "network_type": "internal",
    "detected_ranges": ["192.168.0.0/16"]
  }
}
```

#### GET /api/network/config
Get network configuration (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### Attendance

#### POST /api/attendance/check-in
Face recognition attendance check-in.

**Authorization:**
- Internal Network: No authentication required
- External Network: JWT token required

**Request:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action": "check_in",
    "user": {
      "id": 1,
      "username": "user",
      "full_name": "Full Name"
    },
    "confidence": 0.95,
    "timestamp": "2024-01-01T10:00:00",
    "liveness_passed": true,
    "liveness_score": 0.87
  }
}
```

#### GET /api/attendance/history
Get attendance history.

**Authorization:** External network requires authentication

**Query Parameters:**
- `user_id`: Filter by user (admin only)
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20)

### Extended Attendance

#### GET /api/attendance/extended/status
Get current attendance status for user.

**Authorization:** External network requires authentication

#### GET /api/attendance/extended/summary
Get attendance summary for a period.

**Authorization:** External network requires authentication

#### POST /api/attendance/extended/manual-entry
Manual attendance entry (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "user_id": 1,
  "date": "2024-01-01",
  "check_in_time": "09:00",
  "check_out_time": "17:00",
  "status": "present"
}
```

### Face Enrollment (Admin Only)

#### POST /api/face_enrollment/enroll
Enroll a new face (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:** Multipart form with image file

**Response:**
```json
{
  "success": true,
  "data": {
    "pending_id": "uuid",
    "message": "Face enrolled successfully. Please complete user registration."
  }
}
```

#### POST /api/face_enrollment/register
Complete user registration with pending face (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "username": "newuser",
  "full_name": "New User",
  "email": "newuser@example.com",
  "pending_id": "uuid",
  "role": "user"
}
```

#### GET /api/face_enrollment/pending
Get list of pending face enrollments (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### Extended Face Enrollment (Admin Only)

#### POST /api/face_enrollment/extended/enroll-base64
Face enrollment with base64 image (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "image": "base64_encoded_image_data"
}
```

#### POST /api/face_enrollment/extended/bulk-register
Bulk user registration (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "users": [
    {
      "username": "user1",
      "full_name": "User One",
      "email": "user1@example.com",
      "pending_id": "uuid1",
      "role": "user"
    }
  ]
}
```

### Access Control & Restrictions

#### GET /api/restrictions/features
Get available features based on network type.

**Response:**
```json
{
  "success": true,
  "data": {
    "features": {
      "face_attendance": true,
      "no_login_required": true,
      "face_enrollment": false,
      "leave_requests": true,
      "reports": true,
      "admin_panel": false,
      "network_type": "internal"
    },
    "client_ip": "192.168.1.100",
    "network_type": "internal"
  }
}
```

#### GET /api/restrictions/access-policy
Get detailed access policy information.

#### GET /api/restrictions/check-access/{feature}
Check if user has access to specific feature.

**Headers:** `Authorization: Bearer <token>`

### Leave Requests

#### POST /api/leave/submit
Submit a new leave request.

**Authorization:** External network requires authentication

**Request:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-01-03",
  "reason": "Personal leave"
}
```

#### GET /api/leave/list
Get leave requests for current user.

**Authorization:** External network requires authentication

#### POST /api/leave/approve/{request_id}
Approve a leave request (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### Admin Functions

#### GET /api/admin/users
Get all users (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

#### PUT /api/admin/users/{user_id}
Update user information (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

#### DELETE /api/admin/users/{user_id}
Delete user (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

#### GET /api/admin/leave-requests
Get all leave requests (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

### Reports & Statistics

All report and statistics endpoints require authentication for external networks.

#### GET /api/reports/attendance
Generate attendance report.

**Authorization:** External network requires authentication

**Query Parameters:**
- `start_date`: Start date
- `end_date`: End date
- `user_id`: Filter by user (admin only)
- `format`: Response format (json, excel, csv)

#### GET /api/statistics/attendance/monthly
Get monthly attendance statistics.

**Authorization:** External network requires authentication

#### GET /api/statistics/system/overview
Get system overview statistics (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

## Error Responses

### Authentication Errors
```json
{
  "success": false,
  "error": "Authentication required for external network access",
  "message": "Please provide valid JWT token",
  "network_type": "external"
}
```

### Authorization Errors
```json
{
  "success": false,
  "error": "Admin access required"
}
```

### Network Access Errors
```json
{
  "success": false,
  "error": "Access denied. Internal network required.",
  "client_ip": "203.0.113.1"
}
```

## Security Features

### Network Detection
- Automatic IP-based network type detection
- Configurable internal IP ranges via environment variables
- Support for IPv4 and IPv6 addresses
- Proxy-aware IP detection (X-Forwarded-For, X-Real-IP)

### Role-Based Access Control
- Admin role required for sensitive operations
- User role restrictions for data access
- Automatic role verification via JWT tokens

### Data Isolation
- External users restricted to their own records
- Admin users can access all data
- Network-based data access policies

### Audit Logging
- All security events logged
- Failed authentication attempts tracked
- Admin actions audited
- Network access violations logged

## Environment Configuration

```bash
# Network Detection
INTERNAL_IP_RANGES=192.168.0.0/16,10.0.0.0/8,172.16.0.0/12,127.0.0.1/32

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/face_attendance

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Admin Account
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-admin-password
ADMIN_FULLNAME=System Administrator
```

## Testing

Use the provided test script to verify access control:

```bash
python test_network_access_control.py
```

The test script validates:
- Network detection accuracy
- Attendance access control
- Face enrollment admin restrictions
- External network limitations
- Data isolation policies
