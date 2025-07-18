export interface TwilioLookupResult {
  valid: boolean;
  carrier?: {
    name: string;
    type: 'mobile' | 'landline' | 'voip';
    mobile_country_code?: string;
    mobile_network_code?: string;
  };
  porting?: {
    ported: boolean;
    port_date?: string;
  };
  riskScore: number;
  riskFactors: string[];
}

export interface PhoneVerificationResult {
  phoneNumber: string;
  isValid: boolean;
  carrier: string;
  isVoIP: boolean;
  isPorted: boolean;
  portDate?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export class IndianPhoneVerificationService {
  private static instance: IndianPhoneVerificationService;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new IndianPhoneVerificationService();
    }
    return this.instance;
  }

  // Known Indian carriers for validation
  private readonly indianCarriers = [
    'Jio', 'Airtel', 'VI', 'Vodafone Idea', 'BSNL', 'MTNL'
  ];

  private readonly voipProviders = [
    'Skype', 'WhatsApp', 'Google Voice', 'Truecaller'
  ];

  async verifyIndianPhone(phoneNumber: string, mockMode: boolean = true): Promise<PhoneVerificationResult> {
    // Clean and validate Indian phone number format
    const cleanNumber = this.cleanIndianPhoneNumber(phoneNumber);
    
    if (!this.isValidIndianFormat(cleanNumber)) {
      return {
        phoneNumber,
        isValid: false,
        carrier: 'Unknown',
        isVoIP: false,
        isPorted: false,
        riskScore: 1.0,
        riskLevel: 'high',
        riskFactors: ['Invalid Indian phone number format']
      };
    }

    if (mockMode) {
      return this.mockTwilioLookup(cleanNumber);
    }

    // Real Twilio Lookup API call would go here
    // This requires backend implementation with Supabase
    try {
      const response = await this.callTwilioAPI(cleanNumber);
      return this.processTwilioResponse(response, cleanNumber);
    } catch (error) {
      console.error('Twilio API error:', error);
      return this.getDefaultRiskProfile(cleanNumber);
    }
  }

  private cleanIndianPhoneNumber(phone: string): string {
    // Remove all non-digits
    let clean = phone.replace(/\D/g, '');
    
    // Handle different Indian number formats
    if (clean.startsWith('91') && clean.length === 12) {
      return clean; // Already has country code
    } else if (clean.length === 10) {
      return '91' + clean; // Add country code
    }
    
    return clean;
  }

  private isValidIndianFormat(phone: string): boolean {
    // Indian mobile numbers: +91 followed by 10 digits starting with 6,7,8,9
    const indianMobileRegex = /^91[6-9]\d{9}$/;
    return indianMobileRegex.test(phone);
  }

  private mockTwilioLookup(phoneNumber: string): PhoneVerificationResult {
    // Mock scenarios based on phone number patterns
    const scenarios = {
      'high-risk': {
        carrier: 'Unknown VoIP',
        isVoIP: true,
        isPorted: true,
        riskScore: 0.9,
        riskLevel: 'high' as const,
        riskFactors: ['VoIP number', 'Recently ported', 'Unknown carrier']
      },
      'medium-risk': {
        carrier: 'VI',
        isVoIP: false,
        isPorted: true,
        riskScore: 0.6,
        riskLevel: 'medium' as const,
        riskFactors: ['Recently ported number']
      },
      'jio-safe': {
        carrier: 'Jio',
        isVoIP: false,
        isPorted: false,
        riskScore: 0.1,
        riskLevel: 'low' as const,
        riskFactors: []
      },
      'airtel-safe': {
        carrier: 'Airtel',
        isVoIP: false,
        isPorted: false,
        riskScore: 0.15,
        riskLevel: 'low' as const,
        riskFactors: []
      }
    };

    let scenario = 'airtel-safe';
    if (phoneNumber.includes('999')) scenario = 'high-risk';
    else if (phoneNumber.includes('888')) scenario = 'medium-risk';
    else if (phoneNumber.includes('777')) scenario = 'jio-safe';

    const result = scenarios[scenario];
    
    return {
      phoneNumber,
      isValid: true,
      ...result,
      portDate: result.isPorted ? 
        new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : 
        undefined
    };
  }

  private async callTwilioAPI(phoneNumber: string): Promise<any> {
    // This would be implemented in a Supabase Edge Function
    // to securely handle Twilio API credentials
    const response = await fetch('/api/twilio-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('session_token')}`
      },
      body: JSON.stringify({ phoneNumber })
    });

    if (!response.ok) {
      throw new Error(`Twilio API failed: ${response.status}`);
    }

    return response.json();
  }

  private processTwilioResponse(twilioData: any, phoneNumber: string): PhoneVerificationResult {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Check if VoIP
    const isVoIP = twilioData.carrier?.type === 'voip' || 
                   this.voipProviders.some(provider => 
                     twilioData.carrier?.name?.toLowerCase().includes(provider.toLowerCase())
                   );
    
    if (isVoIP) {
      riskFactors.push('VoIP number detected');
      riskScore += 0.4;
    }

    // Check if recently ported
    const isPorted = twilioData.porting?.ported || false;
    if (isPorted) {
      riskFactors.push('Number recently ported');
      riskScore += 0.3;
    }

    // Check carrier reputation
    const carrier = twilioData.carrier?.name || 'Unknown';
    if (!this.indianCarriers.some(trusted => 
          carrier.toLowerCase().includes(trusted.toLowerCase()))) {
      riskFactors.push('Unknown or untrusted carrier');
      riskScore += 0.2;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 0.6) riskLevel = 'high';
    else if (riskScore > 0.3) riskLevel = 'medium';

    return {
      phoneNumber,
      isValid: twilioData.valid || false,
      carrier,
      isVoIP,
      isPorted,
      portDate: twilioData.porting?.port_date,
      riskScore: Math.min(riskScore, 1.0),
      riskLevel,
      riskFactors
    };
  }

  private getDefaultRiskProfile(phoneNumber: string): PhoneVerificationResult {
    return {
      phoneNumber,
      isValid: true,
      carrier: 'Unknown',
      isVoIP: false,
      isPorted: false,
      riskScore: 0.5,
      riskLevel: 'medium',
      riskFactors: ['Unable to verify carrier information']
    };
  }

  calculatePhoneRiskScore(verification: PhoneVerificationResult): number {
    return verification.riskScore;
  }
}
