
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Smartphone, MapPin, X } from 'lucide-react';

interface SecurityNotificationProps {
  type: 'sim_swap' | 'new_device' | 'location_anomaly' | 'high_risk';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  onDismiss: () => void;
  onAction?: () => void;
}

const SecurityNotification: React.FC<SecurityNotificationProps> = ({
  type,
  severity,
  message,
  onDismiss,
  onAction
}) => {
  const getIcon = () => {
    switch (type) {
      case 'sim_swap': return <Smartphone className="w-6 h-6" />;
      case 'new_device': return <Shield className="w-6 h-6" />;
      case 'location_anomaly': return <MapPin className="w-6 h-6" />;
      default: return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getColors = () => {
    switch (severity) {
      case 'critical': return {
        bg: 'bg-red-500/10 backdrop-blur-xl',
        border: 'border-red-500/50',
        text: 'text-red-400',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
      };
      case 'high': return {
        bg: 'bg-orange-500/10 backdrop-blur-xl',
        border: 'border-orange-500/50',
        text: 'text-orange-400',
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]'
      };
      case 'medium': return {
        bg: 'bg-yellow-500/10 backdrop-blur-xl',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]'
      };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`fixed top-4 right-4 z-50 ${colors.bg} ${colors.border} ${colors.glow} border rounded-xl p-4 max-w-md`}
    >
      <div className="flex items-start space-x-3">
        <div className={`${colors.text} mt-1`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${colors.text} mb-1`}>
            Security Alert - {severity.toUpperCase()}
          </h4>
          <p className="text-slate-300 text-sm">{message}</p>
          {onAction && (
            <button
              onClick={onAction}
              className={`mt-3 px-4 py-2 ${colors.bg} ${colors.text} border ${colors.border} rounded-lg text-sm hover:opacity-80 transition-opacity`}
            >
              Take Action
            </button>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default SecurityNotification;
