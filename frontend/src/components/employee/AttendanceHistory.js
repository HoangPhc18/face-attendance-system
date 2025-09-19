import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  Clock, 
  Calendar,
  BarChart3,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceHistory = ({ networkType }) => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list, calendar, stats

  useEffect(() => {
    loadAttendanceData();
  }, [dateRange]);

  const loadAttendanceData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAttendanceHistory({
        start_date: dateRange.start,
        end_date: dateRange.end,
        include_stats: true
      });
      
      if (response.success) {
        setAttendanceData(response.data.attendance || []);
        setStatistics(response.data.statistics || {});
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      toast.error('Lỗi tải dữ liệu chấm công');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const response = await apiService.exportAttendance({
        start_date: dateRange.start,
        end_date: dateRange.end,
        format: format
      });
      
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${dateRange.start}_${dateRange.end}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Xuất dữ liệu thành công!');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Lỗi xuất dữ liệu');
    }
  };

  const getStatusBadge = (record) => {
    if (!record.check_in_time) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Vắng
        </span>
      );
    }
    
    if (record.status === 'late') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Muộn
        </span>
      );
    }
    
    if (record.status === 'early_leave') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Về sớm
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Bình thường
      </span>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return '-';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const filteredData = attendanceData.filter(record => {
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesSearch = record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return matchesStatus && matchesSearch;
  });

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 bg-${color}-100 rounded-lg`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <Minus className="w-4 h-4 text-gray-500 mr-1" />
              )}
              <span className={`text-sm ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {Math.abs(change)}% so với tháng trước
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const StatsView = () => (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Tổng ngày làm"
          value={statistics.total_days || 0}
          change={statistics.total_days_change}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Ngày có mặt"
          value={statistics.present_days || 0}
          change={statistics.present_days_change}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Ngày muộn"
          value={statistics.late_days || 0}
          change={statistics.late_days_change}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Tổng giờ làm"
          value={formatDuration(statistics.total_hours || 0)}
          change={statistics.total_hours_change}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thống kê theo trạng thái</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bình thường</span>
              <span className="text-sm font-medium text-green-600">
                {statistics.normal_days || 0} ngày ({((statistics.normal_days || 0) / (statistics.total_days || 1) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Muộn</span>
              <span className="text-sm font-medium text-yellow-600">
                {statistics.late_days || 0} ngày ({((statistics.late_days || 0) / (statistics.total_days || 1) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Về sớm</span>
              <span className="text-sm font-medium text-orange-600">
                {statistics.early_leave_days || 0} ngày ({((statistics.early_leave_days || 0) / (statistics.total_days || 1) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Vắng</span>
              <span className="text-sm font-medium text-red-600">
                {statistics.absent_days || 0} ngày ({((statistics.absent_days || 0) / (statistics.total_days || 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Thời gian làm việc</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Trung bình/ngày</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDuration(statistics.avg_hours_per_day || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giờ vào sớm nhất</span>
              <span className="text-sm font-medium text-gray-900">
                {statistics.earliest_checkin ? formatTime(statistics.earliest_checkin) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Giờ ra muộn nhất</span>
              <span className="text-sm font-medium text-gray-900">
                {statistics.latest_checkout ? formatTime(statistics.latest_checkout) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ngày làm dài nhất</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDuration(statistics.longest_day || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ListView = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Chi tiết chấm công ({filteredData.length} bản ghi)
        </h2>
      </div>
      
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {new Date(record.date).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(record.check_in_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(record.check_out_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(record.total_hours)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(record)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {record.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredData.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có dữ liệu chấm công trong khoảng thời gian này</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-7 h-7 text-blue-600" />
          Lịch sử chấm công
        </h1>
        <p className="text-gray-600 mt-1">
          Xem chi tiết lịch sử chấm công và thống kê của bạn
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date Range */}
            <div className="flex gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* View Mode */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('stats')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  viewMode === 'stats' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-1 inline" />
                Thống kê
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="w-4 h-4 mr-1 inline" />
                Chi tiết
              </button>
            </div>

            {/* Export */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => exportData('csv')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </button>
              <button
                onClick={() => exportData('excel')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Filters for List View */}
        {viewMode === 'list' && (
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm trong ghi chú..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="sm:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="present">Bình thường</option>
                  <option value="late">Muộn</option>
                  <option value="early_leave">Về sớm</option>
                  <option value="absent">Vắng</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        </div>
      ) : viewMode === 'stats' ? (
        <StatsView />
      ) : (
        <ListView />
      )}
    </div>
  );
};

export default AttendanceHistory;
