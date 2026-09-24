/**
 * Workflow FSM — shared lifecycle for case handling across modules
 * States: intake → analyze → interpret → decide → communicate → act → feedback → closed
 */

const { randomUUID } = require('crypto');

const STATES = [
  'intake',
  'analyze',
  'interpret',
  'decide',
  'communicate',
  'act',
  'feedback',
  'closed',
];

const TRANSITIONS = {
  intake: ['analyze'],
  analyze: ['interpret', 'intake'],
  interpret: ['decide', 'analyze'],
  decide: ['communicate', 'interpret'],
  communicate: ['act', 'decide'],
  act: ['feedback', 'communicate'],
  feedback: ['closed', 'analyze'],
  closed: [],
};

function createWorkflow(input = {}) {
  return {
    workflow_id: randomUUID(),
    module: input.module || 'unified',
    state: 'intake',
    history: [{ state: 'intake', at: new Date().toISOString(), note: 'created' }],
    context: input.context || {},
    blocked: false,
  };
}

function advance(workflow, toState, note) {
  const from = workflow.state;
  const allowed = TRANSITIONS[from] || [];
  if (!allowed.includes(toState)) {
    return {
      ok: false,
      error: `Illegal transition ${from} → ${toState}`,
      allowed,
      workflow,
    };
  }
  workflow.state = toState;
  workflow.history.push({ state: toState, at: new Date().toISOString(), note: note || null });
  return { ok: true, workflow };
}

/** Run canonical pipeline producing step artifacts */
function runPipeline(steps = {}) {
  const wf = createWorkflow({ module: steps.module || 'unified' });
  const artifacts = {};
  const seq = ['analyze', 'interpret', 'decide', 'communicate'];
  for (const s of seq) {
    advance(wf, s, `auto_${s}`);
    artifacts[s] = steps[s] || { status: 'placeholder' };
  }
  return { workflow: wf, artifacts, states_catalogue: STATES };
}

module.exports = {
  STATES,
  TRANSITIONS,
  createWorkflow,
  advance,
  runPipeline,
};
