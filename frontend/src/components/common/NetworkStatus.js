import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Wifi, WifiOff, Shield } from 'lucide-react';

// Network Status Component - Shows current network type and security warnings
const NetworkStatus = ({ showDetails = false }) => {
  const { 
    networkStatus, 
    isInternalNetwork, 
    isExternalNetwork,
    getSecurityWarnings 
  } = useAuth();

  const warnings = getSecurityWarnings();

  if (!showDetails && warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Network Type Indicator */}
      {showDetails && (
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
          isInternalNetwork 
            ? 'bg-success-50 text-success-700 border border-success-200'
            : 'bg-warning-50 text-warning-700 border border-warning-200'
        }`}>
          {isInternalNetwork ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Mạng nội bộ</span>
              <Shield className="w-4 h-4" />
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Mạng bên ngoài</span>
            </>
          )}
          {networkStatus.ip && (
            <span className="text-xs opacity-70">({networkStatus.ip})</span>
          )}
        </div>
      )}

      {/* Security Warnings */}
      {warnings.map((warning, index) => (
        <div key={index} className={`flex items-start space-x-2 px-3 py-2 rounded-lg text-sm ${
          warning.level === 'warning' 
            ? 'bg-warning-50 text-warning-700 border border-warning-200'
            : 'bg-danger-50 text-danger-700 border border-danger-200'
        }`}>
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{warning.message}</p>
            {warning.details && (
              <p className="text-xs opacity-80 mt-1">{warning.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NetworkStatus;
