# Face Attendance System - Frontend

Giao diện người dùng cho hệ thống chấm công bằng khuôn mặt với phân quyền theo mạng và vai trò.

## 🚀 Tính Năng Chính

### 🔐 **Ma Trận Quyền Hạn**
- **Internal Network + Admin**: Toàn quyền hệ thống
- **Internal Network + Employee**: Chấm công không cần đăng nhập + tính năng cơ bản
- **External Network + Admin**: Đầy đủ quyền admin sau khi đăng nhập
- **External Network + Employee**: Chỉ xem dữ liệu cá nhân sau khi đăng nhập

### 🌐 **Phân Quyền Theo Mạng**
- **Mạng nội bộ**: Chấm công bằng khuôn mặt không cần đăng nhập
- **Mạng bên ngoài**: Bắt buộc đăng nhập, hạn chế tính năng chấm công

### 👥 **Vai Trò Người Dùng**
- **Admin**: Quản lý toàn hệ thống, phê duyệt đăng ký khuôn mặt
- **Employee**: Xem dữ liệu cá nhân, tạo yêu cầu nghỉ phép

## 📦 Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js 16+ 
- npm hoặc yarn
- Backend API đang chạy (mặc định: http://localhost:5000)

### Bước 1: Cài Đặt Dependencies
```bash
npm install
```

### Bước 2: Cấu Hình Environment
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
REACT_APP_API_URL=http://localhost:5000
NODE_ENV=development
PORT=3000
```

### Bước 3: Khởi Chạy Development Server
```bash
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## 🏗️ Cấu Trúc Dự Án

```
src/
├── components/           # React components
│   ├── admin/           # Admin dashboard & management
│   ├── attendance/      # Face attendance interface
│   ├── auth/           # Login/Register pages
│   ├── common/         # Shared components
│   ├── dashboard/      # Employee dashboard
│   ├── face-enrollment/ # Face enrollment management
│   ├── layout/         # Navigation & layout
│   ├── leave/          # Leave request management
│   └── reports/        # Reports & statistics
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication & permissions
├── services/           # API & utility services
│   ├── apiService.js   # Backend API calls
│   └── networkService.js # Network detection
├── App.js             # Main app with routing
└── index.js           # App entry point
```

## 🔧 Scripts Có Sẵn

### Development
```bash
npm start          # Khởi chạy dev server
npm test           # Chạy tests
npm run build      # Build production
npm run eject      # Eject CRA (không khuyến nghị)
```

### Production Build
```bash
npm run build
```

Build sẽ được tạo trong thư mục `build/` và sẵn sàng deploy.

## 🌐 Routing & Navigation

### Public Routes
- `/` - Trang chủ
- `/login` - Đăng nhập
- `/register` - Đăng ký

### Protected Routes
- `/dashboard` - Dashboard nhân viên
- `/admin` - Dashboard admin (chỉ admin)
- `/attendance` - Chấm công (chỉ mạng nội bộ)
- `/face-enrollment` - Quản lý đăng ký khuôn mặt (chỉ admin)
- `/leave` - Quản lý nghỉ phép
- `/reports` - Báo cáo & thống kê

### Error Pages
- `/unauthorized` - Không có quyền truy cập
- `/network-restricted` - Bị hạn chế mạng
- `/feature-restricted` - Tính năng bị hạn chế

## 🔐 Hệ Thống Phân Quyền

### Network Detection
Hệ thống tự động phát hiện loại mạng:
- **Internal**: 192.168.x.x, 10.x.x.x, 172.16-31.x.x, 127.x.x.x
- **External**: Tất cả IP khác

### Permission Matrix
```javascript
// Face Attendance: Chỉ mạng nội bộ
canAccessFaceAttendance: isInternalNetwork

// Admin Functions: Admin role bất kể mạng
canAccessAdminPanel: isAdmin
canManageFaceEnrollment: isAdmin

// General Features: Mạng nội bộ free, ngoài cần auth
canViewReports: isInternal || (isExternal && isAuthenticated)
canCreateLeaveRequests: isInternal || (isExternal && isAuthenticated)
```

## 🎨 UI Components & Styling

### Tailwind CSS
Sử dụng Tailwind CSS cho styling với custom theme:
- Primary: Blue (#3b82f6)
- Success: Green (#22c55e) 
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)

### Component Classes
```css
.btn-primary     # Primary button
.btn-secondary   # Secondary button  
.btn-danger      # Danger button
.card           # Card container
.input-field    # Form input
```

### Icons
Sử dụng Lucide React icons cho consistency.

## 📱 Responsive Design

- **Mobile First**: Thiết kế ưu tiên mobile
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid System**: CSS Grid và Flexbox
- **Navigation**: Responsive navbar với mobile menu

## 🔄 State Management

### AuthContext
Quản lý authentication và permissions:
```javascript
const {
  user,              // Current user info
  isAuthenticated,   // Auth status
  isAdmin,          // Admin role check
  isInternalNetwork, // Network type
  hasPermission,    // Permission checker
  login,            // Login function
  logout            // Logout function
} = useAuth();
```

### API Integration
Tất cả API calls thông qua `apiService.js`:
- Automatic JWT token handling
- Request/response interceptors
- Error handling
- Network-aware requests

## 🚨 Error Handling

### Network Errors
- Automatic retry cho failed requests
- Fallback UI cho network issues
- User-friendly error messages

### Permission Errors
- Redirect đến appropriate error pages
- Clear messaging về access restrictions
- Graceful degradation

## 🔧 Development Tips

### Hot Reload
Development server hỗ trợ hot reload cho:
- React components
- CSS changes
- Context updates

### Debugging
```javascript
// Network status debugging
console.log(networkService.getNetworkStatus());

// Permission debugging  
console.log(authContext.permissions);
```

### Testing
```bash
npm test                    # Run all tests
npm test -- --coverage     # Run with coverage
npm test -- --watch        # Watch mode
```

## 🚀 Deployment

### Environment Variables
Production cần set:
```env
REACT_APP_API_URL=https://your-api-domain.com
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### Build Process
```bash
npm run build
```

### Static Hosting
Build output có thể deploy lên:
- Netlify
- Vercel  
- AWS S3 + CloudFront
- Nginx static hosting

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 Troubleshooting

### Common Issues

**1. Network Detection Không Hoạt Động**
- Kiểm tra backend API `/api/network/status`
- Verify CORS settings
- Check network configuration

**2. Authentication Errors**
- Clear localStorage: `localStorage.clear()`
- Check JWT token expiry
- Verify backend auth endpoints

**3. Permission Issues**
- Check user role trong database
- Verify network detection
- Review permission logic

**4. Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check dependency versions
- Verify environment variables

### Debug Commands
```bash
# Clear cache
npm start -- --reset-cache

# Verbose logging
REACT_APP_DEBUG=true npm start

# Check bundle size
npm run build && npx serve -s build
```

## 📞 Support

Liên hệ team development để được hỗ trợ:
- Issues: GitHub Issues
- Documentation: Wiki
- Email: dev-team@company.com

## 📄 License

Private project - All rights reserved.

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
