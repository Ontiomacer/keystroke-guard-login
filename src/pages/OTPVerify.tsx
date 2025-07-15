
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Settings } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import { toast } from 'sonner';

interface OTPVerifyProps {
  authState: any;
  setAuthState: (state: any) => void;
}

const OTPVerify: React.FC<OTPVerifyProps> = ({ authState, setAuthState }) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [mockMode, setMockMode] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const callBackendAPI = async (endpoint: string, payload: any) => {
    const API_BASE = 'http://localhost:8000';
    
    try {
      console.log(`Attempting to call ${API_BASE}${endpoint}`);
      console.log('Payload:', payload);
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error(`Backend API Error (${endpoint}):`, error);
      throw error;
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);

    try {
      let result;

      if (mockMode) {
        // Mock mode for testing
        console.log('Using mock mode for OTP verification');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Accept '123456' as valid OTP in mock mode
        if (otp === '123456') {
          result = {
            success: true,
            message: 'OTP verified successfully'
          };
        } else {
          result = {
            success: false,
            message: 'Invalid OTP. Try 123456 in demo mode.'
          };
        }
      } else {
        // Real backend call
        result = await callBackendAPI('/verify-otp', {
          email: authState.email,
          otp: otp
        });
      }

      if (result.success) {
        setAuthState({
          ...authState,
          isAuthenticated: true,
          needsOTP: false,
          sessionData: {
            loginTime: new Date(),
            authMethod: 'otp_fallback',
            riskScore: authState.riskScore
          }
        });
        toast.success('OTP verified successfully! Welcome to your dashboard.');
      } else {
        toast.error(result.message || 'Invalid OTP. Please try again.');
        setOtp('');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (mockMode) {
        toast.error('Mock OTP verification failed. Try 123456.');
      } else {
        toast.error('Failed to verify OTP. Please check your connection.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    try {
      if (mockMode) {
        // Mock resend
        toast.success('OTP resent! (Demo: use 123456)');
      } else {
        // Real backend call for resend
        await callBackendAPI('/resend-otp', {
          email: authState.email
        });
        toast.success('OTP resent to your registered phone number');
      }
      
      setCountdown(30);
      setCanResend(false);
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

  const handleBack = () => {
    setAuthState({
      ...authState,
      needsOTP: false,
      email: '',
      username: '',
      riskScore: 0
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthCard>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mock Mode Toggle */}
          <div className="flex items-center justify-between mb-6 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">Mock Mode</span>
            </div>
            <button
              onClick={() => setMockMode(!mockMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                mockMode ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  mockMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Additional Verification Required</h1>
            <p className="text-slate-400 mb-2">
              Risk Score: <span className="text-orange-400 font-mono">{authState.riskScore?.toFixed(3)}</span>
            </p>
            <p className="text-slate-400">
              We've sent a 6-digit OTP to your registered phone number
            </p>
            {mockMode && (
              <p className="text-yellow-400 text-sm mt-2">
                Demo Mode: Use OTP "123456"
              </p>
            )}
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-300 mb-2">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-center text-xl font-mono tracking-widest placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                maxLength={6}
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Verify OTP</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm mb-4">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResendOTP}
              disabled={!canResend}
              className="text-orange-400 hover:text-orange-300 font-medium disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            >
              {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-slate-500 text-xs">
              {mockMode ? 'Running in demo mode' : 'Connected to backend server'}
            </p>
          </div>
        </motion.div>
      </AuthCard>
    </div>
  );
};

export default OTPVerify;
