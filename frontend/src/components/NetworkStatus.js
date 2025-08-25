import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Shield, AlertTriangle } from 'lucide-react';
import { networkService } from '../services/api';

const NetworkStatus = () => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkStatus = async () => {
      try {
        const response = await networkService.getStatus();
        setNetworkInfo(response.data);
      } catch (error) {
        console.error('Failed to fetch network status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkStatus();
    // Refresh network status every 30 seconds
    const interval = setInterval(fetchNetworkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 rounded-full border-t-blue-600"></div>
        <span className="text-sm">Checking network...</span>
      </div>
    );
  }

  const isInternal = networkInfo?.is_internal_network;
  
  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
      isInternal 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-orange-100 text-orange-800 border border-orange-200'
    }`}>
      {isInternal ? (
        <>
          <Shield className="h-4 w-4" />
          <span>Internal Network</span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-4 w-4" />
          <span>External Network</span>
        </>
      )}
      <span className="text-xs opacity-75">
        {networkInfo?.client_ip}
      </span>
    </div>
  );
};

export default NetworkStatus;
