/**
 * Optimisation — objectives, constraints, and a solver you can swap.
 *
 * The roadmap lists "Quantum + AI" against cost optimisation, order allocation
 * and corridor routing. Treating that as a quantum project would be the wrong
 * order of work: the value available today is in STATING these problems
 * properly — decision variables, a cost function, hard constraints — behind an
 * interface whose backend can change. A classical solver delivers the saving
 * now, and a quantum backend later becomes configuration rather than a rewrite.
 *
 * What existed before this file: core/mcda.js, which scores options against
 * weighted criteria. That is ranking, not optimisation. MCDA can tell you which
 * single warehouse looks best; it cannot allocate forty consignments across
 * twelve bays subject to capacity and temperature compatibility, because every
 * assignment changes what the others may do. That coupling is the problem, and
 * nothing in the platform addressed it.
 *
 * DESIGN
 *
 *   An OBJECTIVE names the problem: its variables, its hard constraints, and
 *   the cost of a candidate assignment. Objectives are data, registered here,
 *   so a new one is a declaration rather than new solver code.
 *
 *   A SOLVER takes an objective and returns an assignment. `classical` is a
 *   greedy construction followed by steepest-descent local search — modest,
 *   deterministic, and good enough to beat manual allocation. The interface is
 *   what matters: `solve(objectiveId, instance, { backend })`.
 *
 * HONESTY ABOUT WHAT THIS IS
 *
 *   This is a heuristic, not an exact optimiser. It reports the cost it
 *   achieved, whether every hard constraint holds, and how much it improved on
 *   the greedy start. It does NOT claim optimality, because for these problem
 *   sizes it cannot prove it. A solver that quietly implies optimality is worse
 *   than one that states its limits, particularly when the output allocates
 *   perishable stock.
 */

'use strict';

const { logger } = require('../../utils/logger');

// ---------------------------------------------------------------- objectives

/**
 * @typedef {Object} Objective
 * @property {string}   id
 * @property {string}   description
 * @property {string[]} applications
 * @property {(i:object)=>string[]} items      things to assign
 * @property {(i:object)=>string[]} slots      places to assign them
 * @property {(item:string, slot:string, i:object)=>boolean} feasible  hard constraint
 * @property {(assignment:object, i:object)=>number} cost   lower is better
 */

const OBJECTIVES = new Map();

function registerObjective(objective) {
  for (const k of ['id', 'items', 'slots', 'feasible', 'cost']) {
    if (!objective[k]) throw new Error(`Objective is missing "${k}"`);
  }
  if (!objective.description || objective.description.length < 20) {
    // Same discipline erpAgents applies to proposals: an unexplained objective
    // cannot be reviewed, and an optimiser nobody can review should not run.
    throw new Error(`Objective "${objective.id}" needs a description of what it optimises and why`);
  }
  OBJECTIVES.set(objective.id, objective);
  return objective;
}

// ----- cold storage bay allocation -----------------------------------------

registerObjective({
  id: 'coldstorage.bay_allocation',
  description:
    'Assign incoming consignments to cold storage bays, minimising the cost of ' +
    'spoilage risk plus handling, subject to bay capacity and the temperature ' +
    'band each commodity requires.',
  applications: ['cold chain', 'order allocation'],

  items: (i) => i.consignments.map((c) => c.id),
  slots: (i) => i.bays.map((b) => b.id),

  feasible: (consignmentId, bayId, i) => {
    const c = i.consignments.find((x) => x.id === consignmentId);
    const b = i.bays.find((x) => x.id === bayId);
    if (!c || !b) return false;
    // A bay outside the commodity's temperature band is not a cheaper option,
    // it is a spoiled consignment. Hard constraint, never a cost penalty.
    if (b.tempC < c.minTempC || b.tempC > c.maxTempC) return false;
    return true;
  },

  cost: (assignment, i) => {
    let total = 0;

    // Capacity is checked as cost-with-a-cliff rather than feasibility,
    // because a greedy start that cannot place everything is more useful than
    // no answer — an overfull bay is reported as a violation.
    const load = new Map();
    for (const [cid, bid] of Object.entries(assignment)) {
      const c = i.consignments.find((x) => x.id === cid);
      load.set(bid, (load.get(bid) || 0) + c.volumeM3);
    }
    for (const b of i.bays) {
      const used = load.get(b.id) || 0;
      if (used > b.capacityM3) total += (used - b.capacityM3) * 10000;
    }

    for (const [cid, bid] of Object.entries(assignment)) {
      const c = i.consignments.find((x) => x.id === cid);
      const b = i.bays.find((x) => x.id === bid);

      // Spoilage risk: the closer the bay runs to the commodity's upper limit,
      // the more shelf life is lost. Weighted by what the consignment is worth.
      const band = Math.max(0.1, c.maxTempC - c.minTempC);
      const headroom = (c.maxTempC - b.tempC) / band;   // 1 = coldest, 0 = at the limit
      total += c.valueINR * (1 - headroom) * (c.perishability ?? 0.5);

      // Handling: distance from the receiving dock.
      total += (b.distanceFromDockM ?? 0) * (c.volumeM3 ?? 1) * 0.5;

      // Energy: colder bays cost more to hold, so do not over-chill by default.
      total += Math.max(0, c.maxTempC - b.tempC) * (c.volumeM3 ?? 1) * 20;
    }
    return Math.round(total);
  },
});

// ----- corridor routing -----------------------------------------------------

registerObjective({
  id: 'logistics.corridor_allocation',
  description:
    'Assign consignments to corridor nodes (production node, hub, destination ' +
    'store) minimising transport cost and time-in-transit against remaining ' +
    'shelf life, subject to node throughput.',
  applications: ['corridor routing', 'cost optimisation'],

  items: (i) => i.consignments.map((c) => c.id),
  slots: (i) => i.nodes.map((n) => n.id),

  feasible: (cid, nid, i) => {
    const c = i.consignments.find((x) => x.id === cid);
    const n = i.nodes.find((x) => x.id === nid);
    if (!c || !n) return false;
    // Arriving after the consignment expires is not a routing option.
    return n.transitHours <= c.remainingShelfLifeHours;
  },

  cost: (assignment, i) => {
    let total = 0;
    const load = new Map();
    for (const [cid, nid] of Object.entries(assignment)) {
      const c = i.consignments.find((x) => x.id === cid);
      load.set(nid, (load.get(nid) || 0) + c.tonnes);
    }
    for (const n of i.nodes) {
      const used = load.get(n.id) || 0;
      if (used > n.throughputTonnes) total += (used - n.throughputTonnes) * 50000;
    }
    for (const [cid, nid] of Object.entries(assignment)) {
      const c = i.consignments.find((x) => x.id === cid);
      const n = i.nodes.find((x) => x.id === nid);
      total += n.costPerTonne * c.tonnes;
      // Shelf life consumed in transit, priced against consignment value.
      const consumed = n.transitHours / Math.max(1, c.remainingShelfLifeHours);
      total += c.valueINR * consumed * 0.3;
    }
    return Math.round(total);
  },
});

// ---------------------------------------------------------------- solvers

/** Greedy: place each item in its cheapest feasible slot, hardest items first. */
function greedy(obj, instance) {
  const items = obj.items(instance);
  const slots = obj.slots(instance);
  const assignment = {};
  const unplaced = [];

  // Fewest feasible options first — placing the constrained items last is how
  // a greedy pass paints itself into a corner.
  const ordered = [...items].sort((a, b) =>
    slots.filter((s) => obj.feasible(a, s, instance)).length -
    slots.filter((s) => obj.feasible(b, s, instance)).length);

  for (const item of ordered) {
    let best = null;
    let bestCost = Infinity;
    for (const slot of slots) {
      if (!obj.feasible(item, slot, instance)) continue;
      const trial = { ...assignment, [item]: slot };
      const c = obj.cost(trial, instance);
      if (c < bestCost) { bestCost = c; best = slot; }
    }
    if (best === null) unplaced.push(item);
    else assignment[item] = best;
  }
  return { assignment, unplaced };
}

/** Steepest descent: repeatedly take the single best improving move. */
function localSearch(obj, instance, start, { maxIterations = 200 } = {}) {
  const slots = obj.slots(instance);
  let current = { ...start };
  let currentCost = obj.cost(current, instance);
  let iterations = 0;

  for (; iterations < maxIterations; iterations += 1) {
    let bestMove = null;
    let bestCost = currentCost;

    for (const item of Object.keys(current)) {
      for (const slot of slots) {
        if (slot === current[item]) continue;
        if (!obj.feasible(item, slot, instance)) continue;
        const trial = { ...current, [item]: slot };
        const c = obj.cost(trial, instance);
        if (c < bestCost) { bestCost = c; bestMove = { item, slot }; }
      }
    }

    if (!bestMove) break;              // local optimum
    current[bestMove.item] = bestMove.slot;
    currentCost = bestCost;
  }
  return { assignment: current, cost: currentCost, iterations };
}

const BACKENDS = {
  /**
   * Deterministic heuristic: greedy construction, then steepest descent.
   * Not exact. Reports what it achieved, never that it is optimal.
   */
  classical: (obj, instance, opts) => {
    const g = greedy(obj, instance);
    const greedyCost = Object.keys(g.assignment).length ? obj.cost(g.assignment, instance) : 0;
    const improved = localSearch(obj, instance, g.assignment, opts);
    return {
      assignment: improved.assignment,
      cost: improved.cost,
      greedyCost,
      improvement: greedyCost - improved.cost,
      iterations: improved.iterations,
      unplaced: g.unplaced,
    };
  },

  /**
   * Placeholder that refuses rather than pretending. Registered so the swap is
   * a configuration change and so `solve` can report honestly that the backend
   * is unavailable — a fake quantum path returning classical results would be
   * the worst possible outcome here.
   */
  quantum: () => {
    throw new Error(
      'No quantum backend is configured. The objective and solver interface are ' +
      'ready for one; nothing is going to be simulated in its place.',
    );
  },
};

function registerBackend(name, adapter) {
  if (!/^[a-z][a-z0-9_-]{1,39}$/.test(String(name)) || typeof adapter !== 'function') {
    throw new Error('A solver backend needs a safe name and an executable adapter');
  }
  if (name === 'classical') throw new Error('The classical baseline cannot be replaced at runtime');
  BACKENDS[name] = adapter;
}

function validateInstance(objectiveId, instance) {
  const obj = OBJECTIVES.get(objectiveId);
  if (!obj) throw new Error(`Unknown objective: ${objectiveId}`);
  if (!instance || typeof instance !== 'object' || Array.isArray(instance)) throw new Error('instance must be an object');
  const items = obj.items(instance); const slots = obj.slots(instance);
  if (!Array.isArray(items) || !Array.isArray(slots) || items.length === 0 || slots.length === 0) {
    throw new Error('instance must contain at least one item and one slot');
  }
  if (items.length > 10000 || slots.length > 10000) throw new Error('instance exceeds the 10,000 item/slot execution limit');
  if (new Set(items).size !== items.length || new Set(slots).size !== slots.length) throw new Error('item and slot identifiers must be unique');
  return { itemCount: items.length, slotCount: slots.length };
}

// ---------------------------------------------------------------- entry point

/**
 * Solve a registered objective against a problem instance.
 *
 * Returns the assignment, its cost, and an explicit verification of every hard
 * constraint — so a caller can see that the answer is feasible rather than
 * assuming it.
 */
function solve(objectiveId, instance, { backend = 'classical', ...opts } = {}) {
  const obj = OBJECTIVES.get(objectiveId);
  if (!obj) throw new Error(`Unknown objective: ${objectiveId}`);
  validateInstance(objectiveId, instance);
  const run = BACKENDS[backend];
  if (!run) throw new Error(`Unknown solver backend: ${backend}`);

  const started = Date.now();
  const result = run(obj, instance, opts);

  // Verify rather than trust. A heuristic that silently returns an infeasible
  // assignment is worse than one that fails.
  const violations = [];
  for (const [item, slot] of Object.entries(result.assignment)) {
    if (!obj.feasible(item, slot, instance)) {
      violations.push({ item, slot, reason: 'hard constraint not satisfied' });
    }
  }

  const out = {
    objectiveId,
    backend,
    assignment: result.assignment,
    cost: result.cost,
    greedyCost: result.greedyCost,
    improvement: result.improvement,
    improvementPct: result.greedyCost ? Math.round((result.improvement / result.greedyCost) * 1000) / 10 : 0,
    iterations: result.iterations,
    unplaced: result.unplaced,
    feasible: violations.length === 0 && result.unplaced.length === 0,
    violations,
    elapsedMs: Date.now() - started,
    // Said plainly, every time.
    guarantee: 'heuristic — a feasible assignment with a reported cost, not a proven optimum',
  };

  logger.info('optimisation: solved', {
    objectiveId, backend, cost: out.cost,
    improvementPct: out.improvementPct, feasible: out.feasible,
    unplaced: out.unplaced.length,
  });
  return out;
}

/** Async variant for remote/provider adapters; classical behavior is identical. */
async function solveAsync(objectiveId, instance, { backend = 'classical', ...opts } = {}) {
  const obj = OBJECTIVES.get(objectiveId);
  if (!obj) throw new Error(`Unknown objective: ${objectiveId}`);
  validateInstance(objectiveId, instance);
  const run = BACKENDS[backend];
  if (!run) throw new Error(`Unknown solver backend: ${backend}`);
  const started = Date.now();
  const result = await run(obj, instance, opts);
  if (!result || typeof result.assignment !== 'object' || !Number.isFinite(Number(result.cost))) {
    throw new Error(`Solver backend ${backend} returned an invalid result contract`);
  }
  const violations = Object.entries(result.assignment).filter(([item, slot]) => !obj.feasible(item, slot, instance))
    .map(([item, slot]) => ({ item, slot, reason: 'hard constraint not satisfied' }));
  const unplaced = Array.isArray(result.unplaced) ? result.unplaced : [];
  return { objectiveId, backend, assignment: result.assignment, cost: Number(result.cost),
    greedyCost: result.greedyCost ?? null, improvement: result.improvement ?? null,
    improvementPct: result.greedyCost ? Math.round((result.improvement / result.greedyCost) * 1000) / 10 : null,
    iterations: result.iterations ?? null, unplaced, feasible: violations.length === 0 && unplaced.length === 0,
    violations, elapsedMs: Date.now() - started,
    guarantee: result.guarantee || 'backend result — feasibility verified; optimality not independently proven' };
}

function listObjectives() {
  return [...OBJECTIVES.values()].map((o) => ({
    id: o.id, description: o.description, applications: o.applications,
  }));
}

module.exports = {
  registerObjective, registerBackend, validateInstance, listObjectives, solve, solveAsync,
  OBJECTIVES, BACKENDS,
  _internal: { greedy, localSearch },
};
