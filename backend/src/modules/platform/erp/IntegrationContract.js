/**
 * Canonical integration contract — every external ERP adapter implements this.
 * Domain modules never call Zoho/Tally/GSP directly.
 */

const ADAPTER_CAPABILITIES = {
  sync_party: 'Create/update customer or vendor with GSTIN',
  sync_item: 'Create/update SKU with HSN/SAC and tax',
  post_invoice: 'Post tax invoice / sales voucher',
  post_bill: 'Post purchase bill',
  post_journal: 'Post journal entry',
  post_stock: 'GRN or stock issue',
  fetch_irn: 'e-Invoice IRN via GSP',
  cancel_irn: 'Cancel IRN',
  eway_bill: 'Generate e-Way Bill',
};

/** Normalize AFRERA invoice → adapter-agnostic DTO */
function toCanonicalInvoice(afreraInvoice = {}) {
  return {
    external_ref: afreraInvoice.invoice_id || afreraInvoice.external_ref,
    module: afreraInvoice.module || 'agro',
    date: afreraInvoice.date || new Date().toISOString().slice(0, 10),
    party: {
      name: afreraInvoice.party?.name || afreraInvoice.party || 'Cash Customer',
      gstin: afreraInvoice.party_gstin || afreraInvoice.party?.gstin || null,
      state_code: afreraInvoice.party?.state_code || null,
      place_of_supply: afreraInvoice.place_of_supply || null,
    },
    own_gstin: afreraInvoice.own_gstin || null,
    supply_type: afreraInvoice.supply_type || 'intra',
    lines: (afreraInvoice.lines || []).map((l, i) => ({
      line_no: i + 1,
      sku: l.sku || l.item_id || `LINE-${i + 1}`,
      name: l.name || l.sku || 'Item',
      hsn: l.hsn || l.hsn_or_sac || null,
      sac: l.sac || null,
      qty: Number(l.qty) || 1,
      unit_price: Number(l.rate || l.unit_price) || 0,
      gst_rate: l.gst?.rate ?? l.gst_rate ?? 18,
      taxable: l.gst?.taxable_value ?? (Number(l.qty || 1) * Number(l.rate || l.unit_price || 0)),
      cgst: l.gst?.cgst ?? 0,
      sgst: l.gst?.sgst ?? 0,
      igst: l.gst?.igst ?? 0,
    })),
    totals: afreraInvoice.totals || null,
  };
}

function toCanonicalParty(p = {}) {
  return {
    name: p.name,
    gstin: p.gstin || null,
    pan: p.pan || null,
    email: p.email || null,
    phone: p.phone || null,
    billing_address: p.billing_address || p.address || null,
    state_code: p.state_code || null,
    type: p.type || 'customer', // customer | vendor
  };
}

function toCanonicalItem(it = {}) {
  return {
    sku: it.sku || it.item_id,
    name: it.name || it.sku,
    hsn: it.hsn || null,
    sac: it.sac || null,
    unit: it.uom || it.unit || 'nos',
    rate: Number(it.rate || it.unit_price) || 0,
    gst_rate: Number(it.gst_rate) || 18,
    type: it.type || 'goods', // goods | service
  };
}

module.exports = {
  ADAPTER_CAPABILITIES,
  toCanonicalInvoice,
  toCanonicalParty,
  toCanonicalItem,
};
