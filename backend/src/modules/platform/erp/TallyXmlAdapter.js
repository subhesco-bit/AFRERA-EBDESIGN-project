/**
 * TallyPrime adapter — XML-over-HTTP port 9000 (no REST in Tally)
 * Builds valid ENVELOPE structures for masters and vouchers.
 */

const { randomUUID } = require('crypto');
const { toCanonicalInvoice, toCanonicalParty, toCanonicalItem } = require('./IntegrationContract');

const TALLY_URL = process.env.TALLY_URL || 'http://127.0.0.1:9000';

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ledgerMasterXml(party) {
  const c = toCanonicalParty(party);
  const parent = c.type === 'vendor' ? 'Sundry Creditors' : 'Sundry Debtors';
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <LEDGER Name="${escapeXml(c.name)}" Action="Create">
            <NAME>${escapeXml(c.name)}</NAME>
            <PARENT>${parent}</PARENT>
            ${c.gstin ? `<PARTYGSTIN>${escapeXml(c.gstin)}</PARTYGSTIN>` : ''}
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

function stockItemXml(item) {
  const it = toCanonicalItem(item);
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <STOCKITEM Name="${escapeXml(it.name)}" Action="Create">
            <NAME>${escapeXml(it.name)}</NAME>
            <BASEUNITS>${escapeXml(it.unit)}</BASEUNITS>
            ${it.hsn ? `<GSTAPPLICABLE>Yes</GSTAPPLICABLE><HSNCODE>${escapeXml(it.hsn)}</HSNCODE>` : ''}
          </STOCKITEM>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

function salesVoucherXml(invoice) {
  const c = toCanonicalInvoice(invoice);
  const date = c.date.replace(/-/g, '');
  const partyName = c.party.name;
  const amount = c.totals?.grand_total ?? c.lines.reduce((s, l) => s + l.taxable + l.cgst + l.sgst + l.igst, 0);
  const invLines = c.lines
    .map(
      (l) => `
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(l.name)}</STOCKITEMNAME>
              <RATE>${l.unit_price}/${escapeXml('Nos')}</RATE>
              <ACTUALQTY>${l.qty} Nos</ACTUALQTY>
              <AMOUNT>${-(l.taxable)}</AMOUNT>
            </ALLINVENTORYENTRIES.LIST>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Import</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>Vouchers</ID>
  </HEADER>
  <BODY>
    <DATA>
      <TALLYMESSAGE>
        <VOUCHER>
          <DATE>${date}</DATE>
          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
          <NARRATION>AFRERA ${escapeXml(c.external_ref || '')}</NARRATION>
          <LEDGERENTRIES.LIST>
            <LEDGERNAME>${escapeXml(partyName)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-${amount}</AMOUNT>
          </LEDGERENTRIES.LIST>
          ${invLines}
        </VOUCHER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>`;
}

async function postXml(xml, ctx = {}) {
  const url = ctx.tally_url || TALLY_URL;
  if (!ctx.live) {
    return {
      ok: true,
      adapter: 'tally_xml',
      mode: 'dry_run',
      url,
      content_type: 'text/xml',
      xml,
      idempotency_key: randomUUID(),
    };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml,
    });
    const text = await res.text();
    return { ok: res.ok, adapter: 'tally_xml', mode: 'live', status: res.status, response_xml: text.slice(0, 4000) };
  } catch (e) {
    return {
      ok: false,
      adapter: 'tally_xml',
      mode: 'live',
      error: e.message,
      hint: 'Ensure TallyPrime is running with XML server on port 9000',
      url,
    };
  }
}

async function syncParty(party, ctx = {}) {
  return postXml(ledgerMasterXml(party), ctx);
}

async function syncItem(item, ctx = {}) {
  return postXml(stockItemXml(item), ctx);
}

async function postInvoice(invoice, ctx = {}) {
  return postXml(salesVoucherXml(invoice), ctx);
}

module.exports = {
  name: 'tally_xml',
  capabilities: ['sync_party', 'sync_item', 'post_invoice'],
  syncParty,
  syncItem,
  postInvoice,
  ledgerMasterXml,
  stockItemXml,
  salesVoucherXml,
};
