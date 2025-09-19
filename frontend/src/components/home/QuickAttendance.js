import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock,
  Wifi,
  WifiOff,
  User,
  LogIn,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuickAttendance = () => {
  const { user, login } = useAuth();
  const [networkType, setNetworkType] = useState('checking');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAttendance, setLastAttendance] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    checkNetworkType();
    if (user) {
      loadLastAttendance();
    }
  }, [user]);

  const checkNetworkType = async () => {
    try {
      const response = await apiService.getNetworkFeatures();
      if (response.success) {
        setNetworkType(response.data.network_type);
      }
    } catch (error) {
      console.error('Network check failed:', error);
      setNetworkType('external'); // Default to external if check fails
    }
  };

  const loadLastAttendance = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getAttendanceHistory({ limit: 1 });
      if (response.success && response.data.attendance.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const record = response.data.attendance[0];
        if (record.date === today) {
          setLastAttendance(record);
        }
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Không thể truy cập camera');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

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

  const handleFaceAttendance = async (action) => {
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

      const response = action === 'checkin' 
        ? await apiService.faceCheckIn(imageData)
        : await apiService.faceCheckOut(imageData);
      
      if (response.success) {
        const userData = response.data.user;
        const confidence = response.data.face_match_confidence;
        
        if (action === 'checkin') {
          toast.success(`Check-in thành công!\nXin chào ${userData.full_name}\nĐộ chính xác: ${confidence}%`);
          setLastAttendance({
            date: new Date().toISOString().split('T')[0],
            check_in_time: new Date().toISOString(),
            check_out_time: null
          });
        } else {
          const workHours = response.data.work_hours;
          toast.success(`Check-out thành công!\nTạm biệt ${userData.full_name}\nGiờ làm: ${workHours}h`);
          setLastAttendance(prev => ({
            ...prev,
            check_out_time: new Date().toISOString(),
            total_hours: workHours
          }));
        }
        
        stopCamera();
      } else {
        toast.error(response.error || 'Không nhận diện được khuôn mặt');
      }
    } catch (error) {
      console.error('Attendance failed:', error);
      toast.error('Lỗi chấm công. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await login(loginForm.username, loginForm.password);
      setShowLoginForm(false);
      setLoginForm({ username: '', password: '' });
      toast.success('Đăng nhập thành công!');
    } catch (error) {
      toast.error('Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceStatus = () => {
    if (!lastAttendance) return 'no-record';
    
    if (lastAttendance.check_in_time && !lastAttendance.check_out_time) {
      return 'checked-in';
    } else if (lastAttendance.check_in_time && lastAttendance.check_out_time) {
      return 'checked-out';
    }
    
    return 'no-record';
  };

  const attendanceStatus = getAttendanceStatus();

  // Network Status Component
  const NetworkStatus = () => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
      networkType === 'internal' 
        ? 'bg-green-100 text-green-800' 
        : networkType === 'external'
        ? 'bg-orange-100 text-orange-800'
        : 'bg-gray-100 text-gray-600'
    }`}>
      {networkType === 'internal' ? <Wifi className="w-4 h-4" /> : 
       networkType === 'external' ? <WifiOff className="w-4 h-4" /> :
       <Clock className="w-4 h-4 animate-spin" />}
      <span>
        {networkType === 'internal' ? 'Mạng nội bộ' : 
         networkType === 'external' ? 'Mạng ngoại bộ' : 
         'Đang kiểm tra mạng...'}
      </span>
    </div>
  );

  // Main render logic
  if (networkType === 'checking') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra loại mạng...</p>
        </div>
      </div>
    );
  }

  // External network - require login
  if (networkType === 'external' && !user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-4">
          <NetworkStatus />
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-orange-900">Yêu cầu đăng nhập</h3>
          </div>
          <p className="text-sm text-orange-800">
            Truy cập từ mạng ngoại bộ yêu cầu đăng nhập. Chức năng chấm công bị hạn chế.
          </p>
        </div>

        {!showLoginForm ? (
          <button
            onClick={() => setShowLoginForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
          >
            <LogIn className="w-5 h-5" />
            Đăng nhập để tiếp tục
          </button>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <button
                type="button"
                onClick={() => setShowLoginForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // External network with login - show limited features
  if (networkType === 'external' && user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center mb-4">
          <NetworkStatus />
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <WifiOff className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-orange-900">Chấm công không khả dụng</h3>
          </div>
          <p className="text-sm text-orange-800">
            Chức năng chấm công bằng khuôn mặt chỉ có thể sử dụng từ mạng nội bộ của công ty.
          </p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-gray-900 font-medium">{user.full_name}</span>
          </div>
          <p className="text-sm text-gray-600">Đã đăng nhập từ mạng ngoại bộ</p>
        </div>
      </div>
    );
  }

  // Internal network - full face attendance
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <NetworkStatus />
      </div>

      <div className="text-center mb-6">
        <Camera className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-xl font-semibold text-gray-900">Chấm công nhanh</h2>
        <p className="text-gray-600 text-sm">Sử dụng khuôn mặt để chấm công</p>
      </div>

      {/* Today's Status */}
      {lastAttendance && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Hôm nay:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              attendanceStatus === 'checked-in' ? 'bg-green-100 text-green-800' :
              attendanceStatus === 'checked-out' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {attendanceStatus === 'checked-in' && 'Đã check-in'}
              {attendanceStatus === 'checked-out' && 'Đã check-out'}
              {attendanceStatus === 'no-record' && 'Chưa chấm công'}
            </span>
          </div>
          {lastAttendance.check_in_time && (
            <div className="mt-1 text-xs text-gray-500">
              Vào: {new Date(lastAttendance.check_in_time).toLocaleTimeString('vi-VN')}
              {lastAttendance.check_out_time && 
                ` - Ra: ${new Date(lastAttendance.check_out_time).toLocaleTimeString('vi-VN')}`
              }
            </div>
          )}
        </div>
      )}

      {/* Camera Section */}
      <div className="mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-48 bg-gray-100 rounded-lg object-cover ${!isCapturing ? 'hidden' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isCapturing && (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Camera chưa được bật</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {!isCapturing ? (
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Bật Camera
          </button>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFaceAttendance('checkin')}
                disabled={isLoading || attendanceStatus === 'checked-out'}
                className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Check In
              </button>
              
              <button
                onClick={() => handleFaceAttendance('checkout')}
                disabled={isLoading || attendanceStatus !== 'checked-in'}
                className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Check Out
              </button>
            </div>
            
            <button
              onClick={stopCamera}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Tắt Camera
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      {isCapturing && (
        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-blue-900 text-sm mb-1">Hướng dẫn:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Nhìn thẳng vào camera</li>
            <li>• Đảm bảo ánh sáng đủ</li>
            <li>• Không đeo khẩu trang</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuickAttendance;
