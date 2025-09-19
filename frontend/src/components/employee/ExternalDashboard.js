import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  WifiOff, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Send,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home,
  Settings,
  LogOut,
  Shield,
  Wifi
} from 'lucide-react';
import toast from 'react-hot-toast';

const ExternalDashboard = () => {
  const { user, logout } = useAuth();
  const [networkFeatures, setNetworkFeatures] = useState([]);
  const [networkType, setNetworkType] = useState('external');
  const [userProfile, setUserProfile] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Leave request form
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    loadNetworkFeatures();
    loadUserProfile();
    loadLeaveRequests();
    loadAttendanceHistory();
  }, []);

  const loadNetworkFeatures = async () => {
    try {
      const response = await apiService.getNetworkFeatures();
      if (response.success) {
        setNetworkFeatures(response.data.available_features);
        setNetworkType(response.data.network_type);
      }
    } catch (error) {
      console.error('Failed to load network features:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await apiService.getUserProfile();
      if (response.success) {
        setUserProfile(response.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const response = await apiService.getLeaveRequests();
      if (response.success) {
        setLeaveRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const response = await apiService.getAttendanceHistory();
      if (response.success) {
        setAttendanceHistory(response.data.attendance || []);
      }
    } catch (error) {
      console.error('Failed to load attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await apiService.submitLeaveRequest(leaveForm);
      
      if (response.success) {
        toast.success('Yêu cầu nghỉ phép đã được gửi!');
        setShowLeaveForm(false);
        setLeaveForm({ start_date: '', end_date: '', reason: '' });
        loadLeaveRequests();
      }
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      toast.error('Lỗi gửi yêu cầu nghỉ phép');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center"><XCircle className="w-3 h-3 mr-1" />Từ chối</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</span>;
    }
  };

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

  const FeatureRestrictions = () => (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <WifiOff className="w-5 h-5 text-orange-600" />
        <h3 className="font-medium text-orange-900">Truy cập từ mạng ngoại bộ</h3>
      </div>
      <p className="text-sm text-orange-800 mb-3">
        Một số tính năng bị hạn chế khi truy cập từ bên ngoài công ty:
      </p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span>Chấm công bằng khuôn mặt</span>
        </div>
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span>Đăng nhập bằng khuôn mặt</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Xem lịch sử chấm công</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Gửi yêu cầu nghỉ phép</span>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Home className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Dashboard Nhân Viên</h1>
              </div>
              <NetworkStatus />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.full_name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FeatureRestrictions />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tháng này</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {attendanceHistory.filter(a => {
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
                <p className="text-sm font-medium text-gray-600">Nghỉ phép đã duyệt</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {leaveRequests.filter(r => r.status === 'approved').length}
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
                  {leaveRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leave Requests */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Yêu cầu nghỉ phép
                </h2>
                <button
                  onClick={() => setShowLeaveForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gửi yêu cầu
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có yêu cầu nghỉ phép nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(request.start_date).toLocaleDateString('vi-VN')} - {new Date(request.end_date).toLocaleDateString('vi-VN')}
                        </span>
                        {getStatusBadge(request.status)}
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

          {/* Attendance History */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Lịch sử chấm công
              </h2>
            </div>
            
            <div className="p-6">
              {attendanceHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có dữ liệu chấm công</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendanceHistory.slice(0, 10).map((record) => (
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
        </div>
      </div>

      {/* Leave Request Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gửi yêu cầu nghỉ phép</h3>
              
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
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
                    onClick={() => setShowLeaveForm(false)}
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
    </div>
  );
};

export default ExternalDashboard;
