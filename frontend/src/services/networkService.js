import api from './api';

export const networkService = {
  // Get current network status
  getStatus: () => api.get('/api/network/status'),
  
  // Get network configuration
  getConfig: () => api.get('/api/network/config'),
  
  // Get available features based on network
  getFeatures: () => api.get('/api/restrictions/features'),
  
  // Get access policy information
  getAccessPolicy: () => api.get('/api/restrictions/policy'),
  
  // Check access for specific feature
  checkAccess: (feature) => api.get(`/api/restrictions/check-access/${feature}`)
};

export default networkService;
