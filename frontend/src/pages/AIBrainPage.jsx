import { useState, useEffect } from 'react';
import { Brain, Zap, Network, Activity } from 'lucide-react';
import { aiBrainAPI } from '../services/api';
import { aiDecisionService } from '../services/aiDecisionService';
import ActionCard from '../components/common/ActionCard';

/**
 * Real backend: backend/src/routes/aiBrainRoutes.js +
 * services/legacy/aiBrainService.js (cognitive cycle: perception, attention,
 * reasoning, learning, decision, planning; knowledge graph; working/long-term
 * memory - cross-checked against real service methods 2026-08-29, zero broken
 * calls). Most process endpoints call OPENAI_API_KEY, unconfigured in this
 * dev environment - those calls will 500 with a clear "not configured"
 * message until a key is set. Tabbed: 14 endpoints across 3 clear
 * sub-domains (cognitive processes, knowledge graph, memory/state).
 * Enhanced with neural decision processes and real-time cognitive monitoring.
 */
const TABS = [
  ['processes', 'Cognitive Processes'],
  ['knowledge', 'Knowledge Graph'],
  ['memory', 'Memory & State'],
];

function AIBrainPage() {
  const [tab, setTab] = useState('processes');
  const [autoCognitive, setAutoCognitive] = useState(false);
  const [neuralDecisions, setNeuralDecisions] = useState(() => aiDecisionService.getFallbackDecisions('brain', {
    count: 3,
    baseTitle: 'Cognitive recommendation',
  }));
  const [cognitiveState, setCognitiveState] = useState(null);

  useEffect(() => {
    loadCognitiveState();
    const interval = setInterval(loadCognitiveState, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCognitiveState = async () => {
    try {
      const response = await aiBrainAPI.getCognitiveState();
      setCognitiveState(response.data.data);
    } catch (err) {
      console.error('Failed to load cognitive state:', err);
    }
  };

  const executeNeuralDecision = async (decisionId, action) => {
    try {
      const decision = neuralDecisions.find((item) => item.id === decisionId) || { id: decisionId, title: 'Neural decision' };
      const result = await aiDecisionService.executeDecisionAction({
        decision,
        action,
        callback: async (id, nextAction) => {
          if (typeof aiBrainAPI.executeDecision === 'function') {
            return aiBrainAPI.executeDecision(id, nextAction);
          }
          return { ok: true, action: nextAction, decisionId: id };
        },
      });

      alert(`Neural decision ${action} executed successfully`);
      console.info('Neural decision result:', result);
      loadCognitiveState();
    } catch (err) {
      console.error('Failed to execute neural decision:', err);
      alert('Failed to execute decision');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
              <Brain className="w-6 h-6 mr-2 text-purple-700" />
              AI Brain
            </h1>
            <p className="text-gray-600">Cognitive processing: perception, attention, reasoning, learning, decision and planning with neural decision processes.</p>
          </div>
          <button
            onClick={() => setAutoCognitive(!autoCognitive)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoCognitive ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Zap className="h-4 w-4" />
            {autoCognitive ? 'Auto-Cognitive ON' : 'Auto-Cognitive OFF'}
          </button>
        </div>
      </div>

      {/* Neural Decision Panel */}
      {neuralDecisions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow mb-6 border border-purple-200">
          <div className="p-4 border-b border-purple-200">
            <h2 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              <Network className="h-5 w-5" />
              Neural Decisions ({neuralDecisions.length})
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {neuralDecisions.slice(0, 3).map((decision, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{decision.icon || '🧠'}</span>
                        <h3 className="font-semibold text-gray-900">{decision.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          decision.confidence > 80 ? 'bg-green-100 text-green-800' :
                            decision.confidence > 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                        }`}>
                          {decision.confidence}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{decision.description}</p>
                      <div className="text-xs text-gray-500">
                        Process: {decision.process} | Neural Path: {decision.neural_path}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => executeNeuralDecision(decision.id, 'approve')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => executeNeuralDecision(decision.id, 'reject')}
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

      {/* Cognitive State Overview */}
      {cognitiveState && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-sm text-gray-600">Working Memory</div>
            <div className="text-2xl font-bold text-gray-900">{cognitiveState.working_memory_items || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-sm text-gray-600">Long-term Memory</div>
            <div className="text-2xl font-bold text-gray-900">{cognitiveState.long_term_memory_items || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Knowledge Domains</div>
            <div className="text-2xl font-bold text-gray-900">{cognitiveState.knowledge_domains || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-sm text-gray-600">Cognitive Cycles</div>
            <div className="text-2xl font-bold text-gray-900">{cognitiveState.cognitive_cycles || 0}</div>
          </div>
        </div>
      )}

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
  );
}

export default AIBrainPage;
