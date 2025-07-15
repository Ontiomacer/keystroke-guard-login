
import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeviceInfo {
  userAgent: string;
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  fingerprint: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
}

interface DeviceFingerprintProps {
  onDeviceInfo: (info: DeviceInfo) => void;
}

const DeviceFingerprint: React.FC<DeviceFingerprintProps> = ({ onDeviceInfo }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Canvas fingerprinting
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test', 2, 2);
      }
      
      const canvasData = canvas.toDataURL();
      
      // Collect device characteristics
      const info: DeviceInfo = {
        userAgent: navigator.userAgent,
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        fingerprint: btoa(
          navigator.userAgent + 
          screen.width + 
          screen.height + 
          navigator.language + 
          navigator.platform +
          canvasData
        ).slice(0, 32),
        deviceType: getDeviceType()
      };
      
      setDeviceInfo(info);
      onDeviceInfo(info);
    };

    const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      if (/tablet|ipad|playbook|silk/.test(userAgent)) {
        return 'tablet';
      }
      
      if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
        return 'mobile';
      }
      
      return 'desktop';
    };

    generateFingerprint();
  }, [onDeviceInfo]);

  if (!deviceInfo) return null;

  const getDeviceIcon = () => {
    switch (deviceInfo.deviceType) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  const DeviceIcon = getDeviceIcon();

  return (
    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center mb-3">
        <DeviceIcon className="w-5 h-5 text-blue-400 mr-2" />
        <h3 className="text-white font-medium">Device Information</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Type:</span>
          <span className="text-white capitalize">{deviceInfo.deviceType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Screen:</span>
          <span className="text-white">{deviceInfo.screen}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Timezone:</span>
          <span className="text-white">{deviceInfo.timezone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Fingerprint:</span>
          <span className="text-white font-mono text-xs">{deviceInfo.fingerprint}</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceFingerprint;
