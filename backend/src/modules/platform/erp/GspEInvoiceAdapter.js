/**
 * GSP e-Invoice + e-Way Bill adapter
 * IRP payload follows NIC schema fields (simplified but non-generic).
 * Live calls require GSP credentials (ClearTax / WhiteBooks / IRIS etc.).
 */

const { randomUUID } = require('crypto');
const { toCanonicalInvoice } = require('./IntegrationContract');

const GSP_BASE = process.env.GSP_API_BASE || '';

/**
 * Build IRP-style Doc JSON from AFRERA invoice
 * Field names aligned to common GSP request bodies
 */
function buildIrnRequest(invoice, ctx = {}) {
  const c = toCanonicalInvoice(invoice);
  const sellerGstin = c.own_gstin || ctx.seller_gstin || process.env.SELLER_GSTIN;
  const buyerGstin = c.party.gstin || null;

  if (!sellerGstin) {
    return { error: 'seller_gstin / own_gstin required for IRN' };
  }

  const itemList = c.lines.map((l, idx) => ({
    SlNo: String(idx + 1),
    PrdDesc: l.name,
    IsServc: l.sac ? 'Y' : 'N',
    HsnCd: l.hsn || l.sac || '0000',
    Qty: l.qty,
    Unit: 'NOS',
    UnitPrice: l.unit_price,
    TotAmt: l.taxable,
    Discount: 0,
    AssAmt: l.taxable,
    GstRt: l.gst_rate,
    IgstAmt: l.igst,
    CgstAmt: l.cgst,
    SgstAmt: l.sgst,
    TotItemVal: l.taxable + l.cgst + l.sgst + l.igst,
  }));

  const totals = c.totals || {
    taxable: itemList.reduce((s, i) => s + i.AssAmt, 0),
    cgst: itemList.reduce((s, i) => s + i.CgstAmt, 0),
    sgst: itemList.reduce((s, i) => s + i.SgstAmt, 0),
    igst: itemList.reduce((s, i) => s + i.IgstAmt, 0),
  };
  const grand = totals.grand_total ?? totals.taxable + totals.cgst + totals.sgst + totals.igst;

  return {
    Version: '1.1',
    TranDtls: {
      TaxSch: 'GST',
      SupTyp: buyerGstin ? 'B2B' : 'B2C',
      RegRev: 'N',
      IgstOnIntra: 'N',
    },
    DocDtls: {
      Typ: 'INV',
      No: String(c.external_ref || randomUUID()).slice(0, 16),
      Dt: c.date.split('-').reverse().join('/'), // DD/MM/YYYY common in IRP samples
    },
    SellerDtls: {
      Gstin: sellerGstin,
      LglNm: ctx.seller_name || process.env.SELLER_LEGAL_NAME || 'AFRERA Seller',
      Addr1: ctx.seller_addr || 'Registered Address',
      Loc: ctx.seller_loc || 'City',
      Pin: Number(ctx.seller_pin || 110001),
      Stcd: String(ctx.seller_state_code || '07'),
    },
    BuyerDtls: {
      Gstin: buyerGstin || 'URP',
      LglNm: c.party.name,
      Pos: c.party.place_of_supply || ctx.seller_state_code || '07',
      Addr1: 'Buyer Address',
      Loc: 'City',
      Pin: 110001,
      Stcd: c.party.state_code || '07',
    },
    ItemList: itemList,
    ValDtls: {
      AssVal: totals.taxable,
      CgstVal: totals.cgst,
      SgstVal: totals.sgst,
      IgstVal: totals.igst,
      TotInvVal: grand,
    },
  };
}

function buildEwayRequest(invoice, transport = {}, ctx = {}) {
  const irnBody = buildIrnRequest(invoice, ctx);
  if (irnBody.error) return irnBody;
  return {
    supplyType: 'O',
    subSupplyType: '1',
    docType: 'INV',
    docNo: irnBody.DocDtls.No,
    docDate: irnBody.DocDtls.Dt,
    fromGstin: irnBody.SellerDtls.Gstin,
    fromTrdName: irnBody.SellerDtls.LglNm,
    toGstin: irnBody.BuyerDtls.Gstin,
    toTrdName: irnBody.BuyerDtls.LglNm,
    transMode: transport.mode || '1',
    transDistance: transport.distance_km || 10,
    vehicleNo: transport.vehicle_no || null,
    itemList: irnBody.ItemList,
    totalValue: irnBody.ValDtls.TotInvVal,
  };
}

async function generateIrn(invoice, ctx = {}) {
  const payload = buildIrnRequest(invoice, ctx);
  if (payload.error) {
    return { ok: false, adapter: 'gsp_einvoice', error: payload.error };
  }
  const request = {
    method: 'POST',
    url: GSP_BASE ? `${GSP_BASE}/einvoice/generate` : null,
    headers: {
      'Content-Type': 'application/json',
      Authorization: ctx.gsp_token ? `Bearer ${ctx.gsp_token}` : undefined,
      'X-GSTIN': payload.SellerDtls.Gstin,
    },
    body: payload,
    idempotency_key: randomUUID(),
  };

  if (!ctx.live || !GSP_BASE) {
    return {
      ok: true,
      adapter: 'gsp_einvoice',
      mode: 'dry_run',
      request,
      irn: null,
      authoritative: false,
      note: 'Set GSP_API_BASE + gsp_token + live:true for production IRP',
    };
  }

  try {
    const res = await fetch(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, adapter: 'gsp_einvoice', mode: 'live', status: res.status, data };
  } catch (e) {
    return { ok: false, adapter: 'gsp_einvoice', error: e.message, request };
  }
}

async function generateEwayBill(invoice, transport, ctx = {}) {
  const payload = buildEwayRequest(invoice, transport, ctx);
  if (payload.error) return { ok: false, adapter: 'gsp_eway', error: payload.error };
  if (!ctx.live || !GSP_BASE) {
    return {
      ok: true,
      adapter: 'gsp_eway',
      mode: 'dry_run',
      body: payload,
      eway_bill_number: null,
      authoritative: false,
    };
  }
  try {
    const res = await fetch(`${GSP_BASE}/ewaybill/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ctx.gsp_token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, adapter: 'gsp_eway', mode: 'live', status: res.status, data };
  } catch (e) {
    return { ok: false, adapter: 'gsp_eway', error: e.message };
  }
}

module.exports = {
  name: 'gsp_einvoice',
  capabilities: ['fetch_irn', 'eway_bill'],
  buildIrnRequest,
  buildEwayRequest,
  generateIrn,
  generateEwayBill,
};
