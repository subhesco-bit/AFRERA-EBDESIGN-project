/**
 * Real-time Tracking Component
 * Displays live shipment tracking with map visualization
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { MapPin, Truck, Clock, Navigation, AlertTriangle } from 'lucide-react';
import { logisticsAPI } from '../../services/componentApi';

// FE-02 note: not resolved here. This component polls on a 5-second interval
// for live position/temperature data tied to a specific shipmentId — a
// one-time prop hand-off from a parent page wouldn't fit that refresh model,
// and there is no current parent page rendering it (unmounted as of
// 2026-08-07) to lift the initial fetch into anyway. FE-01 (routing through
// api.js) is fixed below.
const RealTimeTracking = ({ shipmentId }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [temperature, setTemperature] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadTrackingData();
    const interval = setInterval(loadTrackingData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [shipmentId]);

  const loadTrackingData = async () => {
    try {
      const response = await logisticsAPI.getLiveTracking(shipmentId);
      setTrackingData(response.data.data);
      loadTemperatureData();
      loadAlerts();
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemperatureData = async () => {
    try {
      let response = await logisticsAPI.getTemperatureData(shipmentId);
      if (response.data.data.length > 0) {
        setTemperature(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error loading temperature data:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      let response = await logisticsAPI.getTemperatureAlerts(shipmentId);
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">Loading tracking data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!trackingData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">No tracking data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Live Shipment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">Current Location</div>
                <div className="font-semibold">{trackingData.latitude.toFixed(4)}, {trackingData.longitude.toFixed(4)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-sm text-gray-600">Speed</div>
                <div className="font-semibold">{trackingData.speed} km/h</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-sm text-gray-600">Last Update</div>
                <div className="font-semibold">{new Date(trackingData.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={trackingData.status === 'in_transit' ? 'default' : 'secondary'}>
                {trackingData.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Monitoring */}
      {temperature && (
        <Card>
          <CardHeader>
            <CardTitle>Temperature Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{temperature.temperature}°C</div>
                <div className="text-sm text-gray-600">Temperature</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{temperature.humidity}%</div>
                <div className="text-sm text-gray-600">Humidity</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{temperature.zone}</div>
                <div className="text-sm text-gray-600">Zone</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Temperature Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Temperature Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <div className="font-medium">Temperature Range Alert</div>
                    <div className="text-sm text-gray-600">
                      Min: {alert.min_temp}°C | Max: {alert.max_temp}°C
                    </div>
                  </div>
                  <Badge variant={alert.enabled ? 'destructive' : 'secondary'}>
                    {alert.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle>Route Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Origin:</span>
              <span className="font-medium">{trackingData.origin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Destination:</span>
              <span className="font-medium">{trackingData.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Arrival:</span>
              <span className="font-medium">
                {trackingData.estimated_arrival ? new Date(trackingData.estimated_arrival).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeTracking;
