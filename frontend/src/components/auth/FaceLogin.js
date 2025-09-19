import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import toast from 'react-hot-toast';
import { Camera, User, Wifi, WifiOff, Eye } from 'lucide-react';

const FaceLogin = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkType, setNetworkType] = useState('checking');
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check network type and available features
  React.useEffect(() => {
    checkNetworkFeatures();
  }, []);

  const checkNetworkFeatures = async () => {
    try {
      const response = await apiService.getNetworkFeatures();
      if (response.success) {
        setNetworkType(response.data.network_type);
        setAvailableFeatures(response.data.available_features);
      }
    } catch (error) {
      console.error('Failed to check network features:', error);
      setNetworkType('external'); // Default to external if check fails
    }
  };

  const startCamera = async () => {
    try {
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
      toast.error('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
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

  const handleFaceLogin = async () => {
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

      const response = await apiService.faceLogin(imageData);
      
      if (response.success) {
        const userData = response.data.user;
        const confidence = response.data.face_match_confidence;
        
        // Login successful
        login(userData, response.data.token);
        
        toast.success(
          `Đăng nhập thành công!\nXin chào ${userData.full_name}\nĐộ chính xác: ${confidence}%`,
          { duration: 3000 }
        );
        
        stopCamera();
        
        // Navigate based on role
        if (userData.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(response.error || 'Không nhận diện được khuôn mặt');
      }
    } catch (error) {
      console.error('Face login error:', error);
      toast.error('Lỗi đăng nhập bằng khuôn mặt');
    } finally {
      setIsLoading(false);
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

  const FeatureList = () => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Tính năng khả dụng:</h4>
      <ul className="space-y-1">
        {availableFeatures.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {getFeatureName(feature)}
          </li>
        ))}
      </ul>
    </div>
  );

  const getFeatureName = (feature) => {
    const names = {
      'face_login': 'Đăng nhập bằng khuôn mặt',
      'face_attendance': 'Chấm công bằng khuôn mặt',
      'password_login': 'Đăng nhập bằng mật khẩu',
      'full_dashboard': 'Dashboard đầy đủ',
      'limited_dashboard': 'Dashboard hạn chế',
      'leave_requests': 'Quản lý nghỉ phép',
      'leave_requests_view': 'Xem yêu cầu nghỉ phép',
      'profile_management': 'Quản lý hồ sơ',
      'profile_view': 'Xem hồ sơ',
      'reports_view': 'Xem báo cáo'
    };
    return names[feature] || feature;
  };

  // Don't show face login if not available
  if (networkType !== 'internal' || !availableFeatures.includes('face_login')) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Đăng nhập bằng khuôn mặt không khả dụng
          </h2>
          <p className="text-gray-600 mb-4">
            Tính năng này chỉ khả dụng từ mạng nội bộ
          </p>
          <NetworkStatus />
          <FeatureList />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Đăng nhập bằng khuôn mặt
        </h2>
        <p className="text-gray-600">
          Nhìn vào camera để đăng nhập tự động
        </p>
        <NetworkStatus />
      </div>

      <div className="space-y-4">
        {/* Camera Section */}
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
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!isCapturing ? (
            <button
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Bật Camera
            </button>
          ) : (
            <>
              <button
                onClick={handleFaceLogin}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <User className="w-5 h-5" />
                )}
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tắt
              </button>
            </>
          )}
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

        <FeatureList />
      </div>
    </div>
  );
};

export default FaceLogin;
