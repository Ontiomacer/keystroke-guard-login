
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  source: 'gps' | 'ip' | 'network';
}

interface GeoLogEntry {
  id: string;
  phoneNumber: string;
  location: LocationData;
  ipAddress: string;
  deviceFingerprint: string;
  sessionToken: string;
  riskScore: number;
  fraudFlags: string[];
  timestamp: string;
}

interface FraudDetectionResult {
  riskScore: number;
  fraudFlags: string[];
  recommendations: string[];
  shouldBlock: boolean;
  requiresOTP: boolean;
}

export class LocationTrackingService {
  private static instance: LocationTrackingService;
  private apiBase = 'http://localhost:8000';
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new LocationTrackingService();
    }
    return this.instance;
  }

  // Get user location with fallbacks
  async getCurrentLocation(): Promise<LocationData> {
    try {
      // Try GPS first
      const position = await this.getGPSLocation();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
        source: 'gps'
      };
    } catch (error) {
      console.warn('GPS location failed, falling back to IP geolocation:', error);
      
      try {
        // Fallback to IP geolocation
        const ipLocation = await this.getIPLocation();
        return {
          latitude: ipLocation.lat,
          longitude: ipLocation.lon,
          accuracy: 10000, // IP geolocation is less accurate
          timestamp: Date.now(),
          source: 'ip'
        };
      } catch (ipError) {
        console.error('All location methods failed:', ipError);
        throw new Error('Unable to determine location');
      }
    }
  }

  private getGPSLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  private async getIPLocation(): Promise<{ lat: number; lon: number; country: string; city: string }> {
    // Using a free IP geolocation service
    const response = await fetch('http://ip-api.com/json/?fields=status,country,city,lat,lon');
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error('IP geolocation failed');
    }
    
    return {
      lat: data.lat,
      lon: data.lon,
      country: data.country,
      city: data.city
    };
  }

  // Log location with fraud detection
  async logLocation(
    phoneNumber: string, 
    deviceFingerprint: string, 
    sessionToken: string
  ): Promise<{ success: boolean; riskScore: number; fraudFlags: string[] }> {
    try {
      const location = await this.getCurrentLocation();
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const payload = {
        phone_number: phoneNumber,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          source: location.source
        },
        ip_address: ip,
        device_fingerprint: deviceFingerprint,
        session_token: sessionToken,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.apiBase}/api/geo-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Geo-log API error: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        riskScore: result.risk_score || 0,
        fraudFlags: result.fraud_flags || []
      };

    } catch (error) {
      console.error('Location logging failed:', error);
      return {
        success: false,
        riskScore: 0.5, // Default medium risk on failure
        fraudFlags: ['location_tracking_failed']
      };
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
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

  // Analyze fraud risk based on location history
  async analyzeFraudRisk(phoneNumber: string, currentLocation: LocationData): Promise<FraudDetectionResult> {
    try {
      const response = await fetch(`${this.apiBase}/api/analyze-location-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          current_location: currentLocation
        })
      });

      const result = await response.json();
      return {
        riskScore: result.risk_score,
        fraudFlags: result.fraud_flags,
        recommendations: result.recommendations,
        shouldBlock: result.should_block,
        requiresOTP: result.requires_otp
      };
    } catch (error) {
      console.error('Fraud risk analysis failed:', error);
      return {
        riskScore: 0.5,
        fraudFlags: ['analysis_failed'],
        recommendations: ['Manual review required'],
        shouldBlock: false,
        requiresOTP: true
      };
    }
  }
}
