import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import apiService from '../../services/apiService';
import networkService from '../../services/networkService';

const ApiIntegrationTest = () => {
  const [tests, setTests] = useState([
    { name: 'Backend Connection', status: 'pending', message: '', endpoint: '/api/health' },
    { name: 'Network Detection', status: 'pending', message: '', endpoint: '/api/network/status' },
    { name: 'Authentication Login', status: 'pending', message: '', endpoint: '/api/auth/login' },
    { name: 'Face Attendance', status: 'pending', message: '', endpoint: '/api/attendance/status' },
    { name: 'Admin Dashboard', status: 'pending', message: '', endpoint: '/api/admin/stats' },
    { name: 'Face Enrollment', status: 'pending', message: '', endpoint: '/api/face_enrollment/pending' },
    { name: 'Leave Requests', status: 'pending', message: '', endpoint: '/api/leave/list' },
    { name: 'Reports API', status: 'pending', message: '', endpoint: '/api/reports/attendance' },
  ]);

  const updateTestStatus = (index, status, message) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message } : test
    ));
  };

  const runTest = async (testIndex, testName, testFunction) => {
    updateTestStatus(testIndex, 'running', 'Testing...');
    try {
      const result = await testFunction();
      updateTestStatus(testIndex, 'success', result.message || 'Connected successfully');
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Connection failed';
      updateTestStatus(testIndex, 'error', errorMsg);
    }
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/health`);
      if (response.ok) {
        const data = await response.json();
        return { message: `Backend online: ${data.status || 'OK'}` };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      throw new Error('Backend not responding');
    }
  };

  const testNetworkDetection = async () => {
    const networkStatus = await networkService.getNetworkStatus();
    return { 
      message: `Network: ${networkStatus.type} (${networkStatus.isInternal ? 'Internal' : 'External'})` 
    };
  };

  const testAuthentication = async () => {
    try {
      // Test with demo admin credentials
      const response = await apiService.auth.login({
        username: 'admin',
        password: 'admin123'
      });
      
      if (response.token && response.user) {
        // Clean up - logout after test
        await apiService.auth.logout();
        return { message: `Login successful: ${response.user.username} (${response.user.role})` };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      throw new Error(`Auth failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const testFaceAttendance = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/attendance/status`);
      if (response.ok) {
        return { message: 'Face attendance API accessible' };
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      throw new Error('Face attendance API not accessible');
    }
  };

  const testAdminDashboard = async () => {
    try {
      // Login first to get token
      const loginResponse = await apiService.auth.login({
        username: 'admin',
        password: 'admin123'
      });
      
      const response = await apiService.api.get('/api/admin/stats');
      
      // Logout after test
      await apiService.auth.logout();
      
      return { message: 'Admin dashboard API accessible' };
    } catch (error) {
      throw new Error(`Admin API failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const testFaceEnrollment = async () => {
    try {
      // Login as admin first
      const loginResponse = await apiService.auth.login({
        username: 'admin',
        password: 'admin123'
      });
      
      const response = await apiService.api.get('/api/face_enrollment/pending');
      
      // Logout after test
      await apiService.auth.logout();
      
      return { message: 'Face enrollment API accessible' };
    } catch (error) {
      throw new Error(`Face enrollment failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const testLeaveRequests = async () => {
    try {
      const loginResponse = await apiService.auth.login({
        username: 'admin',
        password: 'admin123'
      });
      
      const response = await apiService.api.get('/api/leave/list');
      
      await apiService.auth.logout();
      
      return { message: 'Leave requests API accessible' };
    } catch (error) {
      throw new Error(`Leave API failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const testReportsAPI = async () => {
    try {
      const loginResponse = await apiService.auth.login({
        username: 'admin',
        password: 'admin123'
      });
      
      const response = await apiService.api.get('/api/reports/attendance', {
        params: { limit: 1 }
      });
      
      await apiService.auth.logout();
      
      return { message: 'Reports API accessible' };
    } catch (error) {
      throw new Error(`Reports API failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const runAllTests = async () => {
    const testFunctions = [
      testBackendConnection,
      testNetworkDetection,
      testAuthentication,
      testFaceAttendance,
      testAdminDashboard,
      testFaceEnrollment,
      testLeaveRequests,
      testReportsAPI
    ];

    for (let i = 0; i < testFunctions.length; i++) {
      await runTest(i, tests[i].name, testFunctions[i]);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            API Integration Test
          </h2>
          <p className="text-gray-600 mt-1">
            Test kết nối giữa Frontend và Backend APIs
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={runAllTests}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Chạy tất cả test
            </button>
          </div>

          <div className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-500">{test.endpoint}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const testFunctions = [
                        testBackendConnection,
                        testNetworkDetection,
                        testAuthentication,
                        testFaceAttendance,
                        testAdminDashboard,
                        testFaceEnrollment,
                        testLeaveRequests,
                        testReportsAPI
                      ];
                      runTest(index, test.name, testFunctions[index]);
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Test riêng
                  </button>
                </div>
                {test.message && (
                  <div className="mt-2 text-sm text-gray-700">
                    {test.message}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Hướng dẫn:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Đảm bảo backend đang chạy trên http://localhost:5000</li>
              <li>• Kiểm tra database đã được setup và có dữ liệu admin</li>
              <li>• Test sẽ sử dụng tài khoản demo: admin/admin123</li>
              <li>• Các test yêu cầu authentication sẽ tự động login/logout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiIntegrationTest;
