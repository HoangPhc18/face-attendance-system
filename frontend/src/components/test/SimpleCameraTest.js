import React, { useState, useRef, useEffect } from 'react';

const SimpleCameraTest = () => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('Starting camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('Got media stream:', mediaStream);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Set video source');
      }
      
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Simple Camera Test</h2>
      
      <div className="space-x-4 mb-4">
        <button
          onClick={startCamera}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Camera
        </button>
        <button
          onClick={stopCamera}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stop Camera
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-md border border-gray-300 rounded"
          style={{ backgroundColor: 'black' }}
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>Stream active: {stream ? 'Yes' : 'No'}</p>
        <p>Video element ready: {videoRef.current ? 'Yes' : 'No'}</p>
        <p>Browser support: {navigator.mediaDevices ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default SimpleCameraTest;
