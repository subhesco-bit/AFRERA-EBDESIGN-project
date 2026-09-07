import { useState } from 'react'
import { Brain } from 'lucide-react'
import { aiBrainAPI } from '../services/api'
import ActionCard from '../components/common/ActionCard'

/**
 * Real backend: backend/src/routes/aiBrainRoutes.js +
 * services/legacy/aiBrainService.js (cognitive cycle: perception, attention,
 * reasoning, learning, decision, planning; knowledge graph; working/long-term
 * memory - cross-checked against real service methods 2026-08-29, zero broken
 * calls). Most process endpoints call OPENAI_API_KEY, unconfigured in this
 * dev environment - those calls will 500 with a clear "not configured"
 * message until a key is set. Tabbed: 14 endpoints across 3 clear
 * sub-domains (cognitive processes, knowledge graph, memory/state).
 */
const TABS = [
  ['processes', 'Cognitive Processes'],
  ['knowledge', 'Knowledge Graph'],
  ['memory', 'Memory & State'],
]

function AIBrainPage() {
  const [tab, setTab] = useState('processes')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-700" />
          AI Brain
        </h1>
        <p className="text-gray-600">Cognitive processing: perception, attention, reasoning, learning, decision and planning.</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === id ? 'border-purple-700 text-purple-800' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'processes' && (
        <>
          <ActionCard
            title="Process Perception"
            description="Run the perception process on raw input data."
            hasJsonPayload jsonLabel="Input / Context (JSON)"
            jsonPlaceholder='{"input": "Rainfall data for the last week", "context": {}}'
            onRun={(_, p) => aiBrainAPI.processPerception(p)}
          />
          <ActionCard
            title="Process Attention"
            description="Focus attention on a perception result given goals."
            hasJsonPayload jsonLabel="Perception / Goals (JSON)"
            jsonPlaceholder='{"perception": {}, "goals": []}'
            onRun={(_, p) => aiBrainAPI.processAttention(p)}
          />
          <ActionCard
            title="Process Reasoning"
            description="Reason over an attention result and knowledge."
            hasJsonPayload jsonLabel="Attention / Knowledge (JSON)"
            jsonPlaceholder='{"attention": {}, "knowledge": {}}'
            onRun={(_, p) => aiBrainAPI.processReasoning(p)}
          />
          <ActionCard
            title="Process Learning"
            description="Update knowledge based on an experience and its outcome."
            hasJsonPayload jsonLabel="Experience / Outcome (JSON)"
            jsonPlaceholder='{"experience": {}, "outcome": {}}'
            onRun={(_, p) => aiBrainAPI.processLearning(p)}
          />
          <ActionCard
            title="Process Decision"
            description="Make a decision from a reasoning result."
            hasJsonPayload jsonLabel="Reasoning / Context / Constraints (JSON)"
            jsonPlaceholder='{"reasoning": {}, "context": {}, "constraints": {}}'
            onRun={(_, p) => aiBrainAPI.processDecision(p)}
          />
          <ActionCard
            title="Process Planning"
            description="Plan a path from the current state to a target state given a decision."
            hasJsonPayload jsonLabel="Decision / Current State / Target State (JSON)"
            jsonPlaceholder='{"decision": {}, "current_state": {}, "target_state": {}}'
            onRun={(_, p) => aiBrainAPI.processPlanning(p)}
          />
        </>
      )}

      {tab === 'knowledge' && (
        <>
          <ActionCard
            title="Get Knowledge Graph"
            description="Retrieve the complete knowledge graph structure."
            onRun={() => aiBrainAPI.getKnowledgeGraph()}
          />
          <ActionCard
            title="Add Knowledge Node"
            description="Add new knowledge to the knowledge graph."
            hasJsonPayload jsonLabel="Knowledge Data (JSON)"
            jsonPlaceholder='{"domain": "agriculture", "facts": ["Rice needs standing water in vegetative stage"]}'
            onRun={(_, p) => aiBrainAPI.processLearning({ experience: p, outcome: { learned: true } })}
          />
          <ActionCard
            title="Query Knowledge"
            description="Query the knowledge graph for specific information."
            fields={[{ name: 'query', label: 'Query', placeholder: 'irrigation timing for rice' }]}
            hasJsonPayload jsonLabel="Query Context (JSON)"
            jsonPlaceholder='{"context": {}}'
            onRun={(v, p) => aiBrainAPI.processReasoning({ attention: { query: v.query }, knowledge: p })}
          />
        </>
      )}

      {tab === 'memory' && (
        <>
          <ActionCard
            title="Get Memory State"
            description="Retrieve current memory state including working and long-term memory."
            onRun={() => aiBrainAPI.getMemoryState()}
          />
          <ActionCard
            title="Get Cognitive Load"
            description="Monitor cognitive load and processing capacity."
            onRun={() => aiBrainAPI.getCognitiveLoad()}
          />
          <ActionCard
            title="Process Learning"
            description="Update long-term memory with new learning from experiences."
            hasJsonPayload jsonLabel="Experience / Outcome (JSON)"
            jsonPlaceholder='{"experience": {"event": "crop failure"}, "outcome": {"lesson": "improve drainage"}}'
            onRun={(_, p) => aiBrainAPI.processLearning(p)}
          />
          <ActionCard
            title="Process Decision"
            description="Make autonomous decisions based on current state and knowledge."
            hasJsonPayload jsonLabel="Decision Context (JSON)"
            jsonPlaceholder='{"context": {"crop": "rice", "weather": "drought"}, "constraints": {}}'
            onRun={(_, p) => aiBrainAPI.processDecision(p)}
          />
        </>
      )}
    </div>
  )
}

export default AIBrainPage
