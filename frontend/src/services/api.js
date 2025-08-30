import axios from 'axios';

// Configure base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth service
export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  logout: () => api.post('/api/auth/logout'),
  getCurrentUser: () => api.get('/api/auth/me'),
  verify: () => api.get('/api/auth/verify'),
};

// Attendance service
export const attendanceService = {
  checkIn: (data) => api.post('/api/attendance/check-in', data),
  checkOut: (data) => api.post('/api/attendance/check-out', data),
  getHistory: (params) => api.get('/api/attendance/history', { params }),
  getTodayStatus: (userId) => api.get('/api/attendance/extended/status', { params: { user_id: userId } }),
  getSummary: (params) => api.get('/api/attendance/extended/summary', { params }),
  manualEntry: (data) => api.post('/api/attendance/extended/manual-entry', data),
  bulkUpdate: (data) => api.post('/api/attendance/extended/bulk-update', data),
};

// Face enrollment service
export const faceEnrollmentService = {
  enroll: (data) => api.post('/api/face_enrollment/enroll', data),
  register: (data) => api.post('/api/face_enrollment/register', data),
  getPending: () => api.get('/api/face_enrollment/pending'),
  approvePending: (id, data) => api.post(`/api/face_enrollment/approve/${id}`, data),
  rejectPending: (id) => api.delete(`/api/face_enrollment/pending/${id}`),
  bulkRegister: (data) => api.post('/api/face_enrollment/extended/bulk-register', data),
  getStats: () => api.get('/api/face_enrollment/extended/stats'),
  manageFaces: (params) => api.get('/api/face_enrollment/extended/manage', { params }),
};

// Leave request service
export const leaveService = {
  create: (data) => api.post('/api/leave/request', data),
  getAll: (params) => api.get('/api/leave/requests', { params }),
  getById: (id) => api.get(`/api/leave/requests/${id}`),
  approve: (id) => api.put(`/api/leave/approve/${id}`),
  reject: (id, data) => api.put(`/api/leave/reject/${id}`, data),
  cancel: (id) => api.delete(`/api/leave/requests/${id}`),
};

// Reports service
export const reportsService = {
  getAttendance: (params) => api.get('/api/reports/attendance', { params }),
  getSalary: (params) => api.get('/api/reports/salary', { params }),
  getDashboard: (params) => api.get('/api/reports/dashboard', { params }),
  exportAttendance: (params) => api.get('/api/reports/export/attendance', { params }),
  exportSalary: (params) => api.get('/api/reports/export/salary', { params }),
};

// Statistics service
export const statisticsService = {
  getMonthly: (params) => api.get('/api/statistics/monthly', { params }),
  getTrends: (params) => api.get('/api/statistics/trends', { params }),
  getPerformance: (params) => api.get('/api/statistics/performance', { params }),
  getOverview: () => api.get('/api/statistics/overview'),
};

// Network service
export const networkService = {
  getStatus: () => api.get('/api/network/status'),
  getConfig: () => api.get('/api/network/config'),
  getFeatures: () => api.get('/api/restrictions/features'),
  getAccessPolicy: () => api.get('/api/restrictions/policy'),
  checkAccess: (feature) => api.get(`/api/restrictions/check-access/${feature}`),
};

// Admin service
export const adminService = {
  getUsers: (params) => api.get('/api/admin/users', { params }),
  createUser: (data) => api.post('/api/admin/users', data),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  getSystemStats: () => api.get('/api/admin/stats'),
  getUserStats: (id) => api.get(`/api/admin/users/${id}/stats`),
  resetPassword: (id, data) => api.post(`/api/admin/users/${id}/reset-password`, data),
};

// AI service
export const aiService = {
  chat: (data) => api.post('/api/ai/chat', data),
  calculateSalary: (params) => api.get('/api/ai/salary', { params }),
  generateReport: (data) => api.post('/api/ai/report', data),
};

// Notifications service
export const notificationsService = {
  getAll: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  create: (data) => api.post('/api/notifications', data),
  broadcast: (data) => api.post('/api/notifications/broadcast', data),
};

// Uploads service
export const uploadsService = {
  uploadImage: (formData) => api.post('/api/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFiles: (params) => api.get('/api/uploads/files', { params }),
  deleteFile: (id) => api.delete(`/api/uploads/files/${id}`),
  downloadFile: (id) => api.get(`/api/uploads/files/${id}/download`),
  cleanup: () => api.post('/api/uploads/cleanup'),
};

// Liveness detection service
export const livenessService = {
  checkImage: (data) => api.post('/api/liveness/check_image', data),
  checkFrames: (data) => api.post('/api/liveness/check_frames', data),
  getStatus: () => api.get('/api/liveness/status'),
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if not already on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
