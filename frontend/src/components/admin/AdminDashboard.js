import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import AdminLayout from './AdminLayout';
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboardStats, systemOverview, usersWithoutFace, leaveRequests, systemLogs] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getSystemOverview(),
        apiService.getUsersWithoutFace(),
        apiService.getLeaveRequests({ status: 'pending', limit: 5 }),
        apiService.getSystemLogs({ limit: 10 })
      ]);

      setStats({ 
        ...dashboardStats.data, 
        ...systemOverview.data,
        usersWithoutFace: usersWithoutFace.users_without_face?.length || 0,
        pendingLeaveRequests: leaveRequests.data?.filter(req => req.status === 'pending').length || 0
      });
      
      setPendingApprovals([
        ...usersWithoutFace.users_without_face?.map(user => ({
          id: user.id,
          type: 'face_enrollment',
          user: user.full_name,
          username: user.username,
          time: new Date(user.created_at).toLocaleTimeString(),
          status: 'pending'
        })) || [],
        ...leaveRequests.data?.filter(req => req.status === 'pending').map(req => ({
          id: req.id,
          type: 'leave_request',
          user: req.user_name,
          reason: req.reason,
          dates: `${req.start_date} - ${req.end_date}`,
          time: new Date(req.created_at).toLocaleTimeString(),
          status: 'pending'
        })) || []
      ]);
      
      // Recent activity from system logs
      setRecentActivity(systemLogs.data?.map(log => ({
        id: log.id,
        type: log.action,
        user: log.user_info || 'System',
        time: new Date(log.timestamp).toLocaleTimeString(),
        status: log.level === 'ERROR' ? 'error' : 'success',
        message: log.message
      })) || []);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <AlertTriangle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Truy Cập Bị Từ Chối</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập vào trang quản trị.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bảng Điều Khiển Quản Trị
        </h1>
        <p className="text-gray-600">
          Tổng quan hệ thống và quản lý toàn bộ chức năng
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Tổng nhân viên</p>
              <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
            </div>
            <Users className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100">Có mặt hôm nay</p>
              <p className="text-3xl font-bold">{stats?.present_today || 0}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100">Đang chờ duyệt</p>
              <p className="text-3xl font-bold">{pendingApprovals.length}</p>
            </div>
            <Clock className="w-12 h-12 text-warning-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100">Vắng mặt</p>
              <p className="text-3xl font-bold">{stats?.absent_today || 0}</p>
            </div>
            <XCircle className="w-12 h-12 text-danger-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Thao Tác Nhanh
          </h2>
          
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="block p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 text-primary-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Quản lý nhân viên</p>
                  <p className="text-sm text-gray-600">Thêm, sửa, xóa tài khoản</p>
                </div>
              </div>
            </Link>

            <Link
              to="/face-enrollment"
              className="block p-3 bg-success-50 hover:bg-success-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <UserPlus className="w-5 h-5 text-success-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Đăng ký khuôn mặt</p>
                  <p className="text-sm text-gray-600">Duyệt yêu cầu đăng ký mới</p>
                </div>
              </div>
            </Link>

            <Link
              to="/reports"
              className="block p-3 bg-warning-50 hover:bg-warning-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-warning-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Báo cáo hệ thống</p>
                  <p className="text-sm text-gray-600">Xem báo cáo chi tiết</p>
                </div>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Cài đặt hệ thống</p>
                  <p className="text-sm text-gray-600">Cấu hình và bảo mật</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Chờ Phê Duyệt
          </h2>

          {pendingApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingApprovals.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Đăng ký khuôn mặt</p>
                    <p className="text-sm text-gray-600">ID: {item.id}</p>
                  </div>
                  <Link
                    to={`/face-enrollment/pending/${item.id}`}
                    className="btn-primary text-sm"
                  >
                    Xem
                  </Link>
                </div>
              ))}
              
              {pendingApprovals.length > 5 && (
                <Link
                  to="/face-enrollment"
                  className="block text-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Xem tất cả ({pendingApprovals.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-2" />
              <p className="text-gray-600">Không có yêu cầu nào đang chờ</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Hoạt Động Gần Đây
          </h2>

          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {activity.type === 'check_in' && (
                    <CheckCircle className="w-4 h-4 text-success-500 mr-2" />
                  )}
                  {activity.type === 'check_out' && (
                    <XCircle className="w-4 h-4 text-danger-500 mr-2" />
                  )}
                  {activity.type === 'face_enrollment' && (
                    <UserPlus className="w-4 h-4 text-warning-500 mr-2" />
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-xs text-gray-600">
                      {activity.type === 'check_in' && 'Chấm công vào'}
                      {activity.type === 'check_out' && 'Chấm công ra'}
                      {activity.type === 'face_enrollment' && 'Đăng ký khuôn mặt'}
                    </p>
                  </div>
                </div>
                
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="mt-8 card">
        <h2 className="text-xl font-semibold mb-4">Tình Trạng Hệ Thống</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <p className="font-medium text-gray-900">Database</p>
            <p className="text-sm text-success-600">Hoạt động bình thường</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <p className="font-medium text-gray-900">Face Recognition</p>
            <p className="text-sm text-success-600">Hoạt động bình thường</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <p className="font-medium text-gray-900">API Services</p>
            <p className="text-sm text-success-600">Hoạt động bình thường</p>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
