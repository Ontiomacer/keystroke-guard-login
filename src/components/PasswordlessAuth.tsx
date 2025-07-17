
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Smartphone, QrCode, Key } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordlessAuthProps {
  onSuccess: (method: string, data: any) => void;
  onFallback: () => void;
}

const PasswordlessAuth: React.FC<PasswordlessAuthProps> = ({ onSuccess, onFallback }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    // Check for biometric support
    if ('credentials' in navigator && 'create' in (navigator as any).credentials) {
      setBiometricSupported(true);
    }
  }, []);

  const authMethods = [
    {
      id: 'biometric',
      name: 'Biometric Authentication',
      description: 'Use fingerprint or face recognition',
      icon: <Fingerprint className="w-6 h-6" />,
      available: biometricSupported,
      riskLevel: 'Very Low'
    },
    {
      id: 'behavioral',
      name: 'Enhanced Behavioral',
      description: 'Advanced keystroke & pattern analysis',
      icon: <Key className="w-6 h-6" />,
      available: true,
      riskLevel: 'Low'
    },
    {
      id: 'device_trust',
      name: 'Trusted Device',
      description: 'Device-based authentication',
      icon: <Smartphone className="w-6 h-6" />,
      available: true,
      riskLevel: 'Medium'
    },
    {
      id: 'qr_auth',
      name: 'QR Code Auth',
      description: 'Scan QR with registered device',
      icon: <QrCode className="w-6 h-6" />,
      available: true,
      riskLevel: 'Low'
    }
  ];

  const handleAuthenticate = async (method: string) => {
    setSelectedMethod(method);
    setIsAuthenticating(true);

    try {
      switch (method) {
        case 'biometric':
          await handleBiometricAuth();
          break;
        case 'behavioral':
          await handleBehavioralAuth();
          break;
        case 'device_trust':
          await handleDeviceTrustAuth();
          break;
        case 'qr_auth':
          await handleQRAuth();
          break;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      toast.error('Authentication failed. Please try another method.');
    } finally {
      setIsAuthenticating(false);
      setSelectedMethod(null);
    }
  };

  const handleBiometricAuth = async () => {
    // Mock biometric authentication
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate success
    if (Math.random() > 0.2) {
      onSuccess('biometric', { confidence: 0.95, method: 'fingerprint' });
      toast.success('Biometric authentication successful!');
    } else {
      throw new Error('Biometric authentication failed');
    }
  };

  const handleBehavioralAuth = async () => {
    // Redirect to enhanced behavioral analysis
    onSuccess('behavioral', { enhanced: true });
  };

  const handleDeviceTrustAuth = async () => {
    // Mock device trust check
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const deviceTrustScore = Math.random();
    if (deviceTrustScore > 0.7) {
      onSuccess('device_trust', { trustScore: deviceTrustScore });
      toast.success('Device authentication successful!');
    } else {
      throw new Error('Device not trusted');
    }
  };

  const handleQRAuth = async () => {
    // Mock QR authentication
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    onSuccess('qr_auth', { sessionId: 'qr_' + Date.now() });
    toast.success('QR authentication successful!');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Passwordless Authentication</h2>
        <p className="text-slate-400">Choose your preferred secure authentication method</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {authMethods.map((method) => (
          <motion.div
            key={method.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              method.available 
                ? 'bg-slate-800/40 border-slate-700 hover:border-blue-500 hover:bg-slate-800/60' 
                : 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed'
            } ${selectedMethod === method.id && isAuthenticating ? 'border-blue-500 bg-slate-800/60' : ''}`}
            onClick={() => method.available && !isAuthenticating && handleAuthenticate(method.id)}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${
                method.available ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/20 text-slate-500'
              }`}>
                {method.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium mb-1 ${method.available ? 'text-white' : 'text-slate-500'}`}>
                  {method.name}
                </h3>
                <p className={`text-sm ${method.available ? 'text-slate-400' : 'text-slate-600'}`}>
                  {method.description}
                </p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    method.riskLevel === 'Very Low' ? 'bg-green-500/20 text-green-400' :
                    method.riskLevel === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    Risk: {method.riskLevel}
                  </span>
                </div>
              </div>
              {selectedMethod === method.id && isAuthenticating && (
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            {!method.available && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
                <span className="text-slate-500 text-sm">Not Available</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onFallback}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          Use traditional authentication instead
        </button>
      </div>
    </div>
  );
};

export default PasswordlessAuth;
