import { useState } from 'react'
import { Gauge } from 'lucide-react'
import { aiOperationIntelligenceAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

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
 */
const TABS = [
  ['optimize', 'Monitor & Optimize'],
  ['manage', 'Strategies, Resources & History'],
]

function AIOperationIntelligencePage() {
  const [tab, setTab] = useState('optimize')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Gauge className="w-6 h-6 mr-2 text-teal-700" />
          AI Operation Intelligence
        </h1>
        <p className="text-gray-600">Real-time performance monitoring, optimization and anomaly detection.</p>
      </div>

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
  )
}

export default AIOperationIntelligencePage
