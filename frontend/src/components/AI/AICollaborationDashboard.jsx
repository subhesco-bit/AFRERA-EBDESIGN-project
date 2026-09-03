import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';

/**
 * AI Collaboration Dashboard Component
 * Monitor and manage Devin-Claude AI collaboration with decision-making capabilities
 * Enhanced with real-time AI decision support and process optimization
 */
export default function AICollaborationDashboard() {
  const [context, setContext] = useState(null);
  const [stats, setStats] = useState(null);
  const [devinWork, setDevinWork] = useState([]);
  const [claudeWork, setClaudeWork] = useState([]);
  const [pendingHandoffs, setPendingHandoffs] = useState([]);
  const [aiDecisions, setAIDecisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);

  useEffect(() => {
    loadCollaborationData();
    const interval = setInterval(loadCollaborationData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadCollaborationData = async () => {
    try {
      setLoading(true);
      const [contextRes, statsRes, devinRes, claudeRes, decisionsRes] = await Promise.all([
        authAPI.get('/ai-collaboration/context'),
        authAPI.get('/ai-collaboration/stats'),
        authAPI.get('/ai-collaboration/work-history/devin?limit=5'),
        authAPI.get('/ai-collaboration/work-history/claude?limit=5'),
        authAPI.get('/ai/decisions/pending')
      ]);

      setContext(contextRes.data.data);
      setStats(statsRes.data.data);
      setDevinWork(devinRes.data.data.work_history);
      setClaudeWork(claudeRes.data.data.work_history);
      setAIDecisions(decisionsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load collaboration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createHandoff = async (fromAI, toAI, workData) => {
    try {
      await authAPI.post('/ai-collaboration/handoff', {
        from_ai: fromAI,
        to_ai: toAI,
        work_data: workData
      });
      alert('Handoff created successfully');
      loadCollaborationData();
    } catch (err) {
      console.error('Failed to create handoff:', err);
      alert('Failed to create handoff');
    }
  };

  const executeAIDecision = async (decisionId, action) => {
    try {
      await authAPI.post('/ai/decision/execute', {
        decision_id: decisionId,
        action: action
      });
      alert(`Decision ${action} executed successfully`);
      loadCollaborationData();
    } catch (err) {
      console.error('Failed to execute decision:', err);
      alert('Failed to execute decision');
    }
  };

  const generateReport = async () => {
    try {
      const response = await authAPI.get('/ai-collaboration/report');
      const report = response.data.data;
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-collaboration-report-${new Date().toISOString()}.json`;
      a.click();
    } catch (err) {
      console.error('Failed to generate report:', err);
      alert('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Collaboration Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time AI decision support and process optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={`px-4 py-2 rounded ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {autoMode ? '🤖 Auto Mode ON' : '🤖 Auto Mode OFF'}
          </button>
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* AI Decision Queue */}
      {aiDecisions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow mb-6 border border-purple-200">
          <div className="p-4 border-b border-purple-200">
            <h2 className="text-lg font-semibold text-purple-800">🎯 Pending AI Decisions</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {aiDecisions.map((decision, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{decision.icon || '🤖'}</span>
                        <h3 className="font-semibold text-gray-900">{decision.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          decision.priority === 'high' ? 'bg-red-100 text-red-800' :
                          decision.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {decision.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{decision.description}</p>
                      <div className="text-xs text-gray-500">
                        Confidence: {decision.confidence}% | Source: {decision.source}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => executeAIDecision(decision.id, 'approve')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => executeAIDecision(decision.id, 'reject')}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => executeAIDecision(decision.id, 'defer')}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                      >
                        Defer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Work Entries</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total_work_entries}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-600">
            <div className="text-sm text-gray-600">Devin Work</div>
            <div className="text-2xl font-bold text-blue-600">{stats.devin_work}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-600">
            <div className="text-sm text-gray-600">Claude Work</div>
            <div className="text-2xl font-bold text-purple-600">{stats.claude_work}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Handoffs</div>
            <div className="text-2xl font-bold text-green-600">{stats.handoffs}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-sm text-gray-600">AI Decisions</div>
            <div className="text-2xl font-bold text-orange-600">{aiDecisions.length}</div>
          </div>
        </div>
      )}

      {/* Shared Context */}
      {context && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Shared Project Context</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Project Name</div>
                <div className="font-semibold">{context.project_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Collaboration Mode</div>
                <div className="font-semibold">{context.collaboration_mode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Active AI</div>
                <div className="font-semibold">{context.active_ai}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Auto Mode</div>
                <div className="font-semibold">{autoMode ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">Shared Goals</div>
              <ul className="list-disc list-inside text-sm">
                {context.shared_goals.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recent Work */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Devin Work */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-blue-600">Recent Devin Work</h2>
          </div>
          <div className="p-4">
            {devinWork.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No recent work</div>
            ) : (
              <div className="space-y-3">
                {devinWork.map((work, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{work.work_type}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        work.status === 'completed' ? 'bg-green-100 text-green-800' :
                        work.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {work.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{work.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(work.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Claude Work */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-purple-600">Recent Claude Work</h2>
          </div>
          <div className="p-4">
            {claudeWork.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No recent work</div>
            ) : (
              <div className="space-y-3">
                {claudeWork.map((work, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{work.work_type}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        work.status === 'completed' ? 'bg-green-100 text-green-800' :
                        work.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {work.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{work.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(work.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Handoff */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Create Handoff</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From AI</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="devin">Devin</option>
                <option value="claude">Claude</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To AI</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="claude">Claude</option>
                <option value="devin">Devin</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Description</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded" rows="3" placeholder="Describe the work to hand off..."></textarea>
          </div>
          <button
            onClick={() => createHandoff('devin', 'claude', { description: 'Test handoff' })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Handoff
          </button>
        </div>
      </div>
    </div>
  );
}
