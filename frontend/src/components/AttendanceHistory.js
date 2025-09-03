import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Download, Filter, Search } from 'lucide-react';
import api, { attendanceService, reportsService } from '../services/api';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useNetwork } from '../contexts/NetworkContext';
import FeatureGuard from './FeatureGuard';

const AttendanceHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    fetchAttendanceHistory();
  }, [filters, pagination.page]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const response = await api.attendance.getHistory({
        start_date: filters.startDate,
        end_date: filters.endDate,
        search: filters.search,
        page: pagination.page,
        limit: pagination.limit
      });

      setRecords(response.data.records || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToExcel = async () => {
    try {
      const response = await api.reports.exportAttendance({
        start_date: filters.startDate,
        end_date: filters.endDate,
        format: 'excel'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${filters.startDate}_${filters.endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Attendance data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const calculateTotalHours = (checkinTime, checkoutTime) => {
    if (!checkoutTime) return 'In progress';
    
    const checkin = parseISO(checkinTime);
    const checkout = parseISO(checkoutTime);
    const diffMs = checkout - checkin;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (record) => {
    if (!record.checkout_time) {
      return <span className="status-badge status-active">Active</span>;
    }
    
    const totalMs = parseISO(record.checkout_time) - parseISO(record.checkin_time);
    const hours = totalMs / (1000 * 60 * 60);
    
    if (hours >= 8) {
      return <span className="status-badge status-complete">Complete</span>;
    } else {
      return <span className="status-badge status-partial">Partial</span>;
    }
  };

  return (
    <FeatureGuard feature="attendance_history">
      <div className="attendance-history-container">
        <div className="history-header">
          <h1>Attendance History</h1>
          <p>View and manage your attendance records</p>
        </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Search</label>
            <div className="search-input">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search records..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          <div className="filter-actions">
            <button onClick={exportToExcel} className="export-btn">
              <Download size={20} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="records-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading attendance records...</p>
          </div>
        ) : records.length > 0 ? (
          <>
            <div className="records-table">
              <div className="table-header">
                <div>Date</div>
                <div>Check In</div>
                <div>Check Out</div>
                <div>Total Hours</div>
                <div>Status</div>
              </div>
              {records.map((record, index) => (
                <div key={index} className="table-row">
                  <div className="date-cell">
                    <Calendar size={16} />
                    {format(parseISO(record.checkin_time), 'MMM dd, yyyy')}
                  </div>
                  <div className="time-cell">
                    <Clock size={16} />
                    {format(parseISO(record.checkin_time), 'HH:mm')}
                  </div>
                  <div className="time-cell">
                    {record.checkout_time ? (
                      <>
                        <Clock size={16} />
                        {format(parseISO(record.checkout_time), 'HH:mm')}
                      </>
                    ) : (
                      <span className="no-checkout">--</span>
                    )}
                  </div>
                  <div className="hours-cell">
                    {calculateTotalHours(record.checkin_time, record.checkout_time)}
                  </div>
                  <div className="status-cell">
                    {getStatusBadge(record)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Calendar size={64} />
            <h3>No attendance records found</h3>
            <p>No records match your current filters</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .attendance-history-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .history-header {
          margin-bottom: 2rem;
        }

        .history-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .history-header p {
          color: #6b7280;
          margin: 0;
        }

        .filters-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .filters-row {
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          gap: 1rem;
          align-items: end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .filter-group input {
          padding: 0.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .filter-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .search-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input svg {
          position: absolute;
          left: 0.75rem;
          color: #6b7280;
          z-index: 1;
        }

        .search-input input {
          padding-left: 2.5rem;
          width: 250px;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .export-btn:hover {
          background: #047857;
        }

        .records-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .records-table {
          display: flex;
          flex-direction: column;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr auto;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr auto;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .date-cell,
        .time-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #374151;
        }

        .hours-cell {
          font-weight: 600;
          color: #1f2937;
        }

        .no-checkout {
          color: #9ca3af;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-active {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .status-complete {
          background: #d1fae5;
          color: #065f46;
        }

        .status-partial {
          background: #fef3c7;
          color: #92400e;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .pagination-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
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

        .empty-state svg {
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: #374151;
        }

        .empty-state p {
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .filters-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .search-input input {
            width: 100%;
          }
        }
      `}</style>
      </div>
    </FeatureGuard>
  );
};

export default AttendanceHistory;
