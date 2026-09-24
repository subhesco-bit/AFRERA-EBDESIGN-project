/**
 * Advanced interlink wiring self-test — no full HTTP server required.
 * Run: node backend/src/__tests__/afreraWiringSelfTest.js
 * Exit 0 if all critical engines pass.
 */

'use strict';

const results = [];

function tryReq(p) {
  try {
    return { mod: require(p), error: null };
  } catch (e) {
    return { mod: null, error: e.message };
  }
}

async function check(name, fn) {
  try {
    // hub.operate() (and similar) are declared `async` even where the
    // individual handler is synchronous, so fn() can legitimately return
    // either a plain object or a Promise — await unconditionally covers
    // both instead of only the sync case, which previously made every
    // check against an async-wrapped handler silently compare against a
    // Promise object (always undefined fields) rather than its result.
    const out = await fn();
    const ok = out && out.ok !== false;
    results.push({ name, ok, detail: out && out.detail });
    return ok;
  } catch (e) {
    results.push({ name, ok: false, detail: e.message });
    return false;
  }
}

async function run() {
  // 1. Load engines
  const pricing = tryReq('../services/ecommerce/dynamicPricingEngine');
  await check('load.dynamicPricingEngine', () => ({
    ok: !!pricing.mod,
    detail: pricing.error,
  }));

  const checkout = tryReq('../services/ecommerce/checkoutOrchestrator');
  await check('load.checkoutOrchestrator', () => ({ ok: !!checkout.mod, detail: checkout.error }));

  const fabric = tryReq('../os/interplatformFabric');
  await check('load.interplatformFabric', () => ({ ok: !!fabric.mod, detail: fabric.error }));

  const grade10 = tryReq('../engines/industryGradePack');
  await check('load.industryGradePack', () => ({ ok: !!grade10.mod, detail: grade10.error }));

  const hub = tryReq('../services/hidden/featureActivationHub');
  await check('load.featureActivationHub', () => ({ ok: !!hub.mod, detail: hub.error }));

  const umr = tryReq('../core/universalModuleRuntime');
  await check('load.universalModuleRuntime', () => ({ ok: !!umr.mod, detail: umr.error }));

  const wallet = tryReq('../services/commerce/walletService');
  await check('load.walletService', () => ({ ok: !!wallet.mod, detail: wallet.error }));

  const preseason = tryReq('../services/commerce/preseasonPurchaseService');
  await check('load.preseason', () => ({ ok: !!preseason.mod, detail: preseason.error }));

  const subsidy = tryReq('../services/research-grade/subsidyEligibilityEngine');
  await check('load.subsidy', () => ({ ok: !!subsidy.mod, detail: subsidy.error }));

  const logistics = tryReq('../services/research-grade/logisticsDecisionEngine');
  await check('load.logistics', () => ({ ok: !!logistics.mod, detail: logistics.error }));

  const erp = tryReq('../services/research-grade/erpDoubleEntrySpine');
  await check('load.erp', () => ({ ok: !!erp.mod, detail: erp.error }));

  const trust = tryReq('../services/trust/trustReputationEngine');
  await check('load.trust', () => ({ ok: !!trust.mod, detail: trust.error }));

  // 2. Functional exercises
  if (pricing.mod) {
    await check('fn.pricing.delhi_tomato', () => {
      const r = pricing.mod.priceSku('TOM-ORG-1KG', { lat: 28.6, lng: 77.2 });
      return { ok: r.price > 0 && r.geofence, detail: `price=${r.price} geo=${r.geofence?.id}` };
    });
  }

  if (checkout.mod) {
    await check('fn.checkout.create', () => {
      const r = checkout.mod.checkout({
        buyer_id: 'TEST-B1',
        lines: [{ sku: 'TOM-ORG-1KG', qty: 2, unit_price: 40 }],
      });
      return { ok: !!r.order_id, detail: r.order_id };
    });
  }

  if (wallet.mod) {
    await check('fn.wallet.credit_hold_capture', () => {
      wallet.mod.credit('WTEST', 1000);
      wallet.mod.hold('WTEST', 100, { ref: 't1' });
      wallet.mod.captureHold('WTEST', 100, { ref: 't1' });
      const s = wallet.mod.snapshot('WTEST');
      return { ok: s.balance === 900, detail: `bal=${s.balance}` };
    });
  }

  if (hub.mod) {
    await check('fn.features.gst', async () => {
      const r = await hub.mod.operate({ feature: 'gst', taxable_value: 1000, rate: 0.05 });
      return { ok: r.total_tax === 50, detail: JSON.stringify(r.total_tax) };
    });
    await check('fn.features.escrow', async () => {
      const r = await hub.mod.operate({
        feature: 'escrow',
        action: 'hold',
        amount: 500,
        payer_id: 'P',
        payee_id: 'S',
      });
      return { ok: !!r.escrow_id, detail: r.escrow_id };
    });
  }

  if (grade10.mod) {
    await check('fn.grade10.pricing', () => {
      const r = grade10.mod.price10x('TOM-ORG-1KG', { lat: 19.08, lng: 72.88, inventory_available: 10 });
      return { ok: r.grade === '10x' && r.price > 0, detail: `price=${r.price}` };
    });
  }

  if (fabric.mod) {
    await check('fn.fabric.analyze', () => {
      const a = fabric.mod.deepAnalysis();
      return {
        ok: a.bridges && a.bridges.total >= 10 && a.platforms.length >= 5,
        detail: `platforms=${a.platforms.length} bridges=${a.bridges.total} score=${a.overall_score}`,
      };
    });
    await check('fn.fabric.bridge_pricing', async () => {
      const r = await fabric.mod.runBridge('pricing_geo', {
        sku: 'TOM-ORG-1KG',
        lat: 12.97,
        lng: 77.59,
      });
      return { ok: r.success && r.result && r.result.price > 0, detail: r.result && r.result.price };
    });
  }

  if (subsidy.mod) {
    await check('fn.subsidy.extract', () => {
      const r = subsidy.mod.extractAll({
        state: 'UP',
        land_ha: 1.5,
        farmer_category: 'small',
      });
      return { ok: Array.isArray(r.results), detail: `n=${r.results?.length}` };
    });
  }

  if (logistics.mod) {
    await check('fn.logistics.decide', () => {
      const r = logistics.mod.decide({
        weight_kg: 500,
        distance_km: 120,
        cold_chain: true,
        sla_hours: 36,
      });
      return { ok: !!r.recommendation, detail: r.recommendation?.mode };
    });
  }

  if (erp.mod) {
    await check('fn.erp.balanced_journal', () => {
      const r = erp.mod.postJournal({
        memo: 'selftest',
        lines: [
          { account: '1000', debit: 100, credit: 0 },
          { account: '2000', debit: 0, credit: 100 },
        ],
      });
      return { ok: !!r.journal, detail: r.journal?.id };
    });
  }

  if (umr.mod) {
    await check('fn.umr.order_fsm', async () => {
      const rt = umr.mod.getRuntime('M_TEST_ORDER');
      const c = rt.create({ total: 10 });
      // This module id resolves to the ecommerce order FSM, whose real
      // states are draft -> placed/cancelled -> paid/cancelled -> fulfilled.
      // 'active' is not a state in this table (it belongs to a different,
      // generic FSM) — the correct valid first transition is 'placed'.
      const t = rt.transition(c.record.id, 'placed');
      return { ok: t.success && t.record.state === 'placed', detail: t.record?.state };
    });
  }

  // Resolve async checks that returned promises in detail path
  for (const r of results) {
    if (r.detail && typeof r.detail.then === 'function') {
      try {
        const d = await r.detail;
        r.ok = d.ok;
        r.detail = d.detail;
      } catch (e) {
        r.ok = false;
        r.detail = e.message;
      }
    }
  }

  // Re-run async fabric bridge properly
  if (fabric.mod) {
    try {
      const r = await fabric.mod.runBridge('pricing_geo', {
        sku: 'TOM-ORG-1KG',
        lat: 12.97,
        lng: 77.59,
      });
      const idx = results.findIndex((x) => x.name === 'fn.fabric.bridge_pricing');
      if (idx >= 0) {
        results[idx] = {
          name: 'fn.fabric.bridge_pricing',
          ok: !!(r.success && r.result && r.result.price > 0),
          detail: r.result && r.result.price,
        };
      }
    } catch (e) {
      /* keep prior */
    }
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  const report = {
    suite: 'afrera_wiring_self_test',
    passed,
    failed,
    total: results.length,
    pass_rate: results.length ? Math.round((passed / results.length) * 100) : 0,
    results,
    timestamp: new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));

  if (failed > 0) process.exitCode = 1;
  return report;
}

if (require.main === module) {
  run().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
}

module.exports = { run };
