import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/apiService';
import networkService from '../services/networkService';

// Auth Context for managing user authentication and authorization
const AuthContext = createContext();

// Auth actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  networkStatus: {
    type: 'external',
    isInternal: false,
    isExternal: true
  },
  permissions: {
    canAccessFaceAttendance: false,
    canManageFaceEnrollment: false,
    canAccessAdminPanel: false,
    canViewAllReports: false,
    canManageUsers: false,
    requiresAuth: true
  }
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      };

    case AUTH_ACTIONS.SET_NETWORK_STATUS:
      return {
        ...state,
        networkStatus: action.payload
      };

    case AUTH_ACTIONS.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Calculate permissions based on user role and network status
  const calculatePermissions = (user, networkStatus) => {
    const isAdmin = user?.role === 'admin';
    const isEmployee = user?.role === 'employee';
    const isInternal = networkStatus.isInternal;
    const isExternal = networkStatus.isExternal;

    return {
      // Face attendance: Only internal network, no auth required
      canAccessFaceAttendance: isInternal,
      
      // Face enrollment: Admin only, any network
      canManageFaceEnrollment: isAdmin,
      
      // Admin panel: Admin only, any network
      canAccessAdminPanel: isAdmin,
      
      // Reports: Internal free, External requires auth
      canViewAllReports: isAdmin,
      canViewOwnReports: isInternal || (isExternal && (isAdmin || isEmployee)),
      
      // User management: Admin only
      canManageUsers: isAdmin,
      
      // Leave requests: Internal free, External requires auth
      canManageLeaveRequests: isAdmin,
      canCreateLeaveRequests: isInternal || (isExternal && (isAdmin || isEmployee)),
      
      // Statistics: Role-based access
      canViewSystemStats: isAdmin,
      canViewPersonalStats: isInternal || (isExternal && (isAdmin || isEmployee)),
      
      // General auth requirement
      requiresAuth: isExternal,
      
      // Network-based restrictions
      networkRestrictions: {
        faceAttendanceBlocked: isExternal,
        authRequired: isExternal,
        limitedFeatures: isExternal
      }
    };
  };

  // Initialize network status and permissions
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Detect network type
        const networkData = await networkService.detectNetworkType();
        const networkStatus = {
          type: networkData.network_type,
          isInternal: networkData.network_type === 'internal',
          isExternal: networkData.network_type === 'external',
          ip: networkData.client_ip
        };

        dispatch({
          type: AUTH_ACTIONS.SET_NETWORK_STATUS,
          payload: networkStatus
        });

        // Calculate permissions
        const permissions = calculatePermissions(state.user, networkStatus);
        dispatch({
          type: AUTH_ACTIONS.SET_PERMISSIONS,
          payload: permissions
        });

      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Default to external network for security
        const networkStatus = {
          type: 'external',
          isInternal: false,
          isExternal: true,
          ip: null
        };

        dispatch({
          type: AUTH_ACTIONS.SET_NETWORK_STATUS,
          payload: networkStatus
        });

        const permissions = calculatePermissions(state.user, networkStatus);
        dispatch({
          type: AUTH_ACTIONS.SET_PERMISSIONS,
          payload: permissions
        });
      }
    };

    initializeAuth();
  }, []);

  // Update permissions when user or network changes
  useEffect(() => {
    const permissions = calculatePermissions(state.user, state.networkStatus);
    dispatch({
      type: AUTH_ACTIONS.SET_PERMISSIONS,
      payload: permissions
    });
  }, [state.user, state.networkStatus]);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      // Convert username to the format expected by backend
      const loginData = {
        username: credentials.username,
        password: credentials.password
      };
      
      const response = await apiService.auth.login(loginData);
      const { user, token } = response.data;
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_SUCCESS, 
        payload: { user, token } 
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: errorMessage 
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return state.permissions[permission] || false;
  };

  // Check if feature is available
  const isFeatureAvailable = (feature) => {
    return networkService.isFeatureAvailable(feature, state.user?.role);
  };

  // Get security warnings
  const getSecurityWarnings = () => {
    return networkService.getSecurityWarnings();
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    register,
    clearError,
    
    // Utilities
    hasPermission,
    isFeatureAvailable,
    getSecurityWarnings,
    
    // Computed values
    isAdmin: state.user?.role === 'admin',
    isEmployee: state.user?.role === 'employee',
    isInternalNetwork: state.networkStatus.isInternal,
    isExternalNetwork: state.networkStatus.isExternal
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
