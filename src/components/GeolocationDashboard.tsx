
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Activity, AlertTriangle, Users, Globe, Shield } from 'lucide-react';
import LocationMap from './LocationMap';

interface LocationStats {
  totalLogins: number;
  riskLocations: number;
  countries: number;
  avgRiskScore: number;
  fraudAttempts: number;
  successRate: number;
}

const GeolocationDashboard: React.FC = () => {
  const [locationStats, setLocationStats] = useState<LocationStats>({
    totalLogins: 0,
    riskLocations: 0,
    countries: 0,
    avgRiskScore: 0,
    fraudAttempts: 0,
    successRate: 0
  });

  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  // Mock location data for demo
  const mockLocationData = [
    {
      id: '1',
      latitude: 28.7041,
      longitude: 77.1025,
      city: 'New Delhi',
      country: 'India',
      riskScore: 0.2,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      fraudFlags: []
    },
    {
      id: '2',
      latitude: 19.0760,
      longitude: 72.8777,
      city: 'Mumbai',
      country: 'India',
      riskScore: 0.1,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      fraudFlags: []
    },
    {
      id: '3',
      latitude: 6.5244,
      longitude: 3.3792,
      city: 'Lagos',
      country: 'Nigeria',
      riskScore: 0.9,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      fraudFlags: ['unusual_location', 'high_distance']
    },
    {
      id: '4',
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA',
      riskScore: 0.7,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      fraudFlags: ['location_jump']
    },
    {
      id: '5',
      latitude: 51.5074,
      longitude: -0.1278,
      city: 'London',
      country: 'UK',
      riskScore: 0.6,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      fraudFlags: ['time_anomaly']
    }
  ];

  useEffect(() => {
    // Calculate statistics from mock data
    const stats = {
      totalLogins: mockLocationData.length,
      riskLocations: mockLocationData.filter(loc => loc.riskScore > 0.6).length,
      countries: new Set(mockLocationData.map(loc => loc.country)).size,
      avgRiskScore: mockLocationData.reduce((sum, loc) => sum + loc.riskScore, 0) / mockLocationData.length,
      fraudAttempts: mockLocationData.filter(loc => loc.fraudFlags.length > 0).length,
      successRate: ((mockLocationData.length - mockLocationData.filter(loc => loc.riskScore > 0.8).length) / mockLocationData.length) * 100
    };
    setLocationStats(stats);
  }, []);

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
  }> = ({ icon, title, value, change, changeType }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className={`text-sm font-medium ${
          changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
          changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
          'text-gray-600 dark:text-gray-400'
        }`}>
          {change}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {title}
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Geolocation Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor login locations and detect geographical fraud patterns
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            System Active
          </span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          title="Total Logins"
          value={locationStats.totalLogins}
          change="+12%"
          changeType="positive"
        />
        
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />}
          title="High Risk Locations"
          value={locationStats.riskLocations}
          change="-8%"
          changeType="positive"
        />
        
        <StatCard
          icon={<Globe className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          title="Countries"
          value={locationStats.countries}
          change="+2"
          changeType="neutral"
        />
        
        <StatCard
          icon={<Activity className="w-6 h-6 text-green-600 dark:text-green-400" />}
          title="Avg Risk Score"
          value={`${(locationStats.avgRiskScore * 100).toFixed(1)}%`}
          change="-5%"
          changeType="positive"
        />
        
        <StatCard
          icon={<Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
          title="Fraud Attempts"
          value={locationStats.fraudAttempts}
          change="-15%"
          changeType="positive"
        />
        
        <StatCard
          icon={<Map className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
          title="Success Rate"
          value={`${locationStats.successRate.toFixed(1)}%`}
          change="+3%"
          changeType="positive"
        />
      </div>

      {/* Location Map */}
      <LocationMap
        locationData={mockLocationData}
        selectedLocation={selectedLocation}
        onLocationSelect={setSelectedLocation}
      />

      {/* Recent High-Risk Locations */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent High-Risk Login Attempts
        </h3>
        
        <div className="space-y-3">
          {mockLocationData
            .filter(loc => loc.riskScore > 0.6)
            .map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {location.city}, {location.country}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(location.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-red-600 dark:text-red-400 font-medium">
                    {(location.riskScore * 100).toFixed(0)}% Risk
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {location.fraudFlags.join(', ')}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GeolocationDashboard;
