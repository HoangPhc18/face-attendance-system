import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  FileText,
  User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const LeaveRequestManager = () => {
  const { user, isAdmin, hasPermission } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (hasPermission('canCreateLeaveRequests') || hasPermission('canManageLeaveRequests')) {
      loadLeaveRequests();
    }
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const params = isAdmin ? {} : { user_id: user.id };
      const response = await apiService.getLeaveRequests(params);
      setLeaveRequests(response.leave_requests || []);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
      toast.error('Không thể tải danh sách nghỉ phép');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await apiService.approveLeaveRequest(requestId);
      toast.success('Đã phê duyệt yêu cầu nghỉ phép');
      loadLeaveRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Lỗi phê duyệt yêu cầu');
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      await apiService.rejectLeaveRequest(requestId, reason);
      toast.success('Đã từ chối yêu cầu nghỉ phép');
      loadLeaveRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Lỗi từ chối yêu cầu');
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  if (!hasPermission('canCreateLeaveRequests') && !hasPermission('canManageLeaveRequests')) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <AlertTriangle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Truy Cập Bị Hạn Chế</h2>
          <p className="text-gray-600">
            Bạn không có quyền truy cập vào tính năng nghỉ phép từ mạng này.
          </p>
        </div>
      </div>
    );
  }

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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quản Lý Nghỉ Phép
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Quản lý tất cả yêu cầu nghỉ phép' : 'Yêu cầu nghỉ phép của bạn'}
          </p>
        </div>
        
        {hasPermission('canCreateLeaveRequests') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo yêu cầu mới</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100">Tổng yêu cầu</p>
              <p className="text-3xl font-bold">{leaveRequests.length}</p>
            </div>
            <FileText className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100">Chờ duyệt</p>
              <p className="text-3xl font-bold">
                {leaveRequests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-warning-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100">Đã duyệt</p>
              <p className="text-3xl font-bold">
                {leaveRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100">Đã từ chối</p>
              <p className="text-3xl font-bold">
                {leaveRequests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <XCircle className="w-12 h-12 text-danger-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ duyệt' },
            { key: 'approved', label: 'Đã duyệt' },
            { key: 'rejected', label: 'Đã từ chối' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Requests List */}
      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <LeaveRequestCard
              key={request.id}
              request={request}
              isAdmin={isAdmin}
              onApprove={() => handleApprove(request.id)}
              onReject={(reason) => handleReject(request.id, reason)}
              onView={() => setSelectedRequest(request)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không có yêu cầu nào
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Chưa có yêu cầu nghỉ phép nào được tạo.'
              : `Không có yêu cầu nào ở trạng thái "${filter}".`
            }
          </p>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateLeaveRequestModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadLeaveRequests();
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <LeaveRequestDetailModal
          request={selectedRequest}
          isAdmin={isAdmin}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => handleApprove(selectedRequest.id)}
          onReject={(reason) => handleReject(selectedRequest.id, reason)}
        />
      )}
    </div>
  );
};

// Leave Request Card Component
const LeaveRequestCard = ({ request, isAdmin, onApprove, onReject, onView }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning-100 text-warning-800';
      case 'approved': return 'bg-success-100 text-success-800';
      case 'rejected': return 'bg-danger-100 text-danger-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Đã từ chối';
      default: return status;
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    onReject(rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4 mb-2">
            {isAdmin && (
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-1" />
                {request.user_name || `User ${request.user_id}`}
              </div>
            )}
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {request.leave_type || 'Nghỉ phép'}
          </h3>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <strong>Từ:</strong> {format(parseISO(request.start_date), 'dd/MM/yyyy')} 
              <strong className="ml-4">Đến:</strong> {format(parseISO(request.end_date), 'dd/MM/yyyy')}
            </p>
            <p><strong>Số ngày:</strong> {request.days_count} ngày</p>
            {request.reason && (
              <p><strong>Lý do:</strong> {request.reason}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={onView} className="btn-secondary">
            Xem chi tiết
          </button>
          
          {isAdmin && request.status === 'pending' && (
            <div className="flex space-x-2">
              <button onClick={onApprove} className="btn-primary">
                Duyệt
              </button>
              <button 
                onClick={() => setShowRejectForm(true)} 
                className="btn-danger"
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      </div>

      {showRejectForm && (
        <div className="mt-4 p-4 bg-danger-50 rounded-lg border-t">
          <h4 className="font-medium text-danger-800 mb-2">Từ chối yêu cầu:</h4>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="input-field h-20 mb-3"
            placeholder="Nhập lý do từ chối..."
          />
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowRejectForm(false)} 
              className="btn-secondary"
            >
              Hủy
            </button>
            <button onClick={handleReject} className="btn-danger">
              Xác nhận từ chối
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Leave Request Modal
const CreateLeaveRequestModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date) {
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('Ngày bắt đầu không thể sau ngày kết thúc');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createLeaveRequest(formData);
      toast.success('Tạo yêu cầu nghỉ phép thành công');
      onSuccess();
    } catch (error) {
      console.error('Failed to create leave request:', error);
      toast.error('Lỗi tạo yêu cầu nghỉ phép');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Tạo Yêu Cầu Nghỉ Phép</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại nghỉ phép
              </label>
              <select
                value={formData.leave_type}
                onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                className="input-field"
              >
                <option value="annual">Nghỉ phép năm</option>
                <option value="sick">Nghỉ ốm</option>
                <option value="personal">Nghỉ cá nhân</option>
                <option value="emergency">Nghỉ khẩn cấp</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lý do nghỉ phép
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="input-field h-24"
                placeholder="Nhập lý do nghỉ phép..."
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Leave Request Detail Modal
const LeaveRequestDetailModal = ({ request, isAdmin, onClose, onApprove, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Chi Tiết Yêu Cầu Nghỉ Phép</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">ID yêu cầu:</p>
                <p className="text-gray-900">{request.id}</p>
              </div>
              
              {isAdmin && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Nhân viên:</p>
                  <p className="text-gray-900">{request.user_name || `User ${request.user_id}`}</p>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Loại nghỉ phép:</p>
              <p className="text-gray-900">{request.leave_type}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Ngày bắt đầu:</p>
                <p className="text-gray-900">{format(parseISO(request.start_date), 'dd/MM/yyyy')}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Ngày kết thúc:</p>
                <p className="text-gray-900">{format(parseISO(request.end_date), 'dd/MM/yyyy')}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Số ngày nghỉ:</p>
              <p className="text-gray-900">{request.days_count} ngày</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Trạng thái:</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                request.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                request.status === 'approved' ? 'bg-success-100 text-success-800' :
                'bg-danger-100 text-danger-800'
              }`}>
                {request.status === 'pending' ? 'Chờ duyệt' :
                 request.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
              </span>
            </div>
            
            {request.reason && (
              <div>
                <p className="text-sm font-medium text-gray-700">Lý do:</p>
                <p className="text-gray-900">{request.reason}</p>
              </div>
            )}
            
            {request.admin_notes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Ghi chú admin:</p>
                <p className="text-gray-900">{request.admin_notes}</p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1">
              Đóng
            </button>
            
            {isAdmin && request.status === 'pending' && (
              <>
                <button onClick={onApprove} className="btn-primary">
                  Phê duyệt
                </button>
                <button onClick={() => onReject('Từ chối từ modal')} className="btn-danger">
                  Từ chối
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestManager;
