
export interface SIMSwapResult {
  isSwapped: boolean;
  swapDate?: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface LocationRiskResult {
  distance: number;
  riskScore: number;
  locationMismatch: boolean;
  currentLocation: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  registeredLocation: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
}

export class AdvancedFraudDetection {
  private static instance: AdvancedFraudDetection;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new AdvancedFraudDetection();
    }
    return this.instance;
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  async detectSIMSwap(phoneNumber: string, mockMode: boolean = true): Promise<SIMSwapResult> {
    if (mockMode) {
      // Mock SIM swap detection for demo
      const riskScenarios = {
        'high-risk': { isSwapped: true, confidence: 0.95, riskLevel: 'high' as const },
        'medium-risk': { isSwapped: true, confidence: 0.6, riskLevel: 'medium' as const },
        'low-risk': { isSwapped: false, confidence: 0.1, riskLevel: 'low' as const },
      };

      const scenario = phoneNumber.includes('high-risk') ? 'high-risk' :
                      phoneNumber.includes('medium-risk') ? 'medium-risk' : 'low-risk';
      
      return {
        ...riskScenarios[scenario],
        swapDate: riskScenarios[scenario].isSwapped ? 
          new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : 
          undefined
      };
    }

    // Real implementation would call telecom API like Twilio Lookup
    try {
      // Placeholder for real SIM swap detection API
      console.log(`Checking SIM swap for ${phoneNumber}`);
      return {
        isSwapped: false,
        confidence: 0.1,
        riskLevel: 'low'
      };
    } catch (error) {
      console.error('SIM swap detection failed:', error);
      return {
        isSwapped: false,
        confidence: 0,
        riskLevel: 'low'
      };
    }
  }

  async checkLocationRisk(currentIP: string, registeredLocation: any, mockMode: boolean = true): Promise<LocationRiskResult> {
    if (mockMode) {
      // Mock locations for demo
      const locations = {
        'high-risk': {
          current: { city: 'Lagos', country: 'Nigeria', coordinates: [6.5244, 3.3792] as [number, number] },
          registered: { city: 'New York', country: 'US', coordinates: [40.7128, -74.0060] as [number, number] }
        },
        'medium-risk': {
          current: { city: 'Toronto', country: 'Canada', coordinates: [43.6532, -79.3832] as [number, number] },
          registered: { city: 'New York', country: 'US', coordinates: [40.7128, -74.0060] as [number, number] }
        },
        'low-risk': {
          current: { city: 'New York', country: 'US', coordinates: [40.7128, -74.0060] as [number, number] },
          registered: { city: 'New York', country: 'US', coordinates: [40.7128, -74.0060] as [number, number] }
        }
      };

      const scenario = currentIP.includes('high-risk') ? 'high-risk' :
                      currentIP.includes('medium-risk') ? 'medium-risk' : 'low-risk';
      
      const locationData = locations[scenario];
      const distance = this.calculateDistance(
        locationData.current.coordinates[0], locationData.current.coordinates[1],
        locationData.registered.coordinates[0], locationData.registered.coordinates[1]
      );

      return {
        distance,
        riskScore: distance > 1000 ? 0.8 : distance > 500 ? 0.5 : 0.1,
        locationMismatch: distance > 100,
        currentLocation: locationData.current,
        registeredLocation: locationData.registered
      };
    }

    // Real implementation would use IP geolocation service
    try {
      // Placeholder for real geolocation API call
      console.log(`Checking location risk for IP: ${currentIP}`);
      return {
        distance: 0,
        riskScore: 0.1,
        locationMismatch: false,
        currentLocation: { city: 'Unknown', country: 'Unknown', coordinates: [0, 0] },
        registeredLocation: registeredLocation || { city: 'Unknown', country: 'Unknown', coordinates: [0, 0] }
      };
    } catch (error) {
      console.error('Location risk check failed:', error);
      throw error;
    }
  }

  analyzeLoginPattern(loginHistory: any[]): {
    suspiciousActivity: boolean;
    riskFactors: string[];
    riskScore: number;
  } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Check for unusual login times
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      riskFactors.push('Login outside normal hours');
      riskScore += 0.2;
    }

    // Check for multiple failed attempts
    const recentFailures = loginHistory.filter(login => 
      !login.success && 
      Date.now() - new Date(login.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length;

    if (recentFailures > 3) {
      riskFactors.push('Multiple failed login attempts in 24h');
      riskScore += 0.3;
    }

    // Check for new device/location patterns
    const uniqueDevices = new Set(loginHistory.map(login => login.deviceFingerprint)).size;
    if (uniqueDevices > 5) {
      riskFactors.push('Multiple devices used recently');
      riskScore += 0.2;
    }

    return {
      suspiciousActivity: riskScore > 0.4,
      riskFactors,
      riskScore: Math.min(riskScore, 1.0)
    };
  }
}
