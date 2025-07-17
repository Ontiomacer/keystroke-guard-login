
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, Shield, Brain, MapPin, Settings, Lock, Eye, EyeOff } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import EnhancedTypingCapture from '../components/EnhancedTypingCapture';
import RiskMeter from '../components/RiskMeter';
import DeviceFingerprint from '../components/DeviceFingerprint';
import SecurityAlert from '../components/SecurityAlert';
import SecurityNotification from '../components/SecurityNotification';
import SecurityBackground from '../components/SecurityBackground';
import PasswordlessAuth from '../components/PasswordlessAuth';
import { toast } from 'sonner';
import { AdvancedFraudDetection } from '../services/simSwapDetection';
import { LocationTrackingService } from '../services/locationTracking';
import LocationTracker from '../components/LocationTracker';
import PhoneVerification from '../components/PhoneVerification';
import { IndianPhoneVerificationService, PhoneVerificationResult } from '../services/phoneVerification';

interface LoginProps {
  authState: any;
  setAuthState: (state: any) => void;
}

const Login: React.FC<LoginProps> = ({ authState, setAuthState }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [typingData, setTypingData] = useState<any[]>([]);
  const [typingMetrics, setTypingMetrics] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [realTimeRisk, setRealTimeRisk] = useState(0);
  const [mockMode, setMockMode] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [securityNotifications, setSecurityNotifications] = useState<any[]>([]);
  const [simSwapResult, setSimSwapResult] = useState<any>(null);
  const [locationRisk, setLocationRisk] = useState<any>(null);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [locationRiskScore, setLocationRiskScore] = useState(0);
  const [phoneVerificationResult, setPhoneVerificationResult] = useState<PhoneVerificationResult | null>(null);
  
  const fraudDetection = AdvancedFraudDetection.getInstance();
  const phoneVerificationService = IndianPhoneVerificationService.getInstance();

  // Enhanced security monitoring
  React.useEffect(() => {
    const performSecurityChecks = async () => {
      if (!email) return;

      const mockLocation = {
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        ip: email.includes('high-risk') ? 'high-risk-ip' : 
            email.includes('medium-risk') ? 'medium-risk-ip' : '192.168.1.1'
      };
      setLocationInfo(mockLocation);

      // Enhanced SIM swap detection with immediate notifications
      if (phoneNumber) {
        try {
          const result = await fraudDetection.detectSIMSwap(phoneNumber, mockMode);
          setSimSwapResult(result);

          if (result.isSwapped) {
            setSecurityNotifications(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'sim_swap',
              severity: 'critical',
              message: `CRITICAL: SIM swap detected! Your phone number was recently transferred to a new SIM card. This is a major security risk.`,
              timestamp: new Date()
            }]);
          }
        } catch (error) {
          console.error('SIM swap detection failed:', error);
        }
      }

      // Location anomaly detection
      try {
        const registeredLocation = { city: 'New York', country: 'US', coordinates: [40.7128, -74.0060] };
        const locationRiskResult = await fraudDetection.checkLocationRisk(mockLocation.ip, registeredLocation, mockMode);
        setLocationRisk(locationRiskResult);

        if (locationRiskResult.locationMismatch && locationRiskResult.distance > 1000) {
          setSecurityNotifications(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'location_anomaly',
            severity: 'high',
            message: `Suspicious login detected from ${locationRiskResult.currentLocation.city}, ${locationRiskResult.currentLocation.country} - ${Math.round(locationRiskResult.distance)} km from your usual location.`,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('Location check failed:', error);
      }
    };

    performSecurityChecks();
  }, [email, phoneNumber, mockMode]);

  // Device change detection
  React.useEffect(() => {
    if (deviceInfo && deviceInfo.isNewDevice) {
      setSecurityNotifications(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'new_device',
        severity: 'high',
        message: `New device detected: ${deviceInfo.deviceType} using ${deviceInfo.browser}. If this wasn't you, secure your account immediately.`,
        timestamp: new Date()
      }]);
    }
  }, [deviceInfo]);

  const handleLocationLogged = (data: { riskScore: number; fraudFlags: string[] }) => {
    setLocationRiskScore(data.riskScore);
    
    if (data.riskScore > 0.8) {
      setSecurityNotifications(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'high_risk',
        severity: 'critical',
        message: `BLOCKED: Extremely high-risk location detected. Multiple fraud indicators present.`,
        timestamp: new Date()
      }]);
    }
  };

  const handlePhoneVerificationComplete = (result: PhoneVerificationResult) => {
    setPhoneVerificationResult(result);
    
    if (result.riskLevel === 'high') {
      setSecurityNotifications(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'high_risk',
        severity: 'critical',
        message: `High-risk phone number detected: ${result.riskFactors.join(', ')}. Additional verification required.`,
        timestamp: new Date()
      }]);
    }
  };

  const calculateEnhancedRiskScore = (metrics: any, device: any, location: any, simSwap: any, locationRisk: any, phoneVerification: PhoneVerificationResult | null) => {
    let riskScore = 0;

    if (metrics?.typing_speed_wpm < 20 || metrics?.typing_speed_wpm > 100) riskScore += 0.06;
    if (metrics?.error_rate > 0.1) riskScore += 0.05;
    if (phoneVerification) riskScore += phoneVerification.riskScore * 0.25;
    if (simSwap?.isSwapped) riskScore += simSwap.confidence * 0.30;
    if (locationRisk?.locationMismatch) riskScore += locationRisk.riskScore * 0.25;
    riskScore += locationRiskScore * 0.05;
    if (device?.deviceType !== 'desktop') riskScore += 0.05;

    return Math.min(riskScore, 1.0);
  };

  const handleEnhancedTypingData = (data: any[], metrics: any) => {
    setTypingData(data);
    setTypingMetrics(metrics);
    
    const risk = calculateEnhancedRiskScore(metrics, deviceInfo, locationInfo, simSwapResult, locationRisk, phoneVerificationResult);
    setRealTimeRisk(risk);
  };

  const handlePasswordlessSuccess = (method: string, data: any) => {
    setAuthState({
      ...authState,
      isAuthenticated: true,
      email,
      username,
      riskScore: 0.1,
      sessionData: {
        loginTime: new Date(),
        authMethod: `passwordless_${method}`,
        riskScore: 0.1,
        deviceInfo,
        locationInfo,
        authData: data
      }
    });
    toast.success(`Passwordless authentication successful via ${method}!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !username || !password || typingData.length === 0) {
      toast.error('Please fill all fields and complete the behavioral verification');
      return;
    }

    setIsAnalyzing(true);

    try {
      const finalRiskScore = calculateEnhancedRiskScore(
        typingMetrics, deviceInfo, locationInfo, simSwapResult, locationRisk, phoneVerificationResult
      );

      let result;
      if (mockMode) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (phoneVerificationResult?.riskLevel === 'high' || (simSwapResult?.isSwapped && simSwapResult.riskLevel === 'high')) {
          result = {
            success: false,
            blocked: true,
            risk_score: 0.95,
            message: 'Authentication blocked due to critical security threats'
          };
        } else if (locationRiskScore > 0.8 || locationRisk?.distance > 1000) {
          result = {
            success: true,
            needs_otp: true,
            risk_score: Math.max(0.8, finalRiskScore),
            message: 'High risk detected - multi-factor authentication required'
          };
        } else {
          result = {
            success: true,
            needs_otp: finalRiskScore > 0.4,
            risk_score: finalRiskScore,
            message: finalRiskScore < 0.3 ? 'Secure login approved' : 
                    finalRiskScore < 0.6 ? 'Medium risk - additional verification required' :
                    'High risk - OTP verification required'
          };
        }
      }

      if (result.blocked) {
        setSecurityNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'high_risk',
          severity: 'critical',
          message: 'Login attempt blocked due to multiple security threats detected.',
          timestamp: new Date()
        }]);
        toast.error(result.message);
        return;
      }

      if (result.success) {
        if (result.needs_otp) {
          setAuthState({
            ...authState,
            needsOTP: true,
            email,
            username,
            riskScore: result.risk_score
          });
          toast.warning(`Additional verification required. Risk score: ${result.risk_score.toFixed(3)}`);
        } else {
          setAuthState({
            ...authState,
            isAuthenticated: true,
            email,
            username,
            riskScore: result.risk_score,
            sessionData: {
              loginTime: new Date(),
              authMethod: 'enhanced_behavioral',
              riskScore: result.risk_score,
              deviceInfo,
              locationInfo,
              simSwapResult,
              locationRisk
            }
          });
          toast.success(`Secure login successful! Risk score: ${result.risk_score.toFixed(3)}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismissNotification = (notificationId: number) => {
    setSecurityNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const dismissAlert = (alertId: number) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (showPasswordless) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
        <SecurityBackground />
        <AuthCard>
          <PasswordlessAuth 
            onSuccess={handlePasswordlessSuccess}
            onFallback={() => setShowPasswordless(false)}
          />
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <SecurityBackground />
      
      {/* Security Notifications */}
      <AnimatePresence>
        {securityNotifications.map((notification) => (
          <SecurityNotification
            key={notification.id}
            type={notification.type}
            severity={notification.severity}
            message={notification.message}
            onDismiss={() => dismissNotification(notification.id)}
          />
        ))}
      </AnimatePresence>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <AuthCard>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 rounded-full flex items-center justify-center mb-6 relative"
              >
                <Shield className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 rounded-full blur-xl opacity-50"></div>
              </motion.div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                SecureBank Pro
              </h1>
              <p className="text-slate-400 text-lg">Advanced AI-Powered Security Platform</p>
              <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                <p className="text-cyan-400 text-sm font-medium">
                  🛡️ Real-time threat detection • SIM swap monitoring • Location verification
                </p>
              </div>
            </div>

            {/* Mock Mode Toggle */}
            <div className="flex items-center justify-between mb-6 p-4 bg-slate-800/20 rounded-xl border border-slate-700/30 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-blue-400" />
                <span className="text-slate-300 font-medium">Demo Mode</span>
              </div>
              <button
                onClick={() => setMockMode(!mockMode)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  mockMode ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                    mockMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Security Alerts */}
            {securityAlerts.map((alert) => (
              <SecurityAlert
                key={alert.id}
                type={alert.type}
                severity={alert.severity}
                message={alert.message}
                details={alert.details}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}

            {/* Passwordless Option */}
            <div className="mb-6 text-center">
              <button
                onClick={() => setShowPasswordless(true)}
                className="text-cyan-400 hover:text-cyan-300 underline text-sm font-medium transition-colors"
              >
                Try Passwordless Authentication →
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Input Fields */}
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                    required
                  />
                </div>

                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                    required
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Phone Number (for advanced security verification)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Phone Verification */}
              {phoneNumber && (
                <PhoneVerification
                  phoneNumber={phoneNumber}
                  onVerificationComplete={handlePhoneVerificationComplete}
                  mockMode={mockMode}
                />
              )}

              {/* Behavioral Analysis */}
              <div className="bg-slate-800/20 rounded-xl p-5 border border-slate-700/30 backdrop-blur-sm">
                <div className="flex items-center mb-4">
                  <Brain className="w-6 h-6 text-purple-400 mr-3" />
                  <h3 className="text-white font-semibold">AI Behavioral Analysis</h3>
                </div>
                <EnhancedTypingCapture onTypingData={handleEnhancedTypingData} />
              </div>

              {/* Location Tracking */}
              {phoneNumber && deviceInfo && (
                <LocationTracker
                  phoneNumber={phoneNumber}
                  deviceFingerprint={deviceInfo?.fingerprint || 'unknown'}
                  sessionToken="demo-session-token"
                  onLocationLogged={handleLocationLogged}
                />
              )}

              {/* Risk Assessment */}
              {realTimeRisk > 0 && (
                <div className="flex justify-center">
                  <RiskMeter riskScore={realTimeRisk} size="lg" />
                </div>
              )}

              {/* Device Fingerprinting */}
              <DeviceFingerprint onDeviceInfo={setDeviceInfo} />
              
              {/* Location Info */}
              {locationInfo && (
                <div className="bg-slate-800/20 rounded-xl p-5 border border-slate-700/30 backdrop-blur-sm">
                  <div className="flex items-center mb-3">
                    <MapPin className="w-6 h-6 text-green-400 mr-3" />
                    <h3 className="text-white font-semibold">Location Verification</h3>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Location:</span>
                      <span className="text-white font-medium">{locationInfo.city}, {locationInfo.state}</span>
                    </div>
                    {locationRisk && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk Assessment:</span>
                        <span className={`font-medium ${
                          locationRisk.riskScore < 0.3 ? 'text-green-400' :
                          locationRisk.riskScore < 0.6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {locationRisk.riskScore < 0.3 ? 'Secure' :
                           locationRisk.riskScore < 0.6 ? 'Moderate Risk' : 'High Risk'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Submit Button */}
              <motion.button
                type="submit"
                disabled={isAnalyzing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                {isAnalyzing ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Security Patterns...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6" />
                    <span>Secure Login with AI Protection</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-slate-400 text-sm">
                🔒 Protected by quantum-grade encryption & real-time AI threat detection
              </p>
              <p className="text-slate-500 text-xs">
                {mockMode ? '🧪 Demo Mode Active' : '🌐 Live Security Mode'} • GDPR & DPDP Compliant
              </p>
              <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-slate-500">
                <span>✓ SIM Swap Detection</span>
                <span>✓ Location Verification</span>
                <span>✓ Device Authentication</span>
              </div>
            </div>
          </motion.div>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;
