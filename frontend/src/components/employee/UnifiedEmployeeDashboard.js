import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import FaceAttendanceWidget from './FaceAttendanceWidget';
import LeaveManagement from './LeaveManagement';
import AttendanceHistory from './AttendanceHistory';
import ExternalProfile from './ExternalProfile';
import { 
  Home, 
  User, 
  Clock, 
  FileText, 
  Calendar,
  Settings,
  LogOut,
  WifiOff,
  Wifi,
  Menu,
  X,
  Camera,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

const UnifiedEmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [networkType, setNetworkType] = useState('checking');
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    attendanceStats: {},
    leaveRequests: [],
    recentAttendance: [],
    notifications: []
  });

  useEffect(() => {
    loadNetworkFeatures();
    loadDashboardData();
  }, []);

  const loadNetworkFeatures = async () => {
    try {
      const response = await apiService.getNetworkFeatures();
      if (response.success) {
        setNetworkType(response.data.network_type);
        setAvailableFeatures(response.data.available_features);
      }
    } catch (error) {
      console.error('Failed to check network features:', error);
      setNetworkType('external');
      setAvailableFeatures(['password_login', 'profile_view', 'leave_requests_view']);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [attendanceRes, leaveRes, notificationRes] = await Promise.all([
        apiService.getAttendanceHistory({ limit: 10 }),
        apiService.getLeaveRequests(),
        apiService.getNotifications ? apiService.getNotifications() : Promise.resolve({ success: true, data: [] })
      ]);

      setDashboardData({
        attendanceStats: attendanceRes.data?.stats || {},
        leaveRequests: leaveRes.data?.requests || [],
        recentAttendance: attendanceRes.data?.attendance || [],
        notifications: notificationRes.data || []
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigation = [
    { 
      id: 'dashboard', 
      name: 'Dashboard', 
      icon: Home,
      available: true
    },
    { 
      id: 'attendance', 
      name: 'Chấm công', 
      icon: Clock,
      available: availableFeatures.includes('face_attendance') || networkType === 'internal'
    },
    { 
      id: 'leave', 
      name: 'Nghỉ phép', 
      icon: FileText,
      available: availableFeatures.includes('leave_requests') || availableFeatures.includes('leave_requests_view')
    },
    { 
      id: 'history', 
      name: 'Lịch sử', 
      icon: Calendar,
      available: true
    },
    { 
      id: 'profile', 
      name: 'Hồ sơ', 
      icon: User,
      available: true
    }
  ];

  const NetworkStatus = () => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      networkType === 'internal' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-orange-100 text-orange-800'
    }`}>
      {networkType === 'internal' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span className="text-sm font-medium">
        {networkType === 'internal' ? 'Mạng nội bộ' : 'Mạng ngoại bộ'}
      </span>
    </div>
  );

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Nhân viên</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isDisabled = !item.available;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isDisabled) {
                    setCurrentView(item.id);
                    setSidebarOpen(false);
                  }
                }}
                disabled={isDisabled}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
                {isDisabled && <XCircle className="w-4 h-4 ml-auto text-red-400" />}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="px-3 mb-4">
            <NetworkStatus />
          </div>
          
          <div className="space-y-1">
            <div className="px-3 py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
    </div>
  );

  const DashboardView = () => (
    <div className="p-6">
      {/* Network Notice */}
      {networkType === 'external' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-orange-900">Truy cập từ mạng ngoại bộ</h3>
          </div>
          <p className="text-sm text-orange-800 mb-3">
            Một số tính năng bị hạn chế khi truy cập từ bên ngoài công ty.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span>Chấm công bằng khuôn mặt</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Xem lịch sử chấm công</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tháng này</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.recentAttendance.filter(a => {
                  const date = new Date(a.date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).length} ngày
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nghỉ phép duyệt</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.leaveRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.leaveRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Thông báo</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dashboardData.notifications.filter(n => !n.is_read).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Attendance */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Chấm công gần đây
            </h2>
          </div>
          
          <div className="p-6">
            {dashboardData.recentAttendance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có dữ liệu chấm công</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentAttendance.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.check_in_time && `Vào: ${new Date(record.check_in_time).toLocaleTimeString('vi-VN')}`}
                        {record.check_out_time && ` - Ra: ${new Date(record.check_out_time).toLocaleTimeString('vi-VN')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {record.total_hours ? `${record.total_hours}h` : '-'}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status === 'present' ? 'Có mặt' :
                         record.status === 'late' ? 'Muộn' : 'Vắng'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Yêu cầu nghỉ phép
              </h2>
              {availableFeatures.includes('leave_requests') && (
                <button
                  onClick={() => setCurrentView('leave')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem tất cả
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {dashboardData.leaveRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Chưa có yêu cầu nghỉ phép nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.leaveRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(request.start_date).toLocaleDateString('vi-VN')} - {new Date(request.end_date).toLocaleDateString('vi-VN')}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status === 'approved' ? 'Đã duyệt' :
                         request.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                    <p className="text-xs text-gray-500">
                      Gửi lúc: {new Date(request.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const AttendanceView = () => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chấm công</h1>
        <p className="text-gray-600">
          {networkType === 'internal' 
            ? 'Sử dụng khuôn mặt để chấm công nhanh chóng'
            : 'Chức năng chấm công chỉ khả dụng từ mạng nội bộ'
          }
        </p>
      </div>

      <FaceAttendanceWidget 
        networkType={networkType} 
        onAttendanceUpdate={loadDashboardData}
      />
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'attendance':
        return <AttendanceView />;
      case 'leave':
        return <LeaveManagement networkType={networkType} availableFeatures={availableFeatures} />;
      case 'history':
        return <AttendanceHistory networkType={networkType} />;
      case 'profile':
        return <ExternalProfile />;
      default:
        return <DashboardView />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <NetworkStatus />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default UnifiedEmployeeDashboard;
