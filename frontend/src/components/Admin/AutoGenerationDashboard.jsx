import React, { useEffect, useState } from 'react';
import { PlayCircle, PauseCircle, Trash2, RefreshCw, Settings } from 'lucide-react';

/**
 * Auto Image Generation Admin Dashboard
 * Real-time monitoring of image generation queue and statistics
 */
const AutoGenerationDashboard = () => {
  const [status, setStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = '/api/auto-generation';
  const TOKEN = localStorage.getItem('token');

  // Fetch data
  const fetchData = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/status`, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        }),
        fetch(`${API_BASE}/stats`, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        }),
      ]);

      if (!statusRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch auto-generation data');
      }

      const statusData = await statusRes.json();
      const statsData = await statsRes.json();

      setStatus(statusData.status);
      setStats(statsData.stats);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, TOKEN]);

  // Action handlers
  const handleProcessNow = async () => {
    try {
      const response = await fetch(`${API_BASE}/process-now`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Queue processing triggered!');
        fetchData();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handlePause = async () => {
    try {
      const response = await fetch(`${API_BASE}/pause`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paused: !isPaused }),
      });

      if (response.ok) {
        setIsPaused(!isPaused);
        alert(`Auto-generation ${!isPaused ? 'paused' : 'resumed'}!`);
        fetchData();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleClearQueue = async () => {
    if (!window.confirm('Clear the entire queue? This cannot be undone!')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/queue`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      if (response.ok) {
        alert('Queue cleared!');
        fetchData();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin inline-block">🔄</div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p className="font-bold">Error Loading Dashboard</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!status) {
    return <div className="text-gray-600">No data available</div>;
  }

  // Calculate metrics
  const successRate = stats?.total > 0
    ? ((stats.successful / stats.total) * 100).toFixed(1)
    : 0;

  const queueLength = status.queue?.length || 0;
  const isProcessing = status.queue?.isProcessing || false;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🤖 Auto Image Generation</h1>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              title="Refresh"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={handlePause}
              className={`p-2 rounded-lg transition ${
                isPaused
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 mb-1">Queue Length</p>
            <p className="text-3xl font-bold text-blue-600">{queueLength}</p>
            <p className="text-xs text-gray-500 mt-1">
              {isProcessing ? '🟢 Processing' : '⏸️ Idle'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-600">
            <p className="text-sm text-gray-600 mb-1">Total Processed</p>
            <p className="text-3xl font-bold text-green-600">{stats?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-purple-600">{successRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.successful || 0} successful
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-600">
            <p className="text-sm text-gray-600 mb-1">Avg Processing Time</p>
            <p className="text-3xl font-bold text-orange-600">
              {stats?.avgTimeMs || 0}ms
            </p>
            <p className="text-xs text-gray-500 mt-1">Per image</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Settings size={20} /> Configuration
          </h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Auto Generation</p>
              <p className="font-bold">
                {status.config?.enableAutoGeneration ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">On Product Add</p>
              <p className="font-bold">
                {status.config?.enableOnProductAdd ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">On Page View</p>
              <p className="font-bold">
                {status.config?.enableOnPageView ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Batch Size</p>
              <p className="font-bold">{status.config?.batchSize || 10}</p>
            </div>
          </div>
        </div>

        {/* Queue Preview */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Next in Queue */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-3">Next in Queue</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {status.queue?.nextBatch?.length > 0 ? (
                status.queue.nextBatch.slice(0, 10).map((job, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded border-l-2 border-blue-500"
                  >
                    <div>
                      <p className="font-semibold text-sm">Product {job.productId}</p>
                      <p className="text-xs text-gray-500">{job.trigger}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {job.priority?.toUpperCase() || 'NORMAL'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Queue is empty ✅</p>
              )}
            </div>
          </div>

          {/* Statistics Breakdown */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-3">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">✅ Successful</span>
                <span className="font-bold text-green-600">{stats?.successful || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">❌ Failed</span>
                <span className="font-bold text-red-600">{stats?.failed || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">⏭️ Skipped</span>
                <span className="font-bold text-orange-600">{stats?.skipped || 0}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-semibold">Success Rate</span>
                  <span className="font-bold text-purple-600">{successRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Actions */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-3">Actions</h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleProcessNow}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <PlayCircle size={18} />
              Process Now
            </button>
            <button
              onClick={handlePause}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                isPaused
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {isPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleClearQueue}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear Queue
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-sm text-blue-800">
          <p className="font-bold mb-2">📊 Dashboard Information</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Queue updates every {refreshInterval / 1000} seconds</li>
            <li>Processing occurs in background batches of {status.config?.batchSize}</li>
            <li>Images generated in {(status.config?.defaultLanguages || ['en']).join(', ')}</li>
            <li>Region: {status.config?.defaultRegion}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AutoGenerationDashboard;
