import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AttendanceCheckIn from './components/AttendanceCheckIn';
import AttendanceHistory from './components/AttendanceHistory';
import FaceEnrollment from './components/FaceEnrollment';
import LeaveRequest from './components/LeaveRequest';
import AdminPanel from './components/AdminPanel';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  return (
    <AuthProvider>
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
            <Route path="/login" element={<Login />} />
            
            <Route path="/*" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Navigation />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/checkin" element={<AttendanceCheckIn />} />
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
                      <Route path="/chatbot" element={<ChatBot />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
