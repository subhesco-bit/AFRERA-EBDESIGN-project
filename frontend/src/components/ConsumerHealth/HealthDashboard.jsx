import React, { useState, useEffect } from 'react';
import { consumerHealthAPI } from '../../services/componentApi';

/**
 * Health Dashboard Component
 * Displays consumer health metrics, goals, and recommendations
 *
 * FE-02 note: no current parent page renders this component (unmounted as of
 * 2026-08-07). It accepts an optional `initialData` prop
 * ({ profile, metrics, goals, recommendations, bmi }) so a future parent page
 * can supply data directly; falls back to self-fetching when omitted.
 */
const HealthDashboard = ({ initialData }) => {
  const [healthProfile, setHealthProfile] = useState(initialData?.profile || null);
  const [healthMetrics, setHealthMetrics] = useState(initialData?.metrics || []);
  const [healthGoals, setHealthGoals] = useState(initialData?.goals || []);
  const [recommendations, setRecommendations] = useState(initialData?.recommendations || []);
  const [bmi, setBMI] = useState(initialData?.bmi || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setHealthProfile(initialData.profile || null);
      setHealthMetrics(initialData.metrics || []);
      setHealthGoals(initialData.goals || []);
      setRecommendations(initialData.recommendations || []);
      setBMI(initialData.bmi || null);
      setLoading(false);
      return;
    }
    fetchHealthData();
  }, [initialData]);

  const fetchHealthData = async () => {
    try {
      const [profileRes, metricsRes, goalsRes, recsRes, bmiRes] = await Promise.all([
        consumerHealthAPI.getHealthProfiles(),
        consumerHealthAPI.getHealthMetrics(),
        consumerHealthAPI.getHealthGoals(),
        consumerHealthAPI.getDietaryRecommendations(),
        consumerHealthAPI.getBMI(),
      ]);

      setHealthProfile(profileRes.data);
      setHealthMetrics(metricsRes.data);
      setHealthGoals(goalsRes.data);
      setRecommendations(recsRes.data);
      setBMI(bmiRes.data);
    } catch (err) {
      console.error('Failed to fetch health data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-yellow-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Health Dashboard</h2>

      {/* BMI Card */}
      {bmi && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Body Mass Index (BMI)</h3>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-blue-600">{bmi.bmi?.toFixed(1)}</div>
            <div>
              <p className={`text-lg font-medium ${getBMICategory(bmi.bmi)?.color}`}>
                {getBMICategory(bmi.bmi)?.category}
              </p>
              <p className="text-sm text-gray-500">
                Height: {bmi.height_cm}cm | Weight: {bmi.weight_kg}kg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Health Goals */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Health Goals</h3>
        {healthGoals.length === 0 ? (
          <p className="text-gray-500">No active health goals</p>
        ) : (
          <div className="space-y-4">
            {healthGoals.map((goal) => (
              <div key={goal.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800 capitalize">{goal.goal_type.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-500">{goal.progress_percentage?.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${goal.progress_percentage || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Target: {goal.target_value} {goal.unit} by {goal.target_date}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Health Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Health Metrics</h3>
        {healthMetrics.length === 0 ? (
          <p className="text-gray-500">No health metrics recorded</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {healthMetrics.slice(0, 4).map((metric) => (
              <div key={metric.id} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 capitalize">{metric.metric_type.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {metric.metric_value} {metric.unit}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(metric.recorded_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dietary Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Dietary Recommendations</h3>
        {recommendations.length === 0 ? (
          <p className="text-gray-500">No recommendations available</p>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{rec.recommendation_text}</p>
                  <p className="text-sm text-gray-600 mt-1">{rec.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthDashboard;
