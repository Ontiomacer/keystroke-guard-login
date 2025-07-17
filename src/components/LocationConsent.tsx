
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Shield, AlertTriangle, Check } from 'lucide-react';

interface LocationConsentProps {
  onConsent: (granted: boolean) => void;
  onPrivacyPolicyClick: () => void;
}

const LocationConsent: React.FC<LocationConsentProps> = ({ 
  onConsent, 
  onPrivacyPolicyClick 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleAccept = () => {
    setIsVisible(false);
    onConsent(true);
  };

  const handleDecline = () => {
    setIsVisible(false);
    onConsent(false);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Location Permission Required
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enhanced Security Feature
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-start space-x-3 mb-3">
            <Shield className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Fraud Protection
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Detect suspicious login attempts from unusual locations
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 mb-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Risk-Based Authentication
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Adaptive security based on your location patterns
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Data Protection
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Location data is encrypted and retained for 30 days only
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            We collect location data to:
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Verify login attempts from trusted locations</li>
            <li>• Detect potential account takeover attempts</li>
            <li>• Provide location-based security alerts</li>
            <li>• Comply with regulatory requirements (DPDP Act, GDPR)</li>
          </ul>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          By allowing location access, you consent to our location data processing. 
          Read our{' '}
          <button 
            onClick={onPrivacyPolicyClick}
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            Privacy Policy
          </button>{' '}
          for more details.
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Allow Location
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocationConsent;
