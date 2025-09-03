import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Eye, EyeOff, Camera, CheckCircle, XCircle, Loader } from 'lucide-react';
import api, { livenessService } from '../services/api';
import toast from 'react-hot-toast';

const LivenessCheck = ({ onLivenessResult, onCancel, mode = 'single' }) => {
  const webcamRef = useRef(null);
  const [isChecking, setIsChecking] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [instructions, setInstructions] = useState('Nhìn thẳng vào camera');
  const [livenessResult, setLivenessResult] = useState(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  const captureFrame = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      return imageSrc;
    }
    return null;
  }, []);

  const handleSingleImageCheck = async () => {
    setIsChecking(true);
    try {
      const imageData = captureFrame();
      if (!imageData) {
        toast.error('Không thể chụp ảnh');
        return;
      }

      const response = await api.liveness.checkImage(imageData);
      const result = response.data;

      setLivenessResult(result);
      
      if (result.is_live) {
        toast.success('Liveness detection passed!');
        onLivenessResult(true, result);
      } else {
        toast.error(`Liveness detection failed: ${result.message}`);
        onLivenessResult(false, result);
      }
    } catch (error) {
      console.error('Liveness check error:', error);
      toast.error('Lỗi kiểm tra liveness');
      onLivenessResult(false, { error: error.message });
    } finally {
      setIsChecking(false);
    }
  };

  const handleMultiFrameCheck = async () => {
    if (currentStep === 1) {
      // Bước 1: Nhìn thẳng
      setInstructions('Nhìn thẳng vào camera và giữ yên');
      const frame1 = captureFrame();
      if (frame1) {
        setCapturedFrames([frame1]);
        setCurrentStep(2);
        setInstructions('Chớp mắt 2-3 lần');
      }
    } else if (currentStep === 2) {
      // Bước 2: Chớp mắt
      const frame2 = captureFrame();
      if (frame2) {
        setCapturedFrames(prev => [...prev, frame2]);
        setCurrentStep(3);
        setInstructions('Xoay đầu nhẹ sang trái rồi sang phải');
      }
    } else if (currentStep === 3) {
      // Bước 3: Xoay đầu
      const frame3 = captureFrame();
      if (frame3) {
        const allFrames = [...capturedFrames, frame3];
        setCapturedFrames(allFrames);
        
        // Thực hiện kiểm tra liveness
        setIsChecking(true);
        try {
          const response = await api.liveness.checkFrames(allFrames);
          const result = response.data;

          setLivenessResult(result);
          
          if (result.is_live) {
            toast.success('Liveness detection passed!');
            onLivenessResult(true, result);
          } else {
            toast.error(`Liveness detection failed: ${result.message}`);
            onLivenessResult(false, result);
          }
        } catch (error) {
          console.error('Liveness check error:', error);
          toast.error('Lỗi kiểm tra liveness');
          onLivenessResult(false, { error: error.message });
        } finally {
          setIsChecking(false);
        }
      }
    }
  };

  const resetCheck = () => {
    setCurrentStep(1);
    setCapturedFrames([]);
    setInstructions('Nhìn thẳng vào camera');
    setLivenessResult(null);
  };

  return (
    <div className="liveness-check">
      <div className="webcam-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam"
        />
      </div>

      <div className="liveness-instructions">
        <h3>Kiểm tra Liveness Detection</h3>
        <p className="instruction-text">{instructions}</p>
        
        {mode === 'multi' && (
          <div className="step-indicator">
            <span className={`step ${currentStep >= 1 ? 'active' : ''}`}>1</span>
            <span className={`step ${currentStep >= 2 ? 'active' : ''}`}>2</span>
            <span className={`step ${currentStep >= 3 ? 'active' : ''}`}>3</span>
          </div>
        )}
      </div>

      {livenessResult && (
        <div className={`liveness-result ${livenessResult.is_live ? 'success' : 'error'}`}>
          <div className="result-icon">
            {livenessResult.is_live ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <XCircle className="text-red-500" size={24} />
            )}
          </div>
          <div className="result-details">
            <p><strong>Kết quả:</strong> {livenessResult.is_live ? 'Passed' : 'Failed'}</p>
            <p><strong>Điểm số:</strong> {livenessResult.liveness_score?.toFixed(2)}</p>
            <p><strong>Thông điệp:</strong> {livenessResult.message}</p>
          </div>
        </div>
      )}

      <div className="liveness-actions">
        {!livenessResult && (
          <>
            {mode === 'single' ? (
              <button
                onClick={handleSingleImageCheck}
                disabled={isChecking}
                className="btn btn-primary"
              >
                {isChecking ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    Kiểm tra Liveness
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleMultiFrameCheck}
                disabled={isChecking}
                className="btn btn-primary"
              >
                {isChecking ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Đang kiểm tra...
                  </>
                ) : (
                  <>
                    <Camera size={16} />
                    {currentStep === 1 ? 'Bắt đầu' : 'Tiếp tục'}
                  </>
                )}
              </button>
            )}
          </>
        )}

        {livenessResult && !livenessResult.is_live && (
          <button onClick={resetCheck} className="btn btn-secondary">
            Thử lại
          </button>
        )}

        <button onClick={onCancel} className="btn btn-outline">
          Hủy
        </button>
      </div>

      <style jsx>{`
        .liveness-check {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .webcam-container {
          position: relative;
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .webcam {
          width: 100%;
          height: auto;
        }

        .liveness-instructions {
          text-align: center;
          margin-bottom: 20px;
        }

        .liveness-instructions h3 {
          margin-bottom: 10px;
          color: #333;
        }

        .instruction-text {
          font-size: 16px;
          color: #666;
          margin-bottom: 15px;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .step {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #9ca3af;
          transition: all 0.3s ease;
        }

        .step.active {
          background: #3b82f6;
          color: white;
        }

        .liveness-result {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .liveness-result.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .liveness-result.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .result-details p {
          margin: 5px 0;
          font-size: 14px;
        }

        .liveness-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-outline {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f9fafb;
        }
      `}</style>
    </div>
  );
};

export default LivenessCheck;
