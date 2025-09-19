import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, XCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CameraTest = () => {
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      });

      console.log('Camera stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks());

      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play()
            .then(() => {
              console.log('Video playing successfully');
              setShowCamera(true);
              toast.success('Camera started successfully!');
            })
            .catch(e => {
              console.error('Error playing video:', e);
              setCameraError('Cannot play video stream');
              toast.error('Cannot play video stream');
            });
        };

        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setCameraError('Video playback error');
        };
      }

    } catch (error) {
      console.error('Camera error:', error);
      
      let errorMessage = 'Cannot access camera';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints cannot be satisfied.';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        console.log('Stopping track:', track);
        track.stop();
      });
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setShowCamera(false);
    setCapturedImage(null);
    setCameraError(null);
    toast.success('Camera stopped');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Video or canvas not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      toast.error('Video not ready. Please wait...');
      return;
    }

    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    console.log('Captured image data length:', imageData.length);
    
    setCapturedImage(imageData);
    toast.success('Photo captured!');
  };

  const testImageData = () => {
    if (!capturedImage) {
      toast.error('No image captured');
      return;
    }

    console.log('Testing image data...');
    console.log('Image starts with:', capturedImage.substring(0, 50));
    console.log('Image length:', capturedImage.length);
    
    // Test if it's valid base64
    try {
      const base64Data = capturedImage.split(',')[1];
      const binaryData = atob(base64Data);
      console.log('Binary data length:', binaryData.length);
      toast.success('Image data is valid!');
    } catch (error) {
      console.error('Invalid base64:', error);
      toast.error('Invalid image data');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Camera Test</h2>
        <p className="text-gray-600 mb-6">
          Test camera functionality for face enrollment
        </p>

        <div className="flex space-x-4 mb-6">
          {!showCamera ? (
            <button
              onClick={startCamera}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Stop Camera
            </button>
          )}

          {showCamera && (
            <button
              onClick={capturePhoto}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture Photo
            </button>
          )}

          {capturedImage && (
            <button
              onClick={testImageData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Test Image Data
            </button>
          )}
        </div>

        {/* Camera Error */}
        {cameraError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{cameraError}</p>
          </div>
        )}

        {/* Camera Stream */}
        {showCamera && (
          <div className="flex justify-center mb-6">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-96 h-72 bg-black rounded-lg object-cover border-2 border-blue-400"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {/* Face detection overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-60 border-2 border-blue-400 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
                  Position your face in the frame
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Captured Image */}
        {capturedImage && (
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-2">Captured Image</h3>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-48 h-60 object-cover rounded border"
                style={{ transform: 'scaleX(-1)' }}
              />
              <p className="text-sm text-gray-500 mt-2">
                Size: {Math.round(capturedImage.length / 1024)} KB
              </p>
            </div>
          </div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Debug Information</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Camera Stream:</strong> {cameraStream ? 'Active' : 'Inactive'}</p>
            <p><strong>Video Element:</strong> {videoRef.current ? 'Ready' : 'Not Ready'}</p>
            <p><strong>Canvas Element:</strong> {canvasRef.current ? 'Ready' : 'Not Ready'}</p>
            <p><strong>Captured Image:</strong> {capturedImage ? 'Yes' : 'No'}</p>
            <p><strong>Browser Support:</strong> {navigator.mediaDevices ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraTest;
