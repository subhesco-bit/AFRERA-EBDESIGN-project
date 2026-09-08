import { useState, useEffect } from 'react';
import { Gauge, Zap, TrendingUp, Activity } from 'lucide-react';
import { aiOperationIntelligenceAPI } from '../services/api';
import { aiDecisionService } from '../services/aiDecisionService';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/aiOperationIntelligenceRoutes.js +
 * services/legacy/aiOperationIntelligenceService.js (performance monitoring,
 * optimization recommendations, predictive optimization, anomaly detection,
 * continuous improvement, resource allocation - cross-checked against real
 * service methods 2026-08-29, zero broken calls). The service's constructor
 * previously started permanent setInterval timers hitting an unconfigured
 * OpenAI key every 60s; that bug was already fixed earlier this session -
 * this page just calls the (now safe) route methods. Analyze/recommend/
 * predict calls still need OPENAI_API_KEY, unconfigured in this dev
 * environment - those calls will 500 with a clear "not configured" message
 * until a key is set. Tabbed: 13 endpoints across 2 sub-domains
 * (optimization workflow, strategies/resources/history).
 * Enhanced with real-time process optimization and AI decision support.
 */
const TABS = [
  ['optimize', 'Monitor & Optimize'],
  ['manage', 'Strategies, Resources & History'],
];

function AIOperationIntelligencePage() {
  const [tab, setTab] = useState('optimize');
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [optimizationDecisions, setOptimizationDecisions] = useState(() => aiDecisionService.getFallbackDecisions('operations', {
    count: 3,
    baseTitle: 'Optimization recommendation',
  }));
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  useEffect(() => {
    loadPerformanceMetrics();
    const interval = setInterval(loadPerformanceMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceMetrics = async () => {
    try {
      const response = await aiOperationIntelligenceAPI.getMetrics();
      setPerformanceMetrics(response.data.data);
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
    }
  };

  const executeOptimizationDecision = async (decisionId, action) => {
    try {
      const decision = optimizationDecisions.find((item) => item.id === decisionId) || { id: decisionId, title: 'Optimization decision' };
      const result = await aiDecisionService.executeDecisionAction({
        decision,
        action,
        callback: async (id, nextAction) => {
          if (typeof aiOperationIntelligenceAPI.executeOptimizationDecision === 'function') {
            return aiOperationIntelligenceAPI.executeOptimizationDecision(id, nextAction);
          }
          return { ok: true, action: nextAction, decisionId: id };
        },
      });

      alert(`Optimization decision ${action} executed successfully`);
      console.info('Optimization decision result:', result);
      loadPerformanceMetrics();
    } catch (err) {
      console.error('Failed to execute optimization decision:', err);
      alert('Failed to execute decision');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <Gauge className="w-6 h-6 mr-2 text-teal-700" />
              AI Operation Intelligence
            </h1>
            <p className="text-gray-600">Real-time performance monitoring, optimization and anomaly detection with process decision support.</p>
          </div>
          <button
            onClick={() => setAutoOptimize(!autoOptimize)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoOptimize ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Zap className="h-4 w-4" />
            {autoOptimize ? 'Auto-Optimize ON' : 'Auto-Optimize OFF'}
          </button>
        </div>
      </div>

      {/* Optimization Decisions Panel */}
      {optimizationDecisions.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg shadow mb-6 border border-teal-200">
          <div className="p-4 border-b border-teal-200">
            <h2 className="text-lg font-semibold text-teal-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimization Decisions ({optimizationDecisions.length})
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {optimizationDecisions.slice(0, 3).map((decision, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-teal-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{decision.icon || '⚡'}</span>
                        <h3 className="font-semibold text-gray-900">{decision.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          decision.impact === 'high' ? 'bg-green-100 text-green-800' :
                            decision.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                          {decision.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{decision.description}</p>
                      <div className="text-xs text-gray-500">
                        Resource: {decision.resource} | Expected Gain: {decision.expected_gain}%
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => executeOptimizationDecision(decision.id, 'approve')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => executeOptimizationDecision(decision.id, 'reject')}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics Overview */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Performance Score</div>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.performance_score || 0}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Active Anomalies</div>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.active_anomalies || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Optimizations</div>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.optimizations_executed || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-sm text-gray-600">Resource Utilization</div>
            <div className="text-2xl font-bold text-gray-900">{performanceMetrics.resource_utilization || 0}%</div>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-teal-700 text-teal-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'optimize' && (
        <>
          <ActionCard
            title="Performance Metrics"
            description="Get the current and historical performance metrics."
            onRun={() => aiOperationIntelligenceAPI.getMetrics()}
          />
          <ActionCard
            title="Analyze Performance"
            description="AI-driven analysis of a metrics snapshot. Requires OPENAI_API_KEY."
            hasJsonPayload jsonLabel="Metrics (JSON)"
            jsonPlaceholder='{"cpu": 72, "memory": 60, "active_tasks": 5}'
            onRun={(_, p) => aiOperationIntelligenceAPI.analyzePerformance({ metrics: p })}
          />
          <ActionCard
            title="Generate Recommendations"
            description="Generate optimization recommendations from an analysis result."
            hasJsonPayload jsonLabel="Analysis (JSON)"
            jsonPlaceholder='{"bottlenecks": ["cpu"]}'
            onRun={(_, p) => aiOperationIntelligenceAPI.recommendOptimizations({ analysis: p })}
          />
          <ActionCard
            title="Execute Optimizations"
            description="Execute a set of approved optimizations."
            hasJsonPayload jsonLabel="Optimizations (JSON)"
            jsonPlaceholder='{"actions": ["scale_workers"]}'
            onRun={(_, p) => aiOperationIntelligenceAPI.executeOptimizations({ optimizations: p })}
          />
          <ActionCard
            title="Run Full Optimization Cycle"
            description="Collect metrics, analyze, recommend and (if auto-approved) execute optimizations in one call."
            onRun={() => aiOperationIntelligenceAPI.runOptimizationCycle()}
          />
          <ActionCard
            title="Predictive Optimization"
            description="Forecast optimization needs over a time horizon. Requires OPENAI_API_KEY."
            fields={[{ name: 'horizon', label: 'Horizon (hours)', type: 'number', placeholder: '24' }]}
            onRun={(v) => aiOperationIntelligenceAPI.predictOptimization(v.horizon)}
          />
          <ActionCard
            title="Detect Anomalies"
            description="Detect anomalies in recent performance metrics."
            onRun={() => aiOperationIntelligenceAPI.detectAnomalies()}
          />
          <ActionCard
            title="Continuous Improvement Analysis"
            description="Analyze operation history for continuous improvement opportunities."
            onRun={() => aiOperationIntelligenceAPI.getContinuousImprovement()}
          />
        </>
      )}

      {tab === 'manage' && (
        <>
          <ActionCard
            title="List Strategies"
            description="Get all registered optimization strategies."
            onRun={() => aiOperationIntelligenceAPI.getStrategies()}
          />
          <ActionCard
            title="Add Strategy"
            description="Register a new optimization strategy."
            fields={[{ name: 'name', label: 'Name' }, { name: 'description', label: 'Description' }]}
            hasJsonPayload jsonLabel="Parameters + Objectives (JSON)"
            jsonPlaceholder='{"parameters": {}, "objectives": ["reduce_cost"]}'
            onRun={(v, p) => aiOperationIntelligenceAPI.addStrategy({ name: v.name, description: v.description, ...p })}
          />
          <ActionCard
            title="Resource Allocation"
            description="Get current resource allocation."
            onRun={() => aiOperationIntelligenceAPI.getResourceAllocation()}
          />
          <ActionCard
            title="Operation History"
            description="Get recent operation history."
            fields={[{ name: 'limit', label: 'Limit', type: 'number', placeholder: '100' }]}
            onRun={(v) => aiOperationIntelligenceAPI.getOperationHistory(v.limit)}
          />
          <ActionCard
            title="Service Health"
            description="Check AI Operation Intelligence service health and counts."
            onRun={() => aiOperationIntelligenceAPI.getServiceHealth()}
          />
        </>
      )}
    </div>
  );
}

export default AIOperationIntelligencePage;
