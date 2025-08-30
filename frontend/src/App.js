import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import EnhancedAttendanceCheckIn from './components/EnhancedAttendanceCheckIn';
import PublicAttendanceCheckIn from './components/PublicAttendanceCheckIn';
import HomePage from './components/HomePage';
import AttendanceHistory from './components/AttendanceHistory';
import LeaveRequest from './components/LeaveRequest';
import FaceEnrollment from './components/FaceEnrollment';
import AdminPanel from './components/AdminPanel';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <Router>
          <div className="App">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/public-checkin" element={<PublicAttendanceCheckIn />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <Routes>
                        <Route path="/dashboard" element={<EnhancedDashboard />} />
                        <Route path="/checkin" element={<EnhancedAttendanceCheckIn />} />
                        <Route path="/attendance" element={<AttendanceHistory />} />
                        <Route path="/leave" element={<LeaveRequest />} />
                        <Route path="/enroll" element={
                          <ProtectedRoute requiredRole="admin">
                            <FaceEnrollment />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                          <ProtectedRoute requiredRole="admin">
                            <AdminPanel />
                          </ProtectedRoute>
                        } />
                        <Route path="/chat" element={<ChatBot />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </NetworkProvider>
    </AuthProvider>
  );
}

export default App;
