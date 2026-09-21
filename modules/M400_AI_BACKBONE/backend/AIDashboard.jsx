/**
 * M400 AI Backbone Dashboard
 * Real-time visualization of AI orchestration
 */

import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AIDashboard.css';

const AIDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [engineStatus, setEngineStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/v1/m400-ai-backbone/metrics');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  // Fetch health
  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/v1/m400-ai-backbone/health');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    }
  };

  // Fetch decisions
  const fetchDecisions = async () => {
    try {
      const response = await fetch('/api/v1/m400-ai-backbone/decisions?limit=5');
      const data = await response.json();
      setDecisions(data.decisions || []);
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
    }
  };

  // Fetch strategies
  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/v1/m400-ai-backbone/strategies?limit=5');
      const data = await response.json();
      setStrategies(data.strategies || []);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    }
  };

  // Fetch predictions
  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/v1/m400-ai-backbone/predictions?limit=5');
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  };

  // Fetch engine status
  const fetchEngineStatus = async () => {
    try {
      const response = await fetch('/api/v1/m400-ai-backbone/engines');
      const data = await response.json();
      setEngineStatus(data.engines || {});
    } catch (error) {
      console.error('Failed to fetch engine status:', error);
    }
  };

  // Initial load and setup interval
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        fetchMetrics(),
        fetchHealth(),
        fetchDecisions(),
        fetchStrategies(),
        fetchPredictions(),
        fetchEngineStatus(),
      ]);
      setLoading(false);
    };

    loadAll();

    const interval = setInterval(loadAll, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return <div className="ai-dashboard loading">Loading AI Backbone Dashboard...</div>;
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="ai-dashboard">
      <header className="dashboard-header">
        <h1>🤖 AI Backbone Orchestration Dashboard</h1>
        <div className="header-controls">
          <div className="refresh-interval">
            <label>Refresh Interval:</label>
            <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))}>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
          <div className={`health-badge ${health?.status}`}>
            {health?.status === 'healthy' ? '✅' : '⚠️'} {health?.status || 'Unknown'}
          </div>
        </div>
      </header>

      <section className="dashboard-section">
        <h2>System Health</h2>
        <div className="health-grid">
          <div className={`health-card ${health?.checks?.database ? 'healthy' : 'failed'}`}>
            <h3>Database</h3>
            <p>{health?.checks?.database ? '✅ Connected' : '❌ Failed'}</p>
          </div>
          <div className={`health-card ${health?.checks?.cache ? 'healthy' : 'failed'}`}>
            <h3>Cache (Redis)</h3>
            <p>{health?.checks?.cache ? '✅ Connected' : '❌ Failed'}</p>
          </div>
          <div className={`health-card ${health?.checks?.aiProviders ? 'healthy' : 'failed'}`}>
            <h3>AI Providers</h3>
            <p>{health?.checks?.aiProviders ? '✅ Available' : '❌ Unavailable'}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>AI Engines Status</h2>
        <div className="engines-grid">
          {Object.entries(engineStatus).map(([engine, status]) => (
            <div key={engine} className="engine-card">
              <h3>{engine.charAt(0).toUpperCase() + engine.slice(1)} Engine</h3>
              <p className="status">{status.status}</p>
              {status.stats && <pre className="stats">{JSON.stringify(status.stats, null, 2)}</pre>}
              {status.plans && <p>Execution Plans: {status.plans}</p>}
              {status.feedback && <p>Feedback Records: {status.feedback}</p>}
              {status.models && <p>Models: {status.models}</p>}
              {status.agents && (
                <>
                  <p>Active Agents: {status.agents}</p>
                  <p>Active Requests: {status.activeRequests}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Metrics & Statistics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Decisions</h3>
            <p className="metric-value">{metrics?.decisionsCount || 0}</p>
            <p className="metric-label">Total Decisions Made</p>
          </div>
          <div className="metric-card">
            <h3>Strategies</h3>
            <p className="metric-value">{metrics?.strategiesCount || 0}</p>
            <p className="metric-label">Total Strategies Generated</p>
          </div>
          <div className="metric-card">
            <h3>Predictions</h3>
            <p className="metric-value">{metrics?.predictionsCount || 0}</p>
            <p className="metric-label">Total Predictions Made</p>
          </div>
          <div className="metric-card">
            <h3>Coordination Events</h3>
            <p className="metric-value">{metrics?.coordinationEvents || 0}</p>
            <p className="metric-label">Multi-Agent Executions</p>
          </div>
          <div className="metric-card">
            <h3>Cache Performance</h3>
            <p className="metric-value">{metrics?.cacheHits || 0}</p>
            <p className="metric-label">Cache Hits (Misses: {metrics?.cacheMisses || 0})</p>
          </div>
          <div className="metric-card">
            <h3>Modules Registered</h3>
            <p className="metric-value">{metrics?.modulesRegistered || 0}</p>
            <p className="metric-label">Active Modules</p>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Recent Decisions</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Decision ID</th>
                <th>Module</th>
                <th>Capability</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((decision) => (
                <tr key={decision.decision_id}>
                  <td className="code">{decision.decision_id}</td>
                  <td>{decision.module_id}</td>
                  <td>{decision.decision_type}</td>
                  <td className="confidence">{(decision.confidence * 100).toFixed(0)}%</td>
                  <td className={`status-${decision.status}`}>{decision.status}</td>
                  <td>{new Date(decision.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {decisions.length === 0 && <p className="empty-state">No recent decisions</p>}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Recent Strategies</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Strategy ID</th>
                <th>Module</th>
                <th>Objectives Count</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy) => (
                <tr key={strategy.strategy_id}>
                  <td className="code">{strategy.strategy_id}</td>
                  <td>{strategy.module_id}</td>
                  <td>{Array.isArray(strategy.objectives) ? strategy.objectives.length : 0}</td>
                  <td className="confidence">{(strategy.confidence * 100).toFixed(0)}%</td>
                  <td className={`status-${strategy.status}`}>{strategy.status}</td>
                  <td>{new Date(strategy.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {strategies.length === 0 && <p className="empty-state">No recent strategies</p>}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Recent Predictions</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Prediction ID</th>
                <th>Module</th>
                <th>Model</th>
                <th>Confidence</th>
                <th>Accuracy</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((prediction) => (
                <tr key={prediction.prediction_id}>
                  <td className="code">{prediction.prediction_id}</td>
                  <td>{prediction.module_id}</td>
                  <td>{prediction.model_id}</td>
                  <td className="confidence">{(prediction.confidence * 100).toFixed(0)}%</td>
                  <td className="accuracy">{prediction.accuracy ? (prediction.accuracy * 100).toFixed(0) + '%' : '-'}</td>
                  <td>{new Date(prediction.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {predictions.length === 0 && <p className="empty-state">No recent predictions</p>}
        </div>
      </section>

      <footer className="dashboard-footer">
        <p>AI Backbone v{metrics?.version || '1.0.0'} | Last updated: {new Date().toLocaleTimeString()}</p>
      </footer>
    </div>
  );
};

export default AIDashboard;
