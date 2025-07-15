
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, AlertTriangle, TrendingUp, Download, Eye } from 'lucide-react';
import RiskMeter from './RiskMeter';

interface LoginAttempt {
  id: string;
  email: string;
  timestamp: string;
  riskScore: number;
  authMethod: string;
  location: string;
  deviceType: string;
  status: 'success' | 'failed' | 'otp_required';
}

const AdminDashboard: React.FC = () => {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayLogins: 0,
    highRiskAttempts: 0,
    otpFallbackRate: 0
  });

  useEffect(() => {
    // Mock data - in real app, fetch from backend
    const mockAttempts: LoginAttempt[] = [
      {
        id: '1',
        email: 'user1@example.com',
        timestamp: new Date().toISOString(),
        riskScore: 0.15,
        authMethod: 'enhanced_behavioral',
        location: 'San Francisco, CA',
        deviceType: 'desktop',
        status: 'success'
      },
      {
        id: '2',
        email: 'user2@example.com',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        riskScore: 0.72,
        authMethod: 'otp_fallback',
        location: 'Unknown Location',
        deviceType: 'mobile',
        status: 'otp_required'
      },
      {
        id: '3',
        email: 'user3@example.com',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        riskScore: 0.89,
        authMethod: 'failed',
        location: 'Moscow, RU',
        deviceType: 'desktop',
        status: 'failed'
      }
    ];

    setLoginAttempts(mockAttempts);
    setStats({
      totalUsers: 156,
      todayLogins: 43,
      highRiskAttempts: 8,
      otpFallbackRate: 12.5
    });
  }, []);

  const exportReport = () => {
    const csvData = loginAttempts.map(attempt => ({
      Email: attempt.email,
      Timestamp: attempt.timestamp,
      'Risk Score': attempt.riskScore,
      'Auth Method': attempt.authMethod,
      Location: attempt.location,
      'Device Type': attempt.deviceType,
      Status: attempt.status
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login_attempts_report.csv';
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'otp_required': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Admin Dashboard</h1>
          <p className="text-slate-400">Monitor authentication patterns and security metrics</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
          </div>
          <h3 className="text-slate-300 font-medium">Total Users</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.todayLogins}</span>
          </div>
          <h3 className="text-slate-300 font-medium">Today's Logins</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.highRiskAttempts}</span>
          </div>
          <h3 className="text-slate-300 font-medium">High Risk Attempts</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-white">{stats.otpFallbackRate}%</span>
          </div>
          <h3 className="text-slate-300 font-medium">OTP Fallback Rate</h3>
        </motion.div>
      </div>

      {/* Recent Login Attempts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Recent Authentication Attempts</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="pb-3 text-slate-400">User</th>
                <th className="pb-3 text-slate-400">Time</th>
                <th className="pb-3 text-slate-400">Risk Score</th>
                <th className="pb-3 text-slate-400">Location</th>
                <th className="pb-3 text-slate-400">Device</th>
                <th className="pb-3 text-slate-400">Status</th>
                <th className="pb-3 text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loginAttempts.map((attempt) => (
                <tr key={attempt.id} className="border-b border-slate-800">
                  <td className="py-4 text-white">{attempt.email}</td>
                  <td className="py-4 text-slate-400">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <RiskMeter riskScore={attempt.riskScore} size="sm" isAnimated={false} />
                    </div>
                  </td>
                  <td className="py-4 text-slate-400">{attempt.location}</td>
                  <td className="py-4 text-slate-400 capitalize">{attempt.deviceType}</td>
                  <td className="py-4">
                    <span className={`capitalize ${getStatusColor(attempt.status)}`}>
                      {attempt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4">
                    <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
