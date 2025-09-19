import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard,
  Users, 
  Calendar, 
  BarChart3, 
  FileText,
  UserPlus,
  Settings,
  LogOut,
  Bell,
  Search
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      description: 'Dashboard và thống kê tổng quan'
    },
    {
      path: '/admin/users',
      label: 'Quản lý nhân viên',
      icon: Users,
      description: 'Thêm, sửa, xóa nhân viên'
    },
    {
      path: '/face-enrollment',
      label: 'Đăng ký khuôn mặt',
      icon: UserPlus,
      description: 'Đăng ký face cho nhân viên'
    },
    {
      path: '/admin/leave-requests',
      label: 'Duyệt nghỉ phép',
      icon: Calendar,
      description: 'Duyệt yêu cầu nghỉ phép'
    },
    {
      path: '/admin/reports',
      label: 'Báo cáo & Phân tích',
      icon: BarChart3,
      description: 'Báo cáo chấm công và thống kê'
    },
    {
      path: '/admin/logs',
      label: 'Nhật ký hệ thống',
      icon: FileText,
      description: 'Xem logs và hoạt động hệ thống'
    }
  ];

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <Settings className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-4">Bạn cần quyền admin để truy cập trang này.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-lg w-full lg:max-w-xs">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Tìm kiếm..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
                    </span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  title="Đăng xuất"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                        isActive
                          ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Section */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-700">Hệ thống hoạt động</p>
                  <p className="text-xs text-gray-500">Tất cả dịch vụ ổn định</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Menu Overlay - You can add mobile menu logic here */}
      <div className="md:hidden">
        {/* Mobile navigation can be added here */}
      </div>
    </div>
  );
};

export default AdminLayout;
