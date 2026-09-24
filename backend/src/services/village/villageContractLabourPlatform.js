/**
 * Village Contract Labour — UrbanClap / Urban Company model for farming labour
 *
 * Flow (consumer UX):
 *  Browse category → pick service → choose package → select slot →
 *  confirm booking → provider assigned → track → complete → pay/rate
 *
 * Rural-first: village geo, crop season, group booking, FPO bulk, escrow pay.
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

const vf = tryReq('./villageFreelancerPlatform');
const escrow = tryReq('../commerce/escrowPolicyEngine');
const wallet = tryReq('../commerce/walletService');
const trust = tryReq('../trust/trustReputationEngine');
const events = tryReq('../analytics/businessEventBus');

/** UrbanClap-style category → services → packages */
const CATALOG = {
  field_operations: {
    id: 'field_operations',
    name: 'Field operations',
    icon: '🌾',
    services: {
      ploughing: {
        id: 'ploughing',
        name: 'Ploughing / tillage',
        skill: 'tractor_operator',
        packages: [
          { id: 'plough_1acre', name: '1 acre ploughing', unit: 'acre', qty: 1, price_inr: 1200, duration_hours: 4 },
          { id: 'plough_5acre', name: '5 acre package', unit: 'acre', qty: 5, price_inr: 5500, duration_hours: 16 },
        ],
      },
      sowing: {
        id: 'sowing',
        name: 'Sowing / transplanting',
        skill: 'farm_labour',
        packages: [
          { id: 'sow_1acre', name: 'Sowing 1 acre', unit: 'acre', qty: 1, price_inr: 800, duration_hours: 6 },
          { id: 'transplant_1acre', name: 'Paddy transplant 1 acre', unit: 'acre', qty: 1, price_inr: 2500, duration_hours: 10 },
        ],
      },
      weeding: {
        id: 'weeding',
        name: 'Weeding / intercultural',
        skill: 'farm_labour',
        packages: [
          { id: 'weed_1acre', name: 'Weeding 1 acre', unit: 'acre', qty: 1, price_inr: 600, duration_hours: 8 },
        ],
      },
      harvesting: {
        id: 'harvesting',
        name: 'Harvesting',
        skill: 'harvester_operator',
        packages: [
          { id: 'harvest_1acre_manual', name: 'Manual harvest 1 acre', unit: 'acre', qty: 1, price_inr: 2000, duration_hours: 10 },
          { id: 'harvest_1acre_machine', name: 'Machine harvest 1 acre', unit: 'acre', qty: 1, price_inr: 1800, duration_hours: 2 },
        ],
      },
    },
  },
  plant_protection: {
    id: 'plant_protection',
    name: 'Plant protection',
    icon: '🛡️',
    services: {
      spraying: {
        id: 'spraying',
        name: 'Pesticide / nutrient spray',
        skill: 'sprayer',
        packages: [
          { id: 'spray_1acre', name: 'Spray 1 acre', unit: 'acre', qty: 1, price_inr: 400, duration_hours: 2 },
          { id: 'spray_5acre', name: 'Spray 5 acre', unit: 'acre', qty: 5, price_inr: 1800, duration_hours: 8 },
        ],
      },
    },
  },
  irrigation: {
    id: 'irrigation',
    name: 'Irrigation',
    icon: '💧',
    services: {
      drip_setup: {
        id: 'drip_setup',
        name: 'Drip line setup / repair',
        skill: 'irrigation',
        packages: [
          { id: 'drip_half_day', name: 'Half-day technician', unit: 'job', qty: 1, price_inr: 700, duration_hours: 4 },
          { id: 'drip_full_day', name: 'Full-day technician', unit: 'job', qty: 1, price_inr: 1200, duration_hours: 8 },
        ],
      },
    },
  },
  livestock: {
    id: 'livestock',
    name: 'Livestock support',
    icon: '🐄',
    services: {
      dairy_shift: {
        id: 'dairy_shift',
        name: 'Dairy milking / care shift',
        skill: 'dairy_handler',
        packages: [
          { id: 'dairy_morning', name: 'Morning shift', unit: 'shift', qty: 1, price_inr: 350, duration_hours: 4 },
          { id: 'dairy_day', name: 'Full day', unit: 'shift', qty: 1, price_inr: 600, duration_hours: 8 },
        ],
      },
      vet_aide: {
        id: 'vet_aide',
        name: 'Veterinary aide visit',
        skill: 'veterinary_aide',
        packages: [
          { id: 'vet_visit', name: 'Single visit', unit: 'visit', qty: 1, price_inr: 500, duration_hours: 2 },
        ],
      },
    },
  },
  post_harvest: {
    id: 'post_harvest',
    name: 'Post-harvest',
    icon: '📦',
    services: {
      packing: {
        id: 'packing',
        name: 'Packing & grading',
        skill: 'packing_grading',
        packages: [
          { id: 'pack_half', name: 'Half day packing team (2 pax)', unit: 'job', qty: 1, price_inr: 900, duration_hours: 4 },
          { id: 'pack_full', name: 'Full day packing team (2 pax)', unit: 'job', qty: 1, price_inr: 1600, duration_hours: 8 },
        ],
      },
      cold_helper: {
        id: 'cold_helper',
        name: 'Cold store helper',
        skill: 'cold_store_helper',
        packages: [
          { id: 'cold_shift', name: 'Cold store shift', unit: 'shift', qty: 1, price_inr: 450, duration_hours: 8 },
        ],
      },
    },
  },
  machinery: {
    id: 'machinery',
    name: 'Machinery on hire',
    icon: '🚜',
    services: {
      tractor_with_driver: {
        id: 'tractor_with_driver',
        name: 'Tractor + operator',
        skill: 'tractor_operator',
        packages: [
          { id: 'tractor_half', name: 'Half day', unit: 'job', qty: 1, price_inr: 2000, duration_hours: 4 },
          { id: 'tractor_full', name: 'Full day', unit: 'job', qty: 1, price_inr: 3500, duration_hours: 8 },
        ],
      },
    },
  },
};

const BOOKING_STATES = {
  cart: ['scheduled', 'cancelled'],
  scheduled: ['assigned', 'cancelled'],
  assigned: ['en_route', 'cancelled'],
  en_route: ['started', 'cancelled'],
  started: ['completed', 'disputed'],
  completed: ['rated', 'closed'],
  rated: ['closed'],
  disputed: ['completed', 'cancelled', 'closed'],
  cancelled: [],
  closed: [],
};

const bookings = new Map();
const providers = new Map(); // local cache; also uses VF workers

function rid(p) {
  return `${p}-${randomUUID().slice(0, 8)}`;
}

function getCatalog() {
  const categories = Object.values(CATALOG).map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    service_count: Object.keys(c.services).length,
  }));
  return { categories, model: 'urbanclap_farm_labour', layer: 'farmer' };
}

function getCategory(categoryId) {
  const c = CATALOG[categoryId];
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    services: Object.values(c.services).map((s) => ({
      id: s.id,
      name: s.name,
      skill: s.skill,
      packages: s.packages,
    })),
  };
}

function findPackage(packageId) {
  for (const cat of Object.values(CATALOG)) {
    for (const svc of Object.values(cat.services)) {
      const pkg = svc.packages.find((p) => p.id === packageId);
      if (pkg) {
        return { category: cat, service: svc, package: pkg };
      }
    }
  }
  return null;
}

/** Register provider (UrbanClap professional) — links VF skill */
function registerProvider(data = {}) {
  const pid = data.provider_id || rid('PRV');
  let worker = null;
  if (vf) {
    const r = vf.registerWorker({
      worker_id: data.worker_id || pid,
      name: data.name,
      phone: data.phone,
      village: data.village,
      district: data.district,
      state: data.state,
      lat: data.lat,
      lng: data.lng,
      skills: data.skills || [data.skill || 'farm_labour'],
      wage_rate_inr: data.wage_rate_inr,
      kyc_level: data.kyc_level || 'phone',
    });
    worker = r.worker;
  }
  const rec = {
    provider_id: pid,
    worker_id: worker?.worker_id || pid,
    name: data.name || worker?.name,
    services: data.services || data.skills || ['farm_labour'],
    village: data.village,
    district: data.district,
    lat: data.lat,
    lng: data.lng,
    rating_sum: 0,
    rating_count: 0,
    jobs_done: 0,
    status: 'active',
    verified: data.kyc_level === 'full' || data.verified === true,
  };
  providers.set(pid, rec);
  if (events) events.emit('vcl.provider_registered', { provider_id: pid }, { source: 'villageContractLabour' });
  return { provider: rec, worker };
}

/** Available slots for a day (simple hourly windows) */
function availableSlots(dateStr, duration_hours = 4) {
  const base = dateStr ? new Date(dateStr) : new Date();
  const day = base.toISOString().slice(0, 10);
  const slots = [];
  for (let h = 6; h + duration_hours <= 18; h += 2) {
    slots.push({
      slot_id: `${day}T${String(h).padStart(2, '0')}:00`,
      start: `${day}T${String(h).padStart(2, '0')}:00:00`,
      end: `${day}T${String(h + duration_hours).padStart(2, '0')}:00:00`,
      duration_hours,
      available: true,
    });
  }
  return { date: day, slots };
}

function createBooking(data = {}) {
  const found = findPackage(data.package_id);
  if (!found) {
    const err = new Error(`Unknown package ${data.package_id}`);
    err.code = 'VCL_PACKAGE';
    throw err;
  }
  const { category, service, package: pkg } = found;
  const qty = Number(data.qty) || 1;
  const price = pkg.price_inr * qty;
  const bid = rid('BKG');
  const rec = {
    booking_id: bid,
    state: 'cart',
    customer_id: data.customer_id || data.farmer_id || data.employer_id,
    package_id: pkg.id,
    package_name: pkg.name,
    category_id: category.id,
    service_id: service.id,
    skill: service.skill,
    qty,
    price_inr: price,
    duration_hours: pkg.duration_hours * qty,
    slot: data.slot || null,
    address: {
      village: data.village,
      block: data.block,
      district: data.district,
      state: data.state,
      lat: data.lat,
      lng: data.lng,
      landmark: data.landmark,
    },
    provider_id: null,
    worker_id: null,
    escrow_id: null,
    notes: data.notes || '',
    rating: null,
    history: [{ state: 'cart', at: new Date().toISOString() }],
    layer: 'farmer',
    model: 'urbanclap_contract_labour',
    created_at: new Date().toISOString(),
  };
  bookings.set(bid, rec);
  return { booking: rec, package: pkg, service: { id: service.id, name: service.name } };
}

function transition(booking_id, to, event = {}) {
  const rec = bookings.get(booking_id);
  if (!rec) {
    const err = new Error('Booking not found');
    err.code = 'VCL_NOT_FOUND';
    throw err;
  }
  const allowed = BOOKING_STATES[rec.state] || [];
  if (!allowed.includes(to)) {
    const err = new Error(`Invalid booking transition ${rec.state} → ${to}`);
    err.code = 'VCL_INVALID_TRANSITION';
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

function scheduleBooking(booking_id, data = {}) {
  const rec = bookings.get(booking_id);
  if (!rec) {
    const err = new Error('Booking not found');
    err.code = 'VCL_NOT_FOUND';
    throw err;
  }
  if (data.slot) rec.slot = data.slot;
  if (!rec.slot) {
    const err = new Error('Slot required');
    err.code = 'VCL_SLOT';
    throw err;
  }
  transition(booking_id, 'scheduled', { type: 'schedule' });

  // Escrow hold on schedule
  if (escrow && rec.customer_id) {
    try {
      const { escrow: esc } = escrow.createEscrow({
        policy: 'standard_marketplace',
        amount: rec.price_inr,
        payer_id: rec.customer_id,
        payee_id: 'PENDING_PROVIDER',
        order_id: rec.booking_id,
      });
      escrow.fund(esc.escrow_id, { auto_credit: !!data.auto_credit });
      rec.escrow_id = esc.escrow_id;
    } catch (e) {
      rec.escrow_error = e.message;
    }
  }

  if (events) events.emit('vcl.booking_scheduled', { booking_id }, { source: 'villageContractLabour' });
  return { booking: rec };
}

/** Auto-assign best provider (UrbanClap-style matching) */
function assignProvider(booking_id, opts = {}) {
  const rec = bookings.get(booking_id);
  if (!rec) {
    const err = new Error('Booking not found');
    err.code = 'VCL_NOT_FOUND';
    throw err;
  }

  let provider_id = opts.provider_id;
  let worker_id = opts.worker_id;

  if (!provider_id && vf) {
    // Create ephemeral job for match engine
    const { job } = vf.createJob({
      skill: rec.skill,
      employer_id: rec.customer_id,
      budget_inr: rec.price_inr,
      lat: rec.address.lat,
      lng: rec.address.lng,
      village: rec.address.village,
      district: rec.address.district,
    });
    vf.publishJob(job.job_id);
    const match = vf.matchWorkers(job.job_id, { radius_km: opts.radius_km || 40, limit: 5 });
    if (match.candidates.length) {
      worker_id = match.candidates[0].worker_id;
      provider_id = worker_id;
      rec.match = match.candidates[0];
    }
  }

  if (!provider_id) {
    // fallback any local provider with skill
    const list = [...providers.values()].filter(
      (p) => p.status === 'active' && p.services.includes(rec.skill),
    );
    if (list.length) {
      provider_id = list[0].provider_id;
      worker_id = list[0].worker_id;
    }
  }

  if (!provider_id) {
    const err = new Error('No provider available in range');
    err.code = 'VCL_NO_PROVIDER';
    throw err;
  }

  rec.provider_id = provider_id;
  rec.worker_id = worker_id || provider_id;

  // Update escrow payee if possible
  if (rec.escrow_id && escrow) {
    const esc = escrow.get(rec.escrow_id);
    if (esc) esc.payee_id = rec.worker_id;
  }

  if (rec.state === 'scheduled') transition(booking_id, 'assigned', { type: 'assign' });
  if (events) events.emit('vcl.provider_assigned', { booking_id, provider_id }, { source: 'villageContractLabour' });
  return { booking: rec };
}

function providerEnRoute(booking_id) {
  return { booking: transition(booking_id, 'en_route', { type: 'en_route' }) };
}

function startJob(booking_id) {
  return { booking: transition(booking_id, 'started', { type: 'start' }) };
}

function completeJob(booking_id, data = {}) {
  const rec = transition(booking_id, 'completed', { type: 'complete', actor: data.actor });
  if (rec.escrow_id && escrow) {
    try {
      escrow.setCondition(rec.escrow_id, 'delivery_confirmed', true);
      escrow.setCondition(rec.escrow_id, 'quality_pass', true);
      escrow.release(rec.escrow_id, { actor: data.actor });
    } catch (e) {
      rec.escrow_error = e.message;
      if (wallet && rec.worker_id) {
        wallet.credit(rec.worker_id, rec.price_inr, { reason: 'vcl_pay', ref: rec.booking_id });
      }
    }
  } else if (wallet && rec.worker_id) {
    wallet.credit(rec.worker_id, rec.price_inr, { reason: 'vcl_pay', ref: rec.booking_id });
  }
  const prov = providers.get(rec.provider_id);
  if (prov) prov.jobs_done += 1;
  if (trust && rec.worker_id) {
    trust.recordEvent(rec.worker_id, { kind: 'tx_complete', type: 'worker' });
  }
  if (events) events.emit('vcl.completed', { booking_id }, { source: 'villageContractLabour' });
  return { booking: rec };
}

function rateBooking(booking_id, data = {}) {
  const rec = bookings.get(booking_id);
  if (!rec) {
    const err = new Error('Booking not found');
    err.code = 'VCL_NOT_FOUND';
    throw err;
  }
  const rating = Number(data.rating) || 5;
  rec.rating = {
    stars: Math.min(5, Math.max(1, rating)),
    review: data.review || '',
    at: new Date().toISOString(),
  };
  const prov = providers.get(rec.provider_id);
  if (prov) {
    prov.rating_sum += rec.rating.stars;
    prov.rating_count += 1;
  }
  if (vf && rec.worker_id) {
    const w = vf.getWorker(rec.worker_id);
    if (w) {
      w.rating_sum += rec.rating.stars;
      w.rating_count += 1;
    }
  }
  if (rec.state === 'completed') transition(booking_id, 'rated', { type: 'rate' });
  if (rec.state === 'rated') transition(booking_id, 'closed', { type: 'close' });
  return { booking: rec };
}

/** One-shot book like UrbanClap: package + slot + auto assign */
function bookNow(data = {}) {
  const { booking } = createBooking(data);
  scheduleBooking(booking.booking_id, { slot: data.slot, auto_credit: data.auto_credit });
  try {
    assignProvider(booking.booking_id, data);
  } catch (e) {
    return { booking: bookings.get(booking.booking_id), assign_error: e.message };
  }
  return { booking: bookings.get(booking.booking_id) };
}

function getBooking(id) {
  return bookings.get(id) || null;
}

function listBookings(filter = {}) {
  let all = [...bookings.values()];
  if (filter.customer_id) all = all.filter((b) => b.customer_id === filter.customer_id);
  if (filter.state) all = all.filter((b) => b.state === filter.state);
  return all;
}

async function operate(data = {}) {
  const action = data.action || 'catalog';
  switch (action) {
    case 'catalog':
      return getCatalog();
    case 'category':
      return { category: getCategory(data.category_id) };
    case 'slots':
      return availableSlots(data.date, data.duration_hours);
    case 'register_provider':
      return registerProvider(data);
    case 'create':
      return createBooking(data);
    case 'schedule':
      return scheduleBooking(data.booking_id, data);
    case 'assign':
      return assignProvider(data.booking_id, data);
    case 'en_route':
      return providerEnRoute(data.booking_id);
    case 'start':
      return startJob(data.booking_id);
    case 'complete':
      return completeJob(data.booking_id, data);
    case 'rate':
      return rateBooking(data.booking_id, data);
    case 'book_now':
      return bookNow(data);
    case 'get':
      return { booking: getBooking(data.booking_id) };
    case 'list':
      return { bookings: listBookings(data) };
    default:
      return { error: 'Unknown action', action };
  }
}

module.exports = {
  operate,
  getCatalog,
  getCategory,
  availableSlots,
  registerProvider,
  createBooking,
  scheduleBooking,
  assignProvider,
  completeJob,
  rateBooking,
  bookNow,
  getBooking,
  listBookings,
  CATALOG,
  BOOKING_STATES,
};
