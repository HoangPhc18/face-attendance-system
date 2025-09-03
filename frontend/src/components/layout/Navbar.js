import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Settings, 
  Bell, 
  Menu, 
  X,
  Shield,
  Users,
  Calendar,
  BarChart3,
  Camera,
  Home
} from 'lucide-react';
import NetworkStatus from '../common/NetworkStatus';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, 
    isAuthenticated, 
    isAdmin, 
    isInternalNetwork,
    hasPermission,
    logout 
  } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation items based on permissions
  const getNavigationItems = () => {
    const items = [];

    // Home - always available
    items.push({
      name: 'Trang chủ',
      href: '/',
      icon: Home,
      current: location.pathname === '/'
    });

    // Face Attendance - internal network only
    if (hasPermission('canAccessFaceAttendance')) {
      items.push({
        name: 'Chấm công',
        href: '/attendance',
        icon: Camera,
        current: location.pathname.startsWith('/attendance')
      });
    }

    // Leave Requests - based on network and auth
    if (hasPermission('canCreateLeaveRequests')) {
      items.push({
        name: 'Nghỉ phép',
        href: '/leave',
        icon: Calendar,
        current: location.pathname.startsWith('/leave')
      });
    }

    // Reports - role-based access
    if (hasPermission('canViewOwnReports') || hasPermission('canViewAllReports')) {
      items.push({
        name: 'Báo cáo',
        href: '/reports',
        icon: BarChart3,
        current: location.pathname.startsWith('/reports')
      });
    }

    // Admin Panel - admin only
    if (hasPermission('canAccessAdminPanel')) {
      items.push({
        name: 'Quản trị',
        href: '/admin',
        icon: Shield,
        current: location.pathname.startsWith('/admin')
      });
    }

    // Face Enrollment - admin only
    if (hasPermission('canManageFaceEnrollment')) {
      items.push({
        name: 'Đăng ký khuôn mặt',
        href: '/face-enrollment',
        icon: Users,
        current: location.pathname.startsWith('/face-enrollment')
      });
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Camera className="w-8 h-8 text-primary-600" />
                <span className="font-bold text-xl text-gray-900">
                  Face Attendance
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      item.current
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Network status, notifications, user menu */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="hidden md:block">
              <NetworkStatus showDetails={true} />
            </div>

            {/* Notifications */}
            {isAuthenticated && (
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-500"></span>
              </button>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="hidden md:block text-gray-700 font-medium">
                    {user?.full_name || user?.username}
                  </span>
                  {isAdmin && (
                    <span className="hidden md:block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </button>

                {/* Profile dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Cài đặt
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            {/* Network Status for mobile */}
            <div className="px-3 py-2">
              <NetworkStatus showDetails={true} />
            </div>

            {/* Navigation items */}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    item.current
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile auth buttons */}
            {!isAuthenticated && (
              <div className="px-3 py-2 space-y-2">
                <Link
                  to="/login"
                  className="block w-full text-center btn-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center btn-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
