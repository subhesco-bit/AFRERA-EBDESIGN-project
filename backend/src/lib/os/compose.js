'use strict';
/** Score the catalog. Stage 0 is classification. Dual-truth with GitHub.
 * Ported from pine-shadow src/lib/os/compose.ts. Now uses the real
 * todos.js (osTodos/remainingWork/todoCounts) and matrix.js (chainFor)
 * ports, both added after the initial pass that left this file with a
 * placeholder reduction. */

const { OS_ITEMS, OS_STAGES } = require('./catalog');
const { allStagesComplete, stageClosed } = require('./runtime');
const { todoCounts, osTodos, remainingWork } = require('./todos');
const { chainFor } = require('./matrix');

function composeOs() {
  const items = OS_ITEMS;
  const classified = items.filter((x) => x.kernel && x.github).length;
  const closed = stageClosed(items);
  const stageDone = {};
  for (const s of OS_STAGES) {
    const row = closed[s.stage];
    stageDone[s.stage] = { total: row.total, done: row.done, blocked: row.blocked, closed: row.closed, pct: row.pct };
  }
  const stage0Pct = classified === items.length ? 100 : Math.round((classified / items.length) * 100);
  return {
    items, classified, stage0Pct, stageDone,
    kernelVerified: items.filter((x) => x.kernel === 'verified').length,
    kernelPartial: items.filter((x) => x.kernel === 'partial').length,
    githubScaffolded: items.filter((x) => x.github === 'scaffolded' || x.github === 'duplicated').length,
    open: items.filter((x) => x.todo === 'open').length,
    blocked: items.filter((x) => x.todo === 'blocked').length,
    stagesComplete: allStagesComplete(items),
    thesis:
      'AFRERA is a rural economic operating system, not an agriculture website. Stages 0–6 are closed on this kernel. GitHub platform remains 7%. Lattice ligaments stay ~39%. Human-equivalent body lives. Relax is the withdraw reflex: heat/alert/outage rest the mill, remaining holds, EMI is not frozen, wrong unclench is refused. Rural ERP atlas classifies 32 SAP/Baan/Oracle analog families; sapParity is false; nested remaining conserves person=home=village. AI atlas classifies 35 families; aiParity is false; five tissues decide; GitHub living plugs stay 0. August AI veterinary coding lives on AFRERA-VET; GitHub human ICD stays a cadaver. Village remaining journey lives; tourism itinerary refused. Engineering BOQ stamp lives; CFD stays refused. Cell inspect lives; no login profile. One brain, five tissues. AI still cannot write rupees. Agriculture finance and procure stay missing.',
  };
}

function emitOsCatalog() {
  const os = composeOs();
  return {
    generatedAt: '2026-09-23', thesis: os.thesis, stages: OS_STAGES,
    snapshot: {
      items: os.items.length, classified: os.classified, stage0Pct: os.stage0Pct, stageDone: os.stageDone,
      kernelVerified: os.kernelVerified, kernelPartial: os.kernelPartial, githubScaffolded: os.githubScaffolded,
      open: os.open, blocked: os.blocked, stagesComplete: os.stagesComplete, todo: todoCounts(),
    },
    items: OS_ITEMS,
  };
}

function emitOsTodos() {
  return {
    generatedAt: '2026-09-22',
    counts: todoCounts(),
    remaining: remainingWork(110),
    all: osTodos(),
  };
}

function filterOs(opts) {
  const q = (opts.query ?? '').trim().toLowerCase();
  return OS_ITEMS.filter((x) => {
    if (opts.stage !== undefined && opts.stage !== 'all' && x.stage !== opts.stage) return false;
    if (opts.table && opts.table !== 'all' && x.table !== opts.table) return false;
    if (opts.kernel && opts.kernel !== 'all' && x.kernel !== opts.kernel) return false;
    if (opts.todo && opts.todo !== 'all' && x.todo !== opts.todo) return false;
    if (!q) return true;
    return `${x.id} ${x.name} ${x.area} ${x.present} ${x.missing} ${x.next} ${x.organs.join(' ')}`.toLowerCase().includes(q);
  });
}

module.exports = { composeOs, emitOsCatalog, emitOsTodos, filterOs, todoCounts, osTodos, remainingWork, chainFor };
