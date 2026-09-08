/**
 * Platform Foundation Page - AI Enhanced Platform Foundation
 *
 * This page demonstrates the AI-enhanced platform foundation capabilities:
 * - Platform health monitoring
 * - AI-powered scaling recommendations
 * - Capacity planning and forecasting
 * - Configuration management
 * - System administration dashboard
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { platformCoreAPI, platformConfigurationAPI, systemAdministrationAPI } from '../services/api';

const PlatformFoundationPage = () => {
  const [platformHealth, setPlatformHealth] = useState(null);
  const [scalingRecommendations, setScalingRecommendations] = useState(null);
  const [capacityForecast, setCapacityForecast] = useState(null);
  const [configRecommendations, setConfigRecommendations] = useState(null);
  const [systemDashboard, setSystemDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPlatformData();
  }, []);

  const loadPlatformData = async () => {
    setLoading(true);
    setError(null);

    // Each source loads independently - platformCoreAPI.getScalingRecommendations()
    // has no backend implementation anywhere in the codebase (verified: no service
    // exports it under any name), so it will always reject. Previously that one
    // rejection aborted this whole sequential await chain, silently preventing
    // configRecommendations and systemDashboard from ever loading even though both
    // of those calls work correctly. Settling independently means the one missing
    // feature degrades gracefully (its section just doesn't render) instead of
    // taking down three working ones.
    const [health, scaling, capacity, config, dashboard] = await Promise.allSettled([
      platformCoreAPI.getHealth(),
      platformCoreAPI.getScalingRecommendations(),
      // predictCapacity('24h') pointed at platformCoreService's old M001 shape,
      // which was rewritten and no longer has this endpoint. The real capacity
      // forecast lives in systemAdministrationService, already used correctly by
      // the dashboard call below.
      systemAdministrationAPI.forecastCapacity('24h'),
      platformConfigurationAPI.getRecommendations(),
      systemAdministrationAPI.getSystemHealthDashboard(),
    ]);

    if (health.status === 'fulfilled') setPlatformHealth(health.value.data);
    if (scaling.status === 'fulfilled') setScalingRecommendations(scaling.value.data);
    if (capacity.status === 'fulfilled') setCapacityForecast(capacity.value.data);
    if (config.status === 'fulfilled') setConfigRecommendations(config.value.data);
    if (dashboard.status === 'fulfilled') setSystemDashboard(dashboard.value.data);

    const failures = [health, scaling, capacity, config, dashboard].filter(r => r.status === 'rejected');
    if (failures.length > 0 && [health, capacity, config, dashboard].some(r => r.status === 'rejected')) {
      // Only surface an error banner for unexpected failures - scaling recommendations
      // failing is expected (no backend), so it alone shouldn't alarm the user.
      setError(`${failures.length} of 5 platform data sources failed to load`);
    }

    setLoading(false);
  };

  const handleOptimizeConfiguration = async () => {
    try {
      const config = await platformConfigurationAPI.applyConfiguration(configRecommendations.optimizedConfig);
      alert('Configuration optimized successfully!');
      loadPlatformData();
    } catch (err) {
      alert(`Failed to optimize configuration: ${ err.message}`);
    }
  };

  const handleTriggerSelfHealing = async () => {
    try {
      const result = await systemAdministrationAPI.triggerSelfHealing({
        type: 'performance',
        severity: 'medium',
      });
      alert(`Self-healing triggered: ${ JSON.stringify(result)}`);
      loadPlatformData();
    } catch (err) {
      alert(`Failed to trigger self-healing: ${ err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading platform data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">{error}</div>
        <Button onClick={loadPlatformData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Platform Foundation Dashboard</h1>

      {/* Platform Health */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Health</CardTitle>
        </CardHeader>
        <CardContent>
          {platformHealth && (
            <div className="space-y-2">
              <div><strong>Status:</strong> {platformHealth.status}</div>
              <div><strong>Health Score:</strong> {platformHealth.aiInsights?.healthScore || 'N/A'}</div>
              <div><strong>Predicted Health:</strong> {platformHealth.aiInsights?.predictedHealth || 'N/A'}</div>
              <div><strong>Confidence:</strong> {platformHealth.aiInsights?.confidence || 'N/A'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scaling Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Scaling Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {scalingRecommendations && (
            <div className="space-y-2">
              <div><strong>Action:</strong> {scalingRecommendations.action}</div>
              <div><strong>Target Instances:</strong> {scalingRecommendations.targetInstances}</div>
              <div><strong>Reason:</strong> {scalingRecommendations.reason}</div>
              <div><strong>Estimated Cost:</strong> {scalingRecommendations.estimatedCost}</div>
              <div><strong>Confidence:</strong> {scalingRecommendations.confidence}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capacity Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Forecast (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          {capacityForecast && (
            <div className="space-y-2">
              <div><strong>Risk Level:</strong> {capacityForecast.riskLevel}</div>
              <div><strong>Confidence:</strong> {capacityForecast.confidence}</div>
              <div><strong>Recommendations:</strong></div>
              <ul className="list-disc pl-4">
                {capacityForecast.recommendations?.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI Configuration Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          {configRecommendations && (
            <div className="space-y-2">
              <div><strong>Expected Performance Gain:</strong> {configRecommendations.expectedBenefits?.performance}%</div>
              <div><strong>Expected Security Improvement:</strong> {configRecommendations.expectedBenefits?.security}%</div>
              <div><strong>Expected Cost Savings:</strong> {configRecommendations.expectedBenefits?.cost}%</div>
              <Button onClick={handleOptimizeConfiguration} className="mt-4">
                Apply Optimized Configuration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>System Administration Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {systemDashboard && (
            <div className="space-y-2">
              <div><strong>Overall Health Score:</strong> {systemDashboard.overview?.healthScore}</div>
              <div><strong>Status:</strong> {systemDashboard.overview?.status}</div>
              <div><strong>Incident Risk Level:</strong> {systemDashboard.incidents?.riskLevel}</div>
              <div><strong>Security Risk Level:</strong> {systemDashboard.security?.riskLevel}</div>
              <Button onClick={handleTriggerSelfHealing} className="mt-4">
                Trigger Self-Healing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={loadPlatformData} variant="outline">
        Refresh Data
      </Button>
    </div>
  );
};

export default PlatformFoundationPage;
