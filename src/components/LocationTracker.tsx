
import React, { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, Wifi, Navigation } from 'lucide-react';
import { LocationTrackingService } from '../services/locationTracking';
import LocationConsent from './LocationConsent';
import { toast } from 'sonner';

interface LocationTrackerProps {
  phoneNumber: string;
  deviceFingerprint: string;
  sessionToken: string;
  onLocationLogged: (data: { riskScore: number; fraudFlags: string[] }) => void;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  phoneNumber,
  deviceFingerprint,
  sessionToken,
  onLocationLogged
}) => {
  const [showConsent, setShowConsent] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'tracking'>('pending');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [riskScore, setRiskScore] = useState<number>(0);
  
  const locationService = LocationTrackingService.getInstance();

  useEffect(() => {
    // Check if location consent was previously given
    const consentGiven = localStorage.getItem('location_consent');
    if (consentGiven === 'true') {
      handleLocationTracking();
    } else if (consentGiven === 'false') {
      setLocationStatus('denied');
    } else {
      setShowConsent(true);
    }
  }, []);

  const handleConsent = (granted: boolean) => {
    localStorage.setItem('location_consent', granted.toString());
    setLocationStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      handleLocationTracking();
    } else {
      toast.warning('Location denied. Using IP-based location for security.');
      // Still track using IP location
      handleLocationTracking();
    }
  };

  const handleLocationTracking = async () => {
    setLocationStatus('tracking');
    
    try {
      const result = await locationService.logLocation(
        phoneNumber,
        deviceFingerprint,
        sessionToken
      );

      if (result.success) {
        setRiskScore(result.riskScore);
        onLocationLogged({
          riskScore: result.riskScore,
          fraudFlags: result.fraudFlags
        });

        // Get location description for display
        const location = await locationService.getCurrentLocation();
        if (location.source === 'gps') {
          setCurrentLocation('GPS Location Verified');
        } else {
          setCurrentLocation('IP-based Location');
        }

        // Show risk alerts if needed
        if (result.riskScore > 0.7) {
          toast.error(`High risk location detected (${(result.riskScore * 100).toFixed(0)}%)`);
        } else if (result.riskScore > 0.4) {
          toast.warning(`Medium risk location (${(result.riskScore * 100).toFixed(0)}%)`);
        } else {
          toast.success('Location verified successfully');
        }
      } else {
        toast.error('Location tracking failed');
        onLocationLogged({
          riskScore: 0.5,
          fraudFlags: ['tracking_failed']
        });
      }
    } catch (error) {
      console.error('Location tracking error:', error);
      toast.error('Location service unavailable');
      onLocationLogged({
        riskScore: 0.5,
        fraudFlags: ['service_error']
      });
    }
  };

  const getStatusIcon = () => {
    switch (locationStatus) {
      case 'granted':
      case 'tracking':
        return <MapPin className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <Wifi className="w-5 h-5 text-yellow-500" />;
      default:
        return <Navigation className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (locationStatus) {
      case 'granted':
        return 'GPS Location Enabled';
      case 'denied':
        return 'Using IP Location';
      case 'tracking':
        return 'Verifying Location...';
      default:
        return 'Location Permission Pending';
    }
  };

  const getRiskColor = () => {
    if (riskScore < 0.3) return 'text-green-500';
    if (riskScore < 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <>
      {showConsent && (
        <LocationConsent
          onConsent={handleConsent}
          onPrivacyPolicyClick={() => {
            // Open privacy policy
            window.open('/privacy-policy', '_blank');
          }}
        />
      )}

      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <h3 className="text-white font-medium">Location Security</h3>
          </div>
          
          {riskScore > 0 && (
            <div className={`text-sm font-medium ${getRiskColor()}`}>
              Risk: {(riskScore * 100).toFixed(0)}%
            </div>
          )}
        </div>

        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Status:</span>
            <span className="text-white">{getStatusText()}</span>
          </div>
          
          {currentLocation && (
            <div className="flex justify-between">
              <span className="text-slate-400">Method:</span>
              <span className="text-white">{currentLocation}</span>
            </div>
          )}
          
          {locationStatus === 'tracking' && (
            <div className="flex items-center justify-center py-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-blue-400 text-xs">Analyzing location...</span>
            </div>
          )}
        </div>

        {riskScore > 0.6 && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-xs">
                Unusual location detected - Additional verification may be required
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LocationTracker;
