import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Check, X, Eye } from 'lucide-react';
import api, { leaveService } from '../services/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import FeatureGuard from './FeatureGuard';

const LeaveRequest = () => {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    type: 'vacation'
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await api.leave.getRequests();
      setRequests(response.data.requests || []);
    } catch (error) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.leave.request(formData);
      
      if (response.data.success) {
        toast.success('Leave request submitted successfully');
        setShowForm(false);
        setFormData({
          start_date: '',
          end_date: '',
          reason: '',
          type: 'vacation'
        });
        fetchLeaveRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit leave request');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'yellow', text: 'Pending', icon: Clock },
      approved: { color: 'green', text: 'Approved', icon: Check },
      rejected: { color: 'red', text: 'Rejected', icon: X }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`status-badge status-${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  };

  const calculateDays = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <FeatureGuard feature="leave_requests">
      <div className="leave-request-container">
        <div className="leave-header">
          <div>
            <h1>Leave Requests</h1>
            <p>Manage your time off requests</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="new-request-btn"
          >
            <Plus size={20} />
            New Request
          </button>
        </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-overlay" onClick={() => setShowForm(false)}></div>
          <div className="form-content">
            <h2>Submit Leave Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Leave Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Start Date</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_date">End Date</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reason">Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="Please provide a reason for your leave request..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="requests-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading leave requests...</p>
          </div>
        ) : requests.length > 0 ? (
          <div className="requests-grid">
            {requests.map((request, index) => (
              <div key={index} className="request-card">
                <div className="request-header">
                  <div className="request-type">
                    <Calendar size={20} />
                    {request.type?.charAt(0).toUpperCase() + request.type?.slice(1) || 'Leave'}
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="request-dates">
                  <div className="date-range">
                    <strong>{format(parseISO(request.start_date), 'MMM dd, yyyy')}</strong>
                    <span>to</span>
                    <strong>{format(parseISO(request.end_date), 'MMM dd, yyyy')}</strong>
                  </div>
                  <div className="duration">
                    {calculateDays(request.start_date, request.end_date)} day(s)
                  </div>
                </div>

                <div className="request-reason">
                  <p>{request.reason}</p>
                </div>

                <div className="request-footer">
                  <div className="request-meta">
                    <span>Submitted: {format(parseISO(request.created_at), 'MMM dd, yyyy')}</span>
                    {request.approved_at && (
                      <span>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}: {format(parseISO(request.approved_at), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Calendar size={64} />
            <h3>No leave requests</h3>
            <p>You haven't submitted any leave requests yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="empty-action-btn"
            >
              Submit Your First Request
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .leave-request-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .leave-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .leave-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .leave-header p {
          color: #6b7280;
          margin: 0;
        }

        .new-request-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .new-request-btn:hover {
          background: #2563eb;
        }

        .form-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .form-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .form-content {
          position: relative;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 1.5rem 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn-cancel,
        .btn-submit {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
        }

        .btn-cancel:hover {
          background: #4b5563;
        }

        .btn-submit {
          background: #3b82f6;
          color: white;
        }

        .btn-submit:hover {
          background: #2563eb;
        }

        .requests-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .requests-grid {
          display: grid;
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .request-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          transition: border-color 0.2s;
        }

        .request-card:hover {
          border-color: #d1d5db;
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .request-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-yellow {
          background: #fef3c7;
          color: #92400e;
        }

        .status-green {
          background: #d1fae5;
          color: #065f46;
        }

        .status-red {
          background: #fecaca;
          color: #991b1b;
        }

        .request-dates {
          margin-bottom: 1rem;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .date-range span {
          color: #6b7280;
        }

        .duration {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .request-reason {
          margin-bottom: 1rem;
        }

        .request-reason p {
          color: #374151;
          margin: 0;
          line-height: 1.5;
        }

        .request-footer {
          border-top: 1px solid #f3f4f6;
          padding-top: 1rem;
        }

        .request-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .request-meta span {
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
          margin: 0 0 1.5rem 0;
        }

        .empty-action-btn {
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .empty-action-btn:hover {
          background: #2563eb;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .leave-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
      </div>
    </FeatureGuard>
  );
};

export default LeaveRequest;
