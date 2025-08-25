import React, { useState } from 'react';
import { Camera, User, Mail, Phone, MapPin, Building, Save, ArrowLeft } from 'lucide-react';
import WebcamCapture from './WebcamCapture';
import LivenessCheck from './LivenessCheck';
import api from '../services/api';
import toast from 'react-hot-toast';

const FaceEnrollment = () => {
  const [step, setStep] = useState(1); // 1: liveness, 2: capture, 3: user info, 4: success
  const [capturedImage, setCapturedImage] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [livenessResult, setLivenessResult] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'user'
  });

  const handleLivenessResult = (passed, result) => {
    setLivenessResult(result);
    if (passed) {
      setStep(2); // Chuyển sang bước chụp ảnh
    }
  };

  const handleFaceCapture = async (imageFile, imagePreview) => {
    setIsProcessing(true);
    
    try {
      const response = await api.face.enroll(imageFile);
      
      if (response.data.success) {
        setCapturedImage(imagePreview);
        setPendingId(response.data.pending_id);
        setStep(3); // Chuyển sang bước nhập thông tin user
        toast.success('Khuôn mặt đã được chụp thành công!');
      } else {
        toast.error(response.data.error || 'Không thể chụp khuôn mặt');
      }
    } catch (error) {
      console.error('Face capture error:', error);
      toast.error('Lỗi khi chụp khuôn mặt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserFormChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    });
  };

  const handleUserRegistration = async () => {
    if (!userForm.username || !userForm.full_name || !userForm.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await api.face.registerUser({
        ...userForm,
        pending_id: pendingId
      });
      
      if (response.data.success) {
        setStep(4); // Chuyển sang bước thành công
        toast.success('Đăng ký thành công!');
      } else {
        toast.error(response.data.error || 'Đăng ký thất bại');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Lỗi khi đăng ký');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetEnrollment = () => {
    setStep(1);
    setCapturedImage(null);
    setPendingId(null);
    setLivenessResult(null);
    setUserForm({
      username: '',
      full_name: '',
      email: '',
      role: 'user'
    });
  };

  return (
    <div className="face-enrollment">
      <div className="enrollment-header">
        <h2>Đăng ký khuôn mặt mới</h2>
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>4</div>
        </div>
      </div>

      {step === 1 && (
        <div className="step-content">
          <h3>Bước 1: Kiểm tra Liveness Detection</h3>
          <LivenessCheck
            onLivenessResult={handleLivenessResult}
            onCancel={() => setStep(1)}
            mode="multi"
          />
        </div>
      )}

      {step === 2 && (
        <div className="step-content">
          <h3>Bước 2: Chụp ảnh khuôn mặt</h3>
          <WebcamCapture
            onCapture={handleFaceCapture}
            isProcessing={isProcessing}
          />
          <button 
            onClick={() => setStep(1)} 
            className="btn btn-outline mt-4"
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="step-content">
          <h3>Bước 3: Thông tin người dùng</h3>
          <div className="captured-preview">
            <img src={capturedImage} alt="Captured face" />
            <p>Khuôn mặt đã được chụp thành công</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleUserRegistration(); }} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={userForm.username}
                  onChange={handleUserFormChange}
                  required
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="full_name">Full Name *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={userForm.full_name}
                  onChange={handleUserFormChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleUserFormChange}
                  required
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={userForm.role}
                  onChange={handleUserFormChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-outline"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
              <button 
                type="submit"
                disabled={isProcessing}
                className="btn btn-primary"
              >
                {isProcessing ? (
                  <>Đang xử lý...</>
                ) : (
                  <>
                    <Save size={16} />
                    Đăng ký
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 4 && (
        <div className="step-content">
          <div className="success-content">
            <User className="success-icon" size={64} />
            <h2>Đăng ký thành công!</h2>
            <p>Người dùng đã được đăng ký thành công với nhận diện khuôn mặt.</p>
            
            <div className="user-summary">
              <h3>Thông tin người dùng:</h3>
              <p><strong>Username:</strong> {userForm.username}</p>
              <p><strong>Họ tên:</strong> {userForm.full_name}</p>
              <p><strong>Email:</strong> {userForm.email}</p>
              <p><strong>Vai trò:</strong> {userForm.role}</p>
            </div>
            
            <div className="success-actions">
              <button onClick={resetEnrollment} className="btn btn-primary">
                <Camera size={16} />
                Đăng ký người dùng khác
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .face-enrollment {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .enrollment-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .enrollment-header h2 {
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .step {
          width: 40px;
          height: 40px;
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

        .step-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .step-content h3 {
          margin-bottom: 1.5rem;
          color: #1f2937;
          text-align: center;
        }

        .captured-preview {
          text-align: center;
          margin-bottom: 2rem;
        }

        .captured-preview img {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #3b82f6;
          margin-bottom: 1rem;
        }

        .user-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
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

        .btn-outline {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f9fafb;
        }

        .mt-4 {
          margin-top: 1rem;
        }

        .success-content {
          text-align: center;
        }

        .success-icon {
          color: #059669;
          margin-bottom: 1rem;
        }

        .user-summary {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 8px;
          margin: 2rem 0;
          text-align: left;
        }

        .user-summary h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .user-summary p {
          margin: 0.5rem 0;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default FaceEnrollment;
