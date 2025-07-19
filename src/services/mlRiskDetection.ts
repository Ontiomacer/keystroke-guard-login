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

export interface FraudDetectionPrompt {
  transaction_id: string;
  amount: number;
  timestamp: string;
  location: string;
  merchant: string;
  device_type: string;
  gps_coordinates: { lat: number; lng: number };
  user_profile: {
    customer_age: number;
    customer_location: string;
    credit_limit: number;
    average_monthly_spending: number;
  };
  flags: {
    unusual_time?: boolean;
    rooted_device?: boolean;
    location_mismatch?: boolean;
    high_amount?: boolean;
    unusual_location?: boolean;
  };
}

export interface MLFeatures {
  // Additional computed features for backwards compatibility
  is_voip: number;
  is_ported: number;
  unknown_carrier: number;
  carrier_risk_score: number;
  phone_age_days: number;
  location_mismatch: number;
  vpn_detected: number;
  tor_detected: number;
  high_risk_country: number;
  ip_reputation_score: number;
  new_device: number;
  device_risk_score: number;
  browser_automation: number;
}

export interface RiskPrediction {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  result: "FRAUD" | "NOT_FRAUD";
  reason: string;
  factors: string[];
  recommendations: string[];
  shouldBlock: boolean;
  requiresOTP: boolean;
  location_coordinates?: { lat: number; lon: number };
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
  private isProduction: boolean;

  private constructor() {
    // Check if we're in a production environment
    this.isProduction = window.location.hostname !== 'localhost' && 
                       !window.location.hostname.includes('preview');
    
    // In production, these would come from Supabase secrets
    this.baseUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';
    this.apiKey = import.meta.env.VITE_ML_API_KEY || 'demo-key';
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
    transactionAmount: number = 5000,
    userProfile: any = {},
    merchant: string = "General",
    mockMode: boolean = true
  ): Promise<MLModelResponse> {
    // Always use mock mode in production or when localhost is not available
    if (mockMode || this.isProduction) {
      return this.mockFraudDetection(phoneMetadata, locationMetadata, deviceFingerprint, transactionAmount, userProfile, merchant);
    }

    try {
      // Call Supabase Edge Function for fraud detection
      const response = await fetch('/api/check-risk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phoneMetadata.phoneNumber,
          locationData: locationMetadata,
          deviceData: deviceFingerprint,
          transactionAmount,
          userProfile,
          merchant
        })
      });

      if (!response.ok) {
        throw new Error(`Risk assessment API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Transform response to match our interface
      return {
        prediction: {
          riskScore: result.risk.score,
          riskLevel: result.risk.level,
          confidence: result.risk.confidence,
          result: result.risk.score > 0.7 ? "FRAUD" : "NOT_FRAUD",
          reason: result.risk.reason || 'Risk assessment completed',
          factors: result.risk.factors,
          recommendations: this.generateRecommendations(result.risk.score, result.risk.factors),
          shouldBlock: result.risk.score > 0.8,
          requiresOTP: result.risk.score > 0.4,
          location_coordinates: result.risk.transaction?.coordinates
        },
        modelVersion: 'fraud-mistral-v1.0',
        processingTime: 200,
        requestId: crypto.randomUUID()
      };
    } catch (error) {
      console.error('Fraud detection failed:', error);
      // Fallback to rule-based assessment
      return this.fallbackRiskAssessment(phoneMetadata, locationMetadata, deviceFingerprint, transactionAmount, userProfile, merchant);
    }
  }

  private generateRecommendations(riskScore: number, factors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (riskScore > 0.8) {
      recommendations.push('Block transaction immediately');
      recommendations.push('Require manual verification');
    } else if (riskScore > 0.6) {
      recommendations.push('Require additional authentication');
      recommendations.push('Send SMS verification');
    } else if (riskScore > 0.4) {
      recommendations.push('Monitor transaction closely');
      recommendations.push('Consider step-up authentication');
    } else {
      recommendations.push('Proceed with standard verification');
    }
    
    if (factors.some(f => f.includes('VoIP'))) {
      recommendations.push('Request alternative phone verification');
    }
    
    if (factors.some(f => f.includes('location'))) {
      recommendations.push('Verify user location via GPS');
    }
    
    return recommendations;
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

  private mockFraudDetection(
    phone: PhoneMetadata,
    location: LocationMetadata,
    device: any,
    transactionAmount: number = 5000,
    userProfile: any = {},
    merchant: string = "General"
  ): MLModelResponse {
    // Create fraud detection scenario based on inputs
    let riskScore = 0.2; // Base risk
    const factors: string[] = [];
    const recommendations: string[] = [];
    
    // Transaction amount risk
    const creditLimit = userProfile.credit_limit || 50000;
    const amountRatio = transactionAmount / creditLimit;
    if (amountRatio > 0.8) {
      riskScore += 0.4;
      factors.push(`High transaction amount: ₹${transactionAmount.toLocaleString()} (${Math.round(amountRatio*100)}% of credit limit)`);
      recommendations.push('Require manual approval for high-value transaction');
    }

    // Location mismatch
    const userLocation = userProfile.customer_location || 'Mumbai, India';
    if (location.city !== userLocation.split(',')[0].trim()) {
      riskScore += 0.3;
      factors.push(`Location mismatch: Transaction in ${location.city}, user registered in ${userLocation}`);
      recommendations.push('Verify transaction location with user');
    }

    // Phone risk factors
    if (phone.lineType === 'voip') {
      riskScore += 0.3;
      factors.push('VoIP number detected');
      recommendations.push('Require additional phone verification');
    }
    
    if (phone.isPorted) {
      riskScore += 0.2;
      factors.push('Recently ported number');
      recommendations.push('Monitor for SIM swap activity');
    }

    // Device risk factors
    if (device?.rooted || device?.jailbroken) {
      riskScore += 0.3;
      factors.push('Compromised device detected');
      recommendations.push('Block transaction - security risk');
    }

    // Time-based risk
    const currentHour = new Date().getHours();
    if (currentHour < 6 || currentHour > 22) {
      riskScore += 0.1;
      factors.push('Unusual transaction time');
      recommendations.push('Additional verification for off-hours transaction');
    }

    // Merchant risk
    if (['Jewelry', 'Electronics', 'Cash Advance'].includes(merchant)) {
      riskScore += 0.2;
      factors.push(`High-risk merchant category: ${merchant}`);
    }

    // VPN/Proxy detection
    if (location.isVpn) {
      riskScore += 0.2;
      factors.push('VPN usage detected');
    }

    if (location.isTor) {
      riskScore += 0.6;
      factors.push('Tor network detected');
      recommendations.push('Block transaction - high risk anonymization');
    }

    riskScore = Math.min(riskScore, 1.0);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let fraudResult: "FRAUD" | "NOT_FRAUD" = "NOT_FRAUD";
    let reason = 'Transaction appears legitimate based on analysis';

    if (riskScore > 0.7) {
      riskLevel = 'high';
      fraudResult = 'FRAUD';
      reason = `High fraud probability due to: ${factors.slice(0, 2).join(', ')}`;
    } else if (riskScore > 0.4) {
      riskLevel = 'medium';
      reason = `Medium risk detected: ${factors.slice(0, 1).join(', ')}`;
    }

    const shouldBlock = riskScore > 0.8 || location.isTor;
    const requiresOTP = riskScore > 0.3;

    return {
      prediction: {
        riskScore,
        riskLevel,
        confidence: 0.85,
        result: fraudResult,
        reason,
        factors,
        recommendations,
        shouldBlock,
        requiresOTP,
        location_coordinates: {
          lat: location.latitude,
          lon: location.longitude
        }
      },
      modelVersion: 'fraud-mistral-mock-v1.0',
      processingTime: 150,
      requestId: crypto.randomUUID()
    };
  }

  private fallbackRiskAssessment(
    phone: PhoneMetadata,
    location: LocationMetadata,
    device: any,
    transactionAmount: number = 5000,
    userProfile: any = {},
    merchant: string = "General"
  ): MLModelResponse {
    // Simplified fallback when ML service is unavailable
    let riskScore = 0.3; // Default medium-low risk
    const factors = ['ML service unavailable - using rule-based assessment'];

    // Basic risk factors
    if (phone.lineType === 'voip') {
      riskScore += 0.3;
      factors.push('VoIP number detected');
    }
    
    if (location.isVpn || location.isTor) {
      riskScore += 0.4;
      factors.push('Anonymous network detected');
    }

    if (transactionAmount > 25000) {
      riskScore += 0.2;
      factors.push('High transaction amount');
    }

    const finalRisk = Math.min(riskScore, 1.0);
    const fraudResult: "FRAUD" | "NOT_FRAUD" = finalRisk > 0.6 ? "FRAUD" : "NOT_FRAUD";

    return {
      prediction: {
        riskScore: finalRisk,
        riskLevel: finalRisk > 0.6 ? 'high' : finalRisk > 0.3 ? 'medium' : 'low',
        confidence: 0.6,
        result: fraudResult,
        reason: `Fallback assessment: ${fraudResult === 'FRAUD' ? 'Multiple risk factors detected' : 'Standard risk level'}`,
        factors,
        recommendations: ['Consider manual review', 'ML service needs attention'],
        shouldBlock: false,
        requiresOTP: finalRisk > 0.5,
        location_coordinates: {
          lat: location.latitude,
          lon: location.longitude
        }
      },
      modelVersion: 'fallback_v1.0',
      processingTime: 50,
      requestId: crypto.randomUUID()
    };
  }

  // Admin dashboard methods with improved error handling
  async getModelMetrics(): Promise<any> {
    // Always return mock data in production or when API is not available
    if (this.isProduction) {
      return this.mockModelMetrics();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/api/v1/model/metrics`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
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
