import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Clock, 
  Calendar, 
  UserPlus, 
  Users, 
  MessageCircle, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['user', 'admin'] },
    { path: '/checkin', icon: Clock, label: 'Check In', roles: ['user', 'admin'] },
    { path: '/attendance', icon: Calendar, label: 'History', roles: ['user', 'admin'] },
    { path: '/leave', icon: Calendar, label: 'Leave Request', roles: ['user', 'admin'] },
    { path: '/enroll', icon: UserPlus, label: 'Face Enrollment', roles: ['admin'] },
    { path: '/admin', icon: Users, label: 'User Management', roles: ['admin'] },
    { path: '/chatbot', icon: MessageCircle, label: 'AI Assistant', roles: ['user', 'admin'] },
  ];

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || 'user')
  );

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const NavItem = ({ item, isMobile = false }) => {
    const Icon = item.icon;
    const isActive = window.location.pathname === item.path;
    
    return (
      <a
        href={item.path}
        className={`nav-item ${isActive ? 'active' : ''} ${isMobile ? 'mobile' : ''}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <Icon size={20} />
        <span>{item.label}</span>
      </a>
    );
  };

  return (
    <>
      <nav className="navigation">
        <div className="nav-brand">
          <Clock size={24} />
          <span>Face Attendance</span>
        </div>

        <div className="nav-items desktop">
          {filteredItems.map((item, index) => (
            <NavItem key={index} item={item} />
          ))}
        </div>

        <div className="nav-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.full_name || user?.username}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
          </button>

          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="mobile-menu-content">
            <div className="mobile-nav-items">
              {filteredItems.map((item, index) => (
                <NavItem key={index} item={item} isMobile={true} />
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: #1f2937;
        }

        .nav-brand svg {
          color: #3b82f6;
        }

        .nav-items.desktop {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .nav-item.active {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .nav-item.mobile {
          padding: 1rem 1.5rem;
          border-radius: 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: capitalize;
        }

        .logout-btn {
          padding: 0.5rem;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .mobile-menu-btn {
          display: none;
          padding: 0.5rem;
          border: none;
          background: none;
          color: #6b7280;
          cursor: pointer;
        }

        .mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .mobile-menu-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .mobile-menu-content {
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          width: 280px;
          background: white;
          box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateX(0);
          transition: transform 0.3s ease-in-out;
        }

        .mobile-nav-items {
          padding-top: 5rem;
        }

        @media (max-width: 768px) {
          .nav-items.desktop {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .user-details {
            display: none;
          }

          .navigation {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .nav-brand span {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default Navigation;
