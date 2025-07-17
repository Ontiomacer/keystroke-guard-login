
import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, MapPin, Smartphone, Clock } from 'lucide-react';

interface SecurityAlertProps {
  type: 'sim_swap' | 'location_risk' | 'device_change' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: Record<string, any>;
  onDismiss?: () => void;
  onTakeAction?: () => void;
}

const SecurityAlert: React.FC<SecurityAlertProps> = ({
  type,
  severity,
  message,
  details,
  onDismiss,
  onTakeAction
}) => {
  const getIcon = () => {
    switch (type) {
      case 'sim_swap': return <Smartphone className="w-5 h-5" />;
      case 'location_risk': return <MapPin className="w-5 h-5" />;
      case 'device_change': return <Shield className="w-5 h-5" />;
      case 'suspicious_pattern': return <Clock className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (severity) {
      case 'high': return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        icon: 'text-red-400'
      };
      case 'medium': return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        icon: 'text-yellow-400'
      };
      case 'low': return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: 'text-blue-400'
      };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`${colors.bg} ${colors.border} border rounded-lg p-4 mb-4`}
    >
      <div className="flex items-start space-x-3">
        <div className={`${colors.icon} mt-0.5`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className={`font-medium ${colors.text} mb-1`}>
            Security Alert - {severity.toUpperCase()}
          </h4>
          <p className="text-slate-300 text-sm mb-3">{message}</p>
          
          {details && (
            <div className="space-y-2 text-xs text-slate-400">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace('_', ' ')}:</span>
                  <span className="text-slate-300">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {onTakeAction && (
            <button
              onClick={onTakeAction}
              className={`px-3 py-1 ${colors.bg} ${colors.text} border ${colors.border} rounded text-xs hover:opacity-80 transition-opacity`}
            >
              Take Action
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityAlert;
