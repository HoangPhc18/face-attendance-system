import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  TrendingUp, 
  Camera, 
  FileText, 
  Coffee,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import NetworkBanner from './NetworkBanner';
import NetworkStatus from './NetworkStatus';
import FeatureGuard from './FeatureGuard';
import { attendanceService, networkService } from '../services/api';

const EnhancedDashboard = () => {
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    totalHours: 0
  });
  const [networkInfo, setNetworkInfo] = useState(null);
  const [features, setFeatures] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [networkResponse, featuresResponse, attendanceResponse] = await Promise.all([
          networkService.getStatus(),
          networkService.getFeatures(),
          attendanceService.getTodayStatus()
        ]);
        
        setNetworkInfo(networkResponse.data);
        setFeatures(featuresResponse.data.features);
        setTodayAttendance(attendanceResponse.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const QuickActionCard = ({ title, icon: Icon, onClick, disabled, disabledReason }) => (
    <div 
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        disabled 
          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          disabled ? 'bg-gray-200' : 'bg-blue-100'
        }`}>
          <Icon className={`h-5 w-5 ${
            disabled ? 'text-gray-400' : 'text-blue-600'
          }`} />
        </div>
        <div>
          <h3 className={`font-semibold ${
            disabled ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {title}
          </h3>
          {disabled && (
            <p className="text-xs text-red-500 mt-1">{disabledReason}</p>
          )}
        </div>
      </div>
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const AttendanceStatusCard = () => {
    if (!todayAttendance) return null;

    const isCheckedIn = todayAttendance.check_in_time && !todayAttendance.check_out_time;
    const isCompleted = todayAttendance.check_in_time && todayAttendance.check_out_time;

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Check-in</span>
            <div className="flex items-center space-x-2">
              {todayAttendance.check_in_time ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {new Date(todayAttendance.check_in_time).toLocaleTimeString()}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Not checked in</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Check-out</span>
            <div className="flex items-center space-x-2">
              {todayAttendance.check_out_time ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {new Date(todayAttendance.check_out_time).toLocaleTimeString()}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Not checked out</span>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isCompleted 
                  ? 'bg-green-100 text-green-800'
                  : isCheckedIn
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isCompleted ? 'Completed' : isCheckedIn ? 'Working' : 'Not started'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 rounded-full border-t-blue-600"></div>
      </div>
    );
  }

  const isInternal = networkInfo?.is_internal_network;
  const canAttendance = features?.face_attendance;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
              <NetworkStatus />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NetworkBanner />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today"
            value={`${stats.todayHours}h`}
            icon={Clock}
            color="blue"
          />
          <StatCard
            title="This Week"
            value={`${stats.weekHours}h`}
            icon={Calendar}
            color="green"
          />
          <StatCard
            title="This Month"
            value={`${stats.monthHours}h`}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Total Hours"
            value={`${stats.totalHours}h`}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <QuickActionCard
                title="Face Check-in"
                icon={Camera}
                disabled={!canAttendance}
                disabledReason={!isInternal ? "External network blocked" : "Feature unavailable"}
                onClick={() => window.location.href = '/checkin'}
              />
              <QuickActionCard
                title="View History"
                icon={Calendar}
                onClick={() => window.location.href = '/attendance'}
              />
              <QuickActionCard
                title="Leave Request"
                icon={Coffee}
                onClick={() => window.location.href = '/leave'}
              />
              <QuickActionCard
                title="Reports"
                icon={FileText}
                onClick={() => window.location.href = '/reports'}
              />
            </div>

            {/* Network Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network Type</span>
                  <div className="flex items-center space-x-2">
                    {isInternal ? (
                      <>
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Internal</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-600">External</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">IP Address</span>
                  <span className="text-sm font-medium">{networkInfo?.client_ip}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Face Attendance</span>
                  <span className={`text-sm font-medium ${
                    canAttendance ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {canAttendance ? 'Available' : 'Blocked'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Today's Status */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h2>
            <AttendanceStatusCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
