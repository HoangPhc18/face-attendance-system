import axios from 'axios';

// Configure base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_BASE_URL;

// API service functions
export const api = {
  // Authentication
  auth: {
    login: (credentials) => axios.post('/api/auth/login', credentials),
    verify: () => axios.get('/api/auth/verify'),
  },

  // Face enrollment
  face: {
    enroll: (imageData) => axios.post('/api/face_enrollment/enroll', imageData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    registerUser: (userData) => axios.post('/api/face_enrollment/register', userData),
    getPendingFaces: () => axios.get('/api/face_enrollment/pending'),
  },

  // Attendance
  attendance: {
    checkIn: (imageData) => axios.post('/api/attendance/check', imageData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getHistory: (params) => axios.get('/api/attendance/history', { params }),
    getStats: () => axios.get('/api/attendance/stats'),
  },

  // Leave requests
  leave: {
    request: (leaveData) => axios.post('/api/leave/request', leaveData),
    approve: (requestId) => axios.post(`/api/leave/approve/${requestId}`),
    getRequests: () => axios.get('/api/leave/requests'),
  },

  // AI features
  ai: {
    calculateSalary: (data) => axios.post('/api/ai/calculate_salary', data),
    chatbot: (message) => axios.post('/api/ai/chatbot', { message }),
  },

  // Liveness Detection
  liveness: {
    checkImage: (imageData) => axios.post('/api/liveness/check_image', { image: imageData }),
    checkFrames: (framesData) => axios.post('/api/liveness/check_frames', { frames: framesData }),
    getStatus: () => axios.get('/api/liveness/status'),
  },

  // Admin
  admin: {
    getUsers: () => axios.get('/api/admin/users'),
    updateUser: (userId, userData) => axios.put(`/api/admin/users/${userId}`, userData),
    deleteUser: (userId) => axios.delete(`/api/admin/users/${userId}`),
  }
};

// Request interceptor to add auth token
axios.interceptors.request.use(
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
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export individual functions for backward compatibility
export const enrollFace = (imageData) => api.face.enroll(imageData);
export const registerUser = (userData) => api.face.registerUser(userData);
export const checkIn = (imageData) => api.attendance.checkIn(imageData);
export const checkLivenessImage = (imageData) => api.liveness.checkImage(imageData);
export const checkLivenessFrames = (framesData) => api.liveness.checkFrames(framesData);

export default api;
