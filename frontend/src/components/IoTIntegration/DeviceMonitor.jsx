import React, { useState, useEffect } from 'react';
import { iotAPI } from '../../services/componentApi';

/**
 * Device Monitor Component
 * Displays IoT device status, sensor data, and real-time monitoring
 *
 * FE-02 note: no current parent page renders this component (unmounted as of
 * 2026-08-07), and it polls on an interval for live status — a one-time prop
 * hand-off from a parent wouldn't fit its refresh model. It accepts optional
 * `devices`/`alerts` props for the initial render; the polling fallback below
 * still calls api.js so auth is always attached.
 */
const DeviceMonitor = ({ devices: devicesProp, alerts: alertsProp }) => {
  const [devices, setDevices] = useState(devicesProp || []);
  const [alerts, setAlerts] = useState(alertsProp || []);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(!devicesProp);

  useEffect(() => {
    if (devicesProp) {
      setDevices(devicesProp);
      setAlerts(alertsProp || []);
      setLoading(false);
      return;
    }

    fetchDevices();
    fetchAlerts();

    // Simulate real-time updates
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [devicesProp, alertsProp]);

  const fetchDevices = async () => {
    try {
      const response = await iotAPI.getDevices();
      setDevices(response.data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await iotAPI.getUnacknowledgedAlerts();
      setAlerts(response.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const fetchSensorData = async (deviceId) => {
    try {
      const response = await iotAPI.getSensorData(deviceId);
      setSensorData(response.data);
    } catch (err) {
      console.error('Failed to fetch sensor data:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">IoT Device Monitor</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>Live</span>
        </div>
      </div>

      {/* Device Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Active Devices</p>
          <p className="text-2xl font-bold text-green-600">{devices.filter(d => d.status === 'active').length}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Offline</p>
          <p className="text-2xl font-bold text-red-600">{devices.filter(d => d.status === 'offline').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Maintenance</p>
          <p className="text-2xl font-bold text-yellow-600">{devices.filter(d => d.status === 'maintenance').length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Alerts</p>
          <p className="text-2xl font-bold text-blue-600">{alerts.length}</p>
        </div>
      </div>

      {/* Device List */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Devices</h4>
        {devices.length === 0 ? (
          <p className="text-gray-500 text-sm">No devices registered</p>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                // Enter and Space are what a native <button> responds to.
                // Without this the card is unreachable by keyboard entirely.
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); }
                }}
                onClick={() => {
                  setSelectedDevice(device);
                  fetchSensorData(device.id);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedDevice?.id === device.id ?
                    'border-blue-500 bg-blue-50' :
                    'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${getStatusColor(device.status)} rounded-full`}></div>
                    <div>
                      <p className="font-medium text-gray-800">{device.device_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{device.device_type} • {device.device_category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {device.battery_level !== null && (
                      <p className="text-sm text-gray-600">Battery: {device.battery_level}%</p>
                    )}
                    {device.signal_strength !== null && (
                      <p className="text-sm text-gray-600">Signal: {device.signal_strength}%</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Device Details */}
      {selectedDevice && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Device Details: {selectedDevice.device_name}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Device ID</p>
              <p className="font-mono text-gray-800">{selectedDevice.device_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Manufacturer</p>
              <p className="text-gray-800">{selectedDevice.manufacturer || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Model</p>
              <p className="text-gray-800">{selectedDevice.model || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Firmware</p>
              <p className="text-gray-800">{selectedDevice.firmware_version || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Seen</p>
              <p className="text-gray-800">{selectedDevice.last_seen ? new Date(selectedDevice.last_seen).toLocaleString() : 'Never'}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="capitalize text-gray-800">{selectedDevice.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sensor Data */}
      {selectedDevice && sensorData.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">Recent Sensor Readings</h4>
          <div className="space-y-2">
            {sensorData.slice(0, 5).map((reading) => (
              <div key={reading.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 capitalize">{reading.sensor_type.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500">{new Date(reading.reading_timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{reading.sensor_value} {reading.unit}</p>
                  {reading.is_anomaly && (
                    <p className="text-xs text-red-600">Anomaly detected</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3">Active Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className={`w-8 h-8 ${getSeverityColor(alert.alert_severity)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 capitalize">{alert.alert_type}</p>
                  <p className="text-sm text-gray-600">{alert.alert_message}</p>
                  {alert.device_name && (
                    <p className="text-xs text-gray-500 mt-1">Device: {alert.device_name}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 capitalize">{alert.alert_severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default DeviceMonitor;
