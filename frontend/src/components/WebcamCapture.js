import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw } from 'lucide-react';

const WebcamCapture = ({ onCapture, isCapturing = false, showPreview = true }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    if (onCapture) {
      // Convert base64 to blob for API upload
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' });
          onCapture(file, imageSrc);
        });
    }
  }, [onCapture]);

  const retake = () => {
    setCapturedImage(null);
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  return (
    <div className="webcam-container">
      <div className="webcam-wrapper">
        {!capturedImage ? (
          <Webcam
            audio={false}
            height={480}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={640}
            videoConstraints={videoConstraints}
            className="webcam-video"
          />
        ) : (
          showPreview && (
            <img 
              src={capturedImage} 
              alt="Captured face" 
              className="captured-image"
            />
          )
        )}
      </div>
      
      <div className="webcam-controls">
        {!capturedImage ? (
          <button
            onClick={capture}
            disabled={isCapturing}
            className="capture-btn"
          >
            <Camera size={20} />
            {isCapturing ? 'Processing...' : 'Capture Face'}
          </button>
        ) : (
          <button
            onClick={retake}
            className="retake-btn"
          >
            <RotateCcw size={20} />
            Retake
          </button>
        )}
      </div>

      <style jsx>{`
        .webcam-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .webcam-wrapper {
          border: 3px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: #f9fafb;
        }

        .webcam-video,
        .captured-image {
          display: block;
          width: 640px;
          height: 480px;
          object-fit: cover;
        }

        .webcam-controls {
          display: flex;
          gap: 1rem;
        }

        .capture-btn,
        .retake-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .capture-btn {
          background: #3b82f6;
          color: white;
        }

        .capture-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .capture-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .retake-btn {
          background: #6b7280;
          color: white;
        }

        .retake-btn:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default WebcamCapture;
