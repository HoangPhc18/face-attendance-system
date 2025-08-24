import React, { useState, useEffect } from 'react';
import WebcamCapture from './WebcamCapture';
import LivenessCheck from './LivenessCheck';
import { Clock, CheckCircle, XCircle, User, Wifi, WifiOff } from 'lucide-react';
import { checkIn } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AttendanceCheckIn = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [isInternalNetwork, setIsInternalNetwork] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check if user is on internal network
    checkNetworkStatus();

    return () => clearInterval(timer);
  }, []);

  const checkNetworkStatus = async () => {
    try {
      // This would be implemented based on your network detection logic
      // For now, we'll assume internal network if localhost or private IP
      const hostname = window.location.hostname;
      const isInternal = hostname === 'localhost' || 
                        hostname.startsWith('192.168.') || 
                        hostname.startsWith('10.') ||
                        hostname.startsWith('172.');
      setIsInternalNetwork(isInternal);
    } catch (error) {
      setIsInternalNetwork(false);
    }
  };

  const handleFaceCapture = async (imageFile, imagePreview) => {
    if (!isInternalNetwork) {
      toast.error('Face check-in is only available from internal network');
      return;
    }

    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.attendance.checkIn(formData);
      
      if (response.data.success) {
        setLastCheckIn({
          time: new Date(),
          user: response.data.user,
          type: response.data.type // 'check-in' or 'check-out'
        });
        
        toast.success(`${response.data.type === 'check-in' ? 'Check-in' : 'Check-out'} successful!`);
      } else {
        toast.error(response.data.message || 'Face recognition failed');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Face not recognized. Please register your face first.');
      } else {
        toast.error('Check-in failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isInternalNetwork) {
    return (
      <div className="checkin-container">
        <div className="network-warning">
          <WifiOff size={64} className="warning-icon" />
          <h2>Internal Network Required</h2>
          <p>Face check-in is only available when connected to the company's internal network.</p>
          <p>Please connect to the internal network and try again.</p>
        </div>

        <style jsx>{`
          .checkin-container {
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
          }

          .network-warning {
            text-align: center;
            padding: 3rem;
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 12px;
            color: #dc2626;
          }

          .warning-icon {
            margin-bottom: 1rem;
          }

          .network-warning h2 {
            margin: 0 0 1rem 0;
            font-size: 1.5rem;
          }

          .network-warning p {
            margin: 0.5rem 0;
            color: #7f1d1d;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <div className="time-display">
          <Clock size={24} />
          <div>
            <div className="current-time">{format(currentTime, 'HH:mm:ss')}</div>
            <div className="current-date">{format(currentTime, 'EEEE, MMMM d, yyyy')}</div>
          </div>
        </div>
        
        <div className="network-status">
          <Wifi size={20} />
          <span>Internal Network</span>
        </div>
      </div>

      <div className="checkin-main">
        <h1>Face Check-In</h1>
        <p>Position your face in the camera and click capture to check in/out</p>

        <WebcamCapture
          onCapture={handleFaceCapture}
          isCapturing={isProcessing}
          showPreview={false}
        />

        {lastCheckIn && (
          <div className="last-checkin">
            <CheckCircle size={24} className="success-icon" />
            <div>
              <div className="checkin-type">
                {lastCheckIn.type === 'check-in' ? 'Checked In' : 'Checked Out'}
              </div>
              <div className="checkin-time">
                {format(lastCheckIn.time, 'HH:mm:ss')}
              </div>
              <div className="checkin-user">
                Welcome, {lastCheckIn.user?.full_name || 'User'}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .checkin-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .checkin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .time-display {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #1f2937;
        }

        .current-time {
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Courier New', monospace;
        }

        .current-date {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .network-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #059669;
          font-weight: 600;
        }

        .checkin-main {
          text-align: center;
        }

        .checkin-main h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .checkin-main p {
          color: #6b7280;
          margin: 0 0 2rem 0;
        }

        .last-checkin {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f0fdf4;
          border: 2px solid #bbf7d0;
          border-radius: 12px;
          text-align: left;
        }

        .success-icon {
          color: #059669;
          flex-shrink: 0;
        }

        .checkin-type {
          font-size: 1.125rem;
          font-weight: 700;
          color: #059669;
        }

        .checkin-time {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          font-family: 'Courier New', monospace;
        }

        .checkin-user {
          font-size: 0.875rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default AttendanceCheckIn;
