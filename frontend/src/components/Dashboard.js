import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Calendar, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import api, { attendanceService, reportsService, statisticsService } from '../services/api';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    totalDays: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance stats
      const statsResponse = await api.statistics.getOverview();
      setStats(statsResponse.data);

      // Fetch recent attendance history
      const historyResponse = await api.attendance.getHistory({
        limit: 5,
        sort: 'desc'
      });
      setRecentAttendance(historyResponse.data.records || []);
      
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  const AttendanceRow = ({ record }) => (
    <div className="attendance-row">
      <div className="attendance-date">
        {format(new Date(record.checkin_time), 'MMM dd')}
      </div>
      <div className="attendance-times">
        <div className="checkin-time">
          <CheckCircle size={16} className="checkin-icon" />
          {format(new Date(record.checkin_time), 'HH:mm')}
        </div>
        {record.checkout_time && (
          <div className="checkout-time">
            <XCircle size={16} className="checkout-icon" />
            {format(new Date(record.checkout_time), 'HH:mm')}
          </div>
        )}
      </div>
      <div className="attendance-hours">
        {record.total_hours ? `${record.total_hours}h` : 'In progress'}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.full_name || user?.username}!</h1>
        <p>Here's your attendance overview</p>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={Clock}
          title="Today"
          value={`${stats.todayHours}h`}
          subtitle="Hours worked"
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="This Week"
          value={`${stats.weekHours}h`}
          subtitle="Total hours"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="This Month"
          value={`${stats.monthHours}h`}
          subtitle="Monthly total"
          color="purple"
        />
        <StatCard
          icon={Users}
          title="Working Days"
          value={stats.totalDays}
          subtitle="This month"
          color="orange"
        />
      </div>

      <div className="dashboard-content">
        <div className="recent-attendance">
          <h2>Recent Attendance</h2>
          <div className="attendance-list">
            {recentAttendance.length > 0 ? (
              recentAttendance.map((record, index) => (
                <AttendanceRow key={index} record={record} />
              ))
            ) : (
              <div className="no-data">
                <Clock size={48} />
                <p>No attendance records found</p>
              </div>
            )}
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => window.location.href = '/checkin'}
            >
              <Clock size={20} />
              Check In/Out
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => window.location.href = '/attendance'}
            >
              <Calendar size={20} />
              View History
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => window.location.href = '/leave'}
            >
              <Users size={20} />
              Request Leave
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .dashboard-header p {
          color: #6b7280;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
        }

        .stat-card-blue {
          border-left-color: #3b82f6;
        }

        .stat-card-green {
          border-left-color: #059669;
        }

        .stat-card-purple {
          border-left-color: #7c3aed;
        }

        .stat-card-orange {
          border-left-color: #ea580c;
        }

        .stat-icon {
          padding: 0.75rem;
          border-radius: 8px;
          background: #f3f4f6;
        }

        .stat-card-blue .stat-icon {
          background: #dbeafe;
          color: #3b82f6;
        }

        .stat-card-green .stat-icon {
          background: #d1fae5;
          color: #059669;
        }

        .stat-card-purple .stat-icon {
          background: #e9d5ff;
          color: #7c3aed;
        }

        .stat-card-orange .stat-icon {
          background: #fed7aa;
          color: #ea580c;
        }

        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
        }

        .stat-subtitle {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .recent-attendance,
        .quick-actions {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .recent-attendance h2,
        .quick-actions h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1rem 0;
        }

        .attendance-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .attendance-row {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .attendance-date {
          font-weight: 600;
          color: #374151;
          min-width: 60px;
        }

        .attendance-times {
          display: flex;
          gap: 1rem;
        }

        .checkin-time,
        .checkout-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
        }

        .checkin-icon {
          color: #059669;
        }

        .checkout-icon {
          color: #dc2626;
        }

        .attendance-hours {
          font-weight: 600;
          color: #1f2937;
          text-align: right;
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .no-data svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2563eb;
        }

        .action-btn.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .action-btn.secondary:hover {
          background: #e5e7eb;
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #6b7280;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-content {
            grid-template-columns: 1fr;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
