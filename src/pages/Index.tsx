
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import OTPVerify from './OTPVerify';
import Dashboard from './Dashboard';

const Index = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    needsOTP: false,
    email: '',
    username: '',
    riskScore: 0,
    sessionData: null
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23334155" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      <Routes>
        <Route 
          path="/" 
          element={
            authState.isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              authState.needsOTP ? 
                <Navigate to="/verify-otp" replace /> :
                <Login authState={authState} setAuthState={setAuthState} />
          } 
        />
        <Route 
          path="/verify-otp" 
          element={
            authState.needsOTP ? 
              <OTPVerify authState={authState} setAuthState={setAuthState} /> :
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            authState.isAuthenticated ? 
              <Dashboard authState={authState} setAuthState={setAuthState} /> :
              <Navigate to="/" replace />
          } 
        />
      </Routes>
    </div>
  );
};

export default Index;
