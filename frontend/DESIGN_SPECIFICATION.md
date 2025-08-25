# Thiết Kế Giao Diện Hệ Thống Chấm Công Khuôn Mặt

## 🎨 Tổng Quan Thiết Kế

### Nguyên Tắc Thiết Kế
- **Security-First UI**: Giao diện phản ánh logic bảo mật network-based
- **Role-Based Interface**: UI thay đổi theo quyền Admin/User
- **Network-Aware Design**: Hiển thị trạng thái mạng và quyền truy cập
- **Modern & Intuitive**: Clean design với UX tối ưu

### Color Scheme
```css
Primary Colors:
- Primary Blue: #2563eb (Trust & Security)
- Success Green: #10b981 (Attendance Success)
- Warning Orange: #f59e0b (Network Warnings)
- Error Red: #ef4444 (Access Denied)
- Gray Scale: #f8fafc, #e2e8f0, #64748b, #1e293b

Network Status Colors:
- Internal Network: #10b981 (Green)
- External Network: #f59e0b (Orange)
- Blocked Access: #ef4444 (Red)
```

## 📱 Component Architecture

### 1. Layout Components
```
AppLayout/
├── Header/
│   ├── NetworkStatus        # Hiển thị trạng thái mạng
│   ├── UserProfile         # Avatar & user info
│   └── NotificationBell    # Real-time notifications
├── Sidebar/
│   ├── Navigation          # Role-based menu
│   └── NetworkInfo         # Network access info
└── MainContent/
    ├── PageHeader          # Breadcrumb & actions
    └── ContentArea         # Dynamic content
```

### 2. Core Components
```
Components/
├── Auth/
│   ├── Login               # JWT authentication
│   ├── NetworkGuard        # Network access control
│   └── RoleGuard          # Role-based access
├── Attendance/
│   ├── FaceCapture         # Camera interface
│   ├── LivenessCheck       # Anti-spoofing UI
│   ├── AttendanceCard      # Status display
│   └── AttendanceHistory   # Data table
├── FaceEnrollment/
│   ├── AdminFaceEnroll     # Admin-only enrollment
│   ├── FacePreview         # Face detection preview
│   └── BulkEnrollment      # Mass registration
├── Dashboard/
│   ├── StatsCards          # KPI metrics
│   ├── AttendanceChart     # Visual analytics
│   └── QuickActions        # Shortcut buttons
└── Common/
    ├── NetworkBanner       # Network status banner
    ├── AccessDenied        # 403 error page
    └── LoadingSpinner      # Loading states
```

## 🖥️ Screen Designs

### 1. Login Screen
```
┌─────────────────────────────────────┐
│  🏢 Face Attendance System          │
│                                     │
│  📍 Network: Internal ✅            │
│     IP: 192.168.1.10                │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  👤 Username                    │ │
│  │  🔒 Password                    │ │
│  │  [Login Button]                 │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ℹ️  Internal network detected      │
│     Face attendance available       │
└─────────────────────────────────────┘
```

### 2. Dashboard - Internal Network
```
┌─────────────────────────────────────────────────────────┐
│ Header: 🏢 Dashboard | 📍 Internal ✅ | 👤 User | 🔔 3  │
├─────────────────────────────────────────────────────────┤
│ Sidebar │ Main Content                                   │
│ ────────┼─────────────────────────────────────────────── │
│ 🏠 Dashboard │ ✅ Welcome! Face attendance available    │
│ 📸 Check-in  │                                         │
│ 📊 History   │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │
│ 🏖️ Leave     │ │Today│ │Week │ │Month│ │Total│        │
│ 🤖 AI Chat   │ │ 8h  │ │40h  │ │160h │ │2080h│        │
│ ⚙️ Admin     │ └─────┘ └─────┘ └─────┘ └─────┘        │
│              │                                         │
│ 🌐 Network   │ [📸 Quick Check-in] [📋 View Reports]   │
│ Internal ✅   │                                         │
│ All features │ 📈 Attendance Chart                     │
│ available    │ ████████████████████████████████████    │
└──────────────┴─────────────────────────────────────────┘
```

### 3. Dashboard - External Network
```
┌─────────────────────────────────────────────────────────┐
│ Header: 🏢 Dashboard | 📍 External ⚠️ | 👤 User | 🔔 3  │
├─────────────────────────────────────────────────────────┤
│ Sidebar │ Main Content                                   │
│ ────────┼─────────────────────────────────────────────── │
│ 🏠 Dashboard │ ⚠️ External Network - Limited Access     │
│ ❌ Check-in  │                                         │
│ 📊 History   │ 🚫 Face attendance blocked for security  │
│ 🏖️ Leave     │                                         │
│ 🤖 AI Chat   │ Available features:                     │
│              │ ✅ View attendance history              │
│ 🌐 Network   │ ✅ Submit leave requests                │
│ External ⚠️   │ ✅ View reports                         │
│ Limited      │ ✅ AI chatbot support                   │
│ access       │                                         │
│              │ [🏖️ Request Leave] [📊 View History]    │
└──────────────┴─────────────────────────────────────────┘
```

### 4. Face Check-in (Internal Network Only)
```
┌─────────────────────────────────────┐
│ 📸 Face Attendance Check-in         │
│                                     │
│ 🌐 Internal Network ✅              │
│ No login required                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │     📹 Camera Preview           │ │
│ │                                 │ │
│ │   [Face Detection Active]       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🔍 Liveness Check: ✅ Passed        │
│ 👤 Face Recognition: Processing...   │
│                                     │
│ [📸 Capture] [🔄 Retry]             │
└─────────────────────────────────────┘
```

### 5. Access Denied (External Network)
```
┌─────────────────────────────────────┐
│ 🚫 Access Denied                    │
│                                     │
│ 📍 External Network Detected        │
│ IP: 203.113.xxx.xxx                 │
│                                     │
│ ❌ Face attendance is blocked from   │
│    external networks for security   │
│                                     │
│ Available options:                  │
│ ✅ View attendance history          │
│ ✅ Submit leave requests            │
│ ✅ Access reports                   │
│ ✅ Use AI chatbot                   │
│                                     │
│ [📊 View History] [🏖️ Leave Request] │
└─────────────────────────────────────┘
```

### 6. Admin Panel
```
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Admin Panel - Face Enrollment                        │
├─────────────────────────────────────────────────────────┤
│ Tabs: [👥 Users] [📸 Faces] [📊 Reports] [⚙️ Settings] │
│                                                         │
│ 🔐 Admin-Only Functions:                                │
│                                                         │
│ ┌─────────────────┐ ┌─────────────────┐                │
│ │ 📸 Enroll Face  │ │ 👥 Bulk Import  │                │
│ │ Register new    │ │ Mass user       │                │
│ │ employee faces  │ │ registration    │                │
│ └─────────────────┘ └─────────────────┘                │
│                                                         │
│ 📋 Pending Faces: 3                                    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ID  │ Preview │ Date       │ Actions              │ │
│ │ 001 │ [👤]    │ 2025-01-15 │ [✅ Approve] [❌ Reject] │ │
│ │ 002 │ [👤]    │ 2025-01-15 │ [✅ Approve] [❌ Reject] │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Network-Aware UI Features

### 1. Network Status Banner
```jsx
// Component hiển thị trạng thái mạng
<NetworkBanner>
  {isInternal ? (
    <div className="bg-green-100 border-green-500">
      🌐 Internal Network - Full access available
    </div>
  ) : (
    <div className="bg-orange-100 border-orange-500">
      ⚠️ External Network - Limited features only
    </div>
  )}
</NetworkBanner>
```

### 2. Feature Access Indicators
```jsx
// Component hiển thị quyền truy cập tính năng
<FeatureCard feature="attendance">
  {networkAccess.face_attendance ? (
    <div className="text-green-600">
      ✅ Available - No login required
    </div>
  ) : (
    <div className="text-red-600">
      🚫 Blocked - Internal network only
    </div>
  )}
</FeatureCard>
```

### 3. Dynamic Navigation
```jsx
// Menu thay đổi theo network và role
<Navigation>
  <NavItem to="/dashboard" icon="🏠">Dashboard</NavItem>
  
  {networkAccess.face_attendance ? (
    <NavItem to="/checkin" icon="📸">Check-in</NavItem>
  ) : (
    <NavItem disabled icon="❌">Check-in (Blocked)</NavItem>
  )}
  
  <NavItem to="/attendance" icon="📊">History</NavItem>
  <NavItem to="/leave" icon="🏖️">Leave</NavItem>
  
  {userRole === 'admin' && (
    <NavItem to="/admin" icon="⚙️">Admin</NavItem>
  )}
</Navigation>
```

## 📱 Responsive Design

### Mobile Layout
```
┌─────────────────┐
│ ☰ 🏢 📍 👤 🔔   │ Header
├─────────────────┤
│                 │
│ 📸 Quick Actions │ Cards
│ [Check-in] [Leave] │
│                 │
│ 📊 Today Stats  │
│ In: 08:30       │
│ Out: --:--      │
│                 │
│ 📈 Weekly Chart │
│ ████████████    │
│                 │
│ [View More]     │
└─────────────────┘
```

### Tablet Layout
```
┌─────────────────────────────────┐
│ Header with full navigation     │
├─────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────┐ │
│ │ Stats   │ │ Main Content    │ │
│ │ Cards   │ │                 │ │
│ │         │ │ Charts/Tables   │ │
│ │ Actions │ │                 │ │
│ └─────────┘ └─────────────────┘ │
└─────────────────────────────────┘
```

## 🔧 Technical Implementation

### State Management
```jsx
// Context cho network awareness
const NetworkContext = createContext();

// Context cho user permissions
const PermissionsContext = createContext();

// Hook để check feature access
const useFeatureAccess = (feature) => {
  const { networkType } = useContext(NetworkContext);
  const { userRole } = useContext(PermissionsContext);
  
  return checkFeatureAccess(feature, networkType, userRole);
};
```

### API Integration
```jsx
// Service để check network status
const networkService = {
  getStatus: () => api.get('/api/network/status'),
  getFeatures: () => api.get('/api/restrictions/features'),
  checkAccess: (feature) => api.get(`/api/restrictions/check-access/${feature}`)
};
```

Thiết kế này đảm bảo giao diện phản ánh chính xác logic bảo mật của backend, với network-aware UI và role-based access control được tích hợp sâu vào trải nghiệm người dùng.
