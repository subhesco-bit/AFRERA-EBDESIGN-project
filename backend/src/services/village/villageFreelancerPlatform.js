/**
 * Village Freelancer Platform — highest professional standard
 * Rural / agri-adjacent gig + skilled work marketplace (not urban-only freelance clone).
 *
 * Capabilities:
 *  - Worker profiles (skills, wage bands, village geo, KYC level)
 *  - Job posts with FSM + SLA
 *  - Skill matching + ranking
 *  - Escrow-linked payment
 *  - Attendance / completion evidence
 *  - Trust + dispute hooks
 *  - Village / block geography
 */

'use strict';

const { randomUUID } = require('crypto');

function tryReq(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

const escrow = tryReq('../commerce/escrowPolicyEngine');
const wallet = tryReq('../commerce/walletService');
const trust = tryReq('../trust/trustReputationEngine');
const events = tryReq('../analytics/businessEventBus');
const issues = tryReq('../commerce/issueResolutionWorkflow');

const SKILL_TAXONOMY = {
  farm_labour: { label: 'Farm labour', category: 'field' },
  tractor_operator: { label: 'Tractor operator', category: 'machinery' },
  harvester_operator: { label: 'Harvester operator', category: 'machinery' },
  sprayer: { label: 'Spraying / plant protection', category: 'field' },
  irrigation: { label: 'Irrigation technician', category: 'tech' },
  dairy_handler: { label: 'Dairy handler', category: 'livestock' },
  veterinary_aide: { label: 'Veterinary aide', category: 'livestock' },
  cold_store_helper: { label: 'Cold store helper', category: 'logistics' },
  packing_grading: { label: 'Packing & grading', category: 'post_harvest' },
  transport_driver: { label: 'Transport driver', category: 'logistics' },
  construction_rural: { label: 'Rural construction', category: 'infra' },
  electrician_basic: { label: 'Basic electrician', category: 'infra' },
  solar_installer: { label: 'Solar installer', category: 'infra' },
  accounting_village: { label: 'Village bookkeeping', category: 'services' },
  digital_mitra: { label: 'Digital / CSC mitra', category: 'services' },
  training_facilitator: { label: 'Training facilitator', category: 'services' },
};

const JOB_STATES = {
  draft: ['published', 'cancelled'],
  published: ['matched', 'cancelled', 'expired'],
  matched: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['submitted', 'disputed', 'cancelled'],
  submitted: ['approved', 'rework', 'disputed'],
  rework: ['submitted', 'cancelled'],
  approved: ['paid', 'closed'],
  paid: ['closed'],
  disputed: ['in_progress', 'approved', 'cancelled', 'closed'],
  expired: [],
  cancelled: [],
  closed: [],
};

const workers = new Map();
const jobs = new Map();
const applications = new Map();

function id(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

// ---------- Workers ----------

function registerWorker(data = {}) {
  const wid = data.worker_id || id('VF');
  const skills = Array.isArray(data.skills) ? data.skills : data.skill ? [data.skill] : ['farm_labour'];
  const invalid = skills.filter((s) => !SKILL_TAXONOMY[s]);
  if (invalid.length) {
    const err = new Error(`Unknown skills: ${invalid.join(', ')}`);
    err.code = 'VF_SKILL';
    err.known = Object.keys(SKILL_TAXONOMY);
    throw err;
  }
  const rec = {
    worker_id: wid,
    name: data.name || 'Worker',
    phone: data.phone || null,
    village: data.village || null,
    block: data.block || null,
    district: data.district || null,
    state: data.state || null,
    lat: data.lat != null ? Number(data.lat) : null,
    lng: data.lng != null ? Number(data.lng) : null,
    skills,
    skill_meta: skills.map((s) => ({ id: s, ...SKILL_TAXONOMY[s] })),
    wage_type: data.wage_type || 'daily', // daily | hourly | piece
    wage_rate_inr: Number(data.wage_rate_inr) || Number(data.wage_rate) || 400,
    availability: data.availability || 'available', // available | busy | offline
    kyc_level: data.kyc_level || 'unverified', // unverified | phone | aadhaar_light | full
    languages: data.languages || ['hi'],
    completed_jobs: 0,
    cancelled_jobs: 0,
    rating_sum: 0,
    rating_count: 0,
    layer: 'farmer', // rural labour lives on farmer-side economy
    created_at: new Date().toISOString(),
    status: 'active',
  };
  workers.set(wid, rec);
  if (trust) trust.recordEvent(wid, { kind: 'identity', type: 'worker', level: rec.kyc_level === 'full' ? 'kyc_full' : 'kyc_basic' });
  if (events) events.emit('vf.worker_registered', { worker_id: wid }, { source: 'villageFreelancer' });
  return { worker: rec, confidence: 1 };
}

function getWorker(worker_id) {
  return workers.get(worker_id) || null;
}

function listWorkers(filter = {}) {
  let all = [...workers.values()].filter((w) => w.status === 'active');
  if (filter.skill) all = all.filter((w) => w.skills.includes(filter.skill));
  if (filter.district) all = all.filter((w) => w.district === filter.district);
  if (filter.village) all = all.filter((w) => w.village === filter.village);
  if (filter.availability) all = all.filter((w) => w.availability === filter.availability);
  return all;
}

// ---------- Jobs ----------

function createJob(data = {}) {
  const jid = data.job_id || id('JOB');
  const skill = data.skill || 'farm_labour';
  if (!SKILL_TAXONOMY[skill]) {
    const err = new Error(`Unknown skill ${skill}`);
    err.code = 'VF_SKILL';
    throw err;
  }
  const budget = Number(data.budget_inr) || Number(data.wage_rate_inr) || 400;
  const rec = {
    job_id: jid,
    title: data.title || SKILL_TAXONOMY[skill].label,
    skill,
    description: data.description || '',
    employer_id: data.employer_id || data.farmer_id || null,
    employer_type: data.employer_type || 'farmer', // farmer | fpo | enterprise | household
    village: data.village || null,
    block: data.block || null,
    district: data.district || null,
    state: data.state || null,
    lat: data.lat != null ? Number(data.lat) : null,
    lng: data.lng != null ? Number(data.lng) : null,
    budget_inr: budget,
    wage_type: data.wage_type || 'daily',
    days: Number(data.days) || 1,
    workers_needed: Number(data.workers_needed) || 1,
    state: 'draft',
    assigned_worker_ids: [],
    escrow_id: null,
    sla_hours: Number(data.sla_hours) || 72,
    due_at: new Date(Date.now() + (Number(data.sla_hours) || 72) * 3600000).toISOString(),
    evidence: [],
    history: [{ state: 'draft', at: new Date().toISOString(), event: 'create' }],
    layer: 'farmer',
    created_at: new Date().toISOString(),
  };
  jobs.set(jid, rec);
  return { job: rec };
}

function transitionJob(job_id, to, event = {}) {
  const rec = jobs.get(job_id);
  if (!rec) {
    const err = new Error('Job not found');
    err.code = 'VF_JOB_NOT_FOUND';
    throw err;
  }
  const allowed = JOB_STATES[rec.state] || [];
  if (!allowed.includes(to)) {
    const err = new Error(`Invalid job transition ${rec.state} → ${to}`);
    err.code = 'VF_INVALID_TRANSITION';
    err.allowed = allowed;
    throw err;
  }
  const from = rec.state;
  rec.state = to;
  rec.history.push({
    from,
    state: to,
    at: new Date().toISOString(),
    event: event.type || 'transition',
    actor: event.actor || 'system',
  });
  return rec;
}

function publishJob(job_id) {
  const rec = transitionJob(job_id, 'published', { type: 'publish' });
  if (events) events.emit('vf.job_published', { job_id }, { source: 'villageFreelancer' });
  return { job: rec };
}

/** Distance km haversine */
function distKm(a, b) {
  if (a.lat == null || b.lat == null) return 999;
  const R = 6371;
  const toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Rank workers for a job */
function matchWorkers(job_id, opts = {}) {
  const job = jobs.get(job_id);
  if (!job) {
    const err = new Error('Job not found');
    err.code = 'VF_JOB_NOT_FOUND';
    throw err;
  }
  const radius = Number(opts.radius_km) || 40;
  const candidates = listWorkers({ skill: job.skill, availability: 'available' });
  const ranked = candidates
    .map((w) => {
      const distance_km = distKm(job, w);
      const skillFit = w.skills.includes(job.skill) ? 1 : 0;
      const geoFit = distance_km <= radius ? 1 - distance_km / radius : 0;
      let trustScore = 50;
      if (trust) trustScore = trust.score(w.worker_id).trust_score;
      const rating = w.rating_count ? w.rating_sum / w.rating_count : 3.5;
      const kycBoost = { unverified: 0, phone: 0.05, aadhaar_light: 0.1, full: 0.15 }[w.kyc_level] || 0;
      const score =
        skillFit * 40 +
        geoFit * 25 +
        (trustScore / 100) * 20 +
        (rating / 5) * 10 +
        kycBoost * 100 * 0.05;
      return {
        worker_id: w.worker_id,
        name: w.name,
        village: w.village,
        wage_rate_inr: w.wage_rate_inr,
        distance_km: Math.round(distance_km * 10) / 10,
        trust_score: trustScore,
        rating: Math.round(rating * 100) / 100,
        kyc_level: w.kyc_level,
        match_score: Math.round(score * 10) / 10,
      };
    })
    .filter((c) => c.distance_km <= radius || c.distance_km === 999)
    .sort((a, b) => b.match_score - a.match_score);

  return {
    job_id,
    skill: job.skill,
    candidates: ranked.slice(0, Number(opts.limit) || 20),
    count: ranked.length,
    algorithm: 'skill40 + geo25 + trust20 + rating10 + kyc5',
    confidence: ranked.length ? 0.85 : 0.4,
  };
}

function applyToJob(job_id, worker_id, data = {}) {
  const job = jobs.get(job_id);
  const worker = workers.get(worker_id);
  if (!job || !worker) {
    const err = new Error('Job or worker not found');
    err.code = 'VF_NOT_FOUND';
    throw err;
  }
  if (!['published', 'matched'].includes(job.state)) {
    const err = new Error('Job not open for applications');
    err.code = 'VF_JOB_CLOSED';
    throw err;
  }
  const aid = id('APP');
  const app = {
    application_id: aid,
    job_id,
    worker_id,
    proposed_rate: Number(data.proposed_rate) || worker.wage_rate_inr,
    message: data.message || '',
    status: 'applied',
    at: new Date().toISOString(),
  };
  applications.set(aid, app);
  if (job.state === 'published') transitionJob(job_id, 'matched', { type: 'first_application' });
  return { application: app, job };
}

function assignWorker(job_id, worker_id, opts = {}) {
  const job = jobs.get(job_id);
  const worker = workers.get(worker_id);
  if (!job || !worker) {
    const err = new Error('Job or worker not found');
    err.code = 'VF_NOT_FOUND';
    throw err;
  }
  if (!job.assigned_worker_ids.includes(worker_id)) {
    job.assigned_worker_ids.push(worker_id);
  }
  if (['published', 'matched'].includes(job.state)) {
    transitionJob(job_id, 'accepted', { type: 'assign', actor: opts.actor });
  }
  worker.availability = 'busy';

  // Escrow for job budget
  if (escrow && opts.with_escrow !== false && job.employer_id) {
    try {
      const { escrow: esc } = escrow.createEscrow({
        policy: 'standard_marketplace',
        amount: job.budget_inr * job.days * Math.max(1, job.assigned_worker_ids.length),
        payer_id: job.employer_id,
        payee_id: worker_id,
        order_id: job.job_id,
      });
      escrow.fund(esc.escrow_id, { auto_credit: !!opts.auto_credit });
      job.escrow_id = esc.escrow_id;
    } catch (e) {
      job.escrow_error = e.message;
    }
  }

  if (events) events.emit('vf.job_assigned', { job_id, worker_id }, { source: 'villageFreelancer' });
  return { job, worker_id };
}

function startJob(job_id) {
  return { job: transitionJob(job_id, 'in_progress', { type: 'start' }) };
}

function submitWork(job_id, data = {}) {
  const job = jobs.get(job_id);
  if (!job) {
    const err = new Error('Job not found');
    err.code = 'VF_JOB_NOT_FOUND';
    throw err;
  }
  if (data.evidence) {
    job.evidence.push({ ...data.evidence, at: new Date().toISOString() });
  }
  return { job: transitionJob(job_id, 'submitted', { type: 'submit', actor: data.actor }) };
}

function approveJob(job_id, data = {}) {
  const job = transitionJob(job_id, 'approved', { type: 'approve', actor: data.actor });
  if (job.escrow_id && escrow) {
    try {
      escrow.setCondition(job.escrow_id, 'delivery_confirmed', true);
      escrow.setCondition(job.escrow_id, 'quality_pass', true);
      escrow.release(job.escrow_id, { actor: data.actor });
    } catch (e) {
      job.escrow_release_error = e.message;
    }
  } else if (wallet && job.assigned_worker_ids[0]) {
    const pay = job.budget_inr * job.days;
    wallet.credit(job.assigned_worker_ids[0], pay, { reason: 'vf_job_pay', ref: job.job_id });
  }
  for (const wid of job.assigned_worker_ids) {
    const w = workers.get(wid);
    if (w) {
      w.completed_jobs += 1;
      w.availability = 'available';
      if (data.rating) {
        w.rating_sum += Number(data.rating);
        w.rating_count += 1;
      }
      if (trust) {
        trust.recordEvent(wid, { kind: 'tx_complete', type: 'worker' });
        trust.recordEvent(wid, { kind: 'quality_pass', type: 'worker' });
      }
    }
  }
  transitionJob(job_id, 'paid', { type: 'pay' });
  transitionJob(job_id, 'closed', { type: 'close' });
  if (events) events.emit('vf.job_completed', { job_id }, { source: 'villageFreelancer' });
  return { job: jobs.get(job_id) };
}

async function disputeJob(job_id, data = {}) {
  const job = transitionJob(job_id, 'disputed', { type: 'dispute', actor: data.actor });
  let issue = null;
  if (issues) {
    issue = issues.create({
      type: 'order_quality',
      order_id: job_id,
      escrow_id: job.escrow_id,
      raised_by: data.raised_by,
      against: job.assigned_worker_ids[0],
      reason: data.reason || 'job_dispute',
      amount: job.budget_inr,
    });
  }
  if (job.escrow_id && escrow) {
    try {
      await escrow.openDispute(job.escrow_id, {
        raised_by: data.raised_by,
        against: job.assigned_worker_ids[0],
        reason: data.reason,
      });
    } catch {
      /* */
    }
  }
  return { job, issue };
}

function skillsCatalog() {
  return {
    skills: Object.entries(SKILL_TAXONOMY).map(([id, meta]) => ({ id, ...meta })),
    count: Object.keys(SKILL_TAXONOMY).length,
  };
}

function platformStats() {
  const js = [...jobs.values()];
  return {
    workers: workers.size,
    jobs: js.length,
    open_jobs: js.filter((j) => ['published', 'matched'].includes(j.state)).length,
    completed: js.filter((j) => j.state === 'closed').length,
    applications: applications.size,
  };
}

async function operate(data = {}) {
  const action = data.action || 'stats';
  switch (action) {
    case 'register_worker':
      return registerWorker(data);
    case 'get_worker':
      return { worker: getWorker(data.worker_id) };
    case 'list_workers':
      return { workers: listWorkers(data) };
    case 'create_job':
      return createJob(data);
    case 'publish_job':
      return publishJob(data.job_id);
    case 'match':
      return matchWorkers(data.job_id, data);
    case 'apply':
      return applyToJob(data.job_id, data.worker_id, data);
    case 'assign':
      return assignWorker(data.job_id, data.worker_id, data);
    case 'start':
      return startJob(data.job_id);
    case 'submit':
      return submitWork(data.job_id, data);
    case 'approve':
      return approveJob(data.job_id, data);
    case 'dispute':
      return disputeJob(data.job_id, data);
    case 'get_job':
      return { job: jobs.get(data.job_id) || null };
    case 'list_jobs': {
      let all = [...jobs.values()];
      if (data.state) all = all.filter((j) => j.state === data.state);
      return { jobs: all };
    }
    case 'skills':
      return skillsCatalog();
    case 'stats':
      return platformStats();
    default:
      return { error: 'Unknown action', action, hint: 'skills|register_worker|create_job|match|assign|approve' };
  }
}

module.exports = {
  operate,
  registerWorker,
  createJob,
  publishJob,
  matchWorkers,
  applyToJob,
  assignWorker,
  startJob,
  submitWork,
  approveJob,
  disputeJob,
  skillsCatalog,
  listWorkers,
  getWorker,
  SKILL_TAXONOMY,
  JOB_STATES,
};
