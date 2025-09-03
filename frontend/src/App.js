import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';

// Page Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/admin/AdminDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import FaceAttendance from './components/attendance/FaceAttendance';
import FaceEnrollmentManager from './components/face-enrollment/FaceEnrollmentManager';
import LeaveRequestManager from './components/leave/LeaveRequestManager';
import ReportsManager from './components/reports/ReportsManager';
import ApiIntegrationTest from './components/test/ApiIntegrationTest';

// Home Component
const Home = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hệ Thống Chấm Công Bằng Khuôn Mặt
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Giải pháp chấm công thông minh với công nghệ nhận diện khuôn mặt
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Nhận Diện Khuôn Mặt</h3>
            <p className="text-gray-600">
              Chấm công nhanh chóng và chính xác bằng công nghệ AI
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Bảo Mật Cao</h3>
            <p className="text-gray-600">
              Phân quyền theo mạng và vai trò, đảm bảo an toàn dữ liệu
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Báo Cáo Chi Tiết</h3>
            <p className="text-gray-600">
              Thống kê và báo cáo chấm công đầy đủ, trực quan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { isAdmin } = require('./contexts/AuthContext').useAuth();
  
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

// Error Pages
const NotFound = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="card text-center">
      <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Trang không tồn tại</h2>
      <p className="text-gray-600 mb-6">Trang bạn đang tìm kiếm không tồn tại.</p>
      <a href="/" className="btn-primary">Về trang chủ</a>
    </div>
  </div>
);

const Unauthorized = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="card text-center">
      <h1 className="text-6xl font-bold text-warning-400 mb-4">403</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h2>
      <p className="text-gray-600 mb-6">Bạn không có quyền truy cập vào trang này.</p>
      <a href="/" className="btn-primary">Về trang chủ</a>
    </div>
  </div>
);

const NetworkRestricted = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="card text-center">
      <h1 className="text-6xl font-bold text-danger-400 mb-4">🌐</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Bị hạn chế mạng</h2>
      <p className="text-gray-600 mb-6">
        Tính năng này chỉ khả dụng từ mạng nội bộ công ty.
      </p>
      <a href="/" className="btn-primary">Về trang chủ</a>
    </div>
  </div>
);

const FeatureRestricted = () => (
  <div className="max-w-4xl mx-auto p-6">
    <div className="card text-center">
      <h1 className="text-6xl font-bold text-warning-400 mb-4">🔒</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Tính năng bị hạn chế</h2>
      <p className="text-gray-600 mb-6">
        Bạn không có quyền sử dụng tính năng này.
      </p>
      <a href="/" className="btn-primary">Về trang chủ</a>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Dashboard Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Face Attendance - Internal Network Only */}
              <Route 
                path="/attendance" 
                element={
                  <ProtectedRoute requireInternal={true}>
                    <FaceAttendance />
                  </ProtectedRoute>
                } 
              />
              
              {/* Face Enrollment - Admin Only */}
              <Route 
                path="/face-enrollment" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <FaceEnrollmentManager />
                  </ProtectedRoute>
                } 
              />
              
              {/* Leave Requests */}
              <Route 
                path="/leave/*" 
                element={
                  <ProtectedRoute>
                    <LeaveRequestManager />
                  </ProtectedRoute>
                } 
              />
              
              {/* Reports */}
              <Route 
                path="/reports/*" 
                element={
                  <ProtectedRoute>
                    <ReportsManager />
                  </ProtectedRoute>
                } 
              />
              
              {/* API Integration Test */}
              <Route 
                path="/api-test" 
                element={<ApiIntegrationTest />} 
              />
              
              {/* Auto-redirect based on role */}
              <Route 
                path="/auto-dashboard" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <DashboardRouter />
                  </ProtectedRoute>
                } 
              />
              
              {/* Error Pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/network-restricted" element={<NetworkRestricted />} />
              <Route path="/feature-restricted" element={<FeatureRestricted />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
