import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Camera,
  Video,
  Users,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const FaceEnrollmentManager = () => {
  const { isAdmin } = useAuth();
  const [currentStep, setCurrentStep] = useState(1); // 1: Create User, 2: Capture Face
  const [usersWithoutFace, setUsersWithoutFace] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Form data for creating user
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    position: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsersWithoutFace();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Cleanup camera stream when component unmounts
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const loadUsersWithoutFace = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsersWithoutFace();
      setUsersWithoutFace(response.users_without_face || []);
    } catch (error) {
      console.error('Failed to load users without face:', error);
      toast.error('Không thể tải danh sách nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Create User Account
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await apiService.createUser(formData);
      
      if (response.success) {
        toast.success('Tạo tài khoản thành công!');
        setSelectedUser(response.data);
        setCurrentStep(2);
        setShowCreateForm(false);
        setFormData({ username: '', full_name: '', email: '', password: '', role: 'user', department: '', position: '' });
        loadUsersWithoutFace();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.error || 'Lỗi tạo tài khoản');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Camera Functions - Biometric Style
  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...');
      
      // Check browser support first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Request camera with simpler constraints first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('✅ Camera stream obtained:', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks());
      
      setCameraStream(stream);
      setShowCameraCapture(true);
      
      // Setup video element
      if (videoRef.current) {
        console.log('🎬 Setting up video element...');
        videoRef.current.srcObject = stream;
        
        // Add multiple event listeners for debugging
        videoRef.current.onloadstart = () => console.log('📺 Video load started');
        videoRef.current.onloadeddata = () => console.log('📺 Video data loaded');
        videoRef.current.oncanplay = () => console.log('📺 Video can play');
        videoRef.current.onplaying = () => console.log('📺 Video is playing');
        
        videoRef.current.onloadedmetadata = async () => {
          console.log('📺 Video metadata loaded');
          console.log('📐 Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          console.log('📺 Video readyState:', videoRef.current.readyState);
          console.log('📺 Video currentTime:', videoRef.current.currentTime);
          
          try {
            await videoRef.current.play();
            console.log('✅ Video playing successfully');
            console.log('📺 Video paused:', videoRef.current.paused);
            console.log('📺 Video ended:', videoRef.current.ended);
            toast.success('Camera đã sẵn sàng - Hãy nhìn vào camera');
          } catch (playError) {
            console.error('❌ Error playing video:', playError);
            toast.error('Không thể phát video từ camera');
          }
        };

        // Add more debug events
        videoRef.current.oncanplaythrough = () => console.log('📺 Video can play through');
        videoRef.current.onwaiting = () => console.log('📺 Video waiting for data');
        videoRef.current.onstalled = () => console.log('📺 Video stalled');
        videoRef.current.onsuspend = () => console.log('📺 Video suspended');
        videoRef.current.onabort = () => console.log('📺 Video aborted');
        videoRef.current.onemptied = () => console.log('📺 Video emptied');

        videoRef.current.onerror = (e) => {
          console.error('❌ Video error:', e);
          toast.error('Lỗi video stream');
        };
      }
      
    } catch (error) {
      console.error('❌ Camera error:', error);
      let errorMessage = 'Không thể truy cập camera';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Vui lòng cho phép truy cập camera trong trình duyệt';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Không tìm thấy camera trên thiết bị';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Cài đặt camera không được hỗ trợ';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setShowCameraCapture(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCameraCapture(false);
    setCapturedImage(null);
  };

  // Biometric-style continuous capture
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      console.log('📸 Attempting to capture photo...');
      console.log('📺 Video readyState:', video.readyState);
      console.log('📺 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('📺 Video paused:', video.paused);
      
      // Ensure video is playing
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        toast.error('Camera chưa sẵn sàng, vui lòng thử lại');
        return;
      }
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error('Video chưa có kích thước, vui lòng thử lại');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame
      context.drawImage(video, 0, 0);
      
      // Convert to base64 with better quality
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      console.log('📸 Image captured, size:', imageData.length, 'characters');
      setCapturedImage(imageData);
      
      toast.success('Đã chụp ảnh - Kiểm tra và xác nhận');
    }
  };

  const refreshVideo = () => {
    console.log('🔄 Refreshing video...');
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = null;
      setTimeout(() => {
        videoRef.current.srcObject = cameraStream;
        videoRef.current.play().catch(e => console.error('Refresh play error:', e));
      }, 100);
    }
  };

  const submitFaceCapture = async () => {
    if (!capturedImage || !selectedUser) {
      toast.error('Vui lòng chụp ảnh và chọn nhân viên');
      return;
    }

    try {
      setIsCapturing(true);
      
      // Validate image data
      if (!capturedImage.startsWith('data:image/')) {
        toast.error('Dữ liệu ảnh không hợp lệ');
        return;
      }
      
      console.log('Submitting face capture for user:', selectedUser.id || selectedUser.user_id);
      console.log('Image data length:', capturedImage.length);
      
      const response = await apiService.captureFace({
        user_id: selectedUser.id || selectedUser.user_id,
        face_image: capturedImage
      });

      if (response.success) {
        toast.success('🎉 Đăng ký khuôn mặt thành công!');
        stopCamera();
        setSelectedUser(null);
        setCurrentStep(1);
        loadUsersWithoutFace();
      } else {
        toast.error(response.error || 'Lỗi đăng ký khuôn mặt');
      }
    } catch (error) {
      console.error('Failed to capture face:', error);
      
      let errorMessage = 'Lỗi đăng ký khuôn mặt';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  };

  const selectUserForFaceCapture = (user) => {
    setSelectedUser(user);
    setCurrentStep(2);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có quyền truy cập</h3>
          <p className="mt-1 text-sm text-gray-500">Chỉ admin mới có thể quản lý đăng ký khuôn mặt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quản Lý Đăng Ký Khuôn Mặt</h2>
            <p className="mt-1 text-sm text-gray-500">
              Quy trình mới: Tạo tài khoản → Quét khuôn mặt
            </p>
          </div>
          <button
            onClick={loadUsersWithoutFace}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mt-6">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              <li className="relative">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Tạo Tài Khoản</span>
                </div>
              </li>
              
              <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />
              
              <li className="relative">
                <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    <Camera className="h-4 w-4" />
                  </div>
                  <span className="ml-2 text-sm font-medium">Quét Khuôn Mặt</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Step 1: Create User Account */}
      {currentStep === 1 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Bước 1: Tạo Tài Khoản Nhân Viên</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Tạo Nhân Viên Mới
            </button>
          </div>

          {/* Users without face list */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">
              Nhân viên chưa đăng ký khuôn mặt ({usersWithoutFace.length})
            </h4>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : usersWithoutFace.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Không có nhân viên nào</h3>
                <p className="mt-1 text-sm text-gray-500">Tất cả nhân viên đã đăng ký khuôn mặt</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersWithoutFace.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => selectUserForFaceCapture(user)}
                        className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Quét Khuôn Mặt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Face Capture */}
      {currentStep === 2 && selectedUser && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Bước 2: Quét Khuôn Mặt</h3>
              <p className="text-sm text-gray-500">
                Nhân viên: <span className="font-medium">{selectedUser.full_name}</span>
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentStep(1);
                setSelectedUser(null);
                stopCamera();
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </button>
          </div>

          <div className="space-y-6">
            {!showCameraCapture ? (
              <div className="text-center py-8">
                <Camera className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Bắt đầu quét khuôn mặt</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Nhấn nút bên dưới để mở camera và chụp ảnh khuôn mặt
                </p>
                <button
                  onClick={startCamera}
                  className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Mở Camera
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Video Stream */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-96 h-72 bg-black rounded-lg object-cover"
                      style={{ transform: 'scaleX(-1)' }} // Mirror effect
                    />
                    
                    {/* Face Detection Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Face Detection Frame */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-48 h-60 border-2 border-blue-400 rounded-lg relative">
                          {/* Corner indicators */}
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                          
                          {/* Center crosshair */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border border-blue-400 rounded-full bg-blue-400 bg-opacity-20"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
                        {!capturedImage ? 'Đặt khuôn mặt vào khung và nhìn thẳng vào camera' : 'Ảnh đã được chụp'}
                      </div>
                    </div>
                    
                    {/* Hidden Canvas */}
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* Captured Image Preview */}
                    {capturedImage && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                        <div className="bg-white p-2 rounded-lg">
                          <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-48 h-60 object-cover rounded"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex justify-center">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                    capturedImage 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {capturedImage ? '✅ Đã chụp ảnh' : '📷 Sẵn sàng chụp'}
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  {!capturedImage ? (
                    <>
                      <button
                        onClick={capturePhoto}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Chụp Ảnh
                      </button>
                      <button
                        onClick={refreshVideo}
                        className="inline-flex items-center px-4 py-3 border border-yellow-300 text-base font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Refresh Video
                      </button>
                      <button
                        onClick={stopCamera}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setCapturedImage(null)}
                        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Chụp Lại
                      </button>
                      <button
                        onClick={submitFaceCapture}
                        disabled={isCapturing}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isCapturing ? (
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        )}
                        {isCapturing ? 'Đang Xử Lý...' : 'Xác Nhận'}
                      </button>
                    </>
                  )}
                </div>

                {/* Debug Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <h4 className="font-medium text-gray-900 mb-2">Debug Info:</h4>
                  <div className="space-y-1 text-gray-600">
                    <p>Camera Stream: {cameraStream ? '✅ Active' : '❌ Inactive'}</p>
                    <p>Video Element: {videoRef.current ? '✅ Ready' : '❌ Not Ready'}</p>
                    <p>Video Dimensions: {videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'N/A'}</p>
                    <p>Video Playing: {videoRef.current ? (videoRef.current.paused ? '❌ Paused' : '✅ Playing') : 'N/A'}</p>
                    <p>Ready State: {videoRef.current ? videoRef.current.readyState : 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create User Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo Tài Khoản Nhân Viên Mới</h3>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john_doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Mật khẩu *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mật khẩu cho truy cập từ xa"
                    minLength="6"
                  />
                  <p className="mt-1 text-xs text-gray-500">Cần thiết để nhân viên có thể truy cập từ mạng ngoại bộ</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phòng ban</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="IT, Sales, Marketing..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chức vụ</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Developer, Manager..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="user">Nhân viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
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
    </div>
  );
};

export default FaceEnrollmentManager;
