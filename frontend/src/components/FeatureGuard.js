import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { networkService } from '../services/api';

const FeatureGuard = ({ feature, children, fallback }) => {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await networkService.checkAccess(feature);
        setHasAccess(response.data.has_access);
        setAccessInfo(response.data);
      } catch (error) {
        console.error('Failed to check feature access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    if (fallback) return fallback;

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Access Denied
        </h3>
        <p className="text-red-600 mb-4">
          {feature === 'attendance' && accessInfo?.network_type === 'external' 
            ? 'Face attendance is blocked from external networks for security reasons.'
            : `You don't have permission to access this feature.`
          }
        </p>
        <div className="text-sm text-red-500">
          Network: {accessInfo?.network_type} | Role: {accessInfo?.user_role}
        </div>
      </div>
    );
  }

  return children;
};

export default FeatureGuard;
