import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="homepage-container">
      <h1>Hệ thống chấm công bằng khuôn mặt</h1>
      <p>Chào mừng bạn đến với hệ thống quản lý chấm công hiện đại, an toàn và tiện lợi cho doanh nghiệp.</p>
      <div className="homepage-actions">
        <Link to="/login">
          <button>Đăng nhập</button>
        </Link>
        <Link to="/dashboard">
          <button>Vào Dashboard</button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
