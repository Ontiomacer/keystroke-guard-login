
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, Shield, Brain, MapPin, Settings } from 'lucide-react';
import AuthCard from '../components/AuthCard';
import EnhancedTypingCapture from '../components/EnhancedTypingCapture';
import RiskMeter from '../components/RiskMeter';
import DeviceFingerprint from '../components/DeviceFingerprint';
import { toast } from 'sonner';

interface LoginProps {
  authState: any;
  setAuthState: (state: any) => void;
}

const Login: React.FC<LoginProps> = ({ authState, setAuthState }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [typingData, setTypingData] = useState<any[]>([]);
  const [typingMetrics, setTypingMetrics] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [realTimeRisk, setRealTimeRisk] = useState(0);
  const [mockMode, setMockMode] = useState(true); // Default to mock mode for testing

  // Get user location for geolocation risk assessment
  React.useEffect(() => {
    // Simulate location detection (in real app, use IP geolocation API)
    setLocationInfo({
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      ip: '192.168.1.1' // Mock IP
    });
  }, []);

  const calculateEnhancedRiskScore = (metrics: any, device: any, location: any) => {
    let riskScore = 0;

    // Typing behavior analysis (40% weight)
    if (metrics.typing_speed_wpm < 20 || metrics.typing_speed_wpm > 100) riskScore += 0.15;
    if (metrics.error_rate > 0.1) riskScore += 0.1;
    if (metrics.rhythm_consistency < 0.5) riskScore += 0.1;
    if (metrics.avg_dwell_time < 50 || metrics.avg_dwell_time > 300) riskScore += 0.05;

    // Device fingerprint analysis (30% weight)
    if (device?.deviceType !== 'desktop') riskScore += 0.1; // Higher risk for mobile
    
    // Location analysis (20% weight)
    // In real implementation, compare with registered location
    if (location?.country !== 'US') riskScore += 0.15;

    // Time-based analysis (10% weight)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) riskScore += 0.1; // Login outside normal hours

    return Math.min(riskScore, 1.0);
  };

  const handleEnhancedTypingData = (data: any[], metrics: any) => {
    setTypingData(data);
    setTypingMetrics(metrics);
    
    // Calculate real-time risk score
    const risk = calculateEnhancedRiskScore(metrics, deviceInfo, locationInfo);
    setRealTimeRisk(risk);
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
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error(`Backend API Error (${endpoint}):`, error);
      
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        console.error('Network error - backend server may not be running on localhost:8000');
      }
      
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
      // Enhanced payload with new features
      const enhancedPayload = {
        email,
        username,
        typing_data: typingData,
        typing_metrics: typingMetrics,
        device_info: deviceInfo,
        location_info: locationInfo,
        timestamp: new Date().toISOString()
      };

      let result;

      if (mockMode) {
        // Mock mode for testing
        console.log('Using mock mode for authentication');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        
        const finalRiskScore = calculateEnhancedRiskScore(typingMetrics, deviceInfo, locationInfo);
        
        // Simulate different scenarios based on email
        if (email.includes('high-risk')) {
          result = {
            success: true,
            needs_otp: true,
            risk_score: 0.8,
            message: 'High risk detected - OTP required'
          };
        } else if (email.includes('medium-risk')) {
          result = {
            success: true,
            needs_otp: true,
            risk_score: 0.5,
            message: 'Medium risk - additional verification'
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
        // Real backend call
        result = await callBackendAPI('/analyze', enhancedPayload);
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
              locationInfo
            }
          });
          toast.success(`Welcome! Enhanced security confirmed. Risk: ${result.risk_score.toFixed(3)}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (mockMode) {
        toast.error('Mock authentication failed. Please try again.');
      } else {
        toast.error('Backend connection failed. Check if the server is running on localhost:8000');
      }
    } finally {
      setIsAnalyzing(false);
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
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Enhanced Banking Security</h1>
            <p className="text-slate-400">Advanced Behavioral Authentication</p>
            {mockMode && (
              <p className="text-yellow-400 text-sm mt-2">
                Demo Mode: Try "high-risk@test.com" or "medium-risk@test.com"
              </p>
            )}
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
            </div>

            {/* Enhanced Behavioral Verification */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center mb-3">
                <Brain className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-white font-medium">Enhanced Behavioral Analysis</h3>
              </div>
              <EnhancedTypingCapture onTypingData={handleEnhancedTypingData} />
            </div>

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
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-white">{locationInfo.city}, {locationInfo.state}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-slate-400">Status:</span>
                      <span className="text-green-400">Verified</span>
                    </div>
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
                  <span>Analyzing Enhanced Patterns...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Enhanced Secure Login</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Protected by advanced AI-powered behavioral biometrics
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
