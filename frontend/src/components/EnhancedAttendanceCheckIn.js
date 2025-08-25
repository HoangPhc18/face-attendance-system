import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle, XCircle, Eye, Shield } from 'lucide-react';
import FeatureGuard from './FeatureGuard';
import NetworkStatus from './NetworkStatus';
import { attendanceService } from '../services/api';
import toast from 'react-hot-toast';

const EnhancedAttendanceCheckIn = () => {
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
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
    if (!capturedImage) return;

    setProcessing(true);
    setLivenessStatus({ checking: true, passed: false, score: 0 });

    try {
      // Convert base64 to blob for API
      const base64Data = capturedImage.split(',')[1];
      
      const response = await attendanceService.checkIn({
        image: base64Data
      });

      if (response.data.success) {
        setResult({
          success: true,
          message: response.data.message,
          user: response.data.data.user,
          time: response.data.data.time,
          liveness_score: response.data.data.liveness_score
        });
        setLivenessStatus({
          checking: false,
          passed: true,
          score: response.data.data.liveness_score || 0
        });
        toast.success('Check-in successful!');
      } else {
        setResult({
          success: false,
          message: response.data.error
        });
        toast.error(response.data.error);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Check-in failed';
      setResult({
        success: false,
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setLivenessStatus(prev => ({ ...prev, checking: false }));
    }
  };

  const LivenessIndicator = () => (
    <div className="flex items-center space-x-2 text-sm">
      <Eye className="h-4 w-4" />
      <span>Liveness Check:</span>
      {livenessStatus.checking ? (
        <div className="flex items-center space-x-1">
          <div className="animate-spin h-3 w-3 border border-blue-600 rounded-full border-t-transparent"></div>
          <span className="text-blue-600">Checking...</span>
        </div>
      ) : livenessStatus.passed ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Passed ({(livenessStatus.score * 100).toFixed(1)}%)</span>
        </div>
      ) : result && !result.success ? (
        <div className="flex items-center space-x-1">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Failed</span>
        </div>
      ) : (
        <span className="text-gray-500">Ready</span>
      )}
    </div>
  );

  const CameraInterface = () => (
    <div className="space-y-6">
      {/* Network Status Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Face Check-in</h2>
        <NetworkStatus />
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Internal Network - No Login Required
            </p>
            <p className="text-xs text-green-600">
              Face recognition attendance is available from your current network
            </p>
          </div>
        </div>
      </div>

      {/* Camera/Preview Area */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
          {!isCapturing ? (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{
                width: 1280,
                height: 720,
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
        </div>

        {/* Liveness Status */}
        <div className="mb-4">
          <LivenessIndicator />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          {!isCapturing ? (
            <button
              onClick={capture}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Camera className="h-5 w-5" />
              <span>Capture Photo</span>
            </button>
          ) : (
            <>
              <button
                onClick={retake}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Retake</span>
              </button>
              <button
                onClick={processAttendance}
                disabled={processing}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Check In</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`rounded-lg p-6 ${
          result.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {result.success ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? 'Check-in Successful!' : 'Check-in Failed'}
              </h3>
              <p className={`text-sm ${
                result.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.message}
              </p>
              {result.success && result.user && (
                <div className="mt-2 text-sm text-green-600">
                  <p>Welcome, {result.user.full_name}</p>
                  <p>Time: {new Date(result.time).toLocaleString()}</p>
                  {result.liveness_score && (
                    <p>Liveness Score: {(result.liveness_score * 100).toFixed(1)}%</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• Position your face clearly in the camera frame</li>
          <li>• Ensure good lighting on your face</li>
          <li>• Look directly at the camera</li>
          <li>• Avoid wearing masks or sunglasses</li>
          <li>• The system will automatically detect liveness</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeatureGuard 
          feature="attendance"
          fallback={
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Face Attendance Blocked
              </h2>
              <p className="text-red-600 mb-4">
                Face attendance is only available from internal networks for security reasons.
              </p>
              <div className="text-sm text-red-500 mb-6">
                <NetworkStatus />
              </div>
              <div className="space-y-2 text-sm text-red-600">
                <p><strong>Available from external network:</strong></p>
                <p>• View attendance history</p>
                <p>• Submit leave requests</p>
                <p>• Access reports</p>
                <p>• Use AI chatbot</p>
              </div>
            </div>
          }
        >
          <CameraInterface />
        </FeatureGuard>
      </div>
    </div>
  );
};

export default EnhancedAttendanceCheckIn;
