'use strict';
/** Real Postgres persistence for documents/process/seasons, layered on top
 * of boot.server.js. Faithful port of pine-shadow's
 * src/lib/erp/platform.server.ts, adapted from getSql() to this project's
 * pg Pool the same way boot.server.js is. */

const { getPostgreSQL } = require('../../database/connection');
const { nid } = require('./ids');
const { assertCanSell, energyProcessGate } = require('./kernel');
const { composePlatform, processMass } = require('./platform');
const { ensureBooks, readBooks, ensureSchema } = require('./boot.server');

async function query(pool, text, params = []) {
  const r = await pool.query(text, params);
  return r.rows;
}

function asTime(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value ?? '');
}

async function issueDocument(pool, doc) {
  const existing = await query(pool, 'select count(*)::int as n from erp_documents where kind = $1 and ref_id = $2', [doc.kind, doc.refId]);
  if ((existing[0]?.n ?? 0) > 0) return;
  await query(pool, `insert into erp_documents (id, kind, ref_id, cell_id, lot_id, title, body) values ($1,$2,$3,$4,$5,$6,$7)`,
    [doc.id ?? nid('doc'), doc.kind, doc.refId, doc.cellId, doc.lotId, doc.title, doc.body]);
}

async function backfillDocuments(pool, books) {
  await query(pool, `insert into erp_seasons (id, name, village, status) values ('magh-2026','Magh 2026',$1,'open') on conflict (id) do nothing`, [books.fpo?.village ?? 'Langthasa']);
  for (const lot of books.lots) {
    await issueDocument(pool, {
      kind: 'harvest', refId: lot.id, cellId: lot.cellId, lotId: lot.id, title: `Harvest note · ${lot.variety}`,
      body: `${lot.cellName} minted ${lot.grams} g of ${lot.variety} (${lot.commodity}). Remaining ${lot.remainingGrams} g on the same body. Grade ${lot.grade ?? '—'}. GI ${lot.giMarker ?? 'none'}.`,
    });
  }
  for (const wr of books.receipts) {
    await issueDocument(pool, {
      kind: 'warehouse', refId: wr.id, cellId: null, lotId: wr.lotId, title: `Warehouse receipt · ${wr.id}`,
      body: `${wr.qtyGrams} g of ${wr.variety} inwards at ${wr.facility} for ${wr.cellName}. Status ${wr.status}. Lender ${wr.lender ?? 'none'}.`,
    });
  }
  for (const order of books.orders) {
    await issueDocument(pool, {
      kind: order.status === 'settled' ? 'settle' : 'offtake', refId: order.id, cellId: null, lotId: order.lotId,
      title: `${order.status === 'settled' ? 'Farmgate advice' : 'Offtake note'} · ${order.id}`,
      body: `${order.qtyGrams} g of ${order.variety} to ${order.buyer} at ${order.pricePaisePerKg} paise/kg, freight ${order.freightPaisePerKg} paise/kg. paymentRef ${order.paymentRef ?? 'open'}.`,
    });
  }
}

async function readExtras(pool) {
  const seasons = await query(pool, 'select id, name, village, status from erp_seasons order by opened_at desc limit 1');
  const docs = await query(pool, 'select id, kind, ref_id, cell_id, lot_id, title, body, created_at from erp_documents order by created_at desc limit 40');
  const procs = await query(pool, 'select id, lot_id, kind, in_grams, loss_grams, out_grams, note, created_at from erp_process order by created_at desc limit 20');
  return {
    season: seasons[0] ? { id: seasons[0].id, name: seasons[0].name, village: seasons[0].village, status: seasons[0].status } : null,
    documents: docs.map((d) => ({ id: d.id, kind: d.kind, refId: d.ref_id, cellId: d.cell_id, lotId: d.lot_id, title: d.title, body: d.body, createdAt: asTime(d.created_at) })),
    processes: procs.map((p) => ({ id: p.id, lotId: p.lot_id, kind: p.kind, inGrams: p.in_grams, lossGrams: p.loss_grams, outGrams: p.out_grams, note: p.note, createdAt: asTime(p.created_at) })),
  };
}

async function ensurePlatform() {
  const books = await ensureBooks();
  await ensureSchema();
  const pool = getPostgreSQL();
  await backfillDocuments(pool, books);
  const extras = await readExtras(pool);
  return { ...books, ...composePlatform(books, extras) };
}

async function processLot(pool, input) {
  const lot = await query(pool, 'select remaining_grams, status, variety, cell_id from erp_lots where id = $1', [input.lotId]);
  if (!lot[0]) throw new Error('Unknown lot.');
  const pledged = await query(pool, "select count(*)::int as n from erp_receipts where lot_id = $1 and status = 'pledged'", [input.lotId]);
  assertCanSell(lot[0].status, pledged[0]?.n ?? 0);
  let win = [];
  try {
    win = await query(pool, "select status, kwh, active from erp_energy_windows where active = true order by created_at desc limit 1");
  } catch { /* window table missing — mill gate stays unnamed, process may still run. */ }
  if (win[0]) {
    const gate = energyProcessGate(win[0]);
    if (gate.decision === 'block') throw new Error(gate.reason);
  }
  const inGrams = lot[0].remaining_grams;
  if (inGrams <= 0) throw new Error('No remaining mass to process.');
  const { saleableGrams } = processMass(inGrams, input.lossGrams);
  const id = nid('prc');
  await query(pool, 'update erp_lots set remaining_grams = $2 where id = $1', [input.lotId, saleableGrams]);
  await query(pool, `insert into erp_process (id, lot_id, kind, in_grams, loss_grams, out_grams, note) values ($1,$2,$3,$4,$5,$6,$7)`,
    [id, input.lotId, input.kind, inGrams, input.lossGrams, saleableGrams, input.note.slice(0, 160)]);
  await issueDocument(pool, {
    kind: 'process', refId: id, cellId: lot[0].cell_id, lotId: input.lotId, title: `${input.kind} · ${lot[0].variety}`,
    body: `In ${inGrams} g. Declared ${input.kind} loss ${input.lossGrams} g. Saleable ${saleableGrams} g remains on the same body. ${input.note}`.trim(),
  });
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'lot','b-lot-birth',$2::jsonb)`,
    ['lot.process', JSON.stringify({ lotId: input.lotId, kind: input.kind, lossGrams: input.lossGrams, saleableGrams })]);
  return id;
}

async function readPlatform() {
  const books = await readBooks();
  await ensureSchema();
  const pool = getPostgreSQL();
  const extras = await readExtras(pool);
  return { ...books, ...composePlatform(books, extras) };
}

module.exports = { ensurePlatform, processLot, readPlatform };
