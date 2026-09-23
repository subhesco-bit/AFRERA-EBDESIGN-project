'use strict';
/** Real PostgreSQL persistence for the ERP kernel. Faithful port of
 * pine-shadow's src/lib/erp/boot.server.ts (1,945 lines, read in full —
 * every function below corresponds to one there) plus the table shapes
 * implied by erp/platform.server.ts's erp_documents/erp_process/erp_seasons
 * queries. Pine-shadow's original uses `getSql()` from its own `@/lib/db`
 * (PGLite/Kysely abstraction whose `.query()` returns a plain row array).
 * This project uses the `pg` driver via backend/src/database/connection.js,
 * whose `.query()` returns `{ rows }` — the `query()` helper below bridges
 * that gap so every call site below reads identically to pine-shadow's
 * original (`await query(pool, sql, params)` returns the row array
 * directly, same as `await sql.query(...)` there).
 *
 * No CREATE TABLE DDL existed in boot.server.ts itself (pine-shadow keeps
 * schema in migrations/ elsewhere) — ensureSchema() below derives the DDL
 * from every column actually read/written across all 19 ported functions,
 * verified column-by-column against the real queries. */

const { getPostgreSQL } = require('../../database/connection');
const { paiseFromKgPrice } = require('./money');
const { nid } = require('./ids');
const {
  DEFAULT_FREIGHT_PAISE_PER_KG, allocateFifo, assertCanSell, assertGiClaim, evaluateCover,
  inputJournal, journalBalances, kitchenImplies, mintGiBirth, offerNextSeason, CURRENT_SEASON,
  GI_GEO, remainingAfterSpoilage, settlementAmounts, settlementJournal, villageCostPost,
  villageSpoilagePost, evaluateWeatherCover, evaluateHerdCover, weatherReflex,
  assertDeclaredReading, schemeEligible, fusForVariety, foodUtilityScore, DECLARED_FUS,
  FUS_VERSION, LANGTHASA_MASTER_POLICY, LANGTHASA_WEATHER_POLICY, LANGTHASA_HERD_POLICY,
} = require('./kernel');

async function query(pool, text, params = []) {
  const r = await pool.query(text, params);
  return r.rows;
}

function asTime(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return String(value ?? '');
}

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const pool = getPostgreSQL();
  if (!pool) throw new Error('PostgreSQL pool not initialized — call database initialize() first.');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS spine_events (
      id SERIAL PRIMARY KEY, signal TEXT NOT NULL, organ_id TEXT, ligament_id TEXT,
      payload JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_fpo (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, village TEXT NOT NULL, district TEXT NOT NULL, split_rule TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS erp_cells (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, household TEXT NOT NULL, fpo_id TEXT NOT NULL REFERENCES erp_fpo(id),
      village TEXT NOT NULL, acres_centi INTEGER NOT NULL, notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS erp_kitchen (
      id TEXT PRIMARY KEY, dish TEXT NOT NULL, variety TEXT NOT NULL, festival TEXT NOT NULL, village TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS erp_farms (id TEXT PRIMARY KEY, cell_id TEXT NOT NULL REFERENCES erp_cells(id), name TEXT NOT NULL, village TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS erp_plots (id TEXT PRIMARY KEY, farm_id TEXT NOT NULL REFERENCES erp_farms(id), cell_id TEXT NOT NULL REFERENCES erp_cells(id), name TEXT NOT NULL, acres_centi INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS erp_plantings (
      id TEXT PRIMARY KEY, cell_id TEXT NOT NULL REFERENCES erp_cells(id), plot_id TEXT NOT NULL REFERENCES erp_plots(id),
      variety TEXT NOT NULL, season TEXT NOT NULL, acres_centi INTEGER NOT NULL, status TEXT NOT NULL, lot_id TEXT,
      UNIQUE (cell_id, variety, season)
    );
    CREATE TABLE IF NOT EXISTS erp_lots (
      id TEXT PRIMARY KEY, cell_id TEXT NOT NULL REFERENCES erp_cells(id), fpo_id TEXT NOT NULL REFERENCES erp_fpo(id),
      variety TEXT NOT NULL, commodity TEXT NOT NULL, grams INTEGER NOT NULL, remaining_grams INTEGER NOT NULL,
      grade TEXT, gi_marker TEXT, moisture_bp INTEGER, status TEXT NOT NULL DEFAULT 'minted',
      cover_status TEXT DEFAULT 'gap', policy_id TEXT, planting_id TEXT REFERENCES erp_plantings(id),
      minted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_receipts (
      id TEXT PRIMARY KEY, lot_id TEXT NOT NULL REFERENCES erp_lots(id), facility TEXT NOT NULL,
      qty_grams INTEGER NOT NULL, remaining_grams INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'inward',
      lender TEXT, pledged_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_receipt_events (id SERIAL PRIMARY KEY, receipt_id TEXT NOT NULL REFERENCES erp_receipts(id), event TEXT NOT NULL, note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
    CREATE TABLE IF NOT EXISTS erp_orders (
      id TEXT PRIMARY KEY, lot_id TEXT NOT NULL REFERENCES erp_lots(id), pool_id TEXT, buyer TEXT NOT NULL,
      qty_grams INTEGER NOT NULL, price_paise_per_kg INTEGER NOT NULL, freight_paise_per_kg INTEGER,
      status TEXT NOT NULL DEFAULT 'open', hours_to_pay INTEGER, payment_ref TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), settled_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS erp_journal (
      id SERIAL PRIMARY KEY, entry_id TEXT NOT NULL, cell_id TEXT, lot_id TEXT, organ_id TEXT NOT NULL,
      account TEXT NOT NULL, side TEXT NOT NULL, amount_paise INTEGER NOT NULL, memo TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_inputs (
      id SERIAL PRIMARY KEY, cell_id TEXT NOT NULL REFERENCES erp_cells(id), kind TEXT NOT NULL, qty NUMERIC NOT NULL,
      unit TEXT NOT NULL, amount_paise INTEGER NOT NULL, memo TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_payouts (
      id SERIAL PRIMARY KEY, fpo_id TEXT NOT NULL, cell_id TEXT NOT NULL REFERENCES erp_cells(id), order_id TEXT NOT NULL,
      qty_grams INTEGER NOT NULL, amount_paise INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
      payment_ref TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_gi_chain (
      id TEXT PRIMARY KEY, lot_id TEXT NOT NULL REFERENCES erp_lots(id), seq INTEGER NOT NULL, event TEXT NOT NULL,
      handler TEXT NOT NULL, geo TEXT NOT NULL, season TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_contracts (
      id TEXT PRIMARY KEY, cell_id TEXT NOT NULL REFERENCES erp_cells(id), fpo_id TEXT NOT NULL, variety TEXT NOT NULL,
      season TEXT NOT NULL, qty_grams INTEGER NOT NULL, price_paise_per_kg INTEGER, status TEXT NOT NULL DEFAULT 'offered',
      source_order_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (cell_id, variety, season)
    );
    CREATE TABLE IF NOT EXISTS erp_village_ledger (
      id TEXT PRIMARY KEY, village TEXT NOT NULL, organ_id TEXT NOT NULL, account TEXT NOT NULL, side TEXT NOT NULL,
      amount_paise INTEGER NOT NULL, qty_grams INTEGER NOT NULL DEFAULT 0, cause TEXT NOT NULL,
      lot_id TEXT, cell_id TEXT, memo TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_weather_alerts (
      id TEXT PRIMARY KEY, village TEXT NOT NULL, hazard TEXT NOT NULL, window_note TEXT NOT NULL,
      claim_open BOOLEAN NOT NULL DEFAULT true, moratorium TEXT NOT NULL DEFAULT 'none', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_iot_readings (
      id TEXT PRIMARY KEY, entity_id TEXT NOT NULL, cell_id TEXT, kind TEXT NOT NULL, value_num NUMERIC NOT NULL,
      unit TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_energy_windows (
      id TEXT PRIMARY KEY, village TEXT NOT NULL, status TEXT NOT NULL, kwh INTEGER, note TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_herd (
      id TEXT PRIMARY KEY, cell_id TEXT NOT NULL REFERENCES erp_cells(id), kind TEXT NOT NULL, head INTEGER NOT NULL,
      policy_id TEXT, cover_status TEXT NOT NULL DEFAULT 'gap', UNIQUE (cell_id, kind)
    );
    CREATE TABLE IF NOT EXISTS erp_fus (
      variety TEXT PRIMARY KEY, nutrition INTEGER NOT NULL, satiety INTEGER NOT NULL, taste INTEGER NOT NULL,
      culture INTEGER NOT NULL, convenience INTEGER NOT NULL, version TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS erp_policies (id TEXT PRIMARY KEY, kind TEXT NOT NULL, village TEXT NOT NULL, premium_paise INTEGER);
    CREATE TABLE IF NOT EXISTS erp_cover_bindings (
      id TEXT PRIMARY KEY, subject_kind TEXT NOT NULL, subject_id TEXT NOT NULL, policy_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'bound', UNIQUE (subject_kind, subject_id, policy_id)
    );
    CREATE TABLE IF NOT EXISTS erp_scheme_offers (
      id TEXT PRIMARY KEY, cell_id TEXT NOT NULL REFERENCES erp_cells(id), scheme TEXT NOT NULL, eligible BOOLEAN NOT NULL,
      amount_paise INTEGER, reason TEXT NOT NULL, UNIQUE (cell_id, scheme)
    );
    CREATE TABLE IF NOT EXISTS erp_documents (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, ref_id TEXT NOT NULL, cell_id TEXT, lot_id TEXT, title TEXT NOT NULL,
      body TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_process (
      id TEXT PRIMARY KEY, lot_id TEXT NOT NULL REFERENCES erp_lots(id), kind TEXT NOT NULL, in_grams INTEGER NOT NULL,
      loss_grams INTEGER NOT NULL, out_grams INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS erp_seasons (id TEXT PRIMARY KEY, name TEXT NOT NULL, village TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', opened_at TIMESTAMPTZ NOT NULL DEFAULT now());
  `);
  schemaReady = true;
}

const FPO = { id: 'fpo-hills-chakhao', name: 'Hills Chakhao Collective', village: 'Langthasa', district: 'Karbi Anglong', split_rule: 'qty_weighted' };
const CELLS = [
  { id: 'c-ronghang', name: 'Biren Ronghang', household: 'Ronghang house · 5', acres_centi: 240, notes: 'GI Chakhao, south slope' },
  { id: 'c-teron', name: 'Jirsong Teron', household: 'Teron house · 4', acres_centi: 180, notes: 'Ginger + paddy' },
  { id: 'c-enghi', name: 'Kajir Enghi', household: 'Enghi house · 6', acres_centi: 310, notes: 'GI Chakhao, Magh pithas' },
  { id: 'c-kramsapi', name: 'Serdihun Kramsapi', household: 'Kramsapi house · 3', acres_centi: 120, notes: 'Seed keeper' },
];

async function appendGiLink(pool, input) {
  const max = await query(pool, 'select coalesce(max(seq),0)::int as n from erp_gi_chain where lot_id = $1', [input.lotId]);
  const seq = (max[0]?.n ?? 0) + 1;
  await query(pool, `insert into erp_gi_chain (id, lot_id, seq, event, handler, geo, season) values ($1,$2,$3,$4,$5,$6,$7)`,
    [nid('gi'), input.lotId, seq, input.event, input.handler, input.geo, input.season]);
}

async function ensurePlot(pool, cellId, acresCenti) {
  const existing = await query(pool, 'select id from erp_plots where cell_id = $1 limit 1', [cellId]);
  if (existing[0]) return existing[0].id;
  const cell = await query(pool, 'select name, village from erp_cells where id = $1', [cellId]);
  if (!cell[0]) throw new Error('Unknown cell — a plot must name a farmer cell.');
  const farmId = nid('farm');
  const plotId = nid('plot');
  await query(pool, `insert into erp_farms (id, cell_id, name, village) values ($1,$2,$3,$4)`, [farmId, cellId, `${cell[0].name} farm`, cell[0].village]);
  await query(pool, `insert into erp_plots (id, farm_id, cell_id, name, acres_centi) values ($1,$2,$3,$4,$5)`, [plotId, farmId, cellId, 'home plot', Math.max(acresCenti, 1)]);
  return plotId;
}

async function closePlanting(pool, input) {
  try {
    const open = await query(pool, 'select id, status from erp_plantings where cell_id = $1 and variety = $2 and season = $3', [input.cellId, input.variety, CURRENT_SEASON]);
    if (open[0]) {
      await query(pool, "update erp_plantings set status = 'harvested', lot_id = $2 where id = $1", [open[0].id, input.lotId]);
      await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'crop','b-plantings-schema',$2::jsonb)`,
        ['crop.harvested', JSON.stringify({ plantingId: open[0].id, lotId: input.lotId, variety: input.variety, season: CURRENT_SEASON })]);
      return open[0].id;
    }
    const plotId = await ensurePlot(pool, input.cellId, input.acresCenti);
    const id = nid('pl');
    await query(pool, `insert into erp_plantings (id, cell_id, plot_id, variety, season, acres_centi, status, lot_id) values ($1,$2,$3,$4,$5,$6,'harvested',$7)`,
      [id, input.cellId, plotId, input.variety, CURRENT_SEASON, Math.max(input.acresCenti, 1), input.lotId]);
    await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'crop','b-plantings-schema',$2::jsonb)`,
      ['crop.harvested', JSON.stringify({ plantingId: id, lotId: input.lotId, variety: input.variety, season: CURRENT_SEASON })]);
    return id;
  } catch {
    return null;
  }
}

async function postVillage(pool, input) {
  await query(pool, `insert into erp_village_ledger (id, village, organ_id, account, side, amount_paise, qty_grams, cause, lot_id, cell_id, memo) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [nid('vl'), input.village, input.organId, input.account, input.side, input.amountPaise, input.qtyGrams, input.cause, input.lotId, input.cellId, input.memo]);
}

async function restoreLotStatus(pool, lotId) {
  const lot = await query(pool, 'select remaining_grams from erp_lots where id = $1', [lotId]);
  const open = await query(pool, "select count(*)::int as n from erp_orders where lot_id = $1 and status = 'open'", [lotId]);
  const rec = await query(pool, "select status from erp_receipts where lot_id = $1 and status <> 'released' order by created_at desc limit 1", [lotId]);
  const remaining = lot[0]?.remaining_grams ?? 0;
  if (remaining <= 0 && (open[0]?.n ?? 0) === 0) return void await query(pool, "update erp_lots set status = 'settled' where id = $1", [lotId]);
  if ((open[0]?.n ?? 0) > 0) return void await query(pool, "update erp_lots set status = 'listed' where id = $1", [lotId]);
  if (rec[0]?.status === 'pledged') return void await query(pool, "update erp_lots set status = 'pledged' where id = $1", [lotId]);
  if (rec[0]) return void await query(pool, "update erp_lots set status = 'in_warehouse' where id = $1", [lotId]);
  await query(pool, "update erp_lots set status = 'minted' where id = $1", [lotId]);
}

async function mintLot(pool, input) {
  const cell = await query(pool, 'select fpo_id, name, village, acres_centi from erp_cells where id = $1', [input.cellId]);
  if (!cell[0]) throw new Error('Unknown cell — a lot must name a farmer cell.');
  if (input.grams <= 0) throw new Error('Declared mass is required.');
  const id = input.lotId ?? nid('lot');
  await query(pool, `insert into erp_lots (id, cell_id, fpo_id, variety, commodity, grams, remaining_grams, grade, gi_marker, moisture_bp, status) values ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,'minted')`,
    [id, input.cellId, cell[0].fpo_id, input.variety, input.commodity, input.grams, input.grade ?? null, input.giMarker ?? null, input.moistureBp ?? null]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'lot','b-lot-birth',$2::jsonb)`,
    ['lot.mint', JSON.stringify({ lotId: id, cellId: input.cellId, grams: input.grams, variety: input.variety })]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'spine','b-spine-harvest',$2::jsonb)`,
    ['harvest.completed', JSON.stringify({ lotId: id, cellId: input.cellId })]);
  const plantingId = await closePlanting(pool, { cellId: input.cellId, variety: input.variety, acresCenti: cell[0].acres_centi, lotId: id });
  if (plantingId) await query(pool, 'update erp_lots set planting_id = $2 where id = $1', [id, plantingId]);
  const birth = mintGiBirth({ giMarker: input.giMarker ?? null, handler: cell[0].name, geo: `${cell[0].village}, Karbi Anglong`, season: CURRENT_SEASON });
  if (birth) {
    await appendGiLink(pool, { lotId: id, event: birth.event, handler: birth.handler, geo: birth.geo, season: birth.season });
    await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'trace','b-harvest-trace',$2::jsonb)`,
      ['trace.mint', JSON.stringify({ lotId: id, geo: birth.geo, handler: birth.handler, season: birth.season })]);
  }
  const kitchen = await query(pool, 'select dish, variety, festival from erp_kitchen');
  const implied = kitchenImplies(kitchen, input.variety);
  if (implied[0]) {
    await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'foodgraph','b-graph-genome',$2::jsonb)`,
      ['graph.implies', JSON.stringify({ lotId: id, dish: implied[0].dish, variety: input.variety, festival: implied[0].festival })]);
  }
  return id;
}

async function inwardReceipt(pool, input) {
  const lot = await query(pool, 'select grams, remaining_grams, status from erp_lots where id = $1', [input.lotId]);
  if (!lot[0]) throw new Error('Unknown lot.');
  if (lot[0].status === 'settled') throw new Error('A settled lot cannot re-enter the godown.');
  const open = await query(pool, "select count(*)::int as n from erp_receipts where lot_id = $1 and status <> 'released'", [input.lotId]);
  if ((open[0]?.n ?? 0) > 0) throw new Error('Lot already has an open warehouse receipt.');
  const remaining = lot[0].remaining_grams ?? lot[0].grams;
  if (remaining <= 0) throw new Error('No remaining mass to inward.');
  const id = input.receiptId ?? nid('wr');
  await query(pool, `insert into erp_receipts (id, lot_id, facility, qty_grams, remaining_grams, status) values ($1,$2,$3,$4,$4,'inward')`, [id, input.lotId, input.facility, remaining]);
  await query(pool, `insert into erp_receipt_events (receipt_id, event, note) values ($1,'inward',$2)`, [id, input.facility]);
  await query(pool, "update erp_lots set status = 'in_warehouse' where id = $1 and status = 'minted'", [input.lotId]);
  const cover = evaluateCover(input.facility);
  await query(pool, 'update erp_lots set cover_status = $2, policy_id = $3 where id = $1', [input.lotId, cover.status, cover.policyId]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'warehouse','b-harvest-fanout',$2::jsonb)`,
    ['warehouse.intake', JSON.stringify({ lotId: input.lotId, receiptId: id })]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'insurance',$2,$3::jsonb)`,
    [cover.signal, cover.status === 'bound' ? 'b-harvest-insure' : 'b-lot-cover', JSON.stringify({ lotId: input.lotId, policyId: cover.policyId, facility: input.facility })]);
  const gi = await query(pool, 'select gi_marker from erp_lots where id = $1', [input.lotId]);
  if (gi[0]?.gi_marker) await appendGiLink(pool, { lotId: input.lotId, event: 'intake', handler: input.facility, geo: GI_GEO, season: CURRENT_SEASON });
  return id;
}

async function pledgeReceipt(pool, input) {
  const rec = await query(pool, 'select status, lot_id from erp_receipts where id = $1', [input.receiptId]);
  if (!rec[0]) throw new Error('Unknown receipt.');
  if (rec[0].status === 'released') throw new Error('Released stock cannot be pledged.');
  if (!input.lender.trim()) throw new Error('Lender is required to pledge.');
  const openSale = await query(pool, "select count(*)::int as n from erp_orders where lot_id = $1 and status = 'open'", [rec[0].lot_id]);
  if ((openSale[0]?.n ?? 0) > 0) throw new Error('Open offtake must settle or the stock is already claimed.');
  await query(pool, "update erp_receipts set status = 'pledged', lender = $2, pledged_at = now() where id = $1", [input.receiptId, input.lender.trim()]);
  await query(pool, "update erp_lots set status = 'pledged' where id = $1", [rec[0].lot_id]);
  await query(pool, `insert into erp_receipt_events (receipt_id, event, note) values ($1,'pledged',$2)`, [input.receiptId, input.lender.trim()]);
}

async function releaseLien(pool, receiptId) {
  const rec = await query(pool, 'select status, lot_id from erp_receipts where id = $1', [receiptId]);
  if (!rec[0]) throw new Error('Unknown receipt.');
  if (rec[0].status !== 'pledged') throw new Error('No lien to release.');
  await query(pool, "update erp_receipts set status = 'inward', lender = null where id = $1", [receiptId]);
  await query(pool, "update erp_lots set status = 'in_warehouse' where id = $1", [rec[0].lot_id]);
  await query(pool, `insert into erp_receipt_events (receipt_id, event, note) values ($1,'lien_released', null)`, [receiptId]);
}

async function createOrder(pool, input) {
  const freight = input.freightPaisePerKg ?? DEFAULT_FREIGHT_PAISE_PER_KG;
  settlementAmounts(input.qtyGrams, input.pricePaisePerKg, freight);
  const lot = await query(pool, 'select grams, remaining_grams, status, cell_id, gi_marker from erp_lots where id = $1', [input.lotId]);
  if (!lot[0]) throw new Error('Unknown lot.');
  const pledged = await query(pool, "select count(*)::int as n from erp_receipts where lot_id = $1 and status = 'pledged'", [input.lotId]);
  assertCanSell(lot[0].status, pledged[0]?.n ?? 0);
  const mintCount = await query(pool, "select count(*)::int as n from erp_gi_chain where lot_id = $1 and event = 'mint'", [input.lotId]);
  assertGiClaim(lot[0].gi_marker, mintCount[0]?.n ?? 0);
  const remaining = lot[0].remaining_grams ?? lot[0].grams;
  if (input.qtyGrams > remaining) throw new Error('Cannot sell more than the remaining lot body.');
  if (!input.buyer.trim()) throw new Error('Buyer required.');
  const id = input.orderId ?? nid('ord');
  const held = await query(pool, `update erp_lots set remaining_grams = remaining_grams - $2, status = 'listed' where id = $1 and remaining_grams >= $2 returning remaining_grams`, [input.lotId, input.qtyGrams]);
  if (!held[0]) throw new Error('Cannot sell more than the remaining lot body.');
  await query(pool, `insert into erp_orders (id, lot_id, buyer, qty_grams, price_paise_per_kg, freight_paise_per_kg, pool_id, status) values ($1,$2,$3,$4,$5,$6,$7,'open')`,
    [id, input.lotId, input.buyer.trim(), input.qtyGrams, input.pricePaisePerKg, freight, input.poolId ?? null]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'marketplace','b-harvest-market',$2::jsonb)`,
    ['lot.ready', JSON.stringify({ lotId: input.lotId, orderId: id, pricePaisePerKg: input.pricePaisePerKg })]);
  return id;
}

async function poolOfftake(pool, input) {
  const freight = input.freightPaisePerKg ?? DEFAULT_FREIGHT_PAISE_PER_KG;
  settlementAmounts(input.qtyGrams, input.pricePaisePerKg, freight);
  const lots = await query(pool, `select l.id, l.remaining_grams from erp_lots l where l.commodity = $1 and l.remaining_grams > 0 and l.status in ('in_warehouse','listed') and not exists (select 1 from erp_receipts r where r.lot_id = l.id and r.status = 'pledged') order by l.minted_at asc`, [input.commodity]);
  const alloc = allocateFifo(lots.map((l) => ({ id: l.id, remainingGrams: l.remaining_grams })), input.qtyGrams);
  const poolId = nid('pool');
  for (const row of alloc) {
    await createOrder(pool, { lotId: row.lotId, buyer: input.buyer, qtyGrams: row.qtyGrams, pricePaisePerKg: input.pricePaisePerKg, freightPaisePerKg: freight, poolId });
  }
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'fpo','b-fpo-offtake',$2::jsonb)`,
    ['fpo.pool.offtake', JSON.stringify({ poolId, commodity: input.commodity, qtyGrams: input.qtyGrams, lines: alloc.length })]);
  return poolId;
}

async function settleOrder(pool, input) {
  if (!input.paymentRef.trim()) throw new Error('paymentRef is required to mark paid.');
  const order = await query(pool, 'select lot_id, qty_grams, price_paise_per_kg, freight_paise_per_kg, status from erp_orders where id = $1', [input.orderId]);
  if (!order[0]) throw new Error('Unknown order.');
  if (order[0].status === 'settled') return;
  const lot = await query(pool, 'select cell_id, fpo_id, variety from erp_lots where id = $1', [order[0].lot_id]);
  if (!lot[0]) throw new Error('Lot missing for order.');
  const freightRate = order[0].freight_paise_per_kg ?? DEFAULT_FREIGHT_PAISE_PER_KG;
  const { gross, freight, farmgate } = settlementAmounts(order[0].qty_grams, order[0].price_paise_per_kg, freightRate);
  const lines = settlementJournal({ variety: lot[0].variety, hoursToPay: input.hoursToPay, gross, freight, farmgate });
  if (!journalBalances(lines)) throw new Error('Settlement journal does not balance.');
  const entryId = nid('je');
  await query(pool, `update erp_orders set status = 'settled', hours_to_pay = $2, settled_at = now(), payment_ref = $3 where id = $1`, [input.orderId, input.hoursToPay, input.paymentRef.trim()]);
  const rec = await query(pool, "select id, remaining_grams from erp_receipts where lot_id = $1 and status <> 'released' order by created_at desc limit 1", [order[0].lot_id]);
  if (rec[0]) {
    const next = Math.max(0, (rec[0].remaining_grams ?? 0) - order[0].qty_grams);
    if (next === 0) {
      await query(pool, "update erp_receipts set remaining_grams = 0, status = 'released' where id = $1", [rec[0].id]);
      await query(pool, `insert into erp_receipt_events (receipt_id, event, note) values ($1,'released',$2)`, [rec[0].id, input.paymentRef.trim()]);
    } else {
      await query(pool, 'update erp_receipts set remaining_grams = $2 where id = $1', [rec[0].id, next]);
      await query(pool, `insert into erp_receipt_events (receipt_id, event, note) values ($1,'partial_out',$2)`, [rec[0].id, `${order[0].qty_grams} g settled`]);
    }
  }
  await restoreLotStatus(pool, order[0].lot_id);
  await query(pool, `insert into erp_payouts (fpo_id, cell_id, order_id, qty_grams, amount_paise, status, payment_ref) values ($1,$2,$3,$4,$5,'paid',$6)`,
    [lot[0].fpo_id, lot[0].cell_id, input.orderId, order[0].qty_grams, farmgate, input.paymentRef.trim()]);
  for (const line of lines) {
    await query(pool, `insert into erp_journal (entry_id, cell_id, lot_id, organ_id, account, side, amount_paise, memo) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [entryId, lot[0].cell_id, order[0].lot_id, line.organId, line.account, line.side, line.amountPaise, line.memo]);
  }
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'orders','b-order-payout',$2::jsonb)`,
    ['order.settled', JSON.stringify({ orderId: input.orderId, lotId: order[0].lot_id, cellId: lot[0].cell_id, farmgate, hoursToPay: input.hoursToPay })]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'rupee','b-rupee-cell',$2::jsonb)`,
    ['prosperity.post', JSON.stringify({ organ: 'orders', paise: farmgate, hoursToPay: input.hoursToPay, cellId: lot[0].cell_id })]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'demand','b-order-demand',$2::jsonb)`,
    ['demand.observed', JSON.stringify({ orderId: input.orderId, variety: lot[0].variety, qtyGrams: order[0].qty_grams, cellId: lot[0].cell_id })]);
  const offer = offerNextSeason(order[0].qty_grams, CURRENT_SEASON);
  const contractId = nid('vc');
  await query(pool, `insert into erp_contracts (id, cell_id, fpo_id, variety, season, qty_grams, price_paise_per_kg, status, source_order_id) values ($1,$2,$3,$4,$5,$6,null,'offered',$7) on conflict (cell_id, variety, season) do nothing`,
    [contractId, lot[0].cell_id, lot[0].fpo_id, lot[0].variety, offer.season, offer.qtyGrams, input.orderId]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'contract','b-demand-contract',$2::jsonb)`,
    ['contract.offer', JSON.stringify({ cellId: lot[0].cell_id, variety: lot[0].variety, season: offer.season, qtyGrams: offer.qtyGrams })]);
  const gi = await query(pool, 'select gi_marker from erp_lots where id = $1', [order[0].lot_id]);
  if (gi[0]?.gi_marker) await appendGiLink(pool, { lotId: order[0].lot_id, event: 'settle', handler: input.paymentRef.trim(), geo: GI_GEO, season: CURRENT_SEASON });
  if (freight > 0) {
    const village = await query(pool, 'select village from erp_cells where id = $1', [lot[0].cell_id]);
    const post = villageCostPost('freight', freight, order[0].qty_grams, 'declared freight');
    await postVillage(pool, { village: village[0]?.village ?? FPO.village, cellId: lot[0].cell_id, lotId: order[0].lot_id, memo: `Freight on ${lot[0].variety}`, ...post });
  }
}

async function acceptContract(pool, input) {
  if (input.pricePaisePerKg <= 0) throw new Error('Declared ₹/kg is required — never invented.');
  const row = await query(pool, 'select status from erp_contracts where id = $1', [input.contractId]);
  if (!row[0]) throw new Error('Unknown contract.');
  if (row[0].status === 'accepted') return;
  await query(pool, "update erp_contracts set status = 'accepted', price_paise_per_kg = $2 where id = $1 and status = 'offered'", [input.contractId, input.pricePaisePerKg]);
}

async function settlePool(pool, input) {
  const rows = await query(pool, "select id from erp_orders where pool_id = $1 and status = 'open' order by created_at", [input.poolId]);
  if (rows.length === 0) throw new Error('No open lines in this pool.');
  for (const row of rows) await settleOrder(pool, { orderId: row.id, paymentRef: input.paymentRef, hoursToPay: input.hoursToPay });
}

async function postInput(pool, input) {
  if (input.amountPaise <= 0) throw new Error('Declared amount is required.');
  const cell = await query(pool, 'select id from erp_cells where id = $1', [input.cellId]);
  if (!cell[0]) throw new Error('Unknown cell.');
  await query(pool, `insert into erp_inputs (cell_id, kind, qty, unit, amount_paise, memo) values ($1,$2,$3,$4,$5,$6)`, [input.cellId, input.kind, input.qty, input.unit, input.amountPaise, input.memo]);
  const organ = input.kind === 'energy' ? 'recie' : input.kind === 'cover' ? 'insurance' : input.kind === 'water' ? 'water' : 'crop';
  const lines = inputJournal(input.kind, input.amountPaise, input.memo, organ);
  if (!journalBalances(lines)) throw new Error('Input journal does not balance.');
  const entryId = nid('je');
  for (const line of lines) {
    await query(pool, `insert into erp_journal (entry_id, cell_id, lot_id, organ_id, account, side, amount_paise, memo) values ($1,$2,null,$3,$4,$5,$6,$7)`,
      [entryId, input.cellId, line.organId, line.account, line.side, line.amountPaise, line.memo]);
  }
  if (input.kind === 'energy' || input.kind === 'water' || input.kind === 'cover') {
    const cellRow = await query(pool, 'select village from erp_cells where id = $1', [input.cellId]);
    const post = villageCostPost(input.kind, input.amountPaise, 0, input.memo);
    await postVillage(pool, { village: cellRow[0]?.village ?? FPO.village, cellId: input.cellId, lotId: null, memo: input.memo, ...post });
  }
}

async function recordSpoilage(pool, input) {
  const lot = await query(pool, 'select remaining_grams, cell_id, variety, cover_status from erp_lots where id = $1', [input.lotId]);
  if (!lot[0]) throw new Error('Unknown lot.');
  const next = remainingAfterSpoilage(lot[0].remaining_grams, input.lossGrams);
  await query(pool, 'update erp_lots set remaining_grams = $2 where id = $1', [input.lotId, next]);
  const rec = await query(pool, "select id, remaining_grams from erp_receipts where lot_id = $1 and status <> 'released' order by created_at desc limit 1", [input.lotId]);
  if (rec[0]) {
    const recNext = Math.max(0, rec[0].remaining_grams - input.lossGrams);
    await query(pool, 'update erp_receipts set remaining_grams = $2 where id = $1', [rec[0].id, recNext]);
    await query(pool, `insert into erp_receipt_events (receipt_id, event, note) values ($1,'spoilage',$2)`, [rec[0].id, `${input.lossGrams} g · ${input.cause}`]);
  }
  const cell = await query(pool, 'select village from erp_cells where id = $1', [lot[0].cell_id]);
  const post = villageSpoilagePost(input.lossGrams, input.amountPaise ?? 0, input.cause);
  await postVillage(pool, { village: cell[0]?.village ?? FPO.village, cellId: lot[0].cell_id, lotId: input.lotId, memo: `Spoilage ${lot[0].variety} · ${input.cause}`, ...post });
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'rcop','b-spoilage-cascade',$2::jsonb)`,
    ['spoilage.event', JSON.stringify({ lotId: input.lotId, kg: input.lossGrams / 1000, cause: input.cause, cover: lot[0].cover_status })]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'recie','b-thought-village',$2::jsonb)`,
    ['village.ledger.post', JSON.stringify({ lotId: input.lotId, cause: input.cause, grams: input.lossGrams })]);
}

async function recordWeatherAlert(pool, input) {
  const reflex = weatherReflex(input.hazard);
  const village = input.village.trim() || FPO.village;
  await query(pool, `insert into erp_weather_alerts (id, village, hazard, window_note, claim_open, moratorium) values ($1,$2,$3,$4,true,$5)`,
    [nid('wx'), village, reflex.hazard, input.windowNote.trim().slice(0, 160) || reflex.hazard, reflex.moratorium]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'soil','b-weather-cascade',$2::jsonb)`,
    ['weather.alert', JSON.stringify({ villageId: village, hazard: reflex.hazard, claimWindow: true, freezeEmi: false })]);
}

async function recordIotReading(pool, input) {
  assertDeclaredReading({ entityId: input.entityId, kind: input.kind, value: input.value, unit: input.unit });
  await query(pool, `insert into erp_iot_readings (id, entity_id, cell_id, kind, value_num, unit, note) values ($1,$2,$3,$4,$5,$6,$7)`,
    [nid('iot'), input.entityId.trim(), input.cellId, input.kind.trim(), input.value, input.unit.trim(), input.note.trim().slice(0, 160)]);
}

async function declareEnergyKwh(pool, input) {
  if (!Number.isFinite(input.kwh) || input.kwh < 0) throw new Error('Declared kWh cannot be negative.');
  const row = await query(pool, 'select id from erp_energy_windows where id = $1', [input.windowId]);
  if (!row[0]) throw new Error('Unknown energy window.');
  await query(pool, 'update erp_energy_windows set kwh = $2 where id = $1', [input.windowId, Math.round(input.kwh)]);
}

async function seedNamedRemainder(pool) {
  for (const [key, axes] of Object.entries(DECLARED_FUS)) {
    const variety = key === 'chakhao' ? 'Chakhao Poireiton' : 'Nadia ginger';
    await query(pool, `insert into erp_fus (variety, nutrition, satiety, taste, culture, convenience, version) values ($1,$2,$3,$4,$5,$6,$7) on conflict (variety) do nothing`,
      [variety, axes.nutrition, axes.satiety, axes.taste, axes.culture, axes.convenience, FUS_VERSION]);
  }
  await query(pool, `insert into erp_policies (id, kind, village, premium_paise) values ($1,'godown','Langthasa',null),($2,'weather','Langthasa',null),($3,'herd','Langthasa',null) on conflict (id) do nothing`,
    [LANGTHASA_MASTER_POLICY, LANGTHASA_WEATHER_POLICY, LANGTHASA_HERD_POLICY]);
  const plantings = await query(pool, 'select id from erp_plantings');
  for (const p of plantings) {
    const weather = evaluateWeatherCover('Langthasa');
    if (weather.policyId) {
      await query(pool, `insert into erp_cover_bindings (id, subject_kind, subject_id, policy_id, status) values ($1,'planting',$2,$3,'bound') on conflict (subject_kind, subject_id, policy_id) do nothing`,
        [`cv-pl-${p.id}`, p.id, weather.policyId]);
    }
  }
  const existingHerd = await query(pool, 'select count(*)::int as n from erp_herd');
  if ((existingHerd[0]?.n ?? 0) === 0) {
    const cattle = evaluateHerdCover(2);
    const goats = evaluateHerdCover(4);
    await query(pool, `insert into erp_herd (id, cell_id, kind, head, policy_id, cover_status) values ('herd-ronghang-cattle','c-ronghang','cattle',2,$1,'bound'),('herd-ronghang-goat','c-ronghang','goat',4,$2,'bound') on conflict (cell_id, kind) do nothing`,
      [cattle.policyId, goats.policyId]);
    for (const h of ['herd-ronghang-cattle', 'herd-ronghang-goat']) {
      await query(pool, `insert into erp_cover_bindings (id, subject_kind, subject_id, policy_id, status) values ($1,'herd',$2,$3,'bound') on conflict (subject_kind, subject_id, policy_id) do nothing`, [`cv-${h}`, h, LANGTHASA_HERD_POLICY]);
    }
    await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'livestock','b-livestock-cover',$2::jsonb)`,
      ['herd.covered', JSON.stringify({ cellId: 'c-ronghang', policyId: LANGTHASA_HERD_POLICY, hazard: 'outage' })]);
  }
  const alerts = await query(pool, 'select count(*)::int as n from erp_weather_alerts');
  if ((alerts[0]?.n ?? 0) === 0) {
    const reflex = weatherReflex('unseasonal Magh rain');
    await query(pool, `insert into erp_weather_alerts (id, village, hazard, window_note, claim_open, moratorium) values ('wx-langthasa-magh','Langthasa',$1,'Magh 2026 rain window on the Karbi hills',true,$2)`, [reflex.hazard, reflex.moratorium]);
    await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'soil','b-weather-cascade',$2::jsonb)`,
      ['weather.alert', JSON.stringify({ villageId: 'Langthasa', hazard: reflex.hazard, claimWindow: reflex.claimWindow, freezeEmi: reflex.freezeEmi })]);
  }
  const windows = await query(pool, 'select count(*)::int as n from erp_energy_windows');
  if ((windows[0]?.n ?? 0) === 0) {
    await query(pool, `insert into erp_energy_windows (id, village, status, kwh, note, active) values ('en-langthasa-cut','Langthasa','outage',null,'Power cut that spoiled 40 kg ginger',false),('en-langthasa-now','Langthasa','ok',null,'Village energy cloud — kWh undeclared',true)`, []);
  }
  const iot = await query(pool, 'select count(*)::int as n from erp_iot_readings');
  if ((iot[0]?.n ?? 0) === 0) {
    assertDeclaredReading({ entityId: 'Langthasa godown', kind: 'temperature', value: 31.4, unit: 'C' });
    await query(pool, `insert into erp_iot_readings (id, entity_id, cell_id, kind, value_num, unit, note) values ('iot-godown-temp','Langthasa godown','c-teron','temperature',31.4,'C','Declared godown temperature during the power cut')`, []);
  }
  const offers = await query(pool, 'select count(*)::int as n from erp_scheme_offers');
  if ((offers[0]?.n ?? 0) === 0) {
    const cells = await query(pool, 'select id, acres_centi from erp_cells');
    const plantingCounts = await query(pool, 'select cell_id, count(*)::int as n from erp_plantings group by cell_id');
    const hort = await query(pool, "select distinct cell_id from erp_lots where commodity in ('ginger','turmeric') or variety ilike '%ginger%'");
    const hortSet = new Set(hort.map((h) => h.cell_id));
    const plantMap = Object.fromEntries(plantingCounts.map((p) => [p.cell_id, p.n]));
    const schemes = ['PM-KISAN', 'PMFBY', 'MIDH'];
    for (const c of cells) {
      for (const scheme of schemes) {
        const verdict = schemeEligible(scheme, { acresCenti: c.acres_centi, plantingCount: plantMap[c.id] ?? 0, horticulture: hortSet.has(c.id) });
        await query(pool, `insert into erp_scheme_offers (id, cell_id, scheme, eligible, amount_paise, reason) values ($1,$2,$3,$4,null,$5) on conflict (cell_id, scheme) do nothing`,
          [`sch-${c.id}-${scheme}`, c.id, scheme, verdict.eligible, verdict.reason]);
      }
    }
    await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'ai','b-gov-scheme',$2::jsonb)`, ['scheme.eligible', JSON.stringify({ village: 'Langthasa', amountPaise: null })]);
  }
}

async function seedPulseRemainder(pool) {
  const cells = await query(pool, 'select id, name, village, acres_centi from erp_cells');
  for (const c of cells) await ensurePlot(pool, c.id, c.acres_centi);
  const lots = await query(pool, `select l.id, l.cell_id, l.variety, l.gi_marker, c.name as cell_name, c.village from erp_lots l join erp_cells c on c.id = l.cell_id`);
  for (const lot of lots) {
    const acres = cells.find((c) => c.id === lot.cell_id)?.acres_centi ?? 100;
    await closePlanting(pool, { cellId: lot.cell_id, variety: lot.variety, acresCenti: acres, lotId: lot.id });
    if (lot.gi_marker) {
      const minted = await query(pool, "select count(*)::int as n from erp_gi_chain where lot_id = $1 and event = 'mint'", [lot.id]);
      if ((minted[0]?.n ?? 0) === 0) {
        await appendGiLink(pool, { lotId: lot.id, event: 'mint', handler: lot.cell_name, geo: `${lot.village}, Karbi Anglong`, season: CURRENT_SEASON });
        await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'trace','b-harvest-trace',$2::jsonb)`,
          ['trace.mint', JSON.stringify({ lotId: lot.id, geo: GI_GEO, handler: lot.cell_name, season: CURRENT_SEASON })]);
      }
    }
  }
  const kramsapiPlot = await query(pool, "select id from erp_plots where cell_id = 'c-kramsapi' limit 1");
  if (kramsapiPlot[0]) {
    await query(pool, `insert into erp_plantings (id, cell_id, plot_id, variety, season, acres_centi, status, lot_id) values ('pl-kramsapi-seed','c-kramsapi',$1,'Chakhao Poireiton',$2,120,'planted',null) on conflict (cell_id, variety, season) do nothing`,
      [kramsapiPlot[0].id, CURRENT_SEASON]);
    await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'crop','b-plantings-schema',$2::jsonb)`,
      ['crop.planted', JSON.stringify({ cellId: 'c-kramsapi', variety: 'Chakhao Poireiton', season: CURRENT_SEASON })]);
  }
  const costs = await query(pool, "select count(*)::int as n from erp_village_ledger where account in ('energy','water','cover','freight')");
  if ((costs[0]?.n ?? 0) === 0) {
    const ins = await query(pool, `select i.cell_id, i.kind, i.amount_paise, i.memo, c.village from erp_inputs i join erp_cells c on c.id = i.cell_id where i.kind in ('energy','water','cover')`);
    for (const row of ins) {
      if (row.kind !== 'energy' && row.kind !== 'water' && row.kind !== 'cover') continue;
      const post = villageCostPost(row.kind, row.amount_paise, 0, row.memo);
      await postVillage(pool, { village: row.village, cellId: row.cell_id, lotId: null, memo: row.memo, ...post });
    }
  }
  const spoilage = await query(pool, "select count(*)::int as n from erp_village_ledger where account = 'spoilage'");
  if ((spoilage[0]?.n ?? 0) === 0) {
    const ginger = await query(pool, "select id from erp_lots where id = 'lot-ginger-teron'");
    if (ginger[0]) await recordSpoilage(pool, { lotId: 'lot-ginger-teron', lossGrams: 40000, cause: 'power cut' });
  }
  await seedNamedRemainder(pool);
}

let seedChain = null;

async function seedBooks(pool) {
  const existing = await query(pool, 'select count(*)::int as n from erp_fpo');
  if ((existing[0]?.n ?? 0) > 0) {
    await seedPulseRemainder(pool);
    return;
  }
  await query(pool, `insert into erp_fpo (id, name, village, district, split_rule) values ($1,$2,$3,$4,$5)`, [FPO.id, FPO.name, FPO.village, FPO.district, FPO.split_rule]);
  for (const c of CELLS) {
    await query(pool, `insert into erp_cells (id, name, household, fpo_id, village, acres_centi, notes) values ($1,$2,$3,$4,$5,$6,$7)`, [c.id, c.name, c.household, FPO.id, FPO.village, c.acres_centi, c.notes]);
  }
  await query(pool, `insert into erp_kitchen (id, dish, variety, festival, village) values ('kit-pithas','Chakhao pithas','Chakhao Poireiton','Magh',$1),('kit-pickle','Ginger pickle','Nadia ginger','winter',$1) on conflict (id) do nothing`, [FPO.village]);

  await mintLot(pool, { cellId: 'c-enghi', variety: 'Chakhao Poireiton', commodity: 'black rice', grams: 510000, grade: 'GI', giMarker: 'GI-AS-CHAKHAO', moistureBp: 1250, lotId: 'lot-chakhao-enghi' });
  await inwardReceipt(pool, { lotId: 'lot-chakhao-enghi', facility: 'Langthasa godown', receiptId: 'wr-enghi-01' });
  await createOrder(pool, { lotId: 'lot-chakhao-enghi', buyer: 'Guwahati GI desk', qtyGrams: 510000, pricePaisePerKg: 18500, orderId: 'ord-enghi-01' });
  await settleOrder(pool, { orderId: 'ord-enghi-01', paymentRef: 'UPI-KA-8841', hoursToPay: 18 });

  await mintLot(pool, { cellId: 'c-ronghang', variety: 'Chakhao Poireiton', commodity: 'black rice', grams: 840000, grade: 'GI', giMarker: 'GI-AS-CHAKHAO', moistureBp: 1310, lotId: 'lot-chakhao-ronghang' });
  await inwardReceipt(pool, { lotId: 'lot-chakhao-ronghang', facility: 'Langthasa godown', receiptId: 'wr-ronghang-01' });
  await createOrder(pool, { lotId: 'lot-chakhao-ronghang', buyer: 'Diphu mill offtake', qtyGrams: 400000, pricePaisePerKg: 19200, orderId: 'ord-ronghang-01' });

  await mintLot(pool, { cellId: 'c-teron', variety: 'Nadia ginger', commodity: 'ginger', grams: 220000, grade: 'A', giMarker: null, moistureBp: null, lotId: 'lot-ginger-teron' });

  await postInput(pool, { cellId: 'c-ronghang', kind: 'seed', qty: 12, unit: 'kg', amountPaise: 480000, memo: 'GI seed, declared' });
  await postInput(pool, { cellId: 'c-ronghang', kind: 'energy', qty: 86, unit: 'kWh', amountPaise: 68800, memo: 'Drying hours, declared' });
  await postInput(pool, { cellId: 'c-enghi', kind: 'cover', qty: 1, unit: 'policy', amountPaise: 61200, memo: 'Storage cover on 510 kg' });
  await postInput(pool, { cellId: 'c-teron', kind: 'fodder', qty: 40, unit: 'kg', amountPaise: 24000, memo: 'Not livestock — mulch straw' });
  await postInput(pool, { cellId: 'c-ronghang', kind: 'water', qty: 18, unit: 'h', amountPaise: 14400, memo: 'Irrigation hours, declared' });

  await seedPulseRemainder(pool);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'erp',null,$2::jsonb)`, ['erp.books.seeded', JSON.stringify({ village: FPO.village, fpo: FPO.id })]);
}

async function ensureBooks() {
  await ensureSchema();
  const pool = getPostgreSQL();
  if (!seedChain) {
    seedChain = seedBooks(pool).catch((err) => { seedChain = null; throw err; });
  }
  await seedChain;
  await seedPulseRemainder(pool);
  return readBooks();
}

async function enrollCell(pool, input) {
  const fpo = await query(pool, 'select id, village from erp_fpo limit 1');
  if (!fpo[0]) throw new Error('FPO books are not open.');
  if (!input.name.trim()) throw new Error('Cell name is required.');
  if (!input.household.trim()) throw new Error('Household is required.');
  if (input.acresCenti <= 0) throw new Error('Declared acres are required.');
  const id = nid('c');
  await query(pool, `insert into erp_cells (id, name, household, fpo_id, village, acres_centi, notes) values ($1,$2,$3,$4,$5,$6,$7)`,
    [id, input.name.trim().slice(0, 80), input.household.trim().slice(0, 80), fpo[0].id, fpo[0].village, input.acresCenti, input.notes.trim().slice(0, 160)]);
  await query(pool, `insert into spine_events (signal, organ_id, ligament_id, payload) values ($1,'farmer','b-fpo-member',$2::jsonb)`, ['cell.enrolled', JSON.stringify({ cellId: id, name: input.name.trim() })]);
  return id;
}

async function readBooks() {
  await ensureSchema();
  const pool = getPostgreSQL();
  const fpoRows = await query(pool, 'select id, name, village, district, split_rule from erp_fpo limit 1');
  const fpo = fpoRows[0] ? { id: fpoRows[0].id, name: fpoRows[0].name, village: fpoRows[0].village, district: fpoRows[0].district, splitRule: fpoRows[0].split_rule } : null;

  const cellRows = await query(pool, `select c.id, c.name, c.household, c.fpo_id, c.village, c.acres_centi, c.notes, count(l.id)::int as lot_count, coalesce(sum(l.grams),0)::int as grams, coalesce(sum(l.remaining_grams),0)::int as remaining_grams, coalesce((select sum(j.amount_paise)::int from erp_journal j where j.cell_id = c.id and j.side = 'credit' and j.account = 'farmgate'),0) as credit_paise, coalesce((select sum(i.amount_paise)::int from erp_inputs i where i.cell_id = c.id),0) as debit_paise from erp_cells c left join erp_lots l on l.cell_id = c.id group by c.id order by c.name`);
  const cells = cellRows.map((c) => ({ id: c.id, name: c.name, household: c.household, fpoId: c.fpo_id, village: c.village, acresCenti: c.acres_centi, notes: c.notes, lotCount: c.lot_count, kgOnBooks: c.grams, remainingGrams: c.remaining_grams, rupeeCreditPaise: c.credit_paise, rupeeDebitPaise: c.debit_paise }));

  const lotRows = await query(pool, `select l.id, l.cell_id, c.name as cell_name, l.fpo_id, l.variety, l.commodity, l.grams, l.remaining_grams, l.grade, l.gi_marker, l.moisture_bp, l.status, coalesce(l.cover_status, 'gap') as cover_status, l.policy_id, l.planting_id, l.minted_at from erp_lots l join erp_cells c on c.id = l.cell_id order by l.minted_at desc`);
  const giMintedSet = new Set();
  const giMintedLots = await query(pool, "select distinct lot_id from erp_gi_chain where event = 'mint'");
  for (const g of giMintedLots) giMintedSet.add(g.lot_id);
  const lots = lotRows.map((l) => ({ id: l.id, cellId: l.cell_id, cellName: l.cell_name, fpoId: l.fpo_id, variety: l.variety, commodity: l.commodity, grams: l.grams, remainingGrams: l.remaining_grams ?? l.grams, grade: l.grade, giMarker: l.gi_marker, moistureBp: l.moisture_bp, status: l.status, coverStatus: l.cover_status, policyId: l.policy_id, plantingId: l.planting_id, giMinted: giMintedSet.has(l.id), mintedAt: asTime(l.minted_at), fusScore: fusForVariety(l.variety)?.score ?? null, fusComplete: false }));

  const recRows = await query(pool, `select r.id, r.lot_id, l.variety, c.name as cell_name, r.facility, r.qty_grams, r.remaining_grams, r.status, r.lender, r.created_at from erp_receipts r join erp_lots l on l.id = r.lot_id join erp_cells c on c.id = l.cell_id order by r.created_at desc`);
  const receipts = recRows.map((r) => ({ id: r.id, lotId: r.lot_id, variety: r.variety, cellName: r.cell_name, facility: r.facility, qtyGrams: r.qty_grams, remainingGrams: r.remaining_grams ?? r.qty_grams, status: r.status, lender: r.lender, createdAt: asTime(r.created_at) }));

  const orderRows = await query(pool, `select o.id, o.lot_id, o.pool_id, l.variety, c.name as cell_name, o.buyer, o.qty_grams, o.price_paise_per_kg, o.freight_paise_per_kg, o.status, o.hours_to_pay, o.payment_ref, o.created_at, o.settled_at from erp_orders o join erp_lots l on l.id = o.lot_id join erp_cells c on c.id = l.cell_id order by o.created_at desc`);
  const orders = orderRows.map((o) => ({ id: o.id, lotId: o.lot_id, poolId: o.pool_id, variety: o.variety, cellName: o.cell_name, buyer: o.buyer, qtyGrams: o.qty_grams, pricePaisePerKg: o.price_paise_per_kg, freightPaisePerKg: o.freight_paise_per_kg ?? DEFAULT_FREIGHT_PAISE_PER_KG, status: o.status, hoursToPay: o.hours_to_pay, paymentRef: o.payment_ref, createdAt: asTime(o.created_at), settledAt: o.settled_at ? asTime(o.settled_at) : null }));

  const journalRows = await query(pool, `select id, entry_id, cell_id, lot_id, organ_id, account, side, amount_paise, memo, created_at from erp_journal order by created_at desc, id desc limit 80`);
  const journal = journalRows.map((j) => ({ id: j.id, entryId: j.entry_id, cellId: j.cell_id, lotId: j.lot_id, organId: j.organ_id, account: j.account, side: j.side, amountPaise: j.amount_paise, memo: j.memo, createdAt: asTime(j.created_at) }));

  const inputRows = await query(pool, `select i.id, i.cell_id, c.name as cell_name, i.kind, i.qty, i.unit, i.amount_paise, i.memo, i.created_at from erp_inputs i join erp_cells c on c.id = i.cell_id order by i.created_at desc`);
  const inputs = inputRows.map((i) => ({ id: i.id, cellId: i.cell_id, cellName: i.cell_name, kind: i.kind, qty: i.qty, unit: i.unit, amountPaise: i.amount_paise, memo: i.memo, createdAt: asTime(i.created_at) }));

  const payoutRows = await query(pool, `select p.id, p.fpo_id, p.cell_id, c.name as cell_name, p.order_id, p.qty_grams, p.amount_paise, p.status, p.payment_ref, p.created_at from erp_payouts p join erp_cells c on c.id = p.cell_id order by p.created_at desc`);
  const payouts = payoutRows.map((p) => ({ id: p.id, fpoId: p.fpo_id, cellId: p.cell_id, cellName: p.cell_name, orderId: p.order_id, qtyGrams: p.qty_grams, amountPaise: p.amount_paise, status: p.status, paymentRef: p.payment_ref, createdAt: asTime(p.created_at) }));

  const poolMap = new Map();
  for (const lot of lots) {
    if (lot.remainingGrams <= 0) continue;
    if (lot.status !== 'in_warehouse' && lot.status !== 'listed') continue;
    const pledged = receipts.some((r) => r.lotId === lot.id && r.status === 'pledged');
    if (pledged) continue;
    const prev = poolMap.get(lot.commodity);
    if (prev) { prev.remainingGrams += lot.remainingGrams; prev.lotCount += 1; }
    else poolMap.set(lot.commodity, { commodity: lot.commodity, remainingGrams: lot.remainingGrams, lotCount: 1, cellCount: 0 });
  }
  for (const row of poolMap.values()) {
    row.cellCount = new Set(lots.filter((l) => l.commodity === row.commodity && l.remainingGrams > 0).map((l) => l.cellId)).size;
  }
  const poolable = [...poolMap.values()];

  const openPaise = orders.filter((o) => o.status === 'open').reduce((n, o) => n + paiseFromKgPrice(o.qtyGrams, o.pricePaisePerKg), 0);
  const settledPaise = orders.filter((o) => o.status === 'settled').reduce((n, o) => n + paiseFromKgPrice(o.qtyGrams, o.pricePaisePerKg), 0);
  const farmgatePaise = payouts.reduce((n, p) => n + p.amountPaise, 0);
  const hours = orders.filter((o) => o.status === 'settled' && o.hoursToPay != null).map((o) => o.hoursToPay);
  const kgInWarehouse = receipts.filter((r) => r.status === 'inward' || r.status === 'pledged').reduce((n, r) => n + r.remainingGrams, 0);
  const kgMinted = lots.reduce((n, l) => n + l.grams, 0);
  const kgRemaining = lots.reduce((n, l) => n + l.remainingGrams, 0);
  const totals = await query(pool, `select coalesce(sum(case when side = 'debit' then amount_paise else 0 end), 0)::int as debit, coalesce(sum(case when side = 'credit' then amount_paise else 0 end), 0)::int as credit from erp_journal`);
  const debit = totals[0]?.debit ?? 0;
  const credit = totals[0]?.credit ?? 0;

  const kpis = {
    cells: cells.length, lots: lots.length, kgInWarehouse, kgMinted, kgRemaining, openPaise, settledPaise, farmgatePaise,
    pendingPayouts: payouts.filter((p) => p.status === 'pending').length,
    avgHoursToPay: hours.length ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : null,
    journalBalanced: debit === credit, villageTcoPaise: 0, spoilageGrams: 0, giMinted: giMintedSet.size,
    integrityNote: 'ERP is bone. It records declared farmgate, freight, and settlement. Remaining mass stays on the same lot. It does not invent ₹ or MT. The nerve may read these books; it may not write them.',
  };

  const kitchenRows = await query(pool, 'select id, dish, variety, festival, village from erp_kitchen order by dish');
  const kitchen = kitchenRows.map((k) => ({ id: k.id, dish: k.dish, variety: k.variety, festival: k.festival, village: k.village }));

  const contractRows = await query(pool, `select x.id, x.cell_id, c.name as cell_name, x.fpo_id, x.variety, x.season, x.qty_grams, x.price_paise_per_kg, x.status, x.source_order_id, x.created_at from erp_contracts x join erp_cells c on c.id = x.cell_id order by x.created_at desc`);
  const contracts = contractRows.map((x) => ({ id: x.id, cellId: x.cell_id, cellName: x.cell_name, fpoId: x.fpo_id, variety: x.variety, season: x.season, qtyGrams: x.qty_grams, pricePaisePerKg: x.price_paise_per_kg, status: x.status, sourceOrderId: x.source_order_id, createdAt: asTime(x.created_at) }));

  const plantingRows = await query(pool, `select p.id, p.cell_id, c.name as cell_name, p.plot_id, x.name as plot_name, p.variety, p.season, p.acres_centi, p.status, p.lot_id from erp_plantings p join erp_cells c on c.id = p.cell_id join erp_plots x on x.id = p.plot_id order by p.season desc, c.name`);
  const plantings = plantingRows.map((p) => ({ id: p.id, cellId: p.cell_id, cellName: p.cell_name, plotId: p.plot_id, plotName: p.plot_name, variety: p.variety, season: p.season, acresCenti: p.acres_centi, status: p.status, lotId: p.lot_id }));

  const giRows = await query(pool, 'select id, lot_id, seq, event, handler, geo, season, created_at from erp_gi_chain order by lot_id, seq');
  const giChain = giRows.map((g) => ({ id: g.id, lotId: g.lot_id, seq: g.seq, event: g.event, handler: g.handler, geo: g.geo, season: g.season, createdAt: asTime(g.created_at) }));

  const vlRows = await query(pool, 'select id, village, organ_id, account, side, amount_paise, qty_grams, cause, lot_id, cell_id, memo, created_at from erp_village_ledger order by created_at desc');
  const villageLedger = vlRows.map((v) => ({ id: v.id, village: v.village, organId: v.organ_id, account: v.account, side: v.side, amountPaise: v.amount_paise, qtyGrams: v.qty_grams, cause: v.cause, lotId: v.lot_id, cellId: v.cell_id, memo: v.memo, createdAt: asTime(v.created_at) }));

  kpis.villageTcoPaise = villageLedger.reduce((n, v) => n + v.amountPaise, 0);
  kpis.spoilageGrams = villageLedger.filter((v) => v.account === 'spoilage').reduce((n, v) => n + v.qtyGrams, 0);

  const herdRows = await query(pool, `select h.id, h.cell_id, c.name as cell_name, h.kind, h.head, h.policy_id, h.cover_status from erp_herd h join erp_cells c on c.id = h.cell_id order by c.name, h.kind`);
  const herd = herdRows.map((h) => ({ id: h.id, cellId: h.cell_id, cellName: h.cell_name, kind: h.kind, head: h.head, policyId: h.policy_id, coverStatus: h.cover_status }));

  const wxRows = await query(pool, 'select id, village, hazard, window_note, claim_open, moratorium, created_at from erp_weather_alerts order by created_at desc');
  const weatherAlerts = wxRows.map((w) => ({ id: w.id, village: w.village, hazard: w.hazard, windowNote: w.window_note, claimOpen: w.claim_open, moratorium: w.moratorium, createdAt: asTime(w.created_at) }));

  const enRows = await query(pool, 'select id, village, status, kwh, note, active, created_at from erp_energy_windows order by active desc, created_at desc');
  const energyWindows = enRows.map((e) => ({ id: e.id, village: e.village, status: e.status, kwh: e.kwh, note: e.note, active: e.active, createdAt: asTime(e.created_at) }));

  const iotRows = await query(pool, 'select id, entity_id, cell_id, kind, value_num, unit, note, created_at from erp_iot_readings order by created_at desc');
  const iotReadings = iotRows.map((r) => ({ id: r.id, entityId: r.entity_id, cellId: r.cell_id, kind: r.kind, valueNum: Number(r.value_num), unit: r.unit, note: r.note, createdAt: asTime(r.created_at) }));

  const schRows = await query(pool, `select s.id, s.cell_id, c.name as cell_name, s.scheme, s.eligible, s.amount_paise, s.reason from erp_scheme_offers s join erp_cells c on c.id = s.cell_id order by c.name, s.scheme`);
  const schemes = schRows.map((s) => ({ id: s.id, cellId: s.cell_id, cellName: s.cell_name, scheme: s.scheme, eligible: s.eligible, amountPaise: s.amount_paise, reason: s.reason }));

  const fusRows = await query(pool, 'select variety, nutrition, satiety, taste, culture, convenience, version from erp_fus order by variety');
  const fus = fusRows.map((f) => ({ variety: f.variety, nutrition: f.nutrition, satiety: f.satiety, taste: f.taste, culture: f.culture, convenience: f.convenience, version: f.version, score: foodUtilityScore({ nutrition: f.nutrition, satiety: f.satiety, taste: f.taste, culture: f.culture, convenience: f.convenience, affordability: null }).score }));

  return { fpo, kpis, cells, lots, receipts, orders, journal, inputs, payouts, poolable, kitchen, contracts, plantings, giChain, villageLedger, herd, weatherAlerts, energyWindows, iotReadings, schemes, fus };
}

module.exports = {
  ensureSchema, ensureBooks, readBooks, enrollCell, mintLot, inwardReceipt, pledgeReceipt, releaseLien,
  createOrder, poolOfftake, settleOrder, acceptContract, settlePool, postInput, recordSpoilage,
  recordWeatherAlert, recordIotReading, declareEnergyKwh,
};
