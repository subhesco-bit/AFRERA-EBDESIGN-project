import { Bot } from 'lucide-react'
import { aiAgentAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/aiAgentRoutes.js + services/aiAgentService.js
 * (agentic task execution, multi-agent coordination, agent + tool registry -
 * cross-checked against real service methods 2026-08-29, zero broken calls).
 * Agent execution (execute/coordinate) requires OPENAI_API_KEY or
 * ANTHROPIC_API_KEY server-side, unconfigured in this dev environment - those
 * calls will 500 with a clear "not configured" message until a key is set.
 * Single scroll of ActionCards: ~9 operations, no natural sub-domain split.
 */
function AIAgentPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Bot className="w-6 h-6 mr-2 text-indigo-700" />
          AI Agent
        </h1>
        <p className="text-gray-600">Agentic task execution, multi-agent coordination and tool registry.</p>
      </div>

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
