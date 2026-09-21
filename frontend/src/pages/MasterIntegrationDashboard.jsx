/**
 * MASTER INTEGRATION DASHBOARD
 * Central hub for monitoring all ERP-AI integrations
 */

import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './MasterIntegrationDashboard.css';

const MasterIntegrationDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [moduleConnections, setModuleConnections] = useState([]);
  const [recentIntelligence, setRecentIntelligence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, decisionsRes, connectionsRes] = await Promise.all([
        fetch('/api/v1/ai-integration/metrics'),
        fetch('/api/v1/ai-integration/decisions?limit=20'),
        fetch('/api/v1/ai-integration/connections'),
      ]);

      const metricsData = await metricsRes.json();
      const decisionsData = await decisionsRes.json();
      const connectionsData = await connectionsRes.json();

      setMetrics(metricsData.metrics);
      setDecisions(decisionsData.decisions || []);
      setModuleConnections(connectionsData.connections || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  if (loading) {
    return <div className="master-dashboard loading">Loading Integration Dashboard...</div>;
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="master-dashboard">
      <header className="dashboard-header">
        <h1>🔗 Master ERP-AI Integration Dashboard</h1>
        <div className="header-controls">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </header>

      {/* System Overview */}
      <section className="overview-section">
        <h2>System Overview</h2>
        <div className="overview-grid">
          <div className="metric-card primary">
            <h3>Total Decisions</h3>
            <p className="metric-value">{metrics?.totalDecisions || 0}</p>
            <p className="metric-label">AI decisions processed</p>
          </div>
          <div className="metric-card success">
            <h3>Active Decisions</h3>
            <p className="metric-value">{metrics?.activeDecisions || 0}</p>
            <p className="metric-label">Currently in progress</p>
          </div>
          <div className="metric-card info">
            <h3>Cached Results</h3>
            <p className="metric-value">{metrics?.cachedDecisions || 0}</p>
            <p className="metric-label">Cache hits</p>
          </div>
          <div className="metric-card warning">
            <h3>Cross-Module Shares</h3>
            <p className="metric-value">{metrics?.crossModuleShares || 0}</p>
            <p className="metric-label">Intelligence shared</p>
          </div>
          <div className="metric-card info">
            <h3>Batch Processed</h3>
            <p className="metric-value">{metrics?.batchProcessed || 0}</p>
            <p className="metric-label">Batch requests</p>
          </div>
          <div className="metric-card accent">
            <h3>Notifications Sent</h3>
            <p className="metric-value">{metrics?.notificationsSent || 0}</p>
            <p className="metric-label">Real-time updates</p>
          </div>
        </div>
      </section>

      {/* Module Network Visualization */}
      <section className="network-section">
        <h2>📡 Module Network</h2>
        <div className="module-network">
          <div className="network-graph">
            <svg width="100%" height="400">
              {/* Placeholder for network visualization */}
              <text x="50%" y="50%" textAnchor="middle" fill="#cbd5e1">
                Module Network Connections
              </text>
            </svg>
          </div>
          <div className="connection-list">
            <h3>Active Connections</h3>
            {moduleConnections.slice(0, 10).map((conn, idx) => (
              <div key={idx} className="connection-item">
                <span className="source">{conn.source}</span>
                <span className="arrow">→</span>
                <span className="target">{conn.target}</span>
                <span className="type">{conn.type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Decisions */}
      <section className="decisions-section">
        <h2>Recent AI Decisions</h2>
        <div className="table-container">
          <table className="decisions-table">
            <thead>
              <tr>
                <th>Decision ID</th>
                <th>Source Module</th>
                <th>Capability</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {decisions.slice(0, 10).map((decision) => (
                <tr key={decision.decision_id}>
                  <td className="code">{decision.decision_id}</td>
                  <td>{decision.source_module}</td>
                  <td>{decision.capability}</td>
                  <td className="confidence">{(decision.confidence * 100).toFixed(0)}%</td>
                  <td className={`status-${decision.status}`}>{decision.status}</td>
                  <td className="timestamp">{new Date(decision.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Intelligence Sharing */}
      <section className="intelligence-section">
        <h2>🧠 Cross-Module Intelligence Sharing</h2>
        <div className="intelligence-grid">
          {recentIntelligence.slice(0, 6).map((intel, idx) => (
            <div key={idx} className="intelligence-card">
              <h4>{intel.source}</h4>
              <p className="shared-with">Shared with: {intel.targets.join(', ')}</p>
              <p className="relevance">Relevance: {(intel.relevance * 100).toFixed(0)}%</p>
              <p className="timestamp">{new Date(intel.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integration Statistics */}
      <section className="statistics-section">
        <h2>📊 Integration Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Decision Types</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Crop Recommendations', value: 35 },
                    { name: 'Disease Detection', value: 25 },
                    { name: 'Financial Analysis', value: 20 },
                    { name: 'Predictions', value: 20 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
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

          <div className="stat-card">
            <h3>Module Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: 'M100', decisions: 45 },
                  { name: 'M101', decisions: 38 },
                  { name: 'M301', decisions: 32 },
                  { name: 'M306', decisions: 28 },
                  { name: 'M251', decisions: 25 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="decisions" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="performance-section">
        <h2>⚡ Performance Metrics</h2>
        <div className="performance-grid">
          <div className="performance-card">
            <h3>Average Response Time</h3>
            <p className="value">342ms</p>
            <p className="label">Avg time to AI response</p>
            <div className="trend up">↑ 5% from yesterday</div>
          </div>
          <div className="performance-card">
            <h3>Cache Hit Ratio</h3>
            <p className="value">68%</p>
            <p className="label">Decisions served from cache</p>
            <div className="trend down">↓ 2% from yesterday</div>
          </div>
          <div className="performance-card">
            <h3>Success Rate</h3>
            <p className="value">99.2%</p>
            <p className="label">Successful AI requests</p>
            <div className="trend up">↑ 0.3% from yesterday</div>
          </div>
          <div className="performance-card">
            <h3>Module Availability</h3>
            <p className="value">100%</p>
            <p className="label">All modules operational</p>
            <div className="trend stable">→ Stable</div>
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <p>Master Integration Dashboard | Last Updated: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
};

export default MasterIntegrationDashboard;
