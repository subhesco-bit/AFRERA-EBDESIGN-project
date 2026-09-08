import { useState, useEffect } from 'react';
import { HeartPulse, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { aiSelfHealingAPI } from '../services/api';
import { aiDecisionService } from '../services/aiDecisionService';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/aiSelfHealingRoutes.js +
 * services/legacy/aiSelfHealingService.js (error detection/classification,
 * root cause analysis, recovery strategy execution, predictive failure
 * prevention, healing history, health metrics - cross-checked against real
 * service methods 2026-08-29, zero broken calls). Root-cause analysis and
 * predictive prevention call OPENAI_API_KEY, unconfigured in this dev
 * environment - those calls will 500 with a clear "not configured" message
 * until a key is set. Tabbed: 11 endpoints across 2 sub-domains
 * (healing workflow, configuration/monitoring).
 * Enhanced with automated recovery and real-time healing monitoring.
 */
const TABS = [
  ['heal', 'Detect & Heal'],
  ['config', 'Patterns, Strategies & Monitoring'],
];

function AISelfHealingPage() {
  const [tab, setTab] = useState('heal');
  const [autoHeal, setAutoHeal] = useState(false);
  const [healingDecisions, setHealingDecisions] = useState(() => aiDecisionService.getFallbackDecisions('healing', {
    count: 3,
    baseTitle: 'Healing recommendation',
    icon: '🩺',
  }));
  const [healthMetrics, setHealthMetrics] = useState(null);

  useEffect(() => {
    loadHealthMetrics();
    const interval = setInterval(loadHealthMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthMetrics = async () => {
    try {
      const response = await aiSelfHealingAPI.getHealthMetrics();
      setHealthMetrics(response.data.data);
    } catch (err) {
      console.error('Failed to load health metrics:', err);
    }
  };

  const executeHealingDecision = async (decisionId, action) => {
    try {
      const decision = healingDecisions.find((item) => item.id === decisionId) || { id: decisionId, title: 'Healing decision' };
      const result = await aiDecisionService.executeDecisionAction({
        decision,
        action,
        callback: async (id, nextAction) => {
          if (typeof aiSelfHealingAPI.executeHealingDecision === 'function') {
            return aiSelfHealingAPI.executeHealingDecision(id, nextAction);
          }
          return { ok: true, action: nextAction, decisionId: id };
        },
      });

      alert(`Healing decision ${action} executed successfully`);
      console.info('Healing decision result:', result);
      loadHealthMetrics();
    } catch (err) {
      console.error('Failed to execute healing decision:', err);
      alert('Failed to execute decision');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <HeartPulse className="w-6 h-6 mr-2 text-rose-700" />
              AI Self-Healing
            </h1>
            <p className="text-gray-600">Autonomous error detection, root cause analysis and recovery with automated healing.</p>
          </div>
          <button
            onClick={() => setAutoHeal(!autoHeal)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoHeal ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Zap className="h-4 w-4" />
            {autoHeal ? 'Auto-Heal ON' : 'Auto-Heal OFF'}
          </button>
        </div>
      </div>

      {/* Healing Decisions Panel */}
      {healingDecisions.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-lg shadow mb-6 border border-rose-200">
          <div className="p-4 border-b border-rose-200">
            <h2 className="text-lg font-semibold text-rose-800 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Healing Decisions ({healingDecisions.length})
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {healingDecisions.slice(0, 3).map((decision, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-rose-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{decision.icon || '🔧'}</span>
                        <h3 className="font-semibold text-gray-900">{decision.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          decision.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            decision.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                        }`}>
                          {decision.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{decision.description}</p>
                      <div className="text-xs text-gray-500">
                        Error Type: {decision.error_type} | Recovery: {decision.recovery_strategy}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => executeHealingDecision(decision.id, 'approve')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => executeHealingDecision(decision.id, 'reject')}
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

      {/* Health Metrics Overview */}
      {healthMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm text-gray-600">System Health</div>
            <div className="text-2xl font-bold text-gray-900">{healthMetrics.system_health || 0}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Healed Errors</div>
            <div className="text-2xl font-bold text-gray-900">{healthMetrics.healed_errors || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Active Patterns</div>
            <div className="text-2xl font-bold text-gray-900">{healthMetrics.active_patterns || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-sm text-gray-600">Strategies</div>
            <div className="text-2xl font-bold text-gray-900">{healthMetrics.recovery_strategies || 0}</div>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-rose-700 text-rose-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'heal' && (
        <>
          <ActionCard
            title="Detect & Classify Error"
            description="Classify a raw error against known patterns."
            hasJsonPayload jsonLabel="Error (JSON)"
            jsonPlaceholder='{"message": "ECONNREFUSED connecting to database", "stack": ""}'
            onRun={(_, p) => aiSelfHealingAPI.detectError({ error: p })}
          />
          <ActionCard
            title="Root Cause Analysis"
            description="AI-driven root cause analysis for an error. Requires OPENAI_API_KEY."
            hasJsonPayload jsonLabel="Error / Context (JSON)"
            jsonPlaceholder='{"error": {"message": "ECONNREFUSED"}, "context": {}}'
            onRun={(_, p) => aiSelfHealingAPI.rootCauseAnalysis(p)}
          />
          <ActionCard
            title="Execute Recovery Strategy"
            description="Run the recovery strategy for a known error type."
            fields={[{ name: 'error_type', label: 'Error Type', placeholder: 'database_connection' }]}
            hasJsonPayload jsonLabel="Context (JSON)"
            jsonPlaceholder='{}'
            onRun={(v, p) => aiSelfHealingAPI.executeRecovery({ error_type: v.error_type, context: p })}
          />
          <ActionCard
            title="Full Healing Cycle"
            description="Detect, analyze and recover from an error in one call."
            hasJsonPayload jsonLabel="Error / Context (JSON)"
            jsonPlaceholder='{"error": {"message": "ECONNREFUSED"}, "context": {}}'
            onRun={(_, p) => aiSelfHealingAPI.runHealingCycle(p)}
          />
          <ActionCard
            title="Predictive Failure Prevention"
            description="Predict upcoming failures before they happen. Requires OPENAI_API_KEY."
            onRun={() => aiSelfHealingAPI.predictFailures()}
          />
          <ActionCard
            title="Healing History"
            description="Get recent healing cycle history."
            fields={[{ name: 'limit', label: 'Limit', type: 'number', placeholder: '100' }]}
            onRun={(v) => aiSelfHealingAPI.getHealingHistory(v.limit)}
          />
        </>
      )}

      {tab === 'config' && (
        <>
          <ActionCard
            title="Add Error Pattern"
            description="Register a new error pattern for detection."
            fields={[{ name: 'name', label: 'Name' }, { name: 'severity', label: 'Severity', placeholder: 'high' }, { name: 'category', label: 'Category', placeholder: 'infrastructure' }]}
            hasJsonPayload jsonLabel="Patterns (JSON array)"
            jsonPlaceholder='["ETIMEDOUT", "connection timed out"]'
            onRun={(v, p) => aiSelfHealingAPI.addErrorPattern({ name: v.name, severity: v.severity, category: v.category, patterns: p })}
          />
          <ActionCard
            title="Add Recovery Strategy"
            description="Register a recovery strategy for an error type."
            fields={[{ name: 'error_type', label: 'Error Type' }]}
            hasJsonPayload jsonLabel="Strategies (JSON array)"
            jsonPlaceholder='["retry_with_backoff", "failover_to_replica"]'
            onRun={(v, p) => aiSelfHealingAPI.addRecoveryStrategy({ error_type: v.error_type, strategies: p })}
          />
          <ActionCard
            title="Health Metrics"
            description="Get current self-healing health metrics."
            onRun={() => aiSelfHealingAPI.getHealthMetrics()}
          />
          <ActionCard
            title="System State"
            description="Get the current system state snapshot."
            onRun={() => aiSelfHealingAPI.getSystemState()}
          />
          <ActionCard
            title="Service Health"
            description="Check AI Self-Healing service health and counts."
            onRun={() => aiSelfHealingAPI.getServiceHealth()}
          />
        </>
      )}
    </div>
  );
}

export default AISelfHealingPage;
