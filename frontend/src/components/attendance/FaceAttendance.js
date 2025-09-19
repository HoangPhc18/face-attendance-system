import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { Camera, Clock, CheckCircle, XCircle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const FaceAttendance = () => {
  const { isInternalNetwork, user } = useAuth();
  const webcamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  // Capture image from webcam
  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    return imageSrc;
  }, []);

  // Handle check-in
  const handleCheckIn = async () => {
    if (!isInternalNetwork) {
      toast.error('Chấm công chỉ khả dụng từ mạng nội bộ');
      return;
    }

    setIsLoading(true);
    try {
      const imageData = captureImage();
      if (!imageData) {
        toast.error('Không thể chụp ảnh. Vui lòng kiểm tra camera.');
        return;
      }

      const response = await apiService.faceCheckIn(imageData);
      
      if (response.success) {
        setAttendanceStatus('checked_in');
        setLastAction({
          type: 'check_in',
          time: new Date().toLocaleTimeString('vi-VN'),
          user: response.data.user.full_name,
          confidence: response.data.face_match_confidence
        });
        toast.success(
          `Chấm công vào thành công!\nXin chào ${response.data.user.full_name}\nĐộ chính xác: ${response.data.face_match_confidence}%`,
          { duration: 3000 }
        );
      } else {
        toast.error(response.error || 'Không nhận diện được khuôn mặt');
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      toast.error('Lỗi chấm công vào. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!isInternalNetwork) {
      toast.error('Chấm công chỉ khả dụng từ mạng nội bộ');
      return;
    }

    setIsLoading(true);
    try {
      const imageData = captureImage();
      if (!imageData) {
        toast.error('Không thể chụp ảnh. Vui lòng kiểm tra camera.');
        return;
      }

      const response = await apiService.faceCheckOut(imageData);
      
      if (response.success) {
        setAttendanceStatus('checked_out');
        setLastAction({
          type: 'check_out',
          time: new Date().toLocaleTimeString('vi-VN'),
          user: response.data.user.full_name,
          confidence: response.data.face_match_confidence,
          workHours: response.data.work_hours
        });
        const workHoursText = response.data.work_hours ? ` (Làm việc: ${response.data.work_hours} giờ)` : '';
        toast.success(
          `Chấm công ra thành công!\nTạm biệt ${response.data.user.full_name}${workHoursText}\nĐộ chính xác: ${response.data.face_match_confidence}%`,
          { duration: 3000 }
        );
      } else {
        toast.error(response.error || 'Không nhận diện được khuôn mặt');
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      toast.error('Lỗi chấm công ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // If not internal network, show restriction message
  if (!isInternalNetwork) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card text-center">
          <AlertTriangle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Chấm Công Bị Hạn Chế
          </h2>
          <p className="text-gray-600 mb-6">
            Chức năng chấm công bằng khuôn mặt chỉ khả dụng từ mạng nội bộ công ty.
            Bạn đang truy cập từ mạng bên ngoài.
          </p>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <p className="text-warning-800 text-sm">
              <strong>Lưu ý:</strong> Để sử dụng chức năng này, vui lòng kết nối với mạng WiFi công ty 
              hoặc sử dụng máy tính trong văn phòng.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chấm Công Bằng Khuôn Mặt
        </h1>
        <p className="text-gray-600">
          Sử dụng camera để chấm công vào/ra. Không cần đăng nhập.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Camera
          </h2>
          
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-64 object-cover"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user"
              }}
            />
            
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Đang xử lý...</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button
              onClick={handleCheckIn}
              disabled={isLoading}
              className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Chấm Công Vào</span>
            </button>
            
            <button
              onClick={handleCheckOut}
              disabled={isLoading}
              className="btn-danger flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              <span>Chấm Công Ra</span>
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Trạng Thái
          </h2>

          {/* Current Status */}
          <div className="mb-6">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              attendanceStatus === 'checked_in' 
                ? 'bg-success-100 text-success-800'
                : attendanceStatus === 'checked_out'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-warning-100 text-warning-800'
            }`}>
              {attendanceStatus === 'checked_in' && 'Đã chấm công vào'}
              {attendanceStatus === 'checked_out' && 'Đã chấm công ra'}
              {!attendanceStatus && 'Chưa chấm công'}
            </div>
          </div>

          {/* Last Action */}
          {lastAction && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Hoạt động gần nhất:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Loại:</strong> {lastAction.type === 'check_in' ? 'Chấm công vào' : 'Chấm công ra'}
                </p>
                <p><strong>Thời gian:</strong> {lastAction.time}</p>
                <p><strong>Người dùng:</strong> {lastAction.user}</p>
                {lastAction.workHours && (
                  <p><strong>Giờ làm việc:</strong> {lastAction.workHours}</p>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-primary-50 rounded-lg p-4">
            <h3 className="font-medium text-primary-900 mb-2">Hướng dẫn sử dụng:</h3>
            <ul className="text-sm text-primary-800 space-y-1">
              <li>• Đảm bảo khuôn mặt hiển thị rõ ràng trong camera</li>
              <li>• Ánh sáng đủ để nhận diện khuôn mặt</li>
              <li>• Không cần đăng nhập, hệ thống tự nhận diện</li>
              <li>• Chỉ hoạt động trong mạng nội bộ công ty</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="mt-6 card">
        <h2 className="text-xl font-semibold mb-4">Tóm Tắt Hôm Nay</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-success-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Chấm công vào</p>
            <p className="text-lg font-semibold text-gray-900">--:--</p>
          </div>
          
          <div className="text-center p-4 bg-danger-50 rounded-lg">
            <XCircle className="w-8 h-8 text-danger-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Chấm công ra</p>
            <p className="text-lg font-semibold text-gray-900">--:--</p>
          </div>
          
          <div className="text-center p-4 bg-primary-50 rounded-lg">
            <Clock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Tổng giờ làm</p>
            <p className="text-lg font-semibold text-gray-900">-- giờ</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceAttendance;
