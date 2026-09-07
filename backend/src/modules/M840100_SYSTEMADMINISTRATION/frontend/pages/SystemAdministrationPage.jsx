/**
 * System Administration Page (M006) - AI Enhanced
 * 
 * This page provides AI-powered system administration capabilities:
 * - System settings management
 * - Audit log viewing
 * - System analytics
 * - Anomaly detection
 * - Predictive maintenance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { userManagementAPI } from '../services/api';

const SystemAdministrationPage = () => {
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    loadSystemData();
  }, [activeTab]);

  const loadSystemData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'settings') {
        const data = await userManagementAPI.getSettings();
        setSettings(data.data);
      } else if (activeTab === 'analytics') {
        const data = await userManagementAPI.getSystemAnalytics();
        setAnalytics(data.data);
      } else if (activeTab === 'anomalies') {
        const data = await userManagementAPI.detectAnomalies();
        setAnomalies(data.data);
      } else if (activeTab === 'maintenance') {
        const data = await userManagementAPI.getPredictiveMaintenance();
        setMaintenance(data.data);
      }
    } catch (err) {
      setError('Failed to load system data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (name, value, description) => {
    try {
      await userManagementAPI.upsertSetting(name, value, description);
      alert('Setting updated successfully!');
      loadSystemData();
    } catch (err) {
      alert('Failed to update setting: ' + err.message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">System Administration</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        {['settings', 'analytics', 'anomalies', 'maintenance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.map(setting => (
                <div key={setting.name} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <div className="font-semibold">{setting.name}</div>
                    <div className="text-sm text-gray-600">{setting.description}</div>
                  </div>
                  <div className="text-sm">{setting.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <Card>
          <CardHeader>
            <CardTitle>System Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><strong>Audit Patterns:</strong> {analytics.auditPatterns?.length || 0} patterns detected</div>
              <div><strong>Total Settings:</strong> {analytics.settingsHealth?.total_settings || 0}</div>
              <div><strong>Recently Updated:</strong> {analytics.settingsHealth?.recently_updated || 0}</div>
              <div><strong>AI Recommendations:</strong></div>
              <ul className="list-disc pl-4">
                {analytics.recommendations?.map((rec, i) => (
                  <li key={i}>{rec.message}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && anomalies && (
        <Card>
          <CardHeader>
            <CardTitle>Anomaly Detection</CardTitle>
          </CardHeader>
          <CardContent>
            {anomalies.length === 0 ? (
              <div className="text-green-600">No anomalies detected</div>
            ) : (
              <div className="space-y-4">
                {anomalies.map((anomaly, i) => (
                  <div key={i} className={`p-4 border rounded ${anomaly.severity === 'critical' ? 'border-red-500' : 'border-yellow-500'}`}>
                    <div className="font-semibold">{anomaly.type}</div>
                    <div className="text-sm">Severity: {anomaly.severity}</div>
                    <div className="text-sm">Count: {anomaly.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && maintenance && (
        <Card>
          <CardHeader>
            <CardTitle>Predictive Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><strong>Current Load:</strong> {maintenance.currentLoad}</div>
              <div><strong>Trend:</strong> {maintenance.trend}</div>
              <div><strong>Recommendations:</strong></div>
              <ul className="list-disc pl-4">
                {maintenance.recommendations?.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={loadSystemData} variant="outline">
        Refresh Data
      </Button>
    </div>
  );
};

export default SystemAdministrationPage;