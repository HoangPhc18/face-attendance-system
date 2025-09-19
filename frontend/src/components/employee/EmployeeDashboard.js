import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import ExternalDashboard from './ExternalDashboard';
import ExternalProfile from './ExternalProfile';
import { 
  Home, 
  User, 
  Settings, 
  LogOut,
  WifiOff,
  Wifi,
  Menu,
  X
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [networkType, setNetworkType] = useState('checking');
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkNetworkType();
  }, []);

  const checkNetworkType = async () => {
    try {
      const response = await apiService.getNetworkFeatures();
      if (response.success) {
        setNetworkType(response.data.network_type);
      }
    } catch (error) {
      console.error('Failed to check network type:', error);
      setNetworkType('external'); // Default to external if check fails
    } finally {
      setIsLoading(false);
    }
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'profile', name: 'Thông tin cá nhân', icon: User },
  ];

  const NetworkStatus = () => (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      networkType === 'internal' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-orange-100 text-orange-800'
    }`}>
      {networkType === 'internal' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
      <span className="text-sm font-medium">
        {networkType === 'internal' ? 'Mạng nội bộ' : 'Mạng ngoại bộ'}
      </span>
    </div>
  );

  const Sidebar = () => (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full'
    } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Nhân viên</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  currentView === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="px-3 mb-4">
            <NetworkStatus />
          </div>
          
          <div className="space-y-1">
            <div className="px-3 py-2">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">@{user?.username}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
    </div>
  );

  const renderContent = () => {
    if (networkType === 'internal') {
      // For internal network, redirect to full dashboard (if exists)
      // For now, show external dashboard with more features
      switch (currentView) {
        case 'profile':
          return <ExternalProfile />;
        default:
          return <ExternalDashboard />;
      }
    } else {
      // External network - limited features
      switch (currentView) {
        case 'profile':
          return <ExternalProfile />;
        default:
          return <ExternalDashboard />;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <NetworkStatus />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
