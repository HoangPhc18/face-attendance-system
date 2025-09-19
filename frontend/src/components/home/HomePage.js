import React from 'react';
import QuickAttendance from './QuickAttendance';
import { 
  Clock, 
  Users, 
  Calendar,
  BarChart3,
  Shield,
  Wifi
} from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Face Attendance System</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/admin" className="text-gray-600 hover:text-gray-900">Admin</a>
              <a href="/employee" className="text-gray-600 hover:text-gray-900">Employee</a>
              <a href="/login" className="text-gray-600 hover:text-gray-900">Login</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Hệ thống chấm công thông minh
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sử dụng công nghệ nhận diện khuôn mặt tiên tiến với bảo mật mạng thông minh. 
            Chấm công nhanh chóng từ mạng nội bộ, quản lý từ xa an toàn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Attendance - Main Feature */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Chấm công nhanh
                </h3>
                <p className="text-gray-600">
                  Sử dụng khuôn mặt để chấm công tự động - không cần đăng nhập từ mạng nội bộ
                </p>
              </div>
              
              <QuickAttendance />
            </div>
          </div>

          {/* Features Sidebar */}
          <div className="space-y-6">
            {/* Network Smart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Wifi className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Network Smart</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Mạng nội bộ: Chấm công không cần đăng nhập
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Mạng ngoại bộ: Yêu cầu xác thực
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Tự động phát hiện loại mạng
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Bảo mật cao</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Liveness Detection chống giả mạo
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Mã hóa dữ liệu khuôn mặt
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Phân quyền theo vai trò
                </li>
              </ul>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Thống kê</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hôm nay</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tuần này</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tháng này</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Tính năng nổi bật
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Chấm công tự động</h4>
              <p className="text-gray-600">
                Nhận diện khuôn mặt trong 1-2 giây với độ chính xác cao
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Quản lý nhân sự</h4>
              <p className="text-gray-600">
                Theo dõi giờ làm việc, nghỉ phép và hiệu suất làm việc
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Báo cáo chi tiết</h4>
              <p className="text-gray-600">
                Xuất báo cáo Excel/CSV với thống kê và phân tích chi tiết
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Bắt đầu sử dụng ngay hôm nay</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Hệ thống chấm công thông minh với công nghệ AI tiên tiến, 
            bảo mật cao và dễ sử dụng cho mọi doanh nghiệp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/admin" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Quản trị hệ thống
            </a>
            <a 
              href="/employee" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors border border-blue-500"
            >
              Dashboard nhân viên
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-blue-400 mr-2" />
              <span className="text-lg font-semibold">Face Attendance System</span>
            </div>
            <p className="text-gray-400">
              Hệ thống chấm công thông minh với công nghệ nhận diện khuôn mặt tiên tiến
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
