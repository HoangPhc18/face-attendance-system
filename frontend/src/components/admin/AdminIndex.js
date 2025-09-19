import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminIndex = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Redirect to admin dashboard
  return <Navigate to="/admin/dashboard" replace />;
};

export default AdminIndex;
