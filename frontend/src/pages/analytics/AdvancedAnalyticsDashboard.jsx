import React, { useState } from 'react';

const AdvancedAnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Advanced Analytics Dashboard</h1>

      <div className="flex gap-4 mb-6">
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="px-4 py-2 border rounded">
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
        <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} className="px-4 py-2 border rounded">
          <option value="revenue">Revenue</option>
          <option value="users">Users</option>
          <option value="transactions">Transactions</option>
          <option value="satisfaction">Satisfaction</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Performance Trend</h2>
          <div className="h-64 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Chart Placeholder</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Average Growth</span>
              <span className="text-xl font-bold text-green-600">+12.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Peak Hours</span>
              <span className="text-xl font-bold">2-4 PM</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Top Region</span>
              <span className="text-xl font-bold">North East</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Detailed Breakdown</h2>
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Count</th>
              <th className="p-3 text-left">Percentage</th>
              <th className="p-3 text-left">Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3">Agriculture</td>
              <td className="p-3">450</td>
              <td className="p-3">35%</td>
              <td className="p-3 text-green-600">↑ +5%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
