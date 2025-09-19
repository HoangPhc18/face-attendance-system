import React, { useState, useRef, useEffect } from 'react';

const QuickCameraTest = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const addDebugInfo = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Camera Debug] ${message}`);
  };

  const startCamera = async () => {
    try {
      setError('');
      setDebugInfo([]);
      addDebugInfo('🎥 Starting camera...');

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }
      addDebugInfo('✅ Browser supports camera API');

      // Simple constraints
      const constraints = {
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        },
        audio: false
      };
      addDebugInfo(`📋 Using constraints: ${JSON.stringify(constraints)}`);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addDebugInfo('✅ Got media stream');
      addDebugInfo(`📹 Video tracks: ${stream.getVideoTracks().length}`);
      
      streamRef.current = stream;

      // Setup video element
      if (videoRef.current) {
        addDebugInfo('🎬 Setting up video element...');
        videoRef.current.srcObject = stream;

        // Add event listeners
        videoRef.current.onloadstart = () => addDebugInfo('📺 Video load started');
        videoRef.current.onloadeddata = () => addDebugInfo('📺 Video data loaded');
        videoRef.current.oncanplay = () => addDebugInfo('📺 Video can play');
        videoRef.current.onplaying = () => addDebugInfo('📺 Video is playing');
        videoRef.current.onerror = (e) => addDebugInfo(`❌ Video error: ${e.message}`);

        videoRef.current.onloadedmetadata = async () => {
          addDebugInfo('📺 Video metadata loaded');
          addDebugInfo(`📐 Video size: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
          
          try {
            await videoRef.current.play();
            addDebugInfo('✅ Video playing successfully');
            setIsActive(true);
          } catch (playError) {
            addDebugInfo(`❌ Play error: ${playError.message}`);
            setError(`Cannot play video: ${playError.message}`);
          }
        };
      }

    } catch (err) {
      addDebugInfo(`❌ Camera error: ${err.message}`);
      setError(err.message);
    }
  };

  const stopCamera = () => {
    addDebugInfo('🛑 Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugInfo(`🔴 Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    addDebugInfo('✅ Camera stopped');
  };

  const testCapture = () => {
    if (!videoRef.current) {
      addDebugInfo('❌ Video element not ready');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    addDebugInfo(`📸 Captured image: ${imageData.length} characters`);
    addDebugInfo(`🖼️ Image starts with: ${imageData.substring(0, 50)}...`);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Quick Camera Test</h2>
      
      {/* Controls */}
      <div className="mb-4 space-x-4">
        <button
          onClick={startCamera}
          disabled={isActive}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Start Camera
        </button>
        <button
          onClick={stopCamera}
          disabled={!isActive}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Stop Camera
        </button>
        <button
          onClick={testCapture}
          disabled={!isActive}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          Test Capture
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Video Display */}
      <div className="mb-4 flex justify-center">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="border-2 border-gray-300 rounded"
            style={{
              width: '640px',
              height: '480px',
              backgroundColor: 'black',
              transform: 'scaleX(-1)' // Mirror effect
            }}
          />
          
          {/* Status overlay */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
            {isActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Debug Information:</h3>
        <div className="text-sm font-mono max-h-60 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <p className="text-gray-500">No debug info yet. Click "Start Camera" to begin.</p>
          ) : (
            debugInfo.map((info, index) => (
              <div key={index} className="mb-1">
                {info}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Browser Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Browser:</strong> {navigator.userAgent}</p>
        <p><strong>Media Devices Support:</strong> {navigator.mediaDevices ? 'Yes' : 'No'}</p>
        <p><strong>getUserMedia Support:</strong> {navigator.mediaDevices?.getUserMedia ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default QuickCameraTest;
