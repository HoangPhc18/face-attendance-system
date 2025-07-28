import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/">Trang chủ</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/login">Đăng nhập</Link>
    </nav>
  );
};

export default Navbar;
