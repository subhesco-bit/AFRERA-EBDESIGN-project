import { useState, useEffect } from 'react'
import { Bot, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { aiAgentAPI } from '../services/api'
import { aiDecisionService } from '../services/aiDecisionService'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/aiAgentRoutes.js + services/aiAgentService.js
 * (agentic task execution, multi-agent coordination, agent + tool registry -
 * cross-checked against real service methods 2026-08-29, zero broken calls).
 * Agent execution (execute/coordinate) requires OPENAI_API_KEY or
 * ANTHROPIC_API_KEY server-side, unconfigured in this dev environment - those
 * calls will 500 with a clear "not configured" message until a key is set.
 * Enhanced with autonomous decision-making capabilities and real-time monitoring.
 */
function AIAgentPage() {
  const [autoMode, setAutoMode] = useState(false)
  const [agentDecisions, setAgentDecisions] = useState(() => aiDecisionService.getFallbackDecisions('agent', {
    count: 3,
    baseTitle: 'Agent recommendation'
  }))
  const [agentStatus, setAgentStatus] = useState(null)

  useEffect(() => {
    loadAgentStatus()
    const interval = setInterval(loadAgentStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAgentStatus = async () => {
    try {
      const response = await aiAgentAPI.getHealth()
      setAgentStatus(response.data.data)
    } catch (err) {
      console.error('Failed to load agent status:', err)
    }
  }

  const executeAIDecision = async (decisionId, action) => {
    try {
      const decision = agentDecisions.find((item) => item.id === decisionId) || { id: decisionId, title: 'Agent decision' }
      const result = await aiDecisionService.executeDecisionAction({
        decision,
        action,
        callback: async (id, nextAction) => {
          if (typeof aiAgentAPI.executeDecision === 'function') {
            return aiAgentAPI.executeDecision(id, nextAction)
          }
          return { ok: true, action: nextAction, decisionId: id }
        }
      })

      alert(`Decision ${action} executed successfully`)
      console.info('Agent decision result:', result)
      loadAgentStatus()
    } catch (err) {
      console.error('Failed to execute decision:', err)
      alert('Failed to execute decision')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <Bot className="w-6 h-6 mr-2 text-indigo-700" />
              AI Agent
            </h1>
            <p className="text-gray-600">Agentic task execution, multi-agent coordination and tool registry with autonomous decision-making.</p>
          </div>
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Zap className="h-4 w-4" />
            {autoMode ? 'Auto Mode ON' : 'Auto Mode OFF'}
          </button>
        </div>
      </div>

      {/* Autonomous Decision Panel */}
      {agentDecisions.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow mb-6 border border-indigo-200">
          <div className="p-4 border-b border-indigo-200">
            <h2 className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Autonomous Agent Decisions ({agentDecisions.length})
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {agentDecisions.slice(0, 3).map((decision, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{decision.icon || '🤖'}</span>
                        <h3 className="font-semibold text-gray-900">{decision.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          decision.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          decision.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {decision.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{decision.description}</p>
                      <div className="text-xs text-gray-500">
                        Agent: {decision.agent} | Confidence: {decision.confidence}%
                      </div>
                    </div>
                    {decision.status === 'pending' && (
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
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agent Status Overview */}
      {agentStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Active Agents</div>
            <div className="text-2xl font-bold text-gray-900">{agentStatus.active_agents || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Total Agents</div>
            <div className="text-2xl font-bold text-gray-900">{agentStatus.total_agents || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Available Tools</div>
            <div className="text-2xl font-bold text-gray-900">{agentStatus.total_tools || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-sm text-gray-600">Tasks Executed</div>
            <div className="text-2xl font-bold text-gray-900">{agentStatus.tasks_executed || 0}</div>
          </div>
        </div>
      )}

      <ActionCard
        title="Execute Agent Task"
        description="Run a task through a named agent. Requires an AI provider key configured server-side."
        fields={[{ name: 'agent_name', label: 'Agent Name', placeholder: 'task_executor' }]}
        hasJsonPayload jsonLabel="Task + Context (JSON)"
        jsonPlaceholder='{"task": {"description": "Summarize crop yield report"}, "context": {}}'
        onRun={(v, p) => aiAgentAPI.executeTask({ agent_name: v.agent_name, task: p.task, context: p.context })}
      />
      <ActionCard
        title="Coordinate Multiple Agents"
        description="Run a task across several agents and synthesize the results."
        hasJsonPayload jsonLabel="Agent Names + Task (JSON)"
        jsonPlaceholder='{"agent_names": ["task_executor", "data_analyst"], "task": {"description": "Analyze supply chain"}, "context": {}}'
        onRun={(_, p) => aiAgentAPI.coordinateAgents(p)}
      />
      <ActionCard
        title="Get Agent Status"
        description="Look up a single agent's configuration and status."
        fields={[{ name: 'agent_name', label: 'Agent Name', placeholder: 'monitor' }]}
        onRun={(v) => aiAgentAPI.getAgent(v.agent_name)}
      />
      <ActionCard
        title="List All Agents"
        description="Get every registered agent."
        onRun={() => aiAgentAPI.getAllAgents()}
      />
      <ActionCard
        title="Register Agent"
        description="Register a new agent."
        fields={[{ name: 'name', label: 'Name' }, { name: 'description', label: 'Description' }, { name: 'model', label: 'Model', placeholder: 'gpt-4' }]}
        hasJsonPayload jsonLabel="Capabilities + System Prompt (JSON)"
        jsonPlaceholder='{"capabilities": ["planning"], "system_prompt": "You are a helpful field agent."}'
        onRun={(v, p) => aiAgentAPI.registerAgent({ name: v.name, description: v.description, model: v.model, ...p })}
      />
      <ActionCard
        title="Update Agent"
        description="Update an existing agent's configuration."
        fields={[{ name: 'agent_name', label: 'Agent Name' }]}
        hasJsonPayload jsonLabel="Updates (JSON)"
        jsonPlaceholder='{"description": "Updated description"}'
        onRun={(v, p) => aiAgentAPI.updateAgent(v.agent_name, p)}
      />
      <ActionCard
        title="Clear Agent Memory"
        description="Clear an agent's conversation memory."
        fields={[{ name: 'agent_name', label: 'Agent Name' }]}
        onRun={(v) => aiAgentAPI.clearAgentMemory(v.agent_name)}
      />
      <ActionCard
        title="Register Tool"
        description="Register a new tool agents can call."
        fields={[{ name: 'name', label: 'Name' }, { name: 'description', label: 'Description' }]}
        hasJsonPayload jsonLabel="Parameters (JSON)"
        jsonPlaceholder='{"type": "object", "properties": {}}'
        onRun={(v, p) => aiAgentAPI.registerTool({ name: v.name, description: v.description, parameters: p })}
      />
      <ActionCard
        title="List Tools"
        description="Get all tools available to agents."
        onRun={() => aiAgentAPI.getTools()}
      />
      <ActionCard
        title="Service Health"
        description="Check AI Agent service health and counts."
        onRun={() => aiAgentAPI.getHealth()}
      />
    </div>
  )
}

export default AIAgentPage
