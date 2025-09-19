import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  Clock,
  DollarSign,
  FileText,
  Filter,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const ReportsAnalytics = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [userPerformance, setUserPerformance] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState('attendance');
  const [exportFormat, setExportFormat] = useState('excel');

  useEffect(() => {
    if (isAdmin) {
      loadReportsData();
    }
  }, [isAdmin, selectedMonth, selectedYear]);

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      
      const [
        dashboardStats,
        monthlyData,
        performanceData,
        trendsData
      ] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getMonthlyStats({ month: selectedMonth, year: selectedYear }),
        apiService.getUserPerformance({ month: selectedMonth, year: selectedYear }),
        apiService.getAttendanceTrends({ period: 'month', year: selectedYear })
      ]);

      if (dashboardStats.success) {
        setAttendanceStats(dashboardStats.data);
      }

      if (monthlyData.success) {
        setMonthlyStats(monthlyData.data);
      }

      if (performanceData.success) {
        setUserPerformance(performanceData.data || []);
      }

      if (trendsData.success) {
        setAttendanceTrends(trendsData.data);
      }

    } catch (error) {
      console.error('Failed to load reports data:', error);
      toast.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        month: selectedMonth,
        year: selectedYear,
        format: exportFormat
      };

      const response = await apiService.exportReport(reportType, exportFormat, params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileExtension = exportFormat === 'excel' ? 'xlsx' : 'csv';
      const fileName = `${reportType}_report_${selectedMonth}_${selectedYear}.${fileExtension}`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Xuất báo cáo thành công!');
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Lỗi xuất báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 95) return 'text-green-600 bg-green-100';
    if (percentage >= 85) return 'text-blue-600 bg-blue-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
              Báo Cáo & Phân Tích
            </h1>
            <p className="text-gray-600 mt-2">Thống kê và báo cáo chi tiết về chấm công</p>
          </div>
          <button
            onClick={loadReportsData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tháng</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Năm</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại báo cáo</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="attendance">Chấm công</option>
              <option value="salary">Lương</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Định dạng</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExportReport}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng nhân viên</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {attendanceStats.total_users || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chấm công hôm nay</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {attendanceStats.today_attendance || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tỷ lệ chấm công</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {attendanceStats.attendance_rate ? `${attendanceStats.attendance_rate}%` : '0%'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng lương tháng</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {attendanceStats.total_salary ? formatCurrency(attendanceStats.total_salary) : '0 ₫'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Statistics */}
      {monthlyStats && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Thống Kê Tháng {selectedMonth}/{selectedYear}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {monthlyStats.total_working_days || 0}
              </div>
              <div className="text-sm text-gray-600">Ngày làm việc</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {monthlyStats.total_present_days || 0}
              </div>
              <div className="text-sm text-gray-600">Ngày có mặt</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {monthlyStats.total_absent_days || 0}
              </div>
              <div className="text-sm text-gray-600">Ngày vắng mặt</div>
            </div>
          </div>

          {monthlyStats.daily_stats && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Biểu đồ chấm công hàng ngày</h4>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Biểu đồ sẽ được hiển thị ở đây</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Performance */}
      {userPerformance.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Hiệu Suất Nhân Viên
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày làm việc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày có mặt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tỷ lệ chấm công
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ làm việc
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lương ước tính
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userPerformance.slice(0, 10).map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.working_days || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.present_days || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPerformanceColor(user.attendance_rate || 0)}`}>
                        {user.attendance_rate ? `${user.attendance_rate}%` : '0%'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.total_hours ? `${user.total_hours}h` : '0h'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.estimated_salary ? formatCurrency(user.estimated_salary) : '0 ₫'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Trends */}
      {attendanceTrends && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Xu Hướng Chấm Công Năm {selectedYear}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Tổng quan theo tháng</h4>
              <div className="space-y-2">
                {attendanceTrends.monthly_trends && attendanceTrends.monthly_trends.map((month, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Tháng {month.month}</span>
                    <div className="flex space-x-4 text-sm">
                      <span className="text-green-600">{month.present_days} có mặt</span>
                      <span className="text-red-600">{month.absent_days} vắng</span>
                      <span className="text-blue-600">{month.attendance_rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Biểu đồ xu hướng</h4>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Biểu đồ xu hướng sẽ được hiển thị ở đây</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900">Đang xử lý...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
