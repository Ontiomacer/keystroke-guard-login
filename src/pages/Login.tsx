import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, Shield, Brain, MapPin, Settings, AlertTriangle } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import EnhancedTypingCapture from '../components/EnhancedTypingCapture';
import RiskMeter from '../components/RiskMeter';
import DeviceFingerprint from '../components/DeviceFingerprint';
import SecurityAlert from '../components/SecurityAlert';
import PasswordlessAuth from '../components/PasswordlessAuth';
import { toast } from 'sonner';
import { AdvancedFraudDetection } from '../services/simSwapDetection';
import { LocationTrackingService } from '../services/locationTracking';
import LocationTracker from '../components/LocationTracker';

interface LoginProps {
  authState: any;
  setAuthState: (state: any) => void;
}

const Login: React.FC<LoginProps> = ({ authState, setAuthState }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [typingData, setTypingData] = useState<any[]>([]);
  const [typingMetrics, setTypingMetrics] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [realTimeRisk, setRealTimeRisk] = useState(0);
  const [mockMode, setMockMode] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [simSwapResult, setSimSwapResult] = useState<any>(null);
  const [locationRisk, setLocationRisk] = useState<any>(null);
  const [showPasswordless, setShowPasswordless] = useState(false);
  const [locationRiskScore, setLocationRiskScore] = useState(0);
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  
  const fraudDetection = AdvancedFraudDetection.getInstance();

  // Get user location and perform advanced checks
  React.useEffect(() => {
    const performLocationCheck = async () => {
      const mockLocation = {
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        ip: email.includes('high-risk') ? 'high-risk-ip' : 
            email.includes('medium-risk') ? 'medium-risk-ip' : '192.168.1.1'
      };
      setLocationInfo(mockLocation);

      // Check location risk
      try {
        const registeredLocation = { city: 'New York', country: 'US', coordinates: [40.7128, -74.0060] };
        const locationRiskResult = await fraudDetection.checkLocationRisk(mockLocation.ip, registeredLocation, mockMode);
        setLocationRisk(locationRiskResult);

        if (locationRiskResult.locationMismatch) {
          setSecurityAlerts(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: 'location_risk',
            severity: locationRiskResult.riskScore > 0.7 ? 'high' : 'medium',
            message: `Login attempt from unusual location: ${locationRiskResult.currentLocation.city}, ${locationRiskResult.currentLocation.country}`,
            details: {
              distance: `${Math.round(locationRiskResult.distance)} km`,
              risk_score: locationRiskResult.riskScore.toFixed(3)
            }
          }]);
        }
      } catch (error) {
        console.error('Location check failed:', error);
      }
    };

    if (email) {
      performLocationCheck();
    }
  }, [email, mockMode]);

  // Perform SIM swap detection when phone number is entered
  React.useEffect(() => {
    const checkSIMSwap = async () => {
      if (phoneNumber) {
        try {
          const result = await fraudDetection.detectSIMSwap(phoneNumber, mockMode);
          setSimSwapResult(result);

          if (result.isSwapped) {
            setSecurityAlerts(prev => [...prev, {
              id: Date.now() + Math.random(),
              type: 'sim_swap',
              severity: result.riskLevel,
              message: `SIM swap detected! Confidence: ${(result.confidence * 100).toFixed(1)}%`,
              details: {
                swap_date: result.swapDate,
                confidence: (result.confidence * 100).toFixed(1) + '%',
                risk_level: result.riskLevel
              }
            }]);
          }
        } catch (error) {
          console.error('SIM swap detection failed:', error);
        }
      }
    };

    checkSIMSwap();
  }, [phoneNumber, mockMode]);

  const handleLocationLogged = (data: { riskScore: number; fraudFlags: string[] }) => {
    setLocationRiskScore(data.riskScore);
    
    // Add location-based security alerts
    if (data.riskScore > 0.7) {
      setSecurityAlerts(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'location_risk',
        severity: 'high',
        message: `High-risk location detected! Risk score: ${(data.riskScore * 100).toFixed(0)}%`,
        details: {
          risk_score: data.riskScore.toFixed(3),
          fraud_flags: data.fraudFlags.join(', ')
        }
      }]);
    }
  };

  const calculateEnhancedRiskScore = (metrics: any, device: any, location: any, simSwap: any, locationRisk: any) => {
    let riskScore = 0;

    // Behavioral analysis (25% weight)
    if (metrics?.typing_speed_wpm < 20 || metrics?.typing_speed_wpm > 100) riskScore += 0.08;
    if (metrics?.error_rate > 0.1) riskScore += 0.06;
    if (metrics?.rhythm_consistency < 0.5) riskScore += 0.06;
    if (metrics?.avg_dwell_time < 50 || metrics?.avg_dwell_time > 300) riskScore += 0.05;

    // SIM swap detection (25% weight)
    if (simSwap?.isSwapped) {
      riskScore += simSwap.confidence * 0.25;
    }

    // Location analysis (30% weight) - Enhanced
    if (locationRisk?.locationMismatch) {
      riskScore += locationRisk.riskScore * 0.25;
    }
    
    // Add geo-tracking risk score (additional 5% weight)
    riskScore += locationRiskScore * 0.05;

    // Device analysis (15% weight)
    if (device?.deviceType !== 'desktop') riskScore += 0.08;

    // Time-based analysis (5% weight)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) riskScore += 0.05;

    return Math.min(riskScore, 1.0);
  };

  const handleEnhancedTypingData = (data: any[], metrics: any) => {
    setTypingData(data);
    setTypingMetrics(metrics);
    
    const risk = calculateEnhancedRiskScore(metrics, deviceInfo, locationInfo, simSwapResult, locationRisk);
    setRealTimeRisk(risk);
  };

  const handlePasswordlessSuccess = (method: string, data: any) => {
    setAuthState({
      ...authState,
      isAuthenticated: true,
      email,
      username,
      riskScore: 0.1, // Passwordless methods are inherently low risk
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
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error(`Backend API Error (${endpoint}):`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !username || typingData.length === 0) {
      toast.error('Please fill all fields and complete the typing test');
      return;
    }

    setIsAnalyzing(true);

    try {
      const enhancedPayload = {
        email,
        username,
        phone_number: phoneNumber,
        typing_data: typingData,
        typing_metrics: typingMetrics,
        device_info: deviceInfo,
        location_info: locationInfo,
        sim_swap_result: simSwapResult,
        location_risk: locationRisk,
        geo_risk_score: locationRiskScore,
        timestamp: new Date().toISOString()
      };

      let result;

      if (mockMode) {
        console.log('Using mock mode for authentication');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalRiskScore = calculateEnhancedRiskScore(
          typingMetrics, deviceInfo, locationInfo, simSwapResult, locationRisk
        );
        
        // Enhanced risk scenarios including location
        if (simSwapResult?.isSwapped && simSwapResult.riskLevel === 'high') {
          result = {
            success: false,
            blocked: true,
            risk_score: 0.95,
            message: 'Authentication blocked due to SIM swap detection'
          };
        } else if (locationRiskScore > 0.8 || locationRisk?.distance > 1000) {
          result = {
            success: true,
            needs_otp: true,
            risk_score: Math.max(0.8, finalRiskScore),
            message: 'High location risk - additional verification required'
          };
        } else {
          result = {
            success: true,
            needs_otp: finalRiskScore > 0.4,
            risk_score: finalRiskScore,
            message: finalRiskScore < 0.3 ? 'Low risk - secure login' : 
                    finalRiskScore < 0.6 ? 'Medium risk - additional verification' :
                    'High risk - OTP required'
          };
        }
      } else {
        result = await callBackendAPI('/analyze', enhancedPayload);
      }

      if (result.blocked) {
        toast.error(result.message);
        setSecurityAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'suspicious_pattern',
          severity: 'high',
          message: 'Authentication blocked due to high risk factors',
          details: { risk_score: result.risk_score }
        }]);
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
          toast.warning(`Risk score: ${result.risk_score.toFixed(3)}. OTP sent for verification.`);
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
          toast.success(`Welcome! Enhanced security confirmed. Risk: ${result.risk_score.toFixed(3)}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(mockMode ? 'Mock authentication failed' : 'Backend connection failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const dismissAlert = (alertId: number) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (showPasswordless) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthCard>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Advanced Banking Security</h1>
            <p className="text-slate-400">Multi-Factor Fraud Detection System</p>
            {mockMode && (
              <p className="text-yellow-400 text-sm mt-2">
                Demo Mode: Try "high-risk@test.com" with phone "+1high-risk"
              </p>
            )}
          </div>

          {/* Passwordless Option */}
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowPasswordless(true)}
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              Try Passwordless Authentication →
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type="tel"
                  placeholder="Phone Number (for SIM detection)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Enhanced Behavioral Verification */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-white font-medium">Advanced Behavioral Analysis</h3>
              </div>
              <EnhancedTypingCapture onTypingData={handleEnhancedTypingData} />
            </div>

            {/* Location Tracking Component */}
            {phoneNumber && deviceInfo && (
              <LocationTracker
                phoneNumber={phoneNumber}
                deviceFingerprint={deviceInfo?.fingerprint || 'unknown'}
                sessionToken="demo-session-token"
                onLocationLogged={handleLocationLogged}
              />
            )}

            {/* Real-time Risk Assessment */}
            {realTimeRisk > 0 && (
              <div className="flex justify-center">
                <RiskMeter riskScore={realTimeRisk} size="md" />
              </div>
            )}

            {/* Device & Location Info */}
            <div className="grid grid-cols-1 gap-4">
              <DeviceFingerprint onDeviceInfo={setDeviceInfo} />
              
              {locationInfo && (
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center mb-3">
                    <MapPin className="w-5 h-5 text-green-400 mr-2" />
                    <h3 className="text-white font-medium">Location Verification</h3>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current:</span>
                      <span className="text-white">{locationInfo.city}, {locationInfo.state}</span>
                    </div>
                    {locationRisk && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk Level:</span>
                        <span className={`${
                          locationRisk.riskScore < 0.3 ? 'text-green-400' :
                          locationRisk.riskScore < 0.6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {locationRisk.riskScore < 0.3 ? 'Low' :
                           locationRisk.riskScore < 0.6 ? 'Medium' : 'High'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isAnalyzing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Security Patterns...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Advanced Secure Login</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Protected by AI-powered fraud detection with SIM swap & location analysis
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {mockMode ? 'Running in demo mode' : 'Connected to backend server'}
            </p>
          </div>
        </motion.div>
      </AuthCard>
    </div>
  );
};

export default Login;
