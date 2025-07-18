export interface IPGeolocationData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  organization: string;
  asn: string;
  isVpn: boolean;
  isTor: boolean;
  isProxy: boolean;
  isHosting: boolean;
  riskScore: number;
}

export class IPGeolocationService {
  private static instance: IPGeolocationService;
  private apiKey: string;

  private constructor() {
    // In production, this would come from Supabase secrets
    this.apiKey = import.meta.env.VITE_IPINFO_API_KEY || 'demo-key';
  }

  static getInstance(): IPGeolocationService {
    if (!this.instance) {
      this.instance = new IPGeolocationService();
    }
    return this.instance;
  }

  async getLocationData(ip?: string, mockMode: boolean = true): Promise<IPGeolocationData> {
    if (mockMode) {
      return this.getMockLocationData(ip);
    }

    try {
      const targetIP = ip || await this.getCurrentIP();
      
      // Using IPInfo API (you can also use MaxMind GeoIP2, ipapi.co, etc.)
      const response = await fetch(`https://ipinfo.io/${targetIP}?token=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`IPInfo API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Additional threat intelligence check
      const threatData = await this.checkThreatIntelligence(targetIP);
      
      return this.processIPData(data, threatData);
    } catch (error) {
      console.error('IP Geolocation failed:', error);
      return this.getFallbackLocationData(ip);
    }
  }

  private async getCurrentIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get current IP:', error);
      return '8.8.8.8'; // Fallback
    }
  }

  private async checkThreatIntelligence(ip: string): Promise<any> {
    // This would integrate with threat intelligence APIs like:
    // - VirusTotal
    // - AbuseIPDB
    // - Shodan
    // - Custom threat feeds
    
    // Mock implementation
    return {
      isVpn: Math.random() > 0.8,
      isTor: Math.random() > 0.95,
      isProxy: Math.random() > 0.9,
      isHosting: Math.random() > 0.85,
      threatScore: Math.random() * 0.3 // Low threat for most IPs
    };
  }

  private processIPData(ipData: any, threatData: any): IPGeolocationData {
    const [lat, lng] = ipData.loc?.split(',').map(Number) || [0, 0];
    
    let riskScore = 0;
    if (threatData.isVpn) riskScore += 0.3;
    if (threatData.isTor) riskScore += 0.7;
    if (threatData.isProxy) riskScore += 0.4;
    if (threatData.isHosting) riskScore += 0.2;
    riskScore += threatData.threatScore || 0;

    return {
      ip: ipData.ip,
      country: ipData.country_name || ipData.country,
      countryCode: ipData.country_code || ipData.country,
      region: ipData.region_name || ipData.region,
      city: ipData.city,
      latitude: lat,
      longitude: lng,
      timezone: ipData.timezone,
      isp: ipData.isp || ipData.org,
      organization: ipData.org,
      asn: ipData.asn,
      isVpn: threatData.isVpn,
      isTor: threatData.isTor,
      isProxy: threatData.isProxy,
      isHosting: threatData.isHosting,
      riskScore: Math.min(riskScore, 1.0)
    };
  }

  private getMockLocationData(ip?: string): IPGeolocationData {
    const mockScenarios = [
      {
        ip: ip || '103.21.58.66',
        country: 'India',
        countryCode: 'IN',
        region: 'Maharashtra',
        city: 'Mumbai',
        latitude: 19.0760,
        longitude: 72.8777,
        timezone: 'Asia/Kolkata',
        isp: 'Reliance Jio',
        organization: 'Jio',
        asn: 'AS55836',
        isVpn: false,
        isTor: false,
        isProxy: false,
        isHosting: false,
        riskScore: 0.1
      },
      {
        ip: ip || '192.168.1.100',
        country: 'United States',
        countryCode: 'US',
        region: 'California',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        timezone: 'America/Los_Angeles',
        isp: 'NordVPN',
        organization: 'VPN Service',
        asn: 'AS54825',
        isVpn: true,
        isTor: false,
        isProxy: false,
        isHosting: false,
        riskScore: 0.6
      }
    ];

    // Return high-risk scenario if IP suggests it
    if (ip?.includes('tor') || ip?.includes('vpn')) {
      return mockScenarios[1];
    }

    return mockScenarios[0];
  }

  private getFallbackLocationData(ip?: string): IPGeolocationData {
    return {
      ip: ip || 'unknown',
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
      isp: 'Unknown',
      organization: 'Unknown',
      asn: 'Unknown',
      isVpn: false,
      isTor: false,
      isProxy: false,
      isHosting: false,
      riskScore: 0.5 // Medium risk when unknown
    };
  }

  calculateLocationRisk(current: IPGeolocationData, registered: any): number {
    let riskScore = current.riskScore;

    // Distance-based risk (rough calculation)
    if (registered) {
      const distance = this.calculateDistance(
        current.latitude, current.longitude,
        registered.latitude, registered.longitude
      );

      if (distance > 1000) riskScore += 0.3; // Different country/far location
      if (distance > 5000) riskScore += 0.2; // Very far location
    }

    // Country risk (example: high-risk countries)
    const highRiskCountries = ['CN', 'RU', 'IR', 'KP'];
    if (highRiskCountries.includes(current.countryCode)) {
      riskScore += 0.4;
    }

    return Math.min(riskScore, 1.0);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
