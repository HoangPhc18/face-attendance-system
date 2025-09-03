import axios from 'axios';

// API Service for backend communication
class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.token = localStorage.getItem('token');
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication APIs
  async login(credentials) {
    const response = await this.api.post('/api/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async register(userData) {
    const response = await this.api.post('/api/auth/register', userData);
    return response.data;
  }

  // Network APIs
  async getNetworkStatus() {
    const response = await this.api.get('/api/network/status');
    return response.data;
  }

  async getAccessRestrictions() {
    const response = await this.api.get('/api/restrictions/features');
    return response.data;
  }

  // Face Attendance APIs (Internal Network Only)
  async faceCheckIn(imageData) {
    const response = await this.api.post('/api/attendance/check-in', {
      image: imageData
    });
    return response.data;
  }

  async faceCheckOut(imageData) {
    const response = await this.api.post('/api/attendance/check-out', {
      image: imageData
    });
    return response.data;
  }

  // Face Enrollment APIs (Admin Only)
  async enrollFace(faceData) {
    const response = await this.api.post('/api/face_enrollment/enroll', faceData);
    return response.data;
  }

  async registerFace(registrationData) {
    const response = await this.api.post('/api/face_enrollment/register', registrationData);
    return response.data;
  }

  async getPendingFaces() {
    const response = await this.api.get('/api/face_enrollment/pending');
    return response.data;
  }

  async approveFace(faceId, userData) {
    const response = await this.api.post(`/api/face_enrollment/approve/${faceId}`, userData);
    return response.data;
  }

  async rejectFace(faceId, reason) {
    const response = await this.api.post(`/api/face_enrollment/reject/${faceId}`, { reason });
    return response.data;
  }

  // Liveness Detection APIs
  async checkLiveness(imageData) {
    const response = await this.api.post('/api/liveness/check_image', {
      image: imageData
    });
    return response.data;
  }

  async checkLivenessFrames(frames) {
    const response = await this.api.post('/api/liveness/check_frames', {
      frames: frames
    });
    return response.data;
  }

  // Attendance APIs
  async getAttendanceHistory(params = {}) {
    const response = await this.api.get('/api/attendance/history', { params });
    return response.data;
  }

  async getUserAttendance(userId, params = {}) {
    const response = await this.api.get(`/api/attendance/user/${userId}`, { params });
    return response.data;
  }

  // Leave Request APIs
  async createLeaveRequest(leaveData) {
    const response = await this.api.post('/api/leave/create', leaveData);
    return response.data;
  }

  async getLeaveRequests(params = {}) {
    const response = await this.api.get('/api/leave/requests', { params });
    return response.data;
  }

  async approveLeaveRequest(requestId) {
    const response = await this.api.post(`/api/leave/approve/${requestId}`);
    return response.data;
  }

  async rejectLeaveRequest(requestId, reason) {
    const response = await this.api.post(`/api/leave/reject/${requestId}`, { reason });
    return response.data;
  }

  // Reports APIs
  async getAttendanceReport(params = {}) {
    const response = await this.api.get('/api/reports/attendance', { params });
    return response.data;
  }

  async getSalaryReport(params = {}) {
    const response = await this.api.get('/api/reports/salary', { params });
    return response.data;
  }

  async getDashboardStats() {
    const response = await this.api.get('/api/reports/dashboard');
    return response.data;
  }

  async exportReport(type, format, params = {}) {
    const response = await this.api.get(`/api/reports/export/${type}`, {
      params: { format, ...params },
      responseType: 'blob'
    });
    return response.data;
  }

  // Statistics APIs
  async getMonthlyStats(params = {}) {
    const response = await this.api.get('/api/statistics/monthly', { params });
    return response.data;
  }

  async getAttendanceTrends(params = {}) {
    const response = await this.api.get('/api/statistics/trends', { params });
    return response.data;
  }

  async getUserPerformance(params = {}) {
    const response = await this.api.get('/api/statistics/performance', { params });
    return response.data;
  }

  async getSystemOverview() {
    const response = await this.api.get('/api/statistics/overview');
    return response.data;
  }

  // Admin APIs
  async getUsers(params = {}) {
    const response = await this.api.get('/api/admin/users', { params });
    return response.data;
  }

  async createUser(userData) {
    const response = await this.api.post('/api/admin/users', userData);
    return response.data;
  }

  async updateUser(userId, userData) {
    const response = await this.api.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId) {
    const response = await this.api.delete(`/api/admin/users/${userId}`);
    return response.data;
  }

  async getSystemLogs(params = {}) {
    const response = await this.api.get('/api/admin/logs', { params });
    return response.data;
  }

  // Notifications APIs
  async getNotifications(params = {}) {
    const response = await this.api.get('/api/notifications', { params });
    return response.data;
  }

  async markNotificationRead(notificationId) {
    const response = await this.api.post(`/api/notifications/${notificationId}/read`);
    return response.data;
  }

  async deleteNotification(notificationId) {
    const response = await this.api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  }

  async broadcastNotification(notificationData) {
    const response = await this.api.post('/api/notifications/broadcast', notificationData);
    return response.data;
  }

  // File Upload APIs
  async uploadFile(file, type = 'image') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await this.api.post('/api/uploads/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getUploadedFiles(params = {}) {
    const response = await this.api.get('/api/uploads/files', { params });
    return response.data;
  }

  async deleteFile(fileId) {
    const response = await this.api.delete(`/api/uploads/files/${fileId}`);
    return response.data;
  }
}

export default new ApiService();
