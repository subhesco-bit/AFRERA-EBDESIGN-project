import { useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { aiSelfHealingAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

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
 */
const TABS = [
  ['heal', 'Detect & Heal'],
  ['config', 'Patterns, Strategies & Monitoring'],
]

function AISelfHealingPage() {
  const [tab, setTab] = useState('heal')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <HeartPulse className="w-6 h-6 mr-2 text-rose-700" />
          AI Self-Healing
        </h1>
        <p className="text-gray-600">Autonomous error detection, root cause analysis and recovery.</p>
      </div>

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
  )
}

export default AISelfHealingPage
