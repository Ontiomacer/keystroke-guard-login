
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, AlertTriangle, Users, TrendingUp } from 'lucide-react';

interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  riskScore: number;
  timestamp: string;
  fraudFlags: string[];
}

interface LocationMapProps {
  locationData: LocationData[];
  selectedLocation?: string;
  onLocationSelect?: (locationId: string) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  locationData, 
  selectedLocation, 
  onLocationSelect 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapStats, setMapStats] = useState({
    totalLogins: 0,
    riskLocations: 0,
    countries: 0
  });

  useEffect(() => {
    // Calculate statistics
    const stats = {
      totalLogins: locationData.length,
      riskLocations: locationData.filter(loc => loc.riskScore > 0.6).length,
      countries: new Set(locationData.map(loc => loc.country)).size
    };
    setMapStats(stats);
  }, [locationData]);

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 0.3) return '#10b981'; // green
    if (riskScore < 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Location Analytics Dashboard
        </h3>
        
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-2">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {mapStats.totalLogins}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Logins
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {mapStats.riskLocations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              High Risk
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {mapStats.countries}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Countries
            </div>
          </div>
        </div>
      </div>

      {/* Map Container - Placeholder for actual map implementation */}
      <div className="relative">
        <div 
          ref={mapRef}
          className="h-96 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-700 dark:to-slate-600 relative overflow-hidden"
        >
          {/* Map Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                Interactive Location Map
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Integrate with Leaflet.js or Mapbox to display real-time login locations, 
                risk zones, and geographical fraud patterns.
              </p>
            </div>
          </div>

          {/* Simulated location markers */}
          {locationData.slice(0, 5).map((location, index) => (
            <div
              key={location.id}
              className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-125 ${
                selectedLocation === location.id ? 'scale-125 z-10' : ''
              }`}
              style={{
                backgroundColor: getRiskColor(location.riskScore),
                left: `${20 + index * 15}%`,
                top: `${30 + index * 10}%`
              }}
              onClick={() => onLocationSelect?.(location.id)}
              title={`${location.city}, ${location.country} - Risk: ${(location.riskScore * 100).toFixed(0)}%`}
            />
          ))}
        </div>
      </div>

      {/* Location List */}
      <div className="p-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Recent Login Locations
        </h4>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {locationData.slice(0, 10).map((location) => (
            <div
              key={location.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedLocation === location.id
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700'
                  : 'bg-gray-50 border-gray-200 dark:bg-slate-700 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
              }`}
              onClick={() => onLocationSelect?.(location.id)}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: getRiskColor(location.riskScore) }}
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {location.city}, {location.country}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(location.timestamp)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-medium ${getRiskColor(location.riskScore) === '#ef4444' ? 'text-red-600 dark:text-red-400' : getRiskColor(location.riskScore) === '#f59e0b' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                  {(location.riskScore * 100).toFixed(0)}% Risk
                </div>
                {location.fraudFlags.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {location.fraudFlags.length} flags
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationMap;
