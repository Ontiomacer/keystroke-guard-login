
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, Shield, Brain, MapPin } from 'lucide-react';
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

      // For demo purposes, simulate backend response based on enhanced risk calculation
      const finalRiskScore = calculateEnhancedRiskScore(typingMetrics, deviceInfo, locationInfo);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = {
        success: true,
        needs_otp: finalRiskScore > 0.4, // Lower threshold with enhanced detection
        risk_score: finalRiskScore,
        message: finalRiskScore < 0.3 ? 'Low risk - secure login' : 
                finalRiskScore < 0.6 ? 'Medium risk - additional verification' :
                'High risk - OTP required'
      };

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
      toast.error('Authentication failed. Please try again.');
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
          </div>
        </motion.div>
      </AuthCard>
    </div>
  );
};

export default Login;
