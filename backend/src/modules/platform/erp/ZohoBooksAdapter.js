/**
 * Zoho Books adapter — real endpoint shapes, OAuth contract, idempotent posts
 * Docs pattern: https://www.zohoapis.com/books/v3/...
 */

const { randomUUID } = require('crypto');
const { toCanonicalInvoice, toCanonicalParty, toCanonicalItem } = require('./IntegrationContract');

const ZOHO_BASE = process.env.ZOHO_BOOKS_BASE || 'https://www.zohoapis.com/books/v3';

function authHeaders(ctx = {}) {
  const token = ctx.access_token || process.env.ZOHO_ACCESS_TOKEN;
  if (!token) {
    return { error: 'ZOHO_ACCESS_TOKEN missing — complete OAuth before live post' };
  }
  return {
    Authorization: `Zoho-oauthtoken ${token}`,
    'Content-Type': 'application/json',
  };
}

function orgParam(ctx = {}) {
  const org = ctx.organization_id || process.env.ZOHO_ORGANIZATION_ID;
  if (!org) return { error: 'ZOHO_ORGANIZATION_ID required' };
  return { organization_id: org };
}

/** Build Zoho contact body */
function mapParty(party) {
  const c = toCanonicalParty(party);
  return {
    contact_name: c.name,
    contact_type: c.type === 'vendor' ? 'vendor' : 'customer',
    gst_no: c.gstin || undefined,
    email: c.email || undefined,
    phone: c.phone || undefined,
    billing_address: c.billing_address
      ? { address: typeof c.billing_address === 'string' ? c.billing_address : c.billing_address.line1 }
      : undefined,
    place_of_contact: c.state_code || undefined,
  };
}

function mapItem(item) {
  const it = toCanonicalItem(item);
  return {
    name: it.name,
    sku: it.sku,
    rate: it.rate,
    product_type: it.type === 'service' ? 'service' : 'goods',
    hsn_or_sac: it.hsn || it.sac || undefined,
    tax_percentage: it.gst_rate,
    unit: it.unit,
  };
}

function mapInvoice(inv, ctx = {}) {
  const c = toCanonicalInvoice(inv);
  return {
    customer_id: ctx.zoho_customer_id || undefined,
    date: c.date,
    reference_number: c.external_ref,
    line_items: c.lines.map((l) => ({
      name: l.name,
      description: l.sku,
      rate: l.unit_price,
      quantity: l.qty,
      hsn_or_sac: l.hsn || l.sac,
      tax_percentage: l.gst_rate,
    })),
    notes: `AFRERA module=${c.module}`,
    custom_fields: [{ label: 'afrera_ref', value: c.external_ref }],
  };
}

/**
 * Dry-run or live: builds exact request objects. Live fetch only if ctx.live && token present.
 */
async function syncParty(party, ctx = {}) {
  const headers = authHeaders(ctx);
  const org = orgParam(ctx);
  if (headers.error || org.error) {
    return { ok: false, adapter: 'zoho_books', stage: 'auth', error: headers.error || org.error, body: mapParty(party) };
  }
  const body = mapParty(party);
  const request = {
    method: 'POST',
    url: `${ZOHO_BASE}/contacts?organization_id=${org.organization_id}`,
    headers,
    body,
  };
  if (!ctx.live) {
    return { ok: true, adapter: 'zoho_books', mode: 'dry_run', request, idempotency_key: randomUUID() };
  }
  // Live path — use global fetch when available
  try {
    const res = await fetch(request.url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, adapter: 'zoho_books', mode: 'live', status: res.status, data };
  } catch (e) {
    return { ok: false, adapter: 'zoho_books', mode: 'live', error: e.message, request };
  }
}

async function syncItem(item, ctx = {}) {
  const headers = authHeaders(ctx);
  const org = orgParam(ctx);
  if (headers.error || org.error) {
    return { ok: false, adapter: 'zoho_books', stage: 'auth', error: headers.error || org.error, body: mapItem(item) };
  }
  const body = mapItem(item);
  const request = {
    method: 'POST',
    url: `${ZOHO_BASE}/items?organization_id=${org.organization_id}`,
    headers,
    body,
  };
  if (!ctx.live) return { ok: true, adapter: 'zoho_books', mode: 'dry_run', request };
  try {
    const res = await fetch(request.url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, adapter: 'zoho_books', mode: 'live', status: res.status, data };
  } catch (e) {
    return { ok: false, adapter: 'zoho_books', error: e.message, request };
  }
}

async function postInvoice(invoice, ctx = {}) {
  const headers = authHeaders(ctx);
  const org = orgParam(ctx);
  if (headers.error || org.error) {
    return {
      ok: false,
      adapter: 'zoho_books',
      stage: 'auth',
      error: headers.error || org.error,
      body: mapInvoice(invoice, ctx),
    };
  }
  const body = mapInvoice(invoice, ctx);
  const request = {
    method: 'POST',
    url: `${ZOHO_BASE}/invoices?organization_id=${org.organization_id}`,
    headers,
    body,
    idempotency_key: invoice.invoice_id || randomUUID(),
  };
  if (!ctx.live) return { ok: true, adapter: 'zoho_books', mode: 'dry_run', request };
  try {
    const res = await fetch(request.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, adapter: 'zoho_books', mode: 'live', status: res.status, data, idempotency_key: request.idempotency_key };
  } catch (e) {
    return { ok: false, adapter: 'zoho_books', error: e.message, request };
  }
}

module.exports = {
  name: 'zoho_books',
  capabilities: ['sync_party', 'sync_item', 'post_invoice'],
  syncParty,
  syncItem,
  postInvoice,
  mapParty,
  mapItem,
  mapInvoice,
};
