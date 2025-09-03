import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Login from './components/Login';
import EnhancedDashboard from './components/EnhancedDashboard';
import EnhancedAttendanceCheckIn from './components/EnhancedAttendanceCheckIn';
import PublicAttendanceCheckIn from './components/PublicAttendanceCheckIn';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import AttendanceHistory from './components/AttendanceHistory';
import LeaveRequest from './components/LeaveRequest';
import FaceEnrollment from './components/FaceEnrollment';
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
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <EnhancedDashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/checkin" element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <EnhancedAttendanceCheckIn />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/attendance" element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <AttendanceHistory />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/leave" element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <LeaveRequest />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/enroll" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <FaceEnrollment />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <AdminDashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <div className="app-layout">
                    <Navigation />
                    <main className="main-content">
                      <ChatBot />
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
