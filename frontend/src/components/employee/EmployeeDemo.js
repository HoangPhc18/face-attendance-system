import React, { useState } from 'react';
import UnifiedEmployeeDashboard from './UnifiedEmployeeDashboard';
import { AuthProvider } from '../../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { 
  Wifi, 
  WifiOff, 
  User, 
  Shield,
  Settings,
  RefreshCw
} from 'lucide-react';

// Mock user data for demo
const mockUsers = {
  internal_employee: {
    id: 1,
    username: 'john_doe',
    full_name: 'John Doe',
    email: 'john@company.com',
    role: 'user'
  },
  external_employee: {
    id: 2,
    username: 'jane_smith',
    full_name: 'Jane Smith',
    email: 'jane@company.com',
    role: 'user'
  },
  admin: {
    id: 3,
    username: 'admin',
    full_name: 'System Admin',
    email: 'admin@company.com',
    role: 'admin'
  }
};

// Mock AuthContext for demo
const MockAuthProvider = ({ children, user, networkType }) => {
  const mockAuthValue = {
    user: user,
    isAuthenticated: true,
    isAdmin: user?.role === 'admin',
    login: (userData, token) => {
      console.log('Mock login:', userData);
    },
    logout: () => {
      console.log('Mock logout');
    },
    networkType: networkType
  };

  return (
    <div>
      {children({ ...mockAuthValue })}
    </div>
  );
};

const EmployeeDemo = () => {
  const [selectedUser, setSelectedUser] = useState('internal_employee');
  const [networkType, setNetworkType] = useState('internal');
  const [showControls, setShowControls] = useState(true);

  const currentUser = mockUsers[selectedUser];

  const DemoControls = () => (
    <div className={`fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border transition-transform ${
      showControls ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Demo Controls</h3>
        <button
          onClick={() => setShowControls(!showControls)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User Type:
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="internal_employee">Internal Employee</option>
            <option value="external_employee">External Employee</option>
            <option value="admin">Admin User</option>
          </select>
        </div>

        {/* Network Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network Type:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setNetworkType('internal')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md ${
                networkType === 'internal'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              <Wifi className="w-4 h-4" />
              Internal
            </button>
            <button
              onClick={() => setNetworkType('external')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md ${
                networkType === 'external'
                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              <WifiOff className="w-4 h-4" />
              External
            </button>
          </div>
        </div>

        {/* Current User Info */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            {currentUser.role === 'admin' ? (
              <Shield className="w-4 h-4 text-red-600" />
            ) : (
              <User className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {currentUser.full_name}
            </span>
          </div>
          <p className="text-xs text-gray-500">@{currentUser.username}</p>
          <p className="text-xs text-gray-500">{currentUser.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <div className={`w-2 h-2 rounded-full ${
              networkType === 'internal' ? 'bg-green-500' : 'bg-orange-500'
            }`}></div>
            <span className="text-xs text-gray-500">
              {networkType === 'internal' ? 'Internal Network' : 'External Network'}
            </span>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Demo
        </button>
      </div>
    </div>
  );

  const ControlsToggle = () => (
    <button
      onClick={() => setShowControls(!showControls)}
      className={`fixed top-4 right-4 z-50 p-3 bg-white rounded-full shadow-lg border transition-transform ${
        showControls ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <Settings className="w-5 h-5 text-gray-600" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-blue-600 text-white px-4 py-2 text-center text-sm">
        🚀 Employee Interface Demo - Network: {networkType} | User: {currentUser.full_name} ({currentUser.role})
      </div>

      {/* Demo Controls */}
      <DemoControls />
      <ControlsToggle />

      {/* Main Dashboard */}
      <MockAuthProvider user={currentUser} networkType={networkType}>
        {(authValue) => (
          <AuthProvider value={authValue}>
            <UnifiedEmployeeDashboard />
          </AuthProvider>
        )}
      </MockAuthProvider>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  );
};

export default EmployeeDemo;
