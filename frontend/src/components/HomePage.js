import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, 
  LogIn, 
  Shield
} from 'lucide-react';
import { networkService } from '../services/api';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAttendanceClick = async () => {
    setLoading(true);
    
    try {
      // Check network status in real-time when clicking attendance
      const response = await networkService.getStatus();
      console.log('Network response:', response); // Debug log
      
      const networkData = response.data?.data || response.data;
      console.log('Network data:', networkData); // Debug log
      
      if (networkData && networkData.is_internal === true) {
        // Internal network - allow direct attendance
        toast.success(`Internal network detected (${networkData.client_ip}). Redirecting to attendance check-in...`);
        navigate('/public-checkin');
      } else {
        // External network - redirect to login with message
        toast.error(`External network detected (${networkData?.client_ip || 'Unknown IP'}). Redirecting to login for other features.`);
        navigate('/login');
      }
    } catch (error) {
      console.error('Network check failed:', error);
      toast.error('Unable to verify network status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Face Attendance System</h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome, {user.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Face Attendance System
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure and efficient attendance management using facial recognition technology
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Attendance Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                Attendance Check-In
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                Quick face recognition check-in for employees
              </p>

              <button
                onClick={handleAttendanceClick}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking Network...' : 'Start Check-In'}
              </button>
            </div>
          </div>

          {/* Login/Dashboard Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
                <LogIn className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                {user ? 'Dashboard' : 'Employee Login'}
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                {user 
                  ? 'Access your dashboard and manage attendance'
                  : 'Login to access employee features and history'
                }
              </p>

              <button
                onClick={handleLoginClick}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 hover:shadow-md transition-all"
              >
                {user ? 'Go to Dashboard' : 'Employee Login'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 Face Attendance System. Secure attendance management solution.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
