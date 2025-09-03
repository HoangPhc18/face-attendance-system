import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock } from 'lucide-react';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-danger-100">
            <Lock className="h-6 w-6 text-danger-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng ký tài khoản
          </h2>
        </div>

        {/* Registration Disabled Message */}
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-danger-600 mt-1 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-danger-800 mb-2">
                Đăng ký tài khoản đã bị vô hiệu hóa
              </h3>
              <p className="text-danger-700 mb-4">
                Hệ thống không cho phép tự đăng ký tài khoản. Chỉ quản trị viên mới có thể tạo tài khoản mới cho nhân viên.
              </p>
              <div className="text-sm text-danger-600">
                <p className="font-medium mb-1">Để được cấp tài khoản:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Liên hệ với quản trị viên hệ thống</li>
                  <li>Cung cấp thông tin cá nhân và bộ phận làm việc</li>
                  <li>Chờ quản trị viên tạo tài khoản và cấp thông tin đăng nhập</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            ← Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
