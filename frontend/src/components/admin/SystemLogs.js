import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  FileText, 
  Search, 
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const SystemLogs = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadSystemLogs();
    }
  }, [isAdmin, dateRange]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterLevel, filterAction]);

  const loadSystemLogs = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        limit: 1000,
        date_range: dateRange
      };

      const response = await apiService.getSystemLogs(params);
      if (response.success) {
        setLogs(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load system logs:', error);
      toast.error('Không thể tải nhật ký hệ thống');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    // Action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLevelBadge = (level) => {
    const configs = {
      'ERROR': 'bg-red-100 text-red-800',
      'WARNING': 'bg-yellow-100 text-yellow-800',
      'INFO': 'bg-blue-100 text-blue-800',
      'SUCCESS': 'bg-green-100 text-green-800'
    };

    const config = configs[level] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config} flex items-center`}>
        {getLevelIcon(level)}
        <span className="ml-1">{level}</span>
      </span>
    );
  };

  const getActionBadge = (action) => {
    const configs = {
      'login': 'bg-blue-100 text-blue-800',
      'logout': 'bg-gray-100 text-gray-800',
      'face_enrollment': 'bg-purple-100 text-purple-800',
      'attendance': 'bg-green-100 text-green-800',
      'leave_request': 'bg-yellow-100 text-yellow-800',
      'admin_action': 'bg-red-100 text-red-800'
    };

    const config = configs[action] || 'bg-gray-100 text-gray-800';
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config}`}>
        {action}
      </span>
    );
  };

  const openDetailModal = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const exportLogs = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        date_range: dateRange,
        level: filterLevel !== 'all' ? filterLevel : undefined,
        action: filterAction !== 'all' ? filterAction : undefined,
        search: searchTerm || undefined
      };

      // Create CSV content
      const csvContent = [
        ['Timestamp', 'Level', 'Action', 'User', 'Message', 'IP Address'].join(','),
        ...filteredLogs.map(log => [
          new Date(log.timestamp).toLocaleString('vi-VN'),
          log.level,
          log.action,
          log.user_info || '',
          `"${log.message.replace(/"/g, '""')}"`,
          log.ip_address || ''
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Xuất nhật ký thành công!');
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast.error('Lỗi xuất nhật ký');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique actions for filter
  const uniqueActions = [...new Set(logs.map(log => log.action))].filter(Boolean);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

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
              <FileText className="h-8 w-8 mr-3 text-blue-600" />
              Nhật Ký Hệ Thống
            </h1>
            <p className="text-gray-600 mt-2">Theo dõi và giám sát hoạt động của hệ thống</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportLogs}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Xuất CSV
            </button>
            <button
              onClick={loadSystemLogs}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng logs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredLogs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lỗi</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredLogs.filter(log => log.level === 'ERROR').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cảnh báo</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredLogs.filter(log => log.level === 'WARNING').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Thành công</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredLogs.filter(log => log.level === 'SUCCESS').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="ERROR">Lỗi</option>
              <option value="WARNING">Cảnh báo</option>
              <option value="INFO">Thông tin</option>
              <option value="SUCCESS">Thành công</option>
            </select>
          </div>

          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả hành động</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            Tổng: {filteredLogs.length} logs
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mức độ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thông điệp
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chi tiết
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLevelBadge(log.level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {log.user_info || 'System'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openDetailModal(log)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredLogs.length)}</span> trong{' '}
                      <span className="font-medium">{filteredLogs.length}</span> kết quả
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chi Tiết Log</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Thời gian</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedLog.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mức độ</label>
                    <div className="mt-1">
                      {getLevelBadge(selectedLog.level)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hành động</label>
                    <div className="mt-1">
                      {getActionBadge(selectedLog.action)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Người dùng</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.user_info || 'System'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.ip_address || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Thông điệp</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.message}</p>
                  </div>
                </div>

                {selectedLog.details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chi tiết kỹ thuật</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <pre className="text-xs text-gray-900 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;
