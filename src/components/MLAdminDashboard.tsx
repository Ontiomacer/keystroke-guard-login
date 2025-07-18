
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { MLRiskDetectionService } from '../services/mlRiskDetection';

const MLAdminDashboard: React.FC = () => {
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [recentPredictions, setRecentPredictions] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mlService = MLRiskDetectionService.getInstance();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const metrics = await mlService.getModelMetrics();
      setModelMetrics(metrics);
      
      // Mock recent predictions data
      setRecentPredictions([
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          phoneNumber: '+91**********',
          riskScore: 0.23,
          riskLevel: 'low',
          prediction: 'approved',
          factors: ['Valid carrier', 'Normal location']
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          phoneNumber: '+91**********',
          riskScore: 0.87,
          riskLevel: 'high',
          prediction: 'blocked',
          factors: ['VoIP detected', 'VPN usage', 'Unknown carrier']
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          phoneNumber: '+91**********',
          riskScore: 0.45,
          riskLevel: 'medium',
          prediction: 'otp_required',
          factors: ['Recently ported', 'New device']
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'otp_required': return <Settings className="w-4 h-4 text-yellow-400" />;
      default: return <Brain className="w-4 h-4 text-blue-400" />;
    }
  };

  if (!modelMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">ML Model Dashboard</h1>
          <p className="text-slate-400">Monitor AI risk detection performance and predictions</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Model Accuracy</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {(modelMetrics.accuracy * 100).toFixed(1)}%
          </div>
          <p className="text-slate-400 text-sm">Current model version: {modelMetrics.modelVersion}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Total Predictions</h3>
            <Brain className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {modelMetrics.totalPredictions.toLocaleString()}
          </div>
          <p className="text-slate-400 text-sm">Last 30 days</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">High Risk Detected</h3>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 mb-2">
            {modelMetrics.highRiskDetections}
          </div>
          <p className="text-slate-400 text-sm">
            {((modelMetrics.highRiskDetections / modelMetrics.totalPredictions) * 100).toFixed(1)}% of total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">False Positives</h3>
            <BarChart3 className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {modelMetrics.falsePositives}
          </div>
          <p className="text-slate-400 text-sm">
            {((modelMetrics.falsePositives / modelMetrics.totalPredictions) * 100).toFixed(2)}% rate
          </p>
        </motion.div>
      </div>

      {/* Feature Importance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
      >
        <h3 className="text-white font-semibold mb-6">Feature Importance</h3>
        <div className="space-y-4">
          {Object.entries(modelMetrics.featureImportance).map(([feature, importance]: [string, any], index) => (
            <div key={feature} className="flex items-center space-x-4">
              <div className="w-32 text-slate-300 text-sm">
                {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <div className="flex-1 bg-slate-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${importance * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                />
              </div>
              <div className="text-slate-300 text-sm w-12 text-right">
                {(importance * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Predictions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold">Recent Predictions</h3>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-3 py-1 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {recentPredictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30"
            >
              <div className="flex items-center space-x-4">
                {getPredictionIcon(prediction.prediction)}
                <div>
                  <div className="text-white font-medium">{prediction.phoneNumber}</div>
                  <div className="text-slate-400 text-sm">
                    {prediction.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className={`text-lg font-bold ${getRiskColor(prediction.riskLevel)}`}>
                    {(prediction.riskScore * 100).toFixed(0)}%
                  </div>
                  <div className="text-slate-400 text-xs">Risk Score</div>
                </div>
                
                <div className="text-right">
                  <div className={`font-medium ${getRiskColor(prediction.riskLevel)}`}>
                    {prediction.riskLevel.toUpperCase()}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {prediction.factors.length} factors
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Model Management Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
      >
        <h3 className="text-white font-semibold mb-4">Model Management</h3>
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Deploy New Model</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span>Retrain Model</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Configure Thresholds</span>
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Note:</strong> Model deployment requires backend integration with Supabase Edge Functions for secure ML model serving.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MLAdminDashboard;
