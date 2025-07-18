
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  Zap,
  Eye,
  BarChart3
} from 'lucide-react';
import { MLRiskDetectionService, MLModelResponse } from '../services/mlRiskDetection';

interface RiskDashboardProps {
  riskData?: MLModelResponse;
  realTimeRisk: number;
  isAnalyzing: boolean;
}

const RiskDashboard: React.FC<RiskDashboardProps> = ({
  riskData,
  realTimeRisk,
  isAnalyzing
}) => {
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const mlService = MLRiskDetectionService.getInstance();

  useEffect(() => {
    const fetchMetrics = async () => {
      const metrics = await mlService.getModelMetrics();
      setModelMetrics(metrics);
    };
    fetchMetrics();
  }, []);

  const getRiskColor = (score: number) => {
    if (score > 0.7) return 'text-red-400';
    if (score > 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score > 0.7) return 'bg-red-500/10 border-red-500/30';
    if (score > 0.4) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Real-time Risk Score */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-white font-semibold">AI Risk Assessment</h3>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getRiskColor(realTimeRisk)} mb-2`}>
              {(realTimeRisk * 100).toFixed(1)}%
            </div>
            <div className="text-slate-400 text-sm">Current Risk</div>
          </div>
          
          {riskData && (
            <div className="text-center">
              <div className={`text-3xl font-bold ${getRiskColor(riskData.prediction.confidence)} mb-2`}>
                {(riskData.prediction.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-slate-400 text-sm">AI Confidence</div>
            </div>
          )}
        </div>

        {isAnalyzing && (
          <div className="mt-4 flex items-center justify-center py-2">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-purple-400 text-sm">AI analyzing patterns...</span>
          </div>
        )}
      </div>

      {/* Risk Factors */}
      {riskData && riskData.prediction.factors.length > 0 && (
        <div className={`rounded-xl p-6 border backdrop-blur-sm ${getRiskBgColor(riskData.prediction.riskScore)}`}>
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-white font-semibold">Risk Factors Detected</h3>
          </div>
          
          <div className="space-y-2">
            {riskData.prediction.factors.map((factor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-2 text-sm"
              >
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span className="text-slate-300">{factor}</span>
              </motion.div>
            ))}
          </div>

          {riskData.prediction.recommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <h4 className="text-white font-medium mb-2">AI Recommendations:</h4>
              <div className="space-y-1">
                {riskData.prediction.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-300">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Performance */}
      {modelMetrics && (
        <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-green-400" />
            <h3 className="text-white font-semibold">Model Performance</h3>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              {modelMetrics.modelVersion}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {(modelMetrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-slate-400 text-xs">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {(modelMetrics.precision * 100).toFixed(1)}%
              </div>
              <div className="text-slate-400 text-xs">Precision</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {(modelMetrics.recall * 100).toFixed(1)}%
              </div>
              <div className="text-slate-400 text-xs">Recall</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400 mb-1">
                {modelMetrics.totalPredictions}
              </div>
              <div className="text-slate-400 text-xs">Predictions</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-white font-medium mb-3">Feature Importance</h4>
            <div className="space-y-2">
              {Object.entries(modelMetrics.featureImportance).map(([feature, importance]: [string, any]) => (
                <div key={feature} className="flex items-center space-x-3">
                  <div className="w-24 text-slate-400 text-sm">
                    {feature.replace('_', ' ')}
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${importance * 100}%` }}
                    />
                  </div>
                  <div className="text-slate-300 text-sm w-12">
                    {(importance * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {riskData && (
        <div className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400">Processing Time:</span>
              <span className="text-yellow-400">{riskData.processingTime}ms</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Request ID:</span>
              <span className="text-blue-400 font-mono text-xs">{riskData.requestId.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskDashboard;
