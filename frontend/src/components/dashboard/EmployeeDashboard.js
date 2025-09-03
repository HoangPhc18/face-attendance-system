import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  Clock, 
  Calendar, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  User,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const EmployeeDashboard = () => {
  const { user, isInternalNetwork, hasPermission } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const currentMonth = new Date();
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const [attendanceHistory, monthlyData] = await Promise.all([
        apiService.getUserAttendance(user.id, { 
          start_date: startDate, 
          end_date: endDate,
          limit: 7 
        }),
        apiService.getMonthlyStats({ 
          user_id: user.id,
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear()
        })
      ]);

      setRecentAttendance(attendanceHistory.attendance || []);
      setMonthlyStats(monthlyData);
      
      // Calculate stats from recent attendance
      const stats = calculateAttendanceStats(attendanceHistory.attendance || []);
      setAttendanceStats(stats);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAttendanceStats = (attendance) => {
    const today = new Date().toDateString();
    const thisWeek = attendance.filter(record => {
      const recordDate = new Date(record.date).toDateString();
      const daysDiff = Math.floor((new Date() - new Date(record.date)) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });

    const todayRecord = attendance.find(record => 
      new Date(record.date).toDateString() === today
    );

    return {
      todayStatus: todayRecord ? 'present' : 'absent',
      todayCheckIn: todayRecord?.check_in_time || null,
      todayCheckOut: todayRecord?.check_out_time || null,
      todayWorkHours: todayRecord?.work_hours || 0,
      weeklyDays: thisWeek.length,
      weeklyHours: thisWeek.reduce((sum, record) => sum + (record.work_hours || 0), 0)
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xin chào, {user?.full_name || user?.username}!
        </h1>
        <p className="text-gray-600">
          Tổng quan chấm công và hoạt động cá nhân của bạn
        </p>
      </div>

      {/* Today's Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`card ${
          attendanceStats?.todayStatus === 'present' 
            ? 'bg-gradient-to-r from-success-500 to-success-600 text-white'
            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80">Trạng thái hôm nay</p>
              <p className="text-2xl font-bold">
                {attendanceStats?.todayStatus === 'present' ? 'Có mặt' : 'Vắng mặt'}
              </p>
            </div>
            {attendanceStats?.todayStatus === 'present' ? (
              <CheckCircle className="w-12 h-12 text-white/60" />
            ) : (
              <XCircle className="w-12 h-12 text-white/60" />
            )}
          </div>
        </div>

        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Giờ làm hôm nay</p>
              <p className="text-2xl font-bold">
                {attendanceStats?.todayWorkHours?.toFixed(1) || '0'} giờ
              </p>
            </div>
            <Clock className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100">Tuần này</p>
              <p className="text-2xl font-bold">
                {attendanceStats?.weeklyDays || 0}/7 ngày
              </p>
            </div>
            <Calendar className="w-12 h-12 text-warning-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Thao Tác Nhanh
          </h2>
          
          <div className="space-y-3">
            {/* Face Attendance - Internal Network Only */}
            {isInternalNetwork ? (
              <Link
                to="/attendance"
                className="block p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Chấm công bằng khuôn mặt</p>
                    <p className="text-sm text-gray-600">Chấm công vào/ra không cần đăng nhập</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-500">Chấm công bằng khuôn mặt</p>
                    <p className="text-sm text-gray-400">Chỉ khả dụng từ mạng nội bộ</p>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Requests */}
            {hasPermission('canCreateLeaveRequests') && (
              <Link
                to="/leave/create"
                className="block p-3 bg-success-50 hover:bg-success-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-success-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Yêu cầu nghỉ phép</p>
                    <p className="text-sm text-gray-600">Tạo đơn xin nghỉ phép mới</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Personal Reports */}
            {hasPermission('canViewOwnReports') && (
              <Link
                to="/reports/personal"
                className="block p-3 bg-warning-50 hover:bg-warning-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-warning-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Báo cáo cá nhân</p>
                    <p className="text-sm text-gray-600">Xem lịch sử chấm công chi tiết</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Today's Timeline */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Thời Gian Hôm Nay
          </h2>

          {attendanceStats?.todayCheckIn || attendanceStats?.todayCheckOut ? (
            <div className="space-y-4">
              {attendanceStats.todayCheckIn && (
                <div className="flex items-center p-3 bg-success-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-success-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Chấm công vào</p>
                    <p className="text-sm text-gray-600">{attendanceStats.todayCheckIn}</p>
                  </div>
                </div>
              )}

              {attendanceStats.todayCheckOut && (
                <div className="flex items-center p-3 bg-danger-50 rounded-lg">
                  <XCircle className="w-6 h-6 text-danger-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Chấm công ra</p>
                    <p className="text-sm text-gray-600">{attendanceStats.todayCheckOut}</p>
                  </div>
                </div>
              )}

              {attendanceStats.todayWorkHours > 0 && (
                <div className="flex items-center p-3 bg-primary-50 rounded-lg">
                  <Clock className="w-6 h-6 text-primary-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Tổng giờ làm việc</p>
                    <p className="text-sm text-gray-600">
                      {attendanceStats.todayWorkHours.toFixed(1)} giờ
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Chưa có dữ liệu chấm công hôm nay</p>
              {isInternalNetwork && (
                <Link to="/attendance" className="btn-primary mt-3">
                  Chấm công ngay
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="mt-8 card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Lịch Sử Chấm Công Gần Đây
        </h2>

        {recentAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ vào
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ ra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAttendance.map((record, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.check_in_time || '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.check_out_time || '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.work_hours ? `${record.work_hours.toFixed(1)}h` : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'present' 
                          ? 'bg-success-100 text-success-800'
                          : record.status === 'late'
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-danger-100 text-danger-800'
                      }`}>
                        {record.status === 'present' && 'Có mặt'}
                        {record.status === 'late' && 'Muộn'}
                        {record.status === 'absent' && 'Vắng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Chưa có dữ liệu chấm công</p>
          </div>
        )}

        {recentAttendance.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              to="/reports/personal"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Xem tất cả lịch sử →
            </Link>
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      {monthlyStats && (
        <div className="mt-8 card">
          <h2 className="text-xl font-semibold mb-4">Tóm Tắt Tháng Này</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">
                {monthlyStats.total_days || 0}
              </p>
              <p className="text-sm text-gray-600">Tổng ngày làm</p>
            </div>
            
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <p className="text-2xl font-bold text-success-600">
                {monthlyStats.present_days || 0}
              </p>
              <p className="text-sm text-gray-600">Ngày có mặt</p>
            </div>
            
            <div className="text-center p-4 bg-warning-50 rounded-lg">
              <p className="text-2xl font-bold text-warning-600">
                {monthlyStats.late_days || 0}
              </p>
              <p className="text-sm text-gray-600">Ngày muộn</p>
            </div>
            
            <div className="text-center p-4 bg-danger-50 rounded-lg">
              <p className="text-2xl font-bold text-danger-600">
                {monthlyStats.absent_days || 0}
              </p>
              <p className="text-sm text-gray-600">Ngày vắng</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
