import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AIImageGeneratorDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/ai/images/analytics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setAnalytics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">🎨 AI Image Generator Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Total Generated</p>
          <p className="text-2xl font-bold text-blue-600">{analytics?.totalGenerated || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Average Quality</p>
          <p className="text-2xl font-bold text-green-600">{analytics?.averageQualityScore || 0}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Cache Size</p>
          <p className="text-2xl font-bold text-purple-600">{analytics?.cacheSize || 0}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600">Memory Usage</p>
          <p className="text-2xl font-bold text-orange-600">{analytics?.memorySizeEstimate}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['overview', 'regions', 'languages', 'quality'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold mb-4">Images by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(analytics?.byRegion || {}).map(([region, count]) => ({
                    name: region,
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Quality Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(analytics?.byQualityGrade || {}).map(([grade, count]) => ({
                  grade,
                  count,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === 'regions' && (
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(analytics?.byRegion || {}).map(([region, count]) => (
            <div key={region} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold mb-2">{region}</h4>
              <p className="text-gray-600">
                <span className="text-2xl font-bold text-blue-600">{count}</span> images
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Languages Tab */}
      {activeTab === 'languages' && (
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(analytics?.byLanguage || {}).map(([lang, count]) => (
            <div key={lang} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold mb-2">{lang.toUpperCase()}</h4>
              <p className="text-gray-600">
                <span className="text-2xl font-bold text-green-600">{count}</span> images
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quality Tab */}
      {activeTab === 'quality' && (
        <div>
          <h3 className="text-lg font-bold mb-4">Grade Distribution</h3>
          <div className="grid grid-cols-6 gap-4">
            {Object.entries(analytics?.byQualityGrade || {})
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([grade, count]) => (
                <div key={grade} className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-2">{grade}</p>
                  <p className="text-gray-600">{count} images</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIImageGeneratorDashboard;
