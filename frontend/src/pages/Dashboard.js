import React from 'react';
import Navbar from '../components/Navbar';
import FaceAttendance from '../components/FaceAttendance';
import History from '../components/History';
import Report from '../components/Report';
import LeaveRequest from '../components/LeaveRequest';

const Dashboard = () => {
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Chào mừng đến với hệ thống chấm công bằng khuôn mặt</h1>
        <div className="dashboard-features">
          <div className="feature-block">
            <FaceAttendance />
          </div>
          <div className="feature-block">
            <History />
          </div>
          <div className="feature-block">
            <Report />
          </div>
          <div className="feature-block">
            <LeaveRequest />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
