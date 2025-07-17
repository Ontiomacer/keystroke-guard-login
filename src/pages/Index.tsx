import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import Login from './Login';
import OTPVerify from './OTPVerify';
import Dashboard from './Dashboard';
import GeolocationDashboard from '../components/GeolocationDashboard';
import AdminDashboard from '../components/AdminDashboard';

const Index = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    needsOTP: false,
    email: '',
    username: '',
    riskScore: 0,
    sessionData: null
  });

  // If not authenticated, show login flow without sidebar
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <Routes>
          <Route 
            path="/" 
            element={
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    );
  }

  // Authenticated layout with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">Security Dashboard</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route 
                path="/dashboard" 
                element={<Dashboard authState={authState} setAuthState={setAuthState} />} 
              />
              <Route 
                path="/geolocation" 
                element={<GeolocationDashboard />} 
              />
              <Route 
                path="/admin" 
                element={<AdminDashboard />} 
              />
              <Route 
                path="/security" 
                element={
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Security Analytics</h2>
                    <p className="text-muted-foreground">Security monitoring and analytics dashboard coming soon...</p>
                  </div>
                } 
              />
              <Route 
                path="/phone-verification" 
                element={
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Phone Verification</h2>
                    <p className="text-muted-foreground">Phone number validation system dashboard coming soon...</p>
                  </div>
                } 
              />
              <Route 
                path="/risk-analytics" 
                element={
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Risk Analytics</h2>
                    <p className="text-muted-foreground">Risk assessment dashboard coming soon...</p>
                  </div>
                } 
              />
              <Route 
                path="/fraud-detection" 
                element={
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4">Fraud Detection</h2>
                    <p className="text-muted-foreground">Fraud monitoring system coming soon...</p>
                  </div>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
