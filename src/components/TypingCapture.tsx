
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target } from 'lucide-react';

interface TypingData {
  key: string;
  timestamp: number;
  delay?: number;
}

interface TypingCaptureProps {
  onTypingData: (data: TypingData[]) => void;
}

const phrases = [
  "The quick brown fox jumps over the lazy dog",
  "Banking security is our top priority",
  "Secure authentication protects your account",
  "Type naturally for best results"
];

const TypingCapture: React.FC<TypingCaptureProps> = ({ onTypingData }) => {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [userInput, setUserInput] = useState('');
  const [typingData, setTypingData] = useState<TypingData[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [lastKeyTime, setLastKeyTime] = useState<number | null>(null);

  useEffect(() => {
    // Select a random phrase
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    setCurrentPhrase(randomPhrase);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const now = Date.now();
    
    if (!startTime) {
      setStartTime(now);
      setLastKeyTime(now);
      return;
    }

    const delay = lastKeyTime ? now - lastKeyTime : 0;
    
    const newTypingData: TypingData = {
      key: e.key,
      timestamp: now,
      delay
    };

    setTypingData(prev => [...prev, newTypingData]);
    setLastKeyTime(now);
  }, [startTime, lastKeyTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserInput(value);

    // Check if user completed the phrase
    if (value.trim().toLowerCase() === currentPhrase.toLowerCase()) {
      setIsComplete(true);
      
      // Calculate additional metrics
      const delays = typingData.filter(d => d.delay).map(d => d.delay!);
      const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
      
      // Add summary data point
      const finalData = [...typingData, {
        key: 'COMPLETE',
        timestamp: Date.now(),
        delay: avgDelay
      }];
      
      onTypingData(finalData);
    }
  };

  const accuracy = currentPhrase.length > 0 ? 
    Math.min(100, (userInput.length / currentPhrase.length) * 100) : 0;

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

  const wpm = startTime && userInput.length > 0 ? 
    Math.round((userInput.length / 5) / ((Date.now() - startTime) / 60000)) : 0;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-slate-300 text-sm mb-2">Type the following phrase:</p>
        <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-lg leading-relaxed border border-slate-600">
          {renderPhrase()}
        </div>
      </div>

      <textarea
        value={userInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Start typing here..."
        className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none p-3"
        disabled={isComplete}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{accuracy.toFixed(0)}%</div>
          <div className="text-xs text-slate-400">Accuracy</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{wpm}</div>
          <div className="text-xs text-slate-400">WPM</div>
        </div>
        <div className="bg-slate-800/30 rounded-lg p-3">
          <div className="text-lg font-semibold text-white">{typingData.length}</div>
          <div className="text-xs text-slate-400">Keystrokes</div>
        </div>
      </div>

      {/* Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center space-x-2 text-sm"
      >
        {isComplete ? (
          <>
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Behavioral data captured successfully!</span>
          </>
        ) : (
          <>
            <Brain className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">
              Capturing keystroke dynamics... ({userInput.length}/{currentPhrase.length})
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default TypingCapture;
