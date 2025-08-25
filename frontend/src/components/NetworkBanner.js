import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, Info } from 'lucide-react';
import { networkService } from '../services/api';

const NetworkBanner = () => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [features, setFeatures] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const [statusResponse, featuresResponse] = await Promise.all([
          networkService.getStatus(),
          networkService.getFeatures()
        ]);
        setNetworkInfo(statusResponse.data);
        setFeatures(featuresResponse.data.features);
      } catch (error) {
        console.error('Failed to fetch network data:', error);
      }
    };

    fetchNetworkData();
  }, []);

  if (!networkInfo || !features || dismissed) return null;

  const isInternal = networkInfo.is_internal_network;
  const canAttendance = features.face_attendance;

  return (
    <div className={`relative px-4 py-3 mb-4 rounded-lg border ${
      isInternal 
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-orange-50 border-orange-200 text-orange-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {isInternal ? (
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          )}
          
          <div>
            <div className="font-semibold">
              {isInternal ? 'Internal Network Detected' : 'External Network Detected'}
            </div>
            <div className="text-sm mt-1">
              {isInternal ? (
                <>
                  <span className="font-medium">Full access available.</span> Face attendance works without login.
                </>
              ) : (
                <>
                  <span className="font-medium">Limited access mode.</span> Face attendance is blocked for security.
                  <div className="mt-1">
                    Available: Leave requests, attendance history, reports, AI chatbot
                  </div>
                </>
              )}
            </div>
            <div className="text-xs mt-1 opacity-75">
              IP: {networkInfo.client_ip}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NetworkBanner;
