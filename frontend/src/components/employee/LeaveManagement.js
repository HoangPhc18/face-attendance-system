import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  FileText, 
  Send, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const LeaveManagement = ({ networkType, availableFeatures }) => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    type: 'personal' // personal, sick, vacation, etc.
  });

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getLeaveRequests();
      if (response.success) {
        setLeaveRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load leave requests:', error);
      toast.error('Lỗi tải danh sách nghỉ phép');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    
    // Validation
    if (new Date(leaveForm.start_date) > new Date(leaveForm.end_date)) {
      toast.error('Ngày bắt đầu không thể sau ngày kết thúc');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.submitLeaveRequest(leaveForm);
      
      if (response.success) {
        toast.success('Gửi yêu cầu nghỉ phép thành công!');
        setShowCreateForm(false);
        setLeaveForm({
          start_date: '',
          end_date: '',
          reason: '',
          type: 'personal'
        });
        loadLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      toast.error(error.response?.data?.error || 'Lỗi gửi yêu cầu nghỉ phép');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này?')) return;

    try {
      setIsLoading(true);
      const response = await apiService.cancelLeaveRequest(requestId);
      
      if (response.success) {
        toast.success('Hủy yêu cầu thành công!');
        loadLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
      toast.error('Lỗi hủy yêu cầu');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Từ chối
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Chờ duyệt
          </span>
        );
    }
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      personal: 'Cá nhân',
      sick: 'Ốm đau',
      vacation: 'Nghỉ phép',
      emergency: 'Khẩn cấp',
      maternity: 'Thai sản',
      other: 'Khác'
    };
    return types[type] || type;
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getLeaveTypeLabel(request.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const canCreateRequest = availableFeatures.includes('leave_requests');
  const canViewOnly = availableFeatures.includes('leave_requests_view');

  if (!canCreateRequest && !canViewOnly) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Không có quyền truy cập
            </h3>
            <p className="text-red-800">
              Bạn không có quyền truy cập chức năng quản lý nghỉ phép.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-blue-600" />
              Quản lý nghỉ phép
            </h1>
            <p className="text-gray-600 mt-1">
              {canCreateRequest 
                ? 'Gửi và theo dõi các yêu cầu nghỉ phép của bạn'
                : 'Xem các yêu cầu nghỉ phép của bạn'
              }
            </p>
          </div>
          
          {canCreateRequest && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo yêu cầu mới
            </button>
          )}
        </div>
      </div>

      {/* Network Notice */}
      {networkType === 'external' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">
              {canCreateRequest 
                ? 'Bạn có thể gửi yêu cầu nghỉ phép từ mạng ngoại bộ'
                : 'Chỉ có thể xem yêu cầu nghỉ phép từ mạng ngoại bộ'
              }
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo lý do hoặc loại nghỉ phép..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Danh sách yêu cầu ({filteredRequests.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Đang tải...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Không tìm thấy yêu cầu nào phù hợp'
                  : 'Chưa có yêu cầu nghỉ phép nào'
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {getLeaveTypeLabel(request.type)}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {new Date(request.start_date).toLocaleDateString('vi-VN')} - {new Date(request.end_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{calculateDays(request.start_date, request.end_date)} ngày</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Send className="w-4 h-4 mr-2" />
                        <span>{new Date(request.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{request.reason}</p>
                    
                    {request.status === 'rejected' && request.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                        <p className="text-sm text-red-800">
                          <strong>Lý do từ chối:</strong> {request.rejection_reason}
                        </p>
                      </div>
                    )}
                    
                    {request.approved_by && request.status === 'approved' && (
                      <p className="text-sm text-green-600">
                        Được duyệt bởi: {request.approved_by_name} vào {new Date(request.approved_at).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {canCreateRequest && request.status === 'pending' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                        title="Hủy yêu cầu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Leave Request Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo yêu cầu nghỉ phép</h3>
              
              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại nghỉ phép</label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="personal">Cá nhân</option>
                    <option value="sick">Ốm đau</option>
                    <option value="vacation">Nghỉ phép</option>
                    <option value="emergency">Khẩn cấp</option>
                    <option value="maternity">Thai sản</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Lý do</label>
                  <textarea
                    required
                    rows="3"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập lý do nghỉ phép..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết yêu cầu</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại nghỉ phép</label>
                  <p className="mt-1 text-sm text-gray-900">{getLeaveTypeLabel(selectedRequest.type)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRequest.start_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRequest.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số ngày</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {calculateDays(selectedRequest.start_date, selectedRequest.end_date)} ngày
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lý do</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày gửi</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRequest.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                
                {selectedRequest.approved_by && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Người duyệt</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedRequest.approved_by_name} - {new Date(selectedRequest.approved_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                )}
                
                {selectedRequest.rejection_reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Lý do từ chối</label>
                    <p className="mt-1 text-sm text-red-600">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
