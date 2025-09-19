import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/apiService';
import { Camera, User, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const FaceEnrollmentTest = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testCreateUser = async () => {
    try {
      setIsLoading(true);
      const userData = {
        username: `test_user_${Date.now()}`,
        full_name: 'Test User',
        email: `test${Date.now()}@company.com`,
        role: 'user'
      };

      const response = await apiService.createUser(userData);
      
      if (response.success) {
        addTestResult('Create User', true, `User created: ${response.data.username}`);
        toast.success('Test Create User: PASSED');
        return response.data;
      } else {
        addTestResult('Create User', false, 'API returned success=false');
        toast.error('Test Create User: FAILED');
        return null;
      }
    } catch (error) {
      addTestResult('Create User', false, error.message);
      toast.error('Test Create User: FAILED');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testGetUsersWithoutFace = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUsersWithoutFace();
      
      if (response.success) {
        addTestResult('Get Users Without Face', true, `Found ${response.users_without_face?.length || 0} users`);
        toast.success('Test Get Users: PASSED');
        return response.users_without_face;
      } else {
        addTestResult('Get Users Without Face', false, 'API returned success=false');
        toast.error('Test Get Users: FAILED');
        return [];
      }
    } catch (error) {
      addTestResult('Get Users Without Face', false, error.message);
      toast.error('Test Get Users: FAILED');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const testCaptureFace = async (userId) => {
    try {
      setIsLoading(true);
      
      // Create a dummy base64 image for testing
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      // Draw a simple face-like shape
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(320, 240, 100, 0, 2 * Math.PI);
      ctx.fill();
      
      const dummyImage = canvas.toDataURL('image/jpeg');
      
      const captureData = {
        user_id: userId,
        face_image: dummyImage
      };

      const response = await apiService.captureFace(captureData);
      
      if (response.success) {
        addTestResult('Capture Face', true, `Face captured for user ID: ${userId}`);
        toast.success('Test Capture Face: PASSED');
        return true;
      } else {
        addTestResult('Capture Face', false, 'API returned success=false');
        toast.error('Test Capture Face: FAILED');
        return false;
      }
    } catch (error) {
      addTestResult('Capture Face', false, error.message);
      toast.error('Test Capture Face: FAILED');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const testUserStatus = async (userId) => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserEnrollmentStatus(userId);
      
      if (response.success) {
        const status = response.data.enrollment_status;
        addTestResult('User Status', true, `Status: ${status}`);
        toast.success('Test User Status: PASSED');
        return response.data;
      } else {
        addTestResult('User Status', false, 'API returned success=false');
        toast.error('Test User Status: FAILED');
        return null;
      }
    } catch (error) {
      addTestResult('User Status', false, error.message);
      toast.error('Test User Status: FAILED');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const runFullWorkflowTest = async () => {
    setTestResults([]);
    addTestResult('Full Workflow Test', true, 'Starting full workflow test...');

    // Step 1: Create User
    const newUser = await testCreateUser();
    if (!newUser) {
      addTestResult('Full Workflow Test', false, 'Failed at Step 1: Create User');
      return;
    }

    // Step 2: Check Users Without Face
    await testGetUsersWithoutFace();

    // Step 3: Check User Status (should be pending_face_capture)
    await testUserStatus(newUser.user_id);

    // Step 4: Capture Face
    const captureSuccess = await testCaptureFace(newUser.user_id);
    if (!captureSuccess) {
      addTestResult('Full Workflow Test', false, 'Failed at Step 4: Capture Face');
      return;
    }

    // Step 5: Check User Status Again (should be completed)
    await testUserStatus(newUser.user_id);

    // Step 6: Check Users Without Face Again (should be one less)
    await testGetUsersWithoutFace();

    addTestResult('Full Workflow Test', true, 'Full workflow test completed successfully!');
    toast.success('🎉 Full Workflow Test: PASSED');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (!isAdmin) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">This test component is only available for admin users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Face Enrollment Workflow Test</h2>
        <p className="text-gray-600 mb-6">
          Test the new face enrollment workflow: Create User → Capture Face
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={testCreateUser}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <User className="h-4 w-4 mr-2" />
            Test Create User
          </button>

          <button
            onClick={testGetUsersWithoutFace}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            <User className="h-4 w-4 mr-2" />
            Test Get Users
          </button>

          <button
            onClick={runFullWorkflowTest}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Run Full Workflow Test
          </button>

          <button
            onClick={clearResults}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Results</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-md ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.test}
                  </p>
                  <p className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceEnrollmentTest;
