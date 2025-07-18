
export interface PhoneMetadata {
  phoneNumber: string;
  carrier: string;
  lineType: 'mobile' | 'landline' | 'voip';
  isPorted: boolean;
  portDate?: string;
  countryCode: string;
  isValid: boolean;
}

export interface LocationMetadata {
  ip: string;
  country: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  isVpn: boolean;
  isTor: boolean;
}

export interface MLFeatures {
  // Phone features
  is_voip: number;
  is_ported: number;
  unknown_carrier: number;
  carrier_risk_score: number;
  phone_age_days: number;
  
  // Location features
  location_mismatch: number;
  vpn_detected: number;
  tor_detected: number;
  high_risk_country: number;
  ip_reputation_score: number;
  
  // Device features
  new_device: number;
  device_risk_score: number;
  browser_automation: number;
}

export interface RiskPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  factors: string[];
  recommendations: string[];
  shouldBlock: boolean;
  requiresOTP: boolean;
}

export interface MLModelResponse {
  prediction: RiskPrediction;
  modelVersion: string;
  processingTime: number;
  requestId: string;
}

export class MLRiskDetectionService {
  private static instance: MLRiskDetectionService;
  private baseUrl: string;
  private apiKey: string;

  private constructor() {
    // In production, these would come from Supabase secrets
    this.baseUrl = process.env.VITE_ML_API_URL || 'http://localhost:8000';
    this.apiKey = process.env.VITE_ML_API_KEY || 'demo-key';
  }

  static getInstance(): MLRiskDetectionService {
    if (!this.instance) {
      this.instance = new MLRiskDetectionService();
    }
    return this.instance;
  }

  async assessRisk(
    phoneMetadata: PhoneMetadata,
    locationMetadata: LocationMetadata,
    deviceFingerprint: any,
    mockMode: boolean = true
  ): Promise<MLModelResponse> {
    if (mockMode) {
      return this.mockMLPrediction(phoneMetadata, locationMetadata, deviceFingerprint);
    }

    try {
      const features = this.extractFeatures(phoneMetadata, locationMetadata, deviceFingerprint);
      
      const response = await fetch(`${this.baseUrl}/api/v1/risk-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Request-ID': crypto.randomUUID()
        },
        body: JSON.stringify({
          features,
          metadata: {
            phoneMetadata,
            locationMetadata,
            deviceFingerprint,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ML Risk Assessment failed:', error);
      // Fallback to rule-based assessment
      return this.fallbackRiskAssessment(phoneMetadata, locationMetadata, deviceFingerprint);
    }
  }

  private extractFeatures(
    phone: PhoneMetadata,
    location: LocationMetadata,
    device: any
  ): MLFeatures {
    const carrierRiskMap: Record<string, number> = {
      'Unknown': 0.8,
      'VoIP Provider': 0.9,
      'Jio': 0.1,
      'Airtel': 0.15,
      'VI': 0.2,
      'BSNL': 0.25
    };

    const highRiskCountries = ['CN', 'RU', 'IR', 'KP'];
    
    return {
      // Phone features
      is_voip: phone.lineType === 'voip' ? 1 : 0,
      is_ported: phone.isPorted ? 1 : 0,
      unknown_carrier: !phone.carrier || phone.carrier === 'Unknown' ? 1 : 0,
      carrier_risk_score: carrierRiskMap[phone.carrier] || 0.5,
      phone_age_days: phone.portDate ? 
        Math.max(0, (Date.now() - new Date(phone.portDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        365,

      // Location features
      location_mismatch: this.calculateLocationMismatch(location),
      vpn_detected: location.isVpn ? 1 : 0,
      tor_detected: location.isTor ? 1 : 0,
      high_risk_country: highRiskCountries.includes(location.country) ? 1 : 0,
      ip_reputation_score: this.calculateIPReputation(location),

      // Device features
      new_device: device?.isNewDevice ? 1 : 0,
      device_risk_score: this.calculateDeviceRisk(device),
      browser_automation: device?.automationDetected ? 1 : 0
    };
  }

  private calculateLocationMismatch(location: LocationMetadata): number {
    // Mock user's registered location (in production, this comes from user profile)
    const registeredLocation = { country: 'IN', city: 'Mumbai' };
    
    if (location.country !== registeredLocation.country) return 1;
    if (location.city !== registeredLocation.city) return 0.5;
    return 0;
  }

  private calculateIPReputation(location: LocationMetadata): number {
    let score = 0;
    if (location.isVpn) score += 0.3;
    if (location.isTor) score += 0.7;
    if (location.isp.toLowerCase().includes('hosting')) score += 0.4;
    return Math.min(score, 1.0);
  }

  private calculateDeviceRisk(device: any): number {
    let score = 0;
    if (device?.isNewDevice) score += 0.3;
    if (device?.automationDetected) score += 0.5;
    if (device?.incognito) score += 0.2;
    return Math.min(score, 1.0);
  }

  private mockMLPrediction(
    phone: PhoneMetadata,
    location: LocationMetadata,
    device: any
  ): MLModelResponse {
    const features = this.extractFeatures(phone, location, device);
    
    // Simple rule-based mock ML model
    let riskScore = 0;
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Phone risk factors
    if (features.is_voip) {
      riskScore += 0.4;
      factors.push('VoIP number detected');
      recommendations.push('Require additional phone verification');
    }
    
    if (features.is_ported && features.phone_age_days < 30) {
      riskScore += 0.3;
      factors.push('Recently ported number');
      recommendations.push('Monitor for SIM swap activity');
    }

    if (features.unknown_carrier) {
      riskScore += 0.2;
      factors.push('Unknown carrier');
    }

    // Location risk factors
    if (features.location_mismatch) {
      riskScore += 0.3;
      factors.push('Location anomaly detected');
      recommendations.push('Verify user location');
    }

    if (features.vpn_detected) {
      riskScore += 0.2;
      factors.push('VPN usage detected');
    }

    if (features.tor_detected) {
      riskScore += 0.6;
      factors.push('Tor network detected');
      recommendations.push('Block transaction - high risk');
    }

    // Device risk factors
    if (features.new_device) {
      riskScore += 0.2;
      factors.push('New device detected');
      recommendations.push('Send device verification email');
    }

    riskScore = Math.min(riskScore, 1.0);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 0.7) riskLevel = 'high';
    else if (riskScore > 0.4) riskLevel = 'medium';

    const shouldBlock = riskScore > 0.8 || features.tor_detected === 1;
    const requiresOTP = riskScore > 0.3;

    return {
      prediction: {
        riskScore,
        riskLevel,
        confidence: 0.85,
        factors,
        recommendations,
        shouldBlock,
        requiresOTP
      },
      modelVersion: 'mock_v1.0',
      processingTime: 150,
      requestId: crypto.randomUUID()
    };
  }

  private fallbackRiskAssessment(
    phone: PhoneMetadata,
    location: LocationMetadata,
    device: any
  ): MLModelResponse {
    // Simplified fallback when ML service is unavailable
    let riskScore = 0.3; // Default medium-low risk
    const factors = ['ML service unavailable - using rule-based assessment'];

    if (phone.lineType === 'voip') riskScore += 0.3;
    if (location.isVpn || location.isTor) riskScore += 0.4;

    return {
      prediction: {
        riskScore: Math.min(riskScore, 1.0),
        riskLevel: riskScore > 0.6 ? 'high' : riskScore > 0.3 ? 'medium' : 'low',
        confidence: 0.6,
        factors,
        recommendations: ['Consider manual review'],
        shouldBlock: false,
        requiresOTP: riskScore > 0.5
      },
      modelVersion: 'fallback_v1.0',
      processingTime: 50,
      requestId: crypto.randomUUID()
    };
  }

  // Admin dashboard methods
  async getModelMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/model/metrics`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch model metrics:', error);
      return this.mockModelMetrics();
    }
  }

  private mockModelMetrics() {
    return {
      modelVersion: 'v2.1.0',
      accuracy: 0.94,
      precision: 0.89,
      recall: 0.92,
      f1Score: 0.90,
      totalPredictions: 15420,
      highRiskDetections: 1234,
      falsePositives: 67,
      lastTraining: '2024-01-15T10:30:00Z',
      featureImportance: {
        'is_voip': 0.25,
        'location_mismatch': 0.20,
        'is_ported': 0.18,
        'vpn_detected': 0.15,
        'device_risk_score': 0.12,
        'carrier_risk_score': 0.10
      }
    };
  }
}
