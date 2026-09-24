/**
 * ERP Core — farm / clinic / nutrition-program enterprise resources
 * Domains: inventory, procurement, production, finance light, HR light, CRM light
 * Scoped to three modules: veterinary, nutrition, agro
 */

const { randomUUID } = require('crypto');

const ERP_DISCLAIMER =
  'ERP module is operational scaffolding. Not a certified accounting system. Integrate with Tally/SAP/Zoho as needed for statutory books.';

/** Entity catalogues per module */
const ENTITY_TYPES = {
  veterinary: [
    'animal_batch',
    'medicine_sku',
    'vaccine_sku',
    'feed_sku',
    'equipment',
    'vet_visit',
    'treatment_order',
  ],
  nutrition: [
    'client_profile',
    'meal_plan',
    'food_sku',
    'supplement_sku',
    'consult_session',
    'kitchen_indent',
  ],
  agro: [
    'field_plot',
    'seed_sku',
    'fertilizer_sku',
    'pesticide_sku',
    'biochar_sku',
    'equipment',
    'harvest_lot',
    'labour_gang',
  ],
};

// In-memory stores (replace with DB)
const inventory = new Map();
const documents = new Map();
const ledgers = new Map();

function invKey(module, sku) {
  return `${module}::${sku}`;
}

function upsertInventory(input = {}) {
  const module = input.module || 'agro';
  const sku = String(input.sku || input.item_id || randomUUID());
  const key = invKey(module, sku);
  const prev = inventory.get(key) || {
    module,
    sku,
    name: input.name || sku,
    qty: 0,
    uom: input.uom || 'unit',
    reorder_level: input.reorder_level ?? 0,
    batch: input.batch || null,
    expiry: input.expiry || null,
    meta: {},
  };
  const delta = Number(input.qty_delta != null ? input.qty_delta : input.qty != null ? input.qty - prev.qty : 0);
  prev.qty = Math.max(0, prev.qty + (input.qty != null && input.qty_delta == null ? input.qty - prev.qty : delta));
  if (input.name) prev.name = input.name;
  if (input.reorder_level != null) prev.reorder_level = input.reorder_level;
  if (input.batch) prev.batch = input.batch;
  if (input.expiry) prev.expiry = input.expiry;
  prev.updated_at = new Date().toISOString();
  inventory.set(key, prev);
  return {
    item: prev,
    low_stock: prev.qty <= prev.reorder_level,
  };
}

function listInventory(module) {
  const rows = [...inventory.values()];
  return module ? rows.filter((r) => r.module === module) : rows;
}

function createDocument(input = {}) {
  const doc = {
    doc_id: randomUUID(),
    module: input.module || 'agro',
    type: input.type || 'note', // indent | grn | issue | invoice | treatment_order | meal_indent | spray_log
    lines: input.lines || [],
    party: input.party || null,
    amount: input.amount ?? null,
    status: input.status || 'draft',
    created_at: new Date().toISOString(),
    meta: input.meta || {},
  };
  documents.set(doc.doc_id, doc);

  // Auto inventory effects
  if (doc.type === 'grn' || doc.type === 'purchase') {
    for (const line of doc.lines) {
      upsertInventory({
        module: doc.module,
        sku: line.sku,
        name: line.name,
        qty_delta: Number(line.qty) || 0,
        uom: line.uom,
      });
    }
  }
  if (doc.type === 'issue' || doc.type === 'treatment_order' || doc.type === 'spray_log') {
    for (const line of doc.lines) {
      upsertInventory({
        module: doc.module,
        sku: line.sku,
        qty_delta: -(Number(line.qty) || 0),
      });
    }
  }
  return doc;
}

function listDocuments(module, type) {
  let rows = [...documents.values()];
  if (module) rows = rows.filter((d) => d.module === module);
  if (type) rows = rows.filter((d) => d.type === type);
  return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

function postLedger(input = {}) {
  const entry = {
    entry_id: randomUUID(),
    module: input.module || 'agro',
    account: input.account || 'general',
    debit: Number(input.debit) || 0,
    credit: Number(input.credit) || 0,
    narration: input.narration || '',
    ref_doc: input.ref_doc || null,
    at: new Date().toISOString(),
  };
  const key = entry.entry_id;
  ledgers.set(key, entry);
  return entry;
}

function erpDashboard(module) {
  const inv = listInventory(module);
  const docs = listDocuments(module);
  const low = inv.filter((i) => i.qty <= i.reorder_level);
  const expiring = inv.filter((i) => i.expiry && new Date(i.expiry) < new Date(Date.now() + 30 * 864e5));
  return {
    module,
    inventory_count: inv.length,
    low_stock: low,
    expiring_30d: expiring,
    open_docs: docs.filter((d) => d.status === 'draft' || d.status === 'open').length,
    recent_docs: docs.slice(0, 10),
    entity_types: ENTITY_TYPES[module] || [],
    disclaimer: ERP_DISCLAIMER,
  };
}

/** Module-specific ERP workflows */
function runErpWorkflow(input = {}) {
  const module = input.module || 'agro';
  const action = input.action || 'dashboard';

  if (action === 'dashboard') return erpDashboard(module);

  if (action === 'receive_stock') {
    return createDocument({
      module,
      type: 'grn',
      lines: input.lines || [{ sku: input.sku, name: input.name, qty: input.qty, uom: input.uom }],
      party: input.supplier,
      status: 'posted',
    });
  }

  if (action === 'issue_stock') {
    return createDocument({
      module,
      type: module === 'veterinary' ? 'treatment_order' : module === 'nutrition' ? 'meal_indent' : 'issue',
      lines: input.lines || [{ sku: input.sku, qty: input.qty }],
      status: 'posted',
      meta: { animal_id: input.animal_id, plot_id: input.plot_id, client_id: input.client_id },
    });
  }

  if (action === 'upsert_item') return upsertInventory({ ...input, module });

  if (action === 'finance_entry') return postLedger({ ...input, module });

  return { error: 'unknown_action', allowed: ['dashboard', 'receive_stock', 'issue_stock', 'upsert_item', 'finance_entry'] };
}

module.exports = {
  ENTITY_TYPES,
  upsertInventory,
  listInventory,
  createDocument,
  listDocuments,
  postLedger,
  erpDashboard,
  runErpWorkflow,
  ERP_DISCLAIMER,
};
