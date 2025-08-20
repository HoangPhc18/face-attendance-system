import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      password: '' // Don't pre-fill password
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      const updateData = {
        full_name: editingUser.full_name,
        email: editingUser.email,
        role: editingUser.role
      };
      
      if (editingUser.password) {
        updateData.password = editingUser.password;
      }

      await api.admin.updateUser(editingUser.id, updateData);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await api.admin.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <div>
          <h1>User Management</h1>
          <p>Manage system users and permissions</p>
        </div>
        <button
          onClick={() => window.location.href = '/enroll'}
          className="add-user-btn"
        >
          <UserPlus size={20} />
          Add New User
        </button>
      </div>

      <div className="filters-section">
        <div className="search-filter">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="role-filter">
          <Filter size={20} />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {editingUser && (
        <div className="edit-modal">
          <div className="modal-overlay" onClick={() => setEditingUser(null)}></div>
          <div className="modal-content">
            <h2>Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setEditingUser(null)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="users-table">
            <div className="table-header">
              <div>User</div>
              <div>Email</div>
              <div>Role</div>
              <div>Created</div>
              <div>Actions</div>
            </div>
            {filteredUsers.map((user) => (
              <div key={user.id} className="table-row">
                <div className="user-cell">
                  <div className="user-avatar">
                    {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.full_name || user.username}</div>
                    <div className="username">@{user.username}</div>
                  </div>
                </div>
                <div className="email-cell">{user.email}</div>
                <div className="role-cell">
                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>
                </div>
                <div className="date-cell">
                  {user.created_at ? format(parseISO(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                </div>
                <div className="actions-cell">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="action-btn edit-btn"
                    title="Edit user"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="action-btn delete-btn"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Users size={64} />
            <h3>No users found</h3>
            <p>No users match your current filters</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-panel-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .admin-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .admin-header p {
          color: #6b7280;
          margin: 0;
        }

        .add-user-btn {
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

        .add-user-btn:hover {
          background: #2563eb;
        }

        .filters-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .search-filter,
        .role-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
        }

        .search-filter input,
        .role-filter select {
          padding: 0.5rem 0.5rem 0.5rem 2.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.875rem;
          min-width: 200px;
        }

        .search-filter svg,
        .role-filter svg {
          position: absolute;
          left: 0.75rem;
          color: #6b7280;
          z-index: 1;
        }

        .edit-modal {
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

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
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

        .modal-content h2 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .disabled-input {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn-cancel,
        .btn-save {
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

        .btn-save {
          background: #3b82f6;
          color: white;
        }

        .btn-save:hover {
          background: #2563eb;
        }

        .users-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .users-table {
          display: flex;
          flex-direction: column;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        .username {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .email-cell {
          display: flex;
          align-items: center;
          color: #374151;
        }

        .role-cell {
          display: flex;
          align-items: center;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .role-admin {
          background: #fef3c7;
          color: #92400e;
        }

        .role-user {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .date-cell {
          display: flex;
          align-items: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .actions-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-btn {
          background: #f3f4f6;
          color: #374151;
        }

        .edit-btn:hover {
          background: #e5e7eb;
        }

        .delete-btn {
          background: #fef2f2;
          color: #dc2626;
        }

        .delete-btn:hover {
          background: #fecaca;
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
          .admin-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .filters-section {
            flex-direction: column;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .search-filter input,
          .role-filter select {
            min-width: auto;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
