import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Protected Route Component for role-based and network-based access control
const ProtectedRoute = ({ 
  children, 
  requireAuth = false,
  requireAdmin = false,
  requireInternal = false,
  feature = null,
  fallback = null 
}) => {
  const { 
    isAuthenticated, 
    isAdmin, 
    isInternalNetwork, 
    isExternalNetwork,
    hasPermission,
    isFeatureAvailable 
  } = useAuth();
  const location = useLocation();

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return fallback || <Navigate to="/unauthorized" replace />;
  }

  // Check internal network requirement
  if (requireInternal && !isInternalNetwork) {
    return fallback || <Navigate to="/network-restricted" replace />;
  }

  // Check specific feature availability
  if (feature && !isFeatureAvailable(feature)) {
    return fallback || <Navigate to="/feature-restricted" replace />;
  }

  // External network users need authentication for most features
  if (isExternalNetwork && !isAuthenticated && !requireInternal) {
    // Allow access to login/register pages
    const publicPaths = ['/login', '/register', '/'];
    if (!publicPaths.includes(location.pathname)) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
