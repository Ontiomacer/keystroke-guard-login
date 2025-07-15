
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, Clock, RefreshCw } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import { toast } from 'sonner';

interface OTPVerifyProps {
  authState: any;
  setAuthState: (state: any) => void;
}

const OTPVerify: React.FC<OTPVerifyProps> = ({ authState, setAuthState }) => {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('http://localhost:8000/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authState.email,
          otp
        }),
      });

      const result = await response.json();

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
        toast.success('OTP verified successfully!');
      } else {
        toast.error(result.message || 'Invalid OTP');
        setOtp('');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: authState.email,
          username: authState.username,
          typing_data: [], // Empty for resend
          resend: true
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('New OTP sent to your email');
        setTimeLeft(300);
        setCanResend(false);
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthCard>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-4"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Identity</h1>
            <p className="text-slate-400">
              High risk detected. Please verify with OTP sent to:
            </p>
            <p className="text-blue-400 font-medium mt-2">{authState.email}</p>
            <div className="mt-3 inline-flex items-center space-x-2 text-orange-400">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Risk Score: {authState.riskScore?.toFixed(3)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                maxLength={6}
                required
              />
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-slate-400 mb-4">
                <Clock className="w-4 h-4" />
                <span>Time remaining: {formatTime(timeLeft)}</span>
              </div>
              
              {canResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isVerifying || otp.length !== 6}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
            <button
              onClick={() => setAuthState({ ...authState, needsOTP: false })}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              ← Back to login
            </button>
          </div>
        </motion.div>
      </AuthCard>
    </div>
  );
};

export default OTPVerify;
