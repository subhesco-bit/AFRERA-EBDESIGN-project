'use strict';

const { signalBus } = require('../../core/signalBus');
const { decisionEngine } = require('../../core/decisionEngine');

const workingMemory = new Map();
const longTermMemory = new Map();
const knowledgeGraph = new Map();

function normalizeInput(input) {
  if (typeof input === 'string') return { text: input };
  return input && typeof input === 'object' ? { ...input } : { value: input };
}

function perceptionProcess(input, context = {}) {
  const observation = normalizeInput(input);
  return Promise.resolve({
    type: 'perception',
    observation,
    context: { ...context },
    signals: Object.keys(observation),
    timestamp: new Date().toISOString(),
  });
}

function attentionProcess(perception, goals = []) {
  const items = normalizeInput(perception);
  return Promise.resolve({
    type: 'attention',
    focus: items,
    goals: Array.isArray(goals) ? goals : [goals],
    timestamp: new Date().toISOString(),
  });
}

function reasoningProcess(attention, knowledge = {}) {
  const facts = knowledge && typeof knowledge === 'object' ? knowledge : {};
  return Promise.resolve({
    type: 'reasoning',
    premises: normalizeInput(attention),
    facts,
    rationale: Object.keys(facts).length
      ? 'Reasoning used the supplied domain facts.'
      : 'Reasoning used the observed context; additional domain facts may improve the result.',
    timestamp: new Date().toISOString(),
  });
}

function decisionProcess(reasoning, context = {}, constraints = {}) {
  const result = normalizeInput(reasoning);
  const blocked = Array.isArray(constraints.blockedActions) ? constraints.blockedActions : [];
  return Promise.resolve({
    type: 'decision',
    decision: blocked.length ? 'human_review_required' : 'proceed_with_review',
    reasoning: result,
    context,
    constraints,
    blockedActions: blocked,
    requiresHuman: true,
    timestamp: new Date().toISOString(),
  });
}

function planningProcess(decision, currentState = {}, targetState = {}) {
  const steps = Object.entries(targetState).map(([key, value]) => ({
    key,
    from: currentState[key],
    to: value,
    status: currentState[key] === value ? 'complete' : 'pending',
  }));
  return Promise.resolve({ type: 'planning', decision, steps, timestamp: new Date().toISOString() });
}

async function executeCognitiveCycle(input, context = {}, goals = [], constraints = {}) {
  const perception = await perceptionProcess(input, context);
  const attention = await attentionProcess(perception, goals);
  const reasoning = await reasoningProcess(attention, context.knowledge || {});
  const decision = await decisionProcess(reasoning, context, constraints);
  const plan = await planningProcess(decision, context.currentState || {}, context.targetState || {});
  return { success: true, perception, attention, reasoning, decision, plan };
}

function addKnowledge(domain, knowledge) {
  const current = knowledgeGraph.get(domain) || [];
  current.push({ ...normalizeInput(knowledge), addedAt: new Date().toISOString() });
  knowledgeGraph.set(domain, current);
  return current.at(-1);
}

function getKnowledge(domain) {
  return knowledgeGraph.get(domain) || null;
}

function getCognitiveState() {
  return {
    status: 'active',
    workingMemorySize: workingMemory.size,
    longTermMemorySize: longTermMemory.size,
    knowledgeDomains: [...knowledgeGraph.keys()],
    decisionEngine: decisionEngine.recentDecisions(10),
    signals: signalBus.recent({ limit: 10 }),
  };
}

function updateContext(key, value) {
  workingMemory.set(key, value);
  return { key, value };
}

function clearWorkingMemory() {
  workingMemory.clear();
  return { cleared: true };
}

module.exports = {
  executeCognitiveCycle,
  perceptionProcess,
  attentionProcess,
  reasoningProcess,
  decisionProcess,
  planningProcess,
  learningProcess: (experience, outcome) => {
    longTermMemory.set(String(Date.now()), { experience, outcome });
    return Promise.resolve({ stored: true, experience, outcome });
  },
  addKnowledge,
  getKnowledge,
  getCognitiveState,
  updateContext,
  clearWorkingMemory,
  workingMemory,
  longTermMemory,
  knowledgeGraph,
};