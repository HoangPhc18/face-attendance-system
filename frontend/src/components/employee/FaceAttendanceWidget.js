import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Wifi,
  WifiOff,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const FaceAttendanceWidget = ({ networkType, onAttendanceUpdate }) => {
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAttendance, setLastAttendance] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadLastAttendance();
    return () => {
      stopCamera();
    };
  }, []);

  const loadLastAttendance = async () => {
    try {
      const response = await apiService.getAttendanceHistory({ limit: 1 });
      if (response.success && response.data.attendance.length > 0) {
        setLastAttendance(response.data.attendance[0]);
      }
    } catch (error) {
      console.error('Failed to load last attendance:', error);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCapturing(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
      setIsCapturing(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleCheckIn = async () => {
    if (!isCapturing) {
      toast.error('Vui lòng bật camera trước');
      return;
    }

    try {
      setIsLoading(true);
      const imageData = captureImage();
      
      if (!imageData) {
        toast.error('Không thể chụp ảnh');
        return;
      }

      const response = await apiService.faceCheckIn(imageData);
      
      if (response.success) {
        const userData = response.data.user;
        const confidence = response.data.face_match_confidence;
        
        toast.success(
          `Check-in thành công!\nXin chào ${userData.full_name}\nĐộ chính xác: ${confidence}%`,
          { duration: 3000 }
        );
        
        setLastAttendance({
          date: new Date().toISOString().split('T')[0],
          check_in_time: new Date().toISOString(),
          check_out_time: null,
          status: 'present'
        });
        
        stopCamera();
        if (onAttendanceUpdate) onAttendanceUpdate();
      } else {
        toast.error(response.error || 'Không nhận diện được khuôn mặt');
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      toast.error('Lỗi check-in. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!isCapturing) {
      toast.error('Vui lòng bật camera trước');
      return;
    }

    try {
      setIsLoading(true);
      const imageData = captureImage();
      
      if (!imageData) {
        toast.error('Không thể chụp ảnh');
        return;
      }

      const response = await apiService.faceCheckOut(imageData);
      
      if (response.success) {
        const userData = response.data.user;
        const confidence = response.data.face_match_confidence;
        const workHours = response.data.work_hours;
        
        const workHoursText = workHours ? ` (Làm việc: ${workHours} giờ)` : '';
        toast.success(
          `Check-out thành công!\nTạm biệt ${userData.full_name}${workHoursText}\nĐộ chính xác: ${confidence}%`,
          { duration: 3000 }
        );
        
        setLastAttendance(prev => ({
          ...prev,
          check_out_time: new Date().toISOString(),
          total_hours: workHours
        }));
        
        stopCamera();
        if (onAttendanceUpdate) onAttendanceUpdate();
      } else {
        toast.error(response.error || 'Không nhận diện được khuôn mặt');
      }
    } catch (error) {
      console.error('Check-out failed:', error);
      toast.error('Lỗi check-out. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceStatus = () => {
    if (!lastAttendance) return 'no-record';
    
    const today = new Date().toISOString().split('T')[0];
    if (lastAttendance.date !== today) return 'no-record';
    
    if (lastAttendance.check_in_time && !lastAttendance.check_out_time) {
      return 'checked-in';
    } else if (lastAttendance.check_in_time && lastAttendance.check_out_time) {
      return 'checked-out';
    }
    
    return 'no-record';
  };

  const attendanceStatus = getAttendanceStatus();

  if (networkType !== 'internal') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            Chấm công không khả dụng
          </h3>
          <p className="text-orange-800 text-sm">
            Chức năng chấm công bằng khuôn mặt chỉ có thể sử dụng từ mạng nội bộ của công ty.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-600" />
            Chấm công khuôn mặt
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">Mạng nội bộ</span>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-3 py-2 rounded-full text-sm font-medium ${
          attendanceStatus === 'checked-in' 
            ? 'bg-green-100 text-green-800'
            : attendanceStatus === 'checked-out'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {attendanceStatus === 'checked-in' && 'Đã check-in'}
          {attendanceStatus === 'checked-out' && 'Đã check-out'}
          {attendanceStatus === 'no-record' && 'Chưa chấm công'}
        </div>
      </div>

      {/* Today's Status */}
      {lastAttendance && lastAttendance.date === new Date().toISOString().split('T')[0] && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Hôm nay</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Check-in:</span>
              <span className="ml-2 font-medium">
                {lastAttendance.check_in_time 
                  ? new Date(lastAttendance.check_in_time).toLocaleTimeString('vi-VN')
                  : '-'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Check-out:</span>
              <span className="ml-2 font-medium">
                {lastAttendance.check_out_time 
                  ? new Date(lastAttendance.check_out_time).toLocaleTimeString('vi-VN')
                  : '-'
                }
              </span>
            </div>
          </div>
          {lastAttendance.total_hours && (
            <div className="mt-2 text-sm">
              <span className="text-gray-600">Tổng giờ làm:</span>
              <span className="ml-2 font-medium text-blue-600">{lastAttendance.total_hours} giờ</span>
            </div>
          )}
        </div>
      )}

      {/* Camera Section */}
      <div className="mb-6">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-64 bg-gray-100 rounded-lg object-cover ${
              !isCapturing ? 'hidden' : ''
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isCapturing && (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Camera chưa được bật</p>
                {cameraError && (
                  <p className="text-red-500 text-sm mt-2">{cameraError}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="flex gap-3 mt-4">
          {!isCapturing ? (
            <button
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Bật Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              Tắt Camera
            </button>
          )}
        </div>
      </div>

      {/* Attendance Actions */}
      {isCapturing && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCheckIn}
              disabled={isLoading || attendanceStatus === 'checked-out'}
              className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {isLoading ? 'Đang xử lý...' : 'Check In'}
            </button>
            
            <button
              onClick={handleCheckOut}
              disabled={isLoading || attendanceStatus !== 'checked-in'}
              className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              {isLoading ? 'Đang xử lý...' : 'Check Out'}
            </button>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Đảm bảo khuôn mặt được chiếu sáng tốt</li>
              <li>• Nhìn thẳng vào camera</li>
              <li>• Giữ khuôn mặt trong khung hình</li>
              <li>• Không đeo khẩu trang hoặc kính đen</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceAttendanceWidget;
