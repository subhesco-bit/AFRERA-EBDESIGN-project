'use strict';
/** Living agentic companion. Proposes. A clerk approves. Never writes ₹.
 * Ported from pine-shadow src/lib/modules/companion.ts */

const { queryLibraryKnowledge } = require('../library/match');
const { envelopeFor } = require('../os/envelope');
const { brainDecide } = require('../brain/decide');

function lastSettled(orders) {
  return orders.filter((o) => o.status === 'settled').sort((a, b) => (b.settledAt ?? '').localeCompare(a.settledAt ?? ''))[0];
}

function mintedWaiting(lots) {
  return lots.filter((l) => l.status === 'minted' && l.remainingGrams > 0);
}

function openOfftake(orders) {
  return orders.filter((o) => o.status === 'open');
}

function proposeCompanion(books, gates = []) {
  const proposals = [];
  const settled = lastSettled(books.orders);
  const memory = settled
    ? `Last harvest on books: ${settled.cellName} · ${settled.variety} · paymentRef ${settled.paymentRef ?? 'named'}${settled.hoursToPay != null ? ` · ${settled.hoursToPay}h to pay` : ''}.`
    : 'No settled harvest yet. Magh is waiting on a clerk.';

  for (const order of openOfftake(books.orders)) {
    proposals.push({
      id: `settle-${order.id}`, moduleId: 'agentic', action: 'settle', title: `Settle ${order.cellName}'s offtake`,
      body: `${order.qtyGrams} g of ${order.variety} to ${order.buyer} waits on a paymentRef. The companion will not invent one.`,
      href: '/trade', organ: 'orders', lotId: order.lotId, orderId: order.id, cellId: null, severity: 'defer',
    });
  }

  for (const lot of mintedWaiting(books.lots)) {
    proposals.push({
      id: `intake-${lot.id}`, moduleId: 'erp-agents', action: 'intake', title: `Inward ${lot.variety} for ${lot.cellName}`,
      body: `${lot.remainingGrams} g still minted, not in the godown. Same lot body. Clerk approves intake.`,
      href: '/warehouse', organ: 'warehouse', lotId: lot.id, orderId: null, cellId: lot.cellId, severity: 'note',
    });
  }

  const idle = books.cells.filter((c) => c.lotCount === 0);
  for (const cell of idle.slice(0, 1)) {
    proposals.push({
      id: `harvest-${cell.id}`, moduleId: 'agentic', action: 'harvest', title: `Mint a harvest for ${cell.name}`,
      body: `${cell.household} is on the books with no lot. The companion proposes. The clerk declares kilograms.`,
      href: '/', organ: 'lot', lotId: null, orderId: null, cellId: cell.id, severity: 'note',
    });
  }

  const processable = books.lots.filter((l) => l.remainingGrams > 0 && l.status !== 'pledged' && l.status !== 'settled');
  if (processable[0] && !proposals.some((p) => p.action === 'process')) {
    const lot = processable[0];
    proposals.push({
      id: `process-${lot.id}`, moduleId: 'copilot', action: 'process', title: `Declare process loss on ${lot.variety}`,
      body: `${lot.remainingGrams} g remains on the same body. Drying or milling loss is declared — never guessed.`,
      href: '/platform', organ: 'lot', lotId: lot.id, orderId: null, cellId: lot.cellId, severity: 'note',
    });
  }

  for (const row of (books.herd ?? []).slice(0, 1)) {
    proposals.push({
      id: `code-${row.id}`, moduleId: 'agentic', action: 'code', title: `Code ${row.kind} on ${row.cellName}`,
      body: `${row.head} head under ${row.policyId ?? 'cover gap'}. August AI proposes AFRERA-VET. Clerk/vet confirms. Milk rupees stay undeclared.`,
      href: '/vet', organ: 'livestock', lotId: null, orderId: null, cellId: row.cellId, severity: 'note',
    });
  }

  if (books.lots.some((l) => l.remainingGrams > 0) && !proposals.some((p) => p.action === 'book')) {
    proposals.push({
      id: 'book-cold', moduleId: 'agentic', action: 'book', title: 'Book the Langthasa cold bay',
      body: 'Hours conserved like remaining grams. The companion proposes a slot. Clerk confirms hours. Rent and GST invoice stay undeclared.',
      href: '/share', organ: 'shared', lotId: null, orderId: null, cellId: null, severity: 'note',
    });
  }

  if ((books.weatherAlerts ?? []).some((a) => a.claimOpen)) {
    proposals.push({
      id: 'consult-weather', moduleId: 'advisory', action: 'consult', title: 'Claim window is open',
      body: 'weather.alert opened a claim on POL-LANGTHASA-WEATHER. The companion will not invent a premium or freeze EMI.',
      href: '/warehouse', organ: 'insurance', lotId: null, orderId: null, cellId: null, severity: 'note',
    });
  }

  const weather = gates.find((g) => g.code === 'G9');
  proposals.push({
    id: 'consult-firewall', moduleId: 'advisory', action: 'consult', title: 'Consult the library, not a second brain',
    body: weather?.body ?? 'AI may propose the next gate. A clerk declares price, freight, and loss.',
    href: '/library', organ: 'ai', lotId: null, orderId: null, cellId: null, severity: 'note',
  });

  const ranked = proposals.slice(0, 5).map((p) => ({ ...p, envelope: envelopeFor({ organ: p.organ, body: p.body, action: p.action }) }));
  const next = ranked[0]?.title ?? 'Next keystroke lives on the books.';
  const hits = queryLibraryKnowledge('agentic companion harvest lot remaining rupees', { limit: 1 });
  const remainingGrams = books.lots.reduce((n, l) => n + l.remainingGrams, 0);
  const outage = (books.energyWindows ?? []).some((w) => w.active && w.status === 'outage');
  const alert = (books.weatherAlerts ?? []).some((a) => a.claimOpen);
  const iotTempC = (books.iotReadings ?? []).find((r) => r.unit === 'C' || /temp/i.test(r.kind))?.valueNum ?? null;
  const kwh = (books.iotReadings ?? []).find((r) => r.unit === 'kWh' || /kwh/i.test(r.kind))?.valueNum ?? null;
  const passport = brainDecide({ signal: 'harvest-propose', remainingGrams, outage, alert, iotTempC, kwh, balanced: books.kpis.journalBalanced, clerk: 'Biren' });
  return { memory, next: `Companion · ${next}`, proposals: ranked, libraryHit: hits[0]?.title ?? null, firewall: 'AI cannot write rupees', passport };
}

module.exports = { proposeCompanion };
