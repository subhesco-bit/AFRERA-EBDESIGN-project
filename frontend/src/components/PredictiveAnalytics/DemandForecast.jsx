import React, { useState, useEffect } from 'react';
import { predictiveAnalyticsAPI } from '../../services/api';

/**
 * Demand Forecast Component
 * Displays predictive demand forecasts and analytics
 *
 * FE-02 note: no current parent page renders this component (unmounted as of
 * 2026-08-07). Accepts optional `forecasts`/`predictions`/`alerts` props so a
 * future parent page can supply data directly; falls back to self-fetching
 * by productId when omitted.
 */
const DemandForecast = ({ productId, forecasts: forecastsProp, predictions: predictionsProp, alerts: alertsProp }) => {
  const [forecasts, setForecasts] = useState(forecastsProp || []);
  const [predictions, setPredictions] = useState(predictionsProp || []);
  const [alerts, setAlerts] = useState(alertsProp || []);
  const [loading, setLoading] = useState(!forecastsProp);

  useEffect(() => {
    if (forecastsProp) {
      setForecasts(forecastsProp);
      setPredictions(predictionsProp || []);
      setAlerts(alertsProp || []);
      setLoading(false);
      return;
    }
    fetchForecastData();
  }, [productId, forecastsProp, predictionsProp, alertsProp]);

  const fetchForecastData = async () => {
    try {
      const [forecastsRes, predictionsRes, alertsRes] = await Promise.all([
        predictiveAnalyticsAPI.getForecasts({ forecast_type: 'demand' }).catch(() => null),
        predictiveAnalyticsAPI.getPredictions(productId, 'product').catch(() => null),
        predictiveAnalyticsAPI.getUnacknowledgedAlerts().catch(() => null)
      ]);

      if (forecastsRes) setForecasts(forecastsRes.data);
      if (predictionsRes) setPredictions(predictionsRes.data);
      if (alertsRes) setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Failed to fetch forecast data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
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

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Demand Forecast</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>AI-Powered Predictions</span>
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
        </div>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">7-Day Forecast</p>
          <p className="text-2xl font-bold text-blue-600">+12%</p>
          <p className="text-xs text-gray-500 mt-1">vs last week</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">30-Day Forecast</p>
          <p className="text-2xl font-bold text-green-600">+18%</p>
          <p className="text-xs text-gray-500 mt-1">vs last month</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="text-2xl font-bold text-purple-600">87%</p>
          <p className="text-xs text-gray-500 mt-1">Model accuracy</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Trend</p>
          <p className={`text-2xl font-bold ${getTrendColor(1)}`}>Rising</p>
          <p className="text-xs text-gray-500 mt-1">Seasonal demand</p>
        </div>
      </div>

      {/* Forecast Chart Placeholder */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-gray-700 mb-4">Demand Forecast Chart</h4>
        <div className="h-48 flex items-end justify-between gap-2">
          {[65, 72, 78, 85, 82, 90, 88, 95, 92, 98, 105, 110].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${value}%` }}
              ></div>
              <span className="text-xs text-gray-500 mt-2">Day {index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">Recent Predictions</h4>
        {predictions.length === 0 ? (
          <p className="text-gray-500 text-sm">No predictions available</p>
        ) : (
          <div className="space-y-2">
            {predictions.slice(0, 5).map((pred) => (
              <div key={pred.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{pred.prediction_type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(pred.prediction_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{pred.predicted_value}</p>
                  <p className="text-xs text-gray-500">Confidence: {pred.confidence_score}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                </div>
                <span className="text-xs text-gray-500 capitalize">{alert.alert_severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandForecast;
