# Face Attendance System - Frontend

A modern React.js frontend for the Face Attendance System with webcam integration, real-time face recognition, and comprehensive attendance management.

## Features

- 🎯 **Face Check-in/Check-out** - Webcam-based attendance without login (internal network only)
- 👤 **Face Enrollment** - Register new users with face recognition
- 📊 **Dashboard** - Real-time attendance statistics and overview
- 📅 **Attendance History** - View and export attendance records
- 🏖️ **Leave Management** - Request and manage time off
- 👨‍💼 **Admin Panel** - User management and system administration
- 🤖 **AI Assistant** - Chatbot for HR queries and support
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Technology Stack

- **React.js 19** - Modern UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Webcam** - Camera integration
- **Lucide React** - Modern icon library
- **React Hot Toast** - Notification system
- **Date-fns** - Date manipulation utilities

## Prerequisites

- Node.js 16+ and npm
- Backend API server running on port 5000
- Webcam access for face recognition features

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```

## Development

### Start Development Server
```bash
npm start
```
Opens [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
```
Creates optimized production build in `build/` folder.

### Run Tests
```bash
npm test
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Login.js        # Authentication
│   ├── Dashboard.js    # Main dashboard
│   ├── AttendanceCheckIn.js  # Face check-in
│   ├── FaceEnrollment.js     # Face registration
│   ├── AttendanceHistory.js  # History view
│   ├── LeaveRequest.js       # Leave management
│   ├── AdminPanel.js         # Admin interface
│   ├── ChatBot.js           # AI assistant
│   ├── Navigation.js        # Navigation bar
│   ├── WebcamCapture.js     # Camera component
│   └── ProtectedRoute.js    # Route protection
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication state
├── services/          # API services
│   └── api.js         # API client
└── App.js             # Main application
```

## Key Features

### Authentication & Security
- JWT-based authentication
- Role-based access control (User/Admin)
- Protected routes
- Network-based access control for face check-in

### Face Recognition
- Real-time webcam capture
- Face enrollment with user registration
- Attendance check-in/out without login (internal network only)
- Image preview and retake functionality

### Dashboard & Analytics
- Real-time attendance statistics
- Daily, weekly, monthly summaries
- Recent attendance history
- Quick action buttons

### Attendance Management
- Comprehensive history view with filters
- Export to Excel functionality
- Search and date range filtering
- Pagination for large datasets

### Leave Management
- Submit leave requests with reason
- View request status (Pending/Approved/Rejected)
- Admin approval workflow
- Leave type categorization

### Admin Features
- User management (Create/Edit/Delete)
- Role assignment
- Face enrollment for new users
- System monitoring

### AI Integration
- Chatbot for HR queries
- Attendance statistics via chat
- Natural language processing
- Contextual responses

## API Integration

The frontend communicates with the backend API through:

- **Authentication**: `/api/auth/*`
- **Face Enrollment**: `/api/enroll-face`
- **Attendance**: `/api/attendance/*`
- **Leave Requests**: `/api/leave/*`
- **Admin Functions**: `/api/admin/*`
- **AI Features**: `/api/ai/*`

## Network Requirements

### Internal Network Access
- Face check-in only works on company internal network
- Automatic network detection
- IP-based access control

### External Access
- Login required for external access
- All features except face check-in available
- Secure authentication required

## Browser Support

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: Webcam features require HTTPS in production.

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```
REACT_APP_API_URL=https://your-api-domain.com
```

### HTTPS Requirements
- Webcam access requires HTTPS in production
- Configure SSL certificates
- Update API URLs to HTTPS

## Troubleshooting

### Webcam Issues
- Ensure camera permissions are granted
- Check HTTPS requirement in production
- Verify camera is not used by other applications

### Network Detection
- Face check-in requires internal network
- Check IP range configuration
- Verify backend network validation

### API Connection
- Verify backend server is running
- Check CORS configuration
- Validate API endpoint URLs

## Contributing

1. Follow React best practices
2. Use functional components with hooks
3. Implement proper error handling
4. Add loading states for async operations
5. Ensure responsive design
6. Test webcam functionality across browsers

## License

This project is part of the Face Attendance System.

## Support

For technical support or questions about the frontend:
- Check the troubleshooting section
- Review browser console for errors
- Verify API connectivity
- Ensure proper network configuration
