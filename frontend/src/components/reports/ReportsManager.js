import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users,
  Clock,
  TrendingUp,
  Filter,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import toast from 'react-hot-toast';

const ReportsManager = () => {
  const { user, isAdmin, hasPermission } = useAuth();
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');

  useEffect(() => {
    if (hasPermission('canViewOwnReports') || hasPermission('canViewAllReports')) {
      loadReportData();
    }
  }, [reportType, dateRange]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      let data;
      
      const params = {
        start_date: dateRange.start,
        end_date: dateRange.end,
        ...(isAdmin ? {} : { user_id: user.id })
      };

      switch (reportType) {
        case 'attendance':
          data = await apiService.getAttendanceReport(params);
          break;
        case 'salary':
          data = await apiService.getSalaryReport(params);
          break;
        case 'statistics':
          data = await apiService.getMonthlyStats(params);
          break;
        default:
          data = await apiService.getAttendanceReport(params);
      }
      
      setReportData(data);
    } catch (error) {
      console.error('Failed to load report data:', error);
      toast.error('Không thể tải dữ liệu báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        start_date: dateRange.start,
        end_date: dateRange.end,
        ...(isAdmin ? {} : { user_id: user.id })
      };

      const blob = await apiService.exportReport(reportType, exportFormat, params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${dateRange.start}_${dateRange.end}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Xuất báo cáo thành công');
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Lỗi xuất báo cáo');
    }
  };

  if (!hasPermission('canViewOwnReports') && !hasPermission('canViewAllReports')) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <AlertTriangle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Truy Cập Bị Hạn Chế</h2>
          <p className="text-gray-600">
            Bạn không có quyền truy cập vào tính năng báo cáo từ mạng này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Báo Cáo & Thống Kê
        </h1>
        <p className="text-gray-600">
          {isAdmin ? 'Báo cáo tổng quan hệ thống' : 'Báo cáo cá nhân của bạn'}
        </p>
      </div>

      {/* Controls */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại báo cáo
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="attendance">Chấm công</option>
              <option value="salary">Lương</option>
              <option value="statistics">Thống kê</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="input-field"
            />
          </div>

          {/* Export */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xuất file
            </label>
            <div className="flex space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="input-field flex-1"
              >
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
              <button
                onClick={handleExport}
                className="btn-primary flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {reportType === 'attendance' && <AttendanceReport data={reportData} />}
          {reportType === 'salary' && <SalaryReport data={reportData} />}
          {reportType === 'statistics' && <StatisticsReport data={reportData} />}
        </div>
      ) : (
        <div className="card text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không có dữ liệu
          </h3>
          <p className="text-gray-600">
            Không có dữ liệu báo cáo trong khoảng thời gian đã chọn.
          </p>
        </div>
      )}
    </div>
  );
};

// Attendance Report Component
const AttendanceReport = ({ data }) => {
  const chartData = data.daily_stats || [];
  const summary = data.summary || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Tổng ngày làm</p>
              <p className="text-3xl font-bold">{summary.total_days || 0}</p>
            </div>
            <Calendar className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100">Ngày có mặt</p>
              <p className="text-3xl font-bold">{summary.present_days || 0}</p>
            </div>
            <Users className="w-12 h-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100">Ngày muộn</p>
              <p className="text-3xl font-bold">{summary.late_days || 0}</p>
            </div>
            <Clock className="w-12 h-12 text-warning-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100">Ngày vắng</p>
              <p className="text-3xl font-bold">{summary.absent_days || 0}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-danger-200" />
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Biểu Đồ Chấm Công Hàng Ngày</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#22c55e" name="Có mặt" />
            <Bar dataKey="late" fill="#f59e0b" name="Muộn" />
            <Bar dataKey="absent" fill="#ef4444" name="Vắng" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Chi Tiết Chấm Công</h3>
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
              {(data.attendance_records || []).map((record, index) => (
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
      </div>
    </div>
  );
};

// Salary Report Component
const SalaryReport = ({ data }) => {
  const summary = data.summary || {};
  const breakdown = data.breakdown || {};

  return (
    <div className="space-y-6">
      {/* Salary Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="text-center">
            <p className="text-primary-100">Lương cơ bản</p>
            <p className="text-3xl font-bold">{summary.base_salary?.toLocaleString() || 0} VNĐ</p>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div className="text-center">
            <p className="text-success-100">Thưởng</p>
            <p className="text-3xl font-bold">{summary.bonus?.toLocaleString() || 0} VNĐ</p>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className="text-center">
            <p className="text-warning-100">Tổng lương</p>
            <p className="text-3xl font-bold">{summary.total_salary?.toLocaleString() || 0} VNĐ</p>
          </div>
        </div>
      </div>

      {/* Salary Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Chi Tiết Lương</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Lương cơ bản:</span>
            <span className="font-semibold">{breakdown.base_salary?.toLocaleString() || 0} VNĐ</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-success-50 rounded">
            <span>Thưởng chuyên cần:</span>
            <span className="font-semibold text-success-600">+{breakdown.attendance_bonus?.toLocaleString() || 0} VNĐ</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-primary-50 rounded">
            <span>Thưởng làm thêm giờ:</span>
            <span className="font-semibold text-primary-600">+{breakdown.overtime_bonus?.toLocaleString() || 0} VNĐ</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-danger-50 rounded">
            <span>Phạt đi muộn:</span>
            <span className="font-semibold text-danger-600">-{breakdown.late_penalty?.toLocaleString() || 0} VNĐ</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-danger-50 rounded">
            <span>Phạt vắng mặt:</span>
            <span className="font-semibold text-danger-600">-{breakdown.absent_penalty?.toLocaleString() || 0} VNĐ</span>
          </div>
          
          <hr className="my-4" />
          
          <div className="flex justify-between items-center p-3 bg-warning-50 rounded">
            <span className="text-lg font-semibold">Tổng cộng:</span>
            <span className="text-xl font-bold text-warning-600">{summary.total_salary?.toLocaleString() || 0} VNĐ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Statistics Report Component
const StatisticsReport = ({ data }) => {
  const trends = data.trends || [];
  const distribution = data.distribution || [];

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Xu Hướng Chấm Công</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="attendance_rate" stroke="#22c55e" name="Tỷ lệ có mặt %" />
            <Line type="monotone" dataKey="late_rate" stroke="#f59e0b" name="Tỷ lệ muộn %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Phân Bố Trạng Thái</h3>
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Tóm Tắt Thống Kê</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Hiệu suất chung:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Tỷ lệ có mặt: {data.overall_attendance_rate || 0}%</li>
              <li>• Tỷ lệ đúng giờ: {data.punctuality_rate || 0}%</li>
              <li>• Giờ làm trung bình: {data.average_work_hours || 0}h/ngày</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">So với tháng trước:</h4>
            <ul className="space-y-2 text-sm">
              <li className={`flex items-center ${data.attendance_change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                Chấm công: {data.attendance_change >= 0 ? '+' : ''}{data.attendance_change || 0}%
              </li>
              <li className={`flex items-center ${data.punctuality_change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                <Clock className="w-4 h-4 mr-1" />
                Đúng giờ: {data.punctuality_change >= 0 ? '+' : ''}{data.punctuality_change || 0}%
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
