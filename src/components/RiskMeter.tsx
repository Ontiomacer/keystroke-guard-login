
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskMeterProps {
  riskScore: number;
  isAnimated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RiskMeter: React.FC<RiskMeterProps> = ({ 
  riskScore, 
  isAnimated = true, 
  size = 'md' 
}) => {
  const getRiskLevel = (score: number) => {
    if (score < 0.3) return {
      level: 'Low',
      color: 'text-green-400',
      bgColor: 'bg-green-500',
      icon: CheckCircle
    };
    if (score < 0.6) return {
      level: 'Medium',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500',
      icon: Shield
    };
    return {
      level: 'High',
      color: 'text-red-400',
      bgColor: 'bg-red-500',
      icon: AlertTriangle
    };
  };

  const risk = getRiskLevel(riskScore);
  const percentage = Math.min(riskScore * 100, 100);

  const sizeClasses = {
    sm: { container: 'w-24 h-24', text: 'text-xs', score: 'text-sm' },
    md: { container: 'w-32 h-32', text: 'text-sm', score: 'text-lg' },
    lg: { container: 'w-40 h-40', text: 'text-base', score: 'text-xl' }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`relative ${sizeClasses[size].container}`}>
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-700"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeLinecap="round"
            className={risk.color}
            style={{
              strokeDasharray: `${2 * Math.PI * 40}`,
            }}
            initial={isAnimated ? { strokeDashoffset: 2 * Math.PI * 40 } : false}
            animate={isAnimated ? {
              strokeDashoffset: 2 * Math.PI * 40 * (1 - percentage / 100)
            } : {
              strokeDashoffset: 2 * Math.PI * 40 * (1 - percentage / 100)
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <risk.icon className={`w-6 h-6 ${risk.color} mb-1`} />
          <div className={`font-bold ${risk.color} ${sizeClasses[size].score}`}>
            {percentage.toFixed(0)}%
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <div className={`font-medium ${risk.color} ${sizeClasses[size].text}`}>
          {risk.level} Risk
        </div>
        <div className={`text-slate-400 ${sizeClasses[size].text}`}>
          Score: {riskScore.toFixed(3)}
        </div>
      </div>
    </div>
  );
};

export default RiskMeter;
