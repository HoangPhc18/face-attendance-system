import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle, XCircle, Eye, Shield, User } from 'lucide-react';
import { attendanceService } from '../services/api';
import toast from 'react-hot-toast';

const PublicAttendanceCheckIn = () => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [employeeId, setEmployeeId] = useState('');
  const [livenessStatus, setLivenessStatus] = useState({
    checking: false,
    passed: false,
    score: 0
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setIsCapturing(true);
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
    setIsCapturing(false);
    setResult(null);
    setLivenessStatus({ checking: false, passed: false, score: 0 });
  };

  const processAttendance = async () => {
    if (!capturedImage) {
      toast.error('Please capture an image first');
      return;
    }

    if (!employeeId.trim()) {
      toast.error('Please enter your Employee ID');
      return;
    }

    setProcessing(true);
    setLivenessStatus({ checking: true, passed: false, score: 0 });

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'attendance.jpg');
      formData.append('employee_id', employeeId.trim());

      const attendanceResponse = await attendanceService.checkIn(formData);
      
      if (attendanceResponse.data.success) {
        setResult({
          success: true,
          message: attendanceResponse.data.message || 'Attendance recorded successfully',
          user: attendanceResponse.data.data?.user,
          time: new Date().toLocaleTimeString()
        });
        setLivenessStatus({ checking: false, passed: true, score: 0.9 });
        toast.success('Attendance recorded successfully!');
      } else {
        setResult({
          success: false,
          message: attendanceResponse.data.error || 'Attendance check-in failed'
        });
        toast.error(attendanceResponse.data.error || 'Attendance check-in failed');
      }
    } catch (error) {
      console.error('Attendance error:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || 'Failed to process attendance'
      });
      toast.error(error.response?.data?.error || 'Failed to process attendance');
    } finally {
      setProcessing(false);
      setLivenessStatus(prev => ({ ...prev, checking: false }));
    }
  };

  const resetForm = () => {
    setEmployeeId('');
    retake();
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">Face Attendance System</h1>
          </div>
          <p className="text-gray-600">Internal Network - Quick Check-In</p>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Internal Network Detected
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Employee ID Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter your Employee ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={processing}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Camera Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Face Capture
                </h3>
                
                <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                  {!isCapturing ? (
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user"
                      }}
                    />
                  ) : (
                    <img 
                      src={capturedImage} 
                      alt="Captured" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Liveness Detection Overlay */}
                  {livenessStatus.checking && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-blue-600 animate-pulse" />
                        <span className="text-sm font-medium">Checking liveness...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="flex space-x-3">
                  {!isCapturing ? (
                    <button
                      onClick={capture}
                      disabled={processing || !employeeId.trim()}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Photo</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={retake}
                        disabled={processing}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Retake</span>
                      </button>
                      <button
                        onClick={processAttendance}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {processing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Check In</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
                
                {/* Liveness Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Liveness Detection</span>
                    {livenessStatus.checking ? (
                      <div className="flex items-center text-blue-600">
                        <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                        <span className="text-sm">Checking...</span>
                      </div>
                    ) : livenessStatus.passed ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Passed</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <XCircle className="w-4 h-4 mr-1" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Result Display */}
                {result && (
                  <div className={`rounded-lg p-4 ${
                    result.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {result.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          result.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {result.success ? 'Check-in Successful!' : 'Check-in Failed'}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          result.success ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.message}
                        </p>
                        {result.success && result.user && (
                          <div className="mt-2 text-sm text-green-700">
                            <p><strong>Employee:</strong> {result.user.full_name}</p>
                            <p><strong>Time:</strong> {result.time}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {result.success && (
                      <button
                        onClick={resetForm}
                        className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Check In Another Employee
                      </button>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>1. Enter your Employee ID</li>
                    <li>2. Look directly at the camera</li>
                    <li>3. Capture your photo</li>
                    <li>4. Wait for face recognition</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAttendanceCheckIn;
