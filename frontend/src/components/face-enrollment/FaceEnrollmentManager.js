import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  AlertTriangle,
  Camera,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

const FaceEnrollmentManager = () => {
  const { isAdmin } = useAuth();
  const [pendingFaces, setPendingFaces] = useState([]);
  const [selectedFace, setSelectedFace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadPendingFaces();
    }
  }, [isAdmin]);

  const loadPendingFaces = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getPendingFaces();
      setPendingFaces(response.pending_faces || []);
    } catch (error) {
      console.error('Failed to load pending faces:', error);
      toast.error('Không thể tải danh sách chờ duyệt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveFace = async (faceId, userData) => {
    try {
      await apiService.approveFace(faceId, userData);
      toast.success('Đã phê duyệt đăng ký khuôn mặt');
      loadPendingFaces();
      setSelectedFace(null);
    } catch (error) {
      console.error('Failed to approve face:', error);
      toast.error('Lỗi phê duyệt đăng ký');
    }
  };

  const handleRejectFace = async (faceId, reason) => {
    try {
      await apiService.rejectFace(faceId, reason);
      toast.success('Đã từ chối đăng ký khuôn mặt');
      loadPendingFaces();
      setSelectedFace(null);
    } catch (error) {
      console.error('Failed to reject face:', error);
      toast.error('Lỗi từ chối đăng ký');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <AlertTriangle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Truy Cập Bị Từ Chối</h2>
          <p className="text-gray-600">
            Chỉ quản trị viên mới có quyền quản lý đăng ký khuôn mặt.
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
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
            Quản Lý Đăng Ký Khuôn Mặt
          </h1>
          <p className="text-gray-600">
            Phê duyệt và quản lý các yêu cầu đăng ký khuôn mặt mới
          </p>
        </div>
        
        <button
          onClick={() => setShowEnrollForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <UserPlus className="w-5 h-5" />
          <span>Đăng ký mới</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-100">Chờ phê duyệt</p>
              <p className="text-3xl font-bold">{pendingFaces.length}</p>
            </div>
            <Clock className="w-12 h-12 text-warning-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100">Đã phê duyệt</p>
              <p className="text-3xl font-bold">--</p>
            </div>
            <CheckCircle className="w-12 h-12 text-success-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-r from-danger-500 to-danger-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-danger-100">Đã từ chối</p>
              <p className="text-3xl font-bold">--</p>
            </div>
            <XCircle className="w-12 h-12 text-danger-200" />
          </div>
        </div>
      </div>

      {/* Pending Faces List */}
      {pendingFaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingFaces.map((face) => (
            <PendingFaceCard
              key={face.id}
              face={face}
              onView={() => setSelectedFace(face)}
              onApprove={(userData) => handleApproveFace(face.id, userData)}
              onReject={(reason) => handleRejectFace(face.id, reason)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Không có yêu cầu nào đang chờ
          </h3>
          <p className="text-gray-600">
            Tất cả yêu cầu đăng ký khuôn mặt đã được xử lý.
          </p>
        </div>
      )}

      {/* Face Detail Modal */}
      {selectedFace && (
        <FaceDetailModal
          face={selectedFace}
          onClose={() => setSelectedFace(null)}
          onApprove={(userData) => handleApproveFace(selectedFace.id, userData)}
          onReject={(reason) => handleRejectFace(selectedFace.id, reason)}
        />
      )}

      {/* Enrollment Form Modal */}
      {showEnrollForm && (
        <EnrollmentFormModal
          onClose={() => setShowEnrollForm(false)}
          onSuccess={() => {
            setShowEnrollForm(false);
            loadPendingFaces();
          }}
        />
      )}
    </div>
  );
};

// Pending Face Card Component
const PendingFaceCard = ({ face, onView, onApprove, onReject }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="aspect-w-16 aspect-h-12 mb-4">
        {face.image_url ? (
          <img
            src={face.image_url}
            alt="Pending face"
            className="w-full h-48 object-cover rounded-lg bg-gray-100"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">ID: {face.id}</p>
          <p className="text-sm text-gray-600">
            Ngày tạo: {new Date(face.created_at).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onView}
            className="flex-1 btn-secondary flex items-center justify-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>Xem</span>
          </button>
          
          <button
            onClick={() => setShowActions(!showActions)}
            className="btn-primary"
          >
            Thao tác
          </button>
        </div>

        {showActions && (
          <div className="space-y-2 pt-2 border-t">
            <button
              onClick={() => onApprove({})}
              className="w-full btn-primary flex items-center justify-center space-x-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Phê duyệt</span>
            </button>
            
            <button
              onClick={() => onReject('Không đạt yêu cầu')}
              className="w-full btn-danger flex items-center justify-center space-x-1"
            >
              <XCircle className="w-4 h-4" />
              <span>Từ chối</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Face Detail Modal Component
const FaceDetailModal = ({ face, onClose, onApprove, onReject }) => {
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    department: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    if (!userData.full_name || !userData.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    onApprove(userData);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    onReject(rejectReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Chi Tiết Đăng Ký Khuôn Mặt</h2>
          
          {/* Face Image */}
          <div className="mb-6">
            {face.image_url ? (
              <img
                src={face.image_url}
                alt="Face registration"
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Face Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Thông tin đăng ký:</h3>
            <p><strong>ID:</strong> {face.id}</p>
            <p><strong>Ngày tạo:</strong> {new Date(face.created_at).toLocaleString('vi-VN')}</p>
            <p><strong>Trạng thái:</strong> Chờ phê duyệt</p>
          </div>

          {!showRejectForm ? (
            /* Approval Form */
            <div className="space-y-4">
              <h3 className="font-semibold">Thông tin nhân viên:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên *
                  </label>
                  <input
                    type="text"
                    value={userData.full_name}
                    onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                    className="input-field"
                    placeholder="Nhập họ tên"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                    className="input-field"
                    placeholder="Nhập email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã nhân viên
                  </label>
                  <input
                    type="text"
                    value={userData.employee_id}
                    onChange={(e) => setUserData({...userData, employee_id: e.target.value})}
                    className="input-field"
                    placeholder="Nhập mã nhân viên"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phòng ban
                  </label>
                  <input
                    type="text"
                    value={userData.department}
                    onChange={(e) => setUserData({...userData, department: e.target.value})}
                    className="input-field"
                    placeholder="Nhập phòng ban"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Reject Form */
            <div className="space-y-4">
              <h3 className="font-semibold text-danger-600">Từ chối đăng ký:</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do từ chối *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field h-24"
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1">
              Hủy
            </button>
            
            {!showRejectForm ? (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="btn-danger flex-1"
                >
                  Từ chối
                </button>
                <button onClick={handleApprove} className="btn-primary flex-1">
                  Phê duyệt
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="btn-secondary flex-1"
                >
                  Quay lại
                </button>
                <button onClick={handleReject} className="btn-danger flex-1">
                  Xác nhận từ chối
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enrollment Form Modal Component
const EnrollmentFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    department: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
      } else {
        toast.error('Vui lòng chọn file hình ảnh');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !selectedFile) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn ảnh');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result;
        
        await apiService.enrollFace({
          ...formData,
          image: imageData
        });
        
        toast.success('Đăng ký khuôn mặt thành công');
        onSuccess();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Failed to enroll face:', error);
      toast.error('Lỗi đăng ký khuôn mặt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Đăng Ký Khuôn Mặt Mới</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã nhân viên
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ban
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ảnh khuôn mặt *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Chọn file</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG tối đa 10MB</p>
                  {selectedFile && (
                    <p className="text-sm text-success-600">
                      Đã chọn: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
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
                {isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollmentManager;
