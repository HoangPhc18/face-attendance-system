import React, { useState } from 'react';
import WebcamCapture from './WebcamCapture';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const FaceEnrollment = () => {
  const [step, setStep] = useState(1); // 1: capture, 2: user info, 3: success
  const [capturedImage, setCapturedImage] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'user'
  });

  const handleFaceCapture = async (imageFile, imagePreview) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.face.enroll(formData);
      
      if (response.data.success) {
        setCapturedImage(imagePreview);
        setPendingId(response.data.pending_id);
        setStep(2);
        toast.success('Face captured successfully!');
      } else {
        toast.error(response.data.message || 'Face capture failed');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('No face detected in image. Please try again.');
      } else {
        toast.error('Face enrollment failed. Please try again.');
      }
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

  const handleUserRegistration = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await api.face.registerUser({
        ...userForm,
        pending_id: pendingId
      });

      if (response.data.user_id) {
        setStep(3);
        toast.success('User registered successfully!');
      } else {
        toast.error('User registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetEnrollment = () => {
    setStep(1);
    setCapturedImage(null);
    setPendingId(null);
    setUserForm({
      username: '',
      full_name: '',
      email: '',
      role: 'user'
    });
  };

  return (
    <div className="enrollment-container">
      <div className="enrollment-header">
        <UserPlus size={32} />
        <h1>Face Enrollment</h1>
        <p>Register a new user with face recognition</p>
      </div>

      <div className="enrollment-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <span>Capture Face</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <span>User Information</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <span>Complete</span>
        </div>
      </div>

      <div className="enrollment-content">
        {step === 1 && (
          <div className="step-content">
            <h2>Step 1: Capture Face</h2>
            <p>Position the person's face in the camera and capture a clear image</p>
            <WebcamCapture
              onCapture={handleFaceCapture}
              isCapturing={isProcessing}
              showPreview={true}
            />
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h2>Step 2: User Information</h2>
            <div className="captured-preview">
              <img src={capturedImage} alt="Captured face" />
              <p>Face captured successfully</p>
            </div>
            
            <form onSubmit={handleUserRegistration} className="user-form">
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

              <div className="form-actions">
                <button
                  type="button"
                  onClick={resetEnrollment}
                  className="btn-secondary"
                >
                  Start Over
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary"
                >
                  {isProcessing ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="step-content success-content">
            <CheckCircle size={64} className="success-icon" />
            <h2>Registration Complete!</h2>
            <p>User has been successfully registered with face recognition.</p>
            <div className="user-summary">
              <h3>User Details:</h3>
              <p><strong>Username:</strong> {userForm.username}</p>
              <p><strong>Full Name:</strong> {userForm.full_name}</p>
              <p><strong>Email:</strong> {userForm.email}</p>
              <p><strong>Role:</strong> {userForm.role}</p>
            </div>
            <button onClick={resetEnrollment} className="btn-primary">
              Register Another User
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .enrollment-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .enrollment-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .enrollment-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0.5rem 0;
        }

        .enrollment-header p {
          color: #6b7280;
          margin: 0;
        }

        .enrollment-steps {
          display: flex;
          justify-content: center;
          margin-bottom: 3rem;
          gap: 2rem;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.5;
          transition: opacity 0.3s;
        }

        .step.active {
          opacity: 1;
        }

        .step.completed {
          opacity: 1;
          color: #059669;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .step.active .step-number {
          background: #3b82f6;
          color: white;
        }

        .step.completed .step-number {
          background: #059669;
          color: white;
        }

        .enrollment-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .step-content {
          text-align: center;
        }

        .step-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .step-content p {
          color: #6b7280;
          margin: 0 0 2rem 0;
        }

        .captured-preview {
          margin-bottom: 2rem;
        }

        .captured-preview img {
          width: 200px;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
        }

        .user-form {
          max-width: 500px;
          margin: 0 auto;
          text-align: left;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
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
