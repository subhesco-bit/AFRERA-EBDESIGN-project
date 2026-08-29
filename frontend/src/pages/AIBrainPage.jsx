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
            title="Full Cognitive Cycle"
            description="Run input through the complete perception -> attention -> reasoning -> decision -> planning pipeline. Requires OPENAI_API_KEY."
            hasJsonPayload jsonLabel="Input / Context / Goals / Constraints (JSON)"
            jsonPlaceholder='{"input": "Advise on irrigation timing", "context": {}, "goals": [], "constraints": {}}'
            onRun={(_, p) => aiBrainAPI.runCognitiveCycle(p)}
          />
          <ActionCard
            title="Perception"
            description="Run the perception process on raw input."
            hasJsonPayload jsonLabel="Input / Context (JSON)"
            jsonPlaceholder='{"input": "Rainfall data for the last week", "context": {}}'
            onRun={(_, p) => aiBrainAPI.runPerception(p)}
          />
          <ActionCard
            title="Attention"
            description="Focus attention on a perception result given goals."
            hasJsonPayload jsonLabel="Perception / Goals (JSON)"
            jsonPlaceholder='{"perception": {}, "goals": []}'
            onRun={(_, p) => aiBrainAPI.runAttention(p)}
          />
          <ActionCard
            title="Reasoning"
            description="Reason over an attention result and knowledge."
            hasJsonPayload jsonLabel="Attention / Knowledge (JSON)"
            jsonPlaceholder='{"attention": {}, "knowledge": {}}'
            onRun={(_, p) => aiBrainAPI.runReasoning(p)}
          />
          <ActionCard
            title="Learning"
            description="Update knowledge based on an experience and its outcome."
            hasJsonPayload jsonLabel="Experience / Outcome (JSON)"
            jsonPlaceholder='{"experience": {}, "outcome": {}}'
            onRun={(_, p) => aiBrainAPI.runLearning(p)}
          />
          <ActionCard
            title="Decision"
            description="Make a decision from a reasoning result."
            hasJsonPayload jsonLabel="Reasoning / Context / Constraints (JSON)"
            jsonPlaceholder='{"reasoning": {}, "context": {}, "constraints": {}}'
            onRun={(_, p) => aiBrainAPI.runDecision(p)}
          />
          <ActionCard
            title="Planning"
            description="Plan a path from the current state to a target state given a decision."
            hasJsonPayload jsonLabel="Decision / Current State / Target State (JSON)"
            jsonPlaceholder='{"decision": {}, "current_state": {}, "target_state": {}}'
            onRun={(_, p) => aiBrainAPI.runPlanning(p)}
          />
        </>
      )}

      {tab === 'knowledge' && (
        <>
          <ActionCard
            title="Add Knowledge"
            description="Add knowledge to a domain in the knowledge graph."
            fields={[{ name: 'domain', label: 'Domain', placeholder: 'agriculture' }]}
            hasJsonPayload jsonLabel="Knowledge (JSON)"
            jsonPlaceholder='{"facts": ["Rice needs standing water in vegetative stage"]}'
            onRun={(v, p) => aiBrainAPI.addKnowledge({ domain: v.domain, knowledge: p })}
          />
          <ActionCard
            title="Get Knowledge by Domain"
            description="Fetch knowledge for a single domain."
            fields={[{ name: 'domain', label: 'Domain', placeholder: 'agriculture' }]}
            onRun={(v) => aiBrainAPI.getKnowledge(v.domain)}
          />
          <ActionCard
            title="List Knowledge Domains"
            description="List every domain currently in the knowledge graph."
            onRun={() => aiBrainAPI.getAllKnowledgeDomains()}
          />
        </>
      )}

      {tab === 'memory' && (
        <>
          <ActionCard
            title="Get Cognitive State"
            description="Fetch the current cognitive state, working memory and long-term memory summary."
            onRun={() => aiBrainAPI.getCognitiveState()}
          />
          <ActionCard
            title="Update Context"
            description="Update the brain's active context."
            hasJsonPayload jsonLabel="Context (JSON)"
            jsonPlaceholder='{"location": "Assam", "season": "kharif"}'
            onRun={(_, p) => aiBrainAPI.updateContext(p)}
          />
          <ActionCard
            title="Clear Working Memory"
            description="Clear the short-term working memory."
            onRun={() => aiBrainAPI.clearWorkingMemory()}
          />
          <ActionCard
            title="Service Health"
            description="Check AI Brain service health and memory sizes."
            onRun={() => aiBrainAPI.getHealth()}
          />
        </>
      )}
    </div>
  )
}

export default AIBrainPage
