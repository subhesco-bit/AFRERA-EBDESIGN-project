import React, { useState, useEffect } from 'react';
import { foodIntelligenceAPI } from '../../services/componentApi';

/**
 * Food Safety Dashboard Component
 * Displays food safety alerts, recalls, and quality metrics
 *
 * FE-02 note: no current parent page renders this component (unmounted as of
 * 2026-08-07). Accepts an optional `activeRecalls` prop so a future parent
 * page can supply data directly; falls back to self-fetching when omitted.
 */
const FoodSafetyDashboard = ({ activeRecalls: recallsProp }) => {
  const [activeRecalls, setActiveRecalls] = useState(recallsProp || []);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [loading, setLoading] = useState(!recallsProp);

  useEffect(() => {
    if (recallsProp) {
      setActiveRecalls(recallsProp);
      setLoading(false);
      return;
    }
    fetchActiveRecalls();
  }, [recallsProp]);

  const fetchActiveRecalls = async () => {
    try {
      const response = await foodIntelligenceAPI.getActiveRecalls();
      setActiveRecalls(response.data);
    } catch (err) {
      console.error('Failed to fetch recalls:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHazardColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Food Safety Dashboard</h2>

      {/* Active Recalls */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Active Food Recalls</h3>

        {loading ? (
          <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>
        ) : activeRecalls.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-700">No active food recalls</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRecalls.map((recall) => (
              <div key={recall.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-white text-sm rounded-full ${getHazardColor(recall.hazard_level)}`}>
                        {recall.hazard_level.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{recall.recall_type}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800">{recall.food_name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{recall.recall_reason}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Recall Date: {recall.recall_date}</p>
                      <p>Recalling Firm: {recall.recalling_firm}</p>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-700">{recall.recall_number}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Active Recalls</p>
          <p className="text-2xl font-bold text-red-600">{activeRecalls.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Quality Pass Rate</p>
          <p className="text-2xl font-bold text-green-600">94.5%</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Safety Incidents</p>
          <p className="text-2xl font-bold text-yellow-600">3</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500">Avg Freshness Score</p>
          <p className="text-2xl font-bold text-blue-600">87.2</p>
        </div>
      </div>
    </div>
  );
};

export default FoodSafetyDashboard;
