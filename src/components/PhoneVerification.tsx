
import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { IndianPhoneVerificationService, PhoneVerificationResult } from '../services/phoneVerification';
import { toast } from 'sonner';

interface PhoneVerificationProps {
  phoneNumber: string;
  onVerificationComplete: (result: PhoneVerificationResult) => void;
  mockMode?: boolean;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  phoneNumber,
  onVerificationComplete,
  mockMode = true
}) => {
  const [verificationResult, setVerificationResult] = useState<PhoneVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const phoneService = IndianPhoneVerificationService.getInstance();

  useEffect(() => {
    if (phoneNumber && phoneNumber.length >= 10) {
      verifyPhone();
    }
  }, [phoneNumber]);

  const verifyPhone = async () => {
    if (!phoneNumber) return;

    setIsVerifying(true);
    try {
      const result = await phoneService.verifyIndianPhone(phoneNumber, mockMode);
      setVerificationResult(result);
      onVerificationComplete(result);

      // Show appropriate toast based on risk level
      if (result.riskLevel === 'high') {
        toast.error(`High-risk phone number detected: ${result.riskFactors.join(', ')}`);
      } else if (result.riskLevel === 'medium') {
        toast.warning(`Medium-risk phone number: ${result.riskFactors.join(', ')}`);
      } else {
        toast.success(`Phone verified: ${result.carrier}`);
      }
    } catch (error) {
      console.error('Phone verification failed:', error);
      toast.error('Phone verification failed');
    } finally {
      setIsVerifying(false);
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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Shield className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return <Phone className="w-5 h-5" />;
    }
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-medium">Phone Verification</h3>
        </div>
        
        {verificationResult && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}
      </div>

      {isVerifying ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
          <span className="text-blue-400 text-sm">Verifying phone number...</span>
        </div>
      ) : verificationResult ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Carrier:</span>
            <span className="text-white text-sm">{verificationResult.carrier}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Risk Level:</span>
            <div className={`flex items-center space-x-1 ${getRiskColor(verificationResult.riskLevel)}`}>
              {getRiskIcon(verificationResult.riskLevel)}
              <span className="text-sm capitalize">{verificationResult.riskLevel}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Risk Score:</span>
            <span className={`text-sm ${getRiskColor(verificationResult.riskLevel)}`}>
              {(verificationResult.riskScore * 100).toFixed(0)}%
            </span>
          </div>

          {showDetails && (
            <div className="mt-4 pt-3 border-t border-slate-700 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Valid:</span>
                  <span className={`ml-2 ${verificationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {verificationResult.isValid ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">VoIP:</span>
                  <span className={`ml-2 ${verificationResult.isVoIP ? 'text-red-400' : 'text-green-400'}`}>
                    {verificationResult.isVoIP ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Ported:</span>
                  <span className={`ml-2 ${verificationResult.isPorted ? 'text-yellow-400' : 'text-green-400'}`}>
                    {verificationResult.isPorted ? 'Yes' : 'No'}
                  </span>
                </div>
                {verificationResult.portDate && (
                  <div>
                    <span className="text-slate-400">Port Date:</span>
                    <span className="ml-2 text-white">
                      {new Date(verificationResult.portDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              {verificationResult.riskFactors.length > 0 && (
                <div className="mt-3">
                  <span className="text-slate-400 text-xs">Risk Factors:</span>
                  <ul className="mt-1 space-y-1">
                    {verificationResult.riskFactors.map((factor, index) => (
                      <li key={index} className="text-red-400 text-xs flex items-center">
                        <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-slate-400 text-sm">
          Enter a phone number to verify
        </div>
      )}

      {mockMode && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
          Demo Mode: Try numbers ending with 999 (high-risk), 888 (medium-risk), or 777 (Jio safe)
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
