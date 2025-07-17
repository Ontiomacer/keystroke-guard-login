import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Shield, Activity, AlertTriangle, CheckCircle, Clock, Settings, TrendingUp } from 'lucide-react';
import RiskGraph from '../components/RiskGraph';
import RiskMeter from '../components/RiskMeter';
import { ThemeToggle } from '../components/ThemeProvider';
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
    const mockStats = {
      totalLogins: 47,
      behavioralLogins: 42,
      otpFallbacks: 5,
      avgRiskScore: 0.127,
      recentLogins: [
        { date: '2024-01-15', method: 'behavioral', riskScore: 0.089, status: 'success', location: 'San Francisco, CA' },
        { date: '2024-01-14', method: 'otp_fallback', riskScore: 0.456, status: 'success', location: 'San Francisco, CA' },
        { date: '2024-01-13', method: 'behavioral', riskScore: 0.234, status: 'success', location: 'San Francisco, CA' },
        { date: '2024-01-12', method: 'behavioral', riskScore: 0.156, status: 'success', location: 'San Francisco, CA' },
        { date: '2024-01-11', method: 'otp_fallback', riskScore: 0.623, status: 'success', location: 'San Francisco, CA' },
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
    <div className="p-6 bg-background min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {authState.username}</h1>
            <p className="text-muted-foreground">Your security dashboard overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/30 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Current Session Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card/60 backdrop-blur-lg rounded-2xl p-6 border border-border mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-4">Current Session Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Login Time</p>
                    <p className="text-foreground font-medium">
                      {authState.sessionData?.loginTime ? 
                        new Date(authState.sessionData.loginTime).toLocaleString() : 
                        'Unknown'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    {authState.sessionData?.authMethod === 'enhanced_behavioral' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auth Method</p>
                    <p className="text-foreground font-medium capitalize">
                      {authState.sessionData?.authMethod?.replace('_', ' ') || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Security Level</p>
                    <p className={`font-medium ${getRiskLevel(authState.riskScore || 0).color}`}>
                      {getRiskLevel(authState.riskScore || 0).level} Risk
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-8">
              <RiskMeter riskScore={authState.riskScore || 0} size="lg" />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/60 backdrop-blur-lg rounded-xl p-6 border border-border shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">{stats.totalLogins}</span>
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </div>
              </div>
            </div>
            <h3 className="text-foreground font-medium">Total Logins</h3>
            <p className="text-muted-foreground text-sm">All authentication attempts</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/60 backdrop-blur-lg rounded-xl p-6 border border-border shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">{stats.behavioralLogins}</span>
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8%
                </div>
              </div>
            </div>
            <h3 className="text-foreground font-medium">Behavioral Success</h3>
            <p className="text-muted-foreground text-sm">Direct behavioral auth</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/60 backdrop-blur-lg rounded-xl p-6 border border-border shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">{stats.otpFallbacks}</span>
                <div className="flex items-center text-red-400 text-sm">
                  <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
                  -3%
                </div>
              </div>
            </div>
            <h3 className="text-foreground font-medium">OTP Fallbacks</h3>
            <p className="text-muted-foreground text-sm">High-risk authentications</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/60 backdrop-blur-lg rounded-xl p-6 border border-border shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">{successRate.toFixed(1)}%</span>
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5%
                </div>
              </div>
            </div>
            <h3 className="text-foreground font-medium">Success Rate</h3>
            <p className="text-muted-foreground text-sm">Behavioral auth efficiency</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card/60 backdrop-blur-lg rounded-xl p-6 border border-border shadow-lg"
          >
            <h3 className="text-xl font-semibold text-foreground mb-6">Authentication Methods</h3>
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
            className="bg-card/60 backdrop-blur-lg rounded-xl p-6 border border-border shadow-lg"
          >
            <h3 className="text-xl font-semibold text-foreground mb-6">Risk Score Trend</h3>
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
          className="bg-card/60 backdrop-blur-lg rounded-xl p-6 border border-border shadow-lg"
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">Recent Login Activity</h3>
          <div className="space-y-4">
            {stats.recentLogins.map((login, index) => (
              <div key={index} className="flex items-center justify-between py-4 px-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    login.method === 'behavioral' ? 'bg-green-500/20' : 'bg-orange-500/20'
                  }`}>
                    {login.method === 'behavioral' ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{login.date}</p>
                    <p className="text-muted-foreground text-sm capitalize">
                      {login.method.replace('_', ' ')} authentication
                    </p>
                    <p className="text-muted-foreground text-xs">{login.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground font-mono text-lg">{login.riskScore.toFixed(3)}</div>
                  <div className={`text-xs px-3 py-1 rounded-full ${getRiskLevel(login.riskScore).bg} ${getRiskLevel(login.riskScore).color}`}>
                    {getRiskLevel(login.riskScore).level} Risk
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
