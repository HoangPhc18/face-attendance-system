import React, { createContext, useContext, useState, useEffect } from 'react';
import { networkService } from '../services/api';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const [statusResponse, featuresResponse] = await Promise.all([
        networkService.getStatus(),
        networkService.getFeatures()
      ]);
      
      setNetworkInfo(statusResponse.data);
      setFeatures(featuresResponse.data.features);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch network data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkFeatureAccess = async (feature) => {
    try {
      const response = await networkService.checkAccess(feature);
      return response.data;
    } catch (err) {
      console.error(`Failed to check access for ${feature}:`, err);
      return { has_access: false, error: err.message };
    }
  };

  const refreshNetworkStatus = () => {
    fetchNetworkData();
  };

  useEffect(() => {
    fetchNetworkData();
    
    // Refresh network status every 30 seconds
    const interval = setInterval(fetchNetworkData, 30000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    networkInfo,
    features,
    loading,
    error,
    isInternal: networkInfo?.is_internal_network || false,
    clientIP: networkInfo?.client_ip || 'Unknown',
    networkType: networkInfo?.network_type || 'unknown',
    checkFeatureAccess,
    refreshNetworkStatus
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkContext;
