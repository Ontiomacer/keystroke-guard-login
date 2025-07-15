
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Activity } from 'lucide-react';

interface EnhancedTypingData {
  key: string;
  timestamp: number;
  dwell_time?: number;
  flight_time?: number;
  error_rate?: number;
  typing_speed?: number;
  pressure?: number;
}

interface TypingMetrics {
  total_time: number;
  avg_dwell_time: number;
  avg_flight_time: number;
  typing_speed_wpm: number;
  error_rate: number;
  rhythm_consistency: number;
}

interface EnhancedTypingCaptureProps {
  onTypingData: (data: EnhancedTypingData[], metrics: TypingMetrics) => void;
}

const phrases = [
  "The quick brown fox jumps over the lazy dog",
  "Banking security is our top priority",
  "Secure authentication protects your account",
  "Type naturally for best results",
  "Advanced behavioral biometrics ensure safety",
  "Keystroke dynamics provide unique identification"
];

const EnhancedTypingCapture: React.FC<EnhancedTypingCaptureProps> = ({ onTypingData }) => {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [userInput, setUserInput] = useState('');
  const [typingData, setTypingData] = useState<EnhancedTypingData[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [keyDownTime, setKeyDownTime] = useState<{ [key: string]: number }>({});
  const [lastKeyUpTime, setLastKeyUpTime] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [riskScore, setRiskScore] = useState(0);

  useEffect(() => {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setCurrentPhrase(randomPhrase);
  }, []);

  const calculateRiskScore = useCallback((data: EnhancedTypingData[], metrics: TypingMetrics) => {
    // Simple risk calculation based on typing patterns
    let risk = 0;
    
    // Speed anomaly (very fast or very slow)
    if (metrics.typing_speed_wpm < 20 || metrics.typing_speed_wpm > 100) risk += 0.3;
    
    // High error rate
    if (metrics.error_rate > 0.1) risk += 0.2;
    
    // Inconsistent rhythm
    if (metrics.rhythm_consistency < 0.5) risk += 0.2;
    
    // Unusual dwell times
    if (metrics.avg_dwell_time < 50 || metrics.avg_dwell_time > 300) risk += 0.1;
    
    return Math.min(risk, 1.0);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const now = Date.now();
    
    if (!startTime) {
      setStartTime(now);
    }

    setKeyDownTime(prev => ({ ...prev, [e.key]: now }));
  }, [startTime]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    const now = Date.now();
    const keyDown = keyDownTime[e.key];
    
    if (!keyDown) return;

    const dwell_time = now - keyDown;
    const flight_time = lastKeyUpTime ? keyDown - lastKeyUpTime : 0;

    const newTypingData: EnhancedTypingData = {
      key: e.key,
      timestamp: now,
      dwell_time,
      flight_time,
      pressure: 1.0 // Simulated, would come from device in real implementation
    };

    setTypingData(prev => [...prev, newTypingData]);
    setLastKeyUpTime(now);
  }, [keyDownTime, lastKeyUpTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserInput(value);

    // Calculate errors
    let errorCount = 0;
    for (let i = 0; i < Math.min(value.length, currentPhrase.length); i++) {
      if (value[i] !== currentPhrase[i]) {
        errorCount++;
      }
    }
    setErrors(errorCount);

    // Check completion
    if (value.trim().toLowerCase() === currentPhrase.toLowerCase()) {
      setIsComplete(true);
      
      const totalTime = startTime ? Date.now() - startTime : 0;
      const dwellTimes = typingData.filter(d => d.dwell_time).map(d => d.dwell_time!);
      const flightTimes = typingData.filter(d => d.flight_time && d.flight_time > 0).map(d => d.flight_time!);
      
      const metrics: TypingMetrics = {
        total_time: totalTime,
        avg_dwell_time: dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0,
        avg_flight_time: flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0,
        typing_speed_wpm: totalTime > 0 ? (value.length / 5) / (totalTime / 60000) : 0,
        error_rate: value.length > 0 ? errorCount / value.length : 0,
        rhythm_consistency: calculateRhythmConsistency(flightTimes)
      };

      const risk = calculateRiskScore(typingData, metrics);
      setRiskScore(risk);
      
      onTypingData(typingData, metrics);
    }
  };

  const calculateRhythmConsistency = (flightTimes: number[]) => {
    if (flightTimes.length < 2) return 1.0;
    
    const mean = flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length;
    const variance = flightTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / flightTimes.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 1 - (stdDev / mean));
  };

  const renderPhrase = () => {
    return currentPhrase.split('').map((char, index) => {
      let className = 'transition-colors duration-200';
      
      if (index < userInput.length) {
        if (userInput[index] === char) {
          className += ' text-green-400 bg-green-400/20';
        } else {
          className += ' text-red-400 bg-red-400/20';
        }
      } else if (index === userInput.length) {
        className += ' text-blue-400 bg-blue-400/20 animate-pulse';
      } else {
        className += ' text-slate-500';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const accuracy = currentPhrase.length > 0 ? 
    Math.max(0, ((userInput.length - errors) / currentPhrase.length) * 100) : 0;

  const wpm = startTime && userInput.length > 0 ? 
    Math.round((userInput.length / 5) / ((Date.now() - startTime) / 60000)) : 0;

  const avgDwellTime = typingData.filter(d => d.dwell_time).length > 0 ?
    typingData.filter(d => d.dwell_time).reduce((sum, d) => sum + d.dwell_time!, 0) / 
    typingData.filter(d => d.dwell_time).length : 0;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-slate-300 text-sm mb-2">Type the following phrase naturally:</p>
        <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-lg leading-relaxed border border-slate-600">
          {renderPhrase()}
        </div>
      </div>

      <textarea
        value={userInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Start typing here..."
        className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none p-3"
        disabled={isComplete}
      />

      {/* Enhanced Stats */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{accuracy.toFixed(0)}%</div>
          <div className="text-xs text-slate-400">Accuracy</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{wpm}</div>
          <div className="text-xs text-slate-400">WPM</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{avgDwellTime.toFixed(0)}ms</div>
          <div className="text-xs text-slate-400">Avg Dwell</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{typingData.length}</div>
          <div className="text-xs text-slate-400">Keystrokes</div>
        </div>
      </div>

      {/* Real-time Risk Meter */}
      {typingData.length > 5 && !isComplete && (
        <div className="bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm">Real-time Risk Assessment</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                riskScore < 0.3 ? 'bg-green-500' : 
                riskScore < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(riskScore * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Current: {(riskScore * 100).toFixed(1)}% risk
          </div>
        </div>
      )}

      {/* Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center space-x-2 text-sm"
      >
        {isComplete ? (
          <>
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-green-400">
              Enhanced behavioral data captured! Risk Score: {(riskScore * 100).toFixed(1)}%
            </span>
          </>
        ) : (
          <>
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">
              Analyzing keystroke dynamics... ({userInput.length}/{currentPhrase.length})
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EnhancedTypingCapture;
