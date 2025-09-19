import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  User,
  FileText,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveRequestManagement = () => {
  const { isAdmin } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (isAdmin) {
      loadLeaveRequests();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, searchTerm, filterStatus]);

  const loadLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getLeaveRequests();
      if (response.success) {
        setLeaveRequests(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load leave requests:', error);
      toast.error('Không thể tải danh sách yêu cầu nghỉ phép');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = leaveRequests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  };

  const handleApproveRequest = async () => {
    try {
      const response = await apiService.approveLeaveRequest(selectedRequest.id);
      if (response.success) {
        toast.success('Đã duyệt yêu cầu nghỉ phép!');
        setShowApprovalModal(false);
        setSelectedRequest(null);
        loadLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to approve leave request:', error);
      toast.error(error.response?.data?.error || 'Lỗi duyệt yêu cầu');
    }
  };

  const handleRejectRequest = async () => {
    if (!approvalReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      const response = await apiService.rejectLeaveRequest(selectedRequest.id, approvalReason);
      if (response.success) {
        toast.success('Đã từ chối yêu cầu nghỉ phép!');
        setShowApprovalModal(false);
        setSelectedRequest(null);
        setApprovalReason('');
        loadLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to reject leave request:', error);
      toast.error(error.response?.data?.error || 'Lỗi từ chối yêu cầu');
    }
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const openApprovalModal = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setApprovalReason('');
    setShowApprovalModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Chờ duyệt
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center">
            <XCircle className="w-3 h-3 mr-1" />
            Từ chối
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getLeaveTypeBadge = (type) => {
    const types = {
      'sick': { label: 'Nghỉ ốm', color: 'bg-red-100 text-red-800' },
      'personal': { label: 'Nghỉ cá nhân', color: 'bg-blue-100 text-blue-800' },
      'vacation': { label: 'Nghỉ phép', color: 'bg-green-100 text-green-800' },
      'emergency': { label: 'Khẩn cấp', color: 'bg-orange-100 text-orange-800' },
      'other': { label: 'Khác', color: 'bg-gray-100 text-gray-800' }
    };

    const typeInfo = types[type] || types['other'];
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    );
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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
              <Calendar className="h-8 w-8 mr-3 text-blue-600" />
              Quản Lý Yêu Cầu Nghỉ Phép
            </h1>
            <p className="text-gray-600 mt-2">Duyệt và quản lý các yêu cầu nghỉ phép của nhân viên</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredRequests.filter(req => req.status === 'pending').length}
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
              <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredRequests.filter(req => req.status === 'approved').length}
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
              <p className="text-sm font-medium text-gray-600">Từ chối</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredRequests.filter(req => req.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng cộng</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredRequests.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm yêu cầu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            Tổng: {filteredRequests.length} yêu cầu
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
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
                      Nhân viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại nghỉ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.user_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {request.user_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLeaveTypeBadge(request.leave_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.start_date).toLocaleDateString('vi-VN')} - {new Date(request.end_date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {calculateDuration(request.start_date, request.end_date)} ngày
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openDetailModal(request)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openApprovalModal(request, 'approve')}
                                className="text-green-600 hover:text-green-900"
                                title="Duyệt"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openApprovalModal(request, 'reject')}
                                className="text-red-600 hover:text-red-900"
                                title="Từ chối"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
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
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredRequests.length)}</span> trong{' '}
                      <span className="font-medium">{filteredRequests.length}</span> kết quả
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Chi Tiết Yêu Cầu Nghỉ Phép</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nhân viên</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.user_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại nghỉ</label>
                  <div className="mt-1">
                    {getLeaveTypeBadge(selectedRequest.leave_type)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Thời gian nghỉ</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.start_date).toLocaleDateString('vi-VN')} - {new Date(selectedRequest.end_date).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-sm text-gray-500">
                    ({calculateDuration(selectedRequest.start_date, selectedRequest.end_date)} ngày)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Lý do</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                {selectedRequest.admin_response && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phản hồi admin</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.admin_response}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openApprovalModal(selectedRequest, 'approve');
                      }}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openApprovalModal(selectedRequest, 'reject');
                      }}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Từ chối
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {approvalAction === 'approve' ? 'Duyệt Yêu Cầu' : 'Từ Chối Yêu Cầu'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Nhân viên: <strong>{selectedRequest.user_name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Thời gian: {new Date(selectedRequest.start_date).toLocaleDateString('vi-VN')} - {new Date(selectedRequest.end_date).toLocaleDateString('vi-VN')}
                </p>
                <p className="text-sm text-gray-600">
                  Lý do: {selectedRequest.reason}
                </p>
              </div>

              {approvalAction === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do từ chối *
                  </label>
                  <textarea
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập lý do từ chối..."
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={approvalAction === 'approve' ? handleApproveRequest : handleRejectRequest}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    approvalAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalAction === 'approve' ? 'Duyệt' : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestManagement;
