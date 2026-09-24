/**
 * ERP Sync Engine — orchestrates Zoho / Tally / GSP for the three modules
 * Default mode: dry_run (safe). live:true + credentials for production.
 */

const { randomUUID } = require('crypto');
const zoho = require('./ZohoBooksAdapter');
const tally = require('./TallyXmlAdapter');
const gsp = require('./GspEInvoiceAdapter');
const fin = require('../FinancialERP');

const ADAPTERS = {
  zoho_books: zoho,
  tally_xml: tally,
  gsp_einvoice: gsp,
};

function pickAdapters(targets = ['zoho_books']) {
  return targets.map((t) => ADAPTERS[t]).filter(Boolean);
}

/**
 * Full commercial path for a module decision:
 * 1) Ensure AFRERA tax invoice
 * 2) Sync party/item dry or live
 * 3) Post invoice to books adapter
 * 4) Optional IRN if B2B + threshold flags
 */
async function syncCommercial(input = {}) {
  const module = input.module || 'agro';
  const targets = input.targets || ['zoho_books'];
  const ctx = {
    live: !!input.live,
    access_token: input.access_token,
    organization_id: input.organization_id,
    zoho_customer_id: input.zoho_customer_id,
    tally_url: input.tally_url,
    gsp_token: input.gsp_token,
    seller_gstin: input.seller_gstin || input.own_gstin,
    seller_name: input.seller_name,
    seller_state_code: input.seller_state_code,
  };

  let invoice = input.invoice;
  if (!invoice && input.invoice_lines) {
    invoice = fin.createInvoice({
      module,
      lines: input.invoice_lines,
      supply_type: input.supply_type || 'intra',
      party: input.party,
      party_gstin: input.party_gstin,
      own_gstin: input.own_gstin || ctx.seller_gstin,
    });
  }
  if (!invoice) {
    return { ok: false, error: 'invoice or invoice_lines required', sync_id: randomUUID() };
  }

  const results = { sync_id: randomUUID(), module, mode: ctx.live ? 'live' : 'dry_run', steps: [] };

  // Party
  if (input.party || invoice.party) {
    for (const ad of pickAdapters(targets.filter((t) => t !== 'gsp_einvoice'))) {
      if (ad.syncParty) {
        results.steps.push({
          step: 'sync_party',
          adapter: ad.name,
          result: await ad.syncParty(input.party || { name: invoice.party, gstin: invoice.party_gstin }, ctx),
        });
      }
    }
  }

  // Items from lines
  for (const line of invoice.lines || []) {
    for (const ad of pickAdapters(targets.filter((t) => t !== 'gsp_einvoice'))) {
      if (ad.syncItem) {
        results.steps.push({
          step: 'sync_item',
          adapter: ad.name,
          result: await ad.syncItem(
            { sku: line.sku, name: line.name, hsn: line.hsn || line.gst?.hsn_or_sac, rate: line.rate || line.unit_price, gst_rate: line.gst?.rate },
            ctx,
          ),
        });
      }
    }
  }

  // Invoice post
  for (const ad of pickAdapters(targets.filter((t) => t !== 'gsp_einvoice'))) {
    if (ad.postInvoice) {
      results.steps.push({
        step: 'post_invoice',
        adapter: ad.name,
        result: await ad.postInvoice(invoice, ctx),
      });
    }
  }

  // IRN if requested / B2B
  if (input.generate_irn || (invoice.party_gstin && input.auto_irn)) {
    results.steps.push({
      step: 'generate_irn',
      adapter: 'gsp_einvoice',
      result: await gsp.generateIrn(invoice, ctx),
    });
  }

  if (input.generate_eway) {
    results.steps.push({
      step: 'eway_bill',
      adapter: 'gsp_eway',
      result: await gsp.generateEwayBill(invoice, input.transport || {}, ctx),
    });
  }

  results.invoice = invoice;
  results.ok = results.steps.every((s) => s.result?.ok !== false);
  results.disclaimer =
    'Dry-run by default. Live posts need Zoho OAuth / Tally :9000 / GSP credentials. Not a substitute for CA validation.';
  return results;
}

function adapterCatalogue() {
  return {
    zoho_books: { capabilities: zoho.capabilities, auth: 'OAuth Zoho-oauthtoken + organization_id' },
    tally_xml: { capabilities: tally.capabilities, auth: 'TallyPrime running XML server :9000' },
    gsp_einvoice: { capabilities: gsp.capabilities, auth: 'GSP_API_BASE + Bearer token + seller GSTIN' },
  };
}

module.exports = {
  syncCommercial,
  adapterCatalogue,
  ADAPTERS,
};
