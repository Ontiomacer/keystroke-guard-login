
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Shield, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import RiskGraph from '../components/RiskGraph';
import { toast } from 'sonner';

interface DashboardProps {
  authState: any;
  setAuthState: (state: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ authState, setAuthState }) => {
  const [stats, setStats] = useState({
    totalLogins: 0,
    behavioralLogins: 0,
    otpFallbacks: 0,
    avgRiskScore: 0,
    recentLogins: []
  });

  useEffect(() => {
    // Simulate loading dashboard data
    const mockStats = {
      totalLogins: 47,
      behavioralLogins: 42,
      otpFallbacks: 5,
      avgRiskScore: 0.127,
      recentLogins: [
        { date: '2024-01-15', method: 'behavioral', riskScore: 0.089, status: 'success' },
        { date: '2024-01-14', method: 'otp_fallback', riskScore: 0.456, status: 'success' },
        { date: '2024-01-13', method: 'behavioral', riskScore: 0.234, status: 'success' },
        { date: '2024-01-12', method: 'behavioral', riskScore: 0.156, status: 'success' },
        { date: '2024-01-11', method: 'otp_fallback', riskScore: 0.623, status: 'success' },
      ]
    };
    setStats(mockStats);
  }, []);

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      needsOTP: false,
      email: '',
      username: '',
      riskScore: 0,
      sessionData: null
    });
    toast.success('Logged out successfully');
  };

  const getRiskLevel = (score: number) => {
    if (score < 0.3) return { level: 'Low', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score < 0.6) return { level: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'High', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const successRate = stats.totalLogins > 0 ? (stats.behavioralLogins / stats.totalLogins * 100) : 0;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
            <p className="text-slate-400">Welcome back, {authState.username}</p>
          </div>
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </motion.button>
        </motion.div>

        {/* Current Session Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/40 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Current Session</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">
                    {authState.sessionData?.loginTime ? 
                      new Date(authState.sessionData.loginTime).toLocaleString() : 
                      'Unknown'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {authState.sessionData?.authMethod === 'behavioral' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  )}
                  <span className="text-slate-300 capitalize">
                    {authState.sessionData?.authMethod?.replace('_', ' ') || 'Unknown'} Authentication
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white mb-1">
                {authState.riskScore?.toFixed(3) || '0.000'}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevel(authState.riskScore || 0).bg} ${getRiskLevel(authState.riskScore || 0).color}`}>
                {getRiskLevel(authState.riskScore || 0).level} Risk
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.totalLogins}</span>
            </div>
            <h3 className="text-slate-300 font-medium">Total Logins</h3>
            <p className="text-slate-400 text-sm">All authentication attempts</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.behavioralLogins}</span>
            </div>
            <h3 className="text-slate-300 font-medium">Behavioral Success</h3>
            <p className="text-slate-400 text-sm">Direct behavioral auth</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.otpFallbacks}</span>
            </div>
            <h3 className="text-slate-300 font-medium">OTP Fallbacks</h3>
            <p className="text-slate-400 text-sm">High-risk authentications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</span>
            </div>
            <h3 className="text-slate-300 font-medium">Success Rate</h3>
            <p className="text-slate-400 text-sm">Behavioral auth efficiency</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Authentication Methods</h3>
            <RiskGraph 
              data={[
                { name: 'Behavioral', value: stats.behavioralLogins, color: '#10b981' },
                { name: 'OTP Fallback', value: stats.otpFallbacks, color: '#f59e0b' }
              ]}
              type="pie"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
          >
            <h3 className="text-xl font-semibold text-white mb-6">Risk Score Trend</h3>
            <RiskGraph 
              data={stats.recentLogins.map((login, index) => ({
                name: login.date,
                riskScore: login.riskScore,
                index: index + 1
              }))}
              type="line"
            />
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-slate-800/40 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Recent Login Activity</h3>
          <div className="space-y-4">
            {stats.recentLogins.map((login, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    login.method === 'behavioral' ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    {login.method === 'behavioral' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{login.date}</p>
                    <p className="text-slate-400 text-sm capitalize">
                      {login.method.replace('_', ' ')} authentication
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono">{login.riskScore.toFixed(3)}</div>
                  <div className={`text-xs px-2 py-1 rounded ${getRiskLevel(login.riskScore).bg} ${getRiskLevel(login.riskScore).color}`}>
                    {getRiskLevel(login.riskScore).level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
