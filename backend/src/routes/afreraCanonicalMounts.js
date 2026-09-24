/**
 * AFRERA canonical route mounts — stable even when DynamicRouteLoader degrades
 * Call: require('./routes/afreraCanonicalMounts').mount(app);
 */

'use strict';

function safeRequire(p) {
  try {
    return require(p);
  } catch (e) {
    return { __error: e.message, __path: p };
  }
}

function mount(app) {
  const report = [];

  function use(path, mod, note) {
    if (!mod || mod.__error) {
      report.push({ path, ok: false, error: mod && mod.__error, note });
      return;
    }
    if (typeof mod === 'function' && mod.length <= 1 && mod.mount) {
      // mount(app) style
      try {
        mod.mount(app);
        report.push({ path: path || '(mount-fn)', ok: true, note });
      } catch (e) {
        report.push({ path, ok: false, error: e.message, note });
      }
      return;
    }
    if (typeof mod === 'function' || (mod && typeof mod.handle === 'function') || (mod && mod.stack)) {
      app.use(path, mod);
      report.push({ path, ok: true, note });
      return;
    }
    if (mod && typeof mod.mount === 'function') {
      try {
        mod.mount(app);
        report.push({ path: path || '(mount-fn)', ok: true, note });
      } catch (e) {
        report.push({ path, ok: false, error: e.message, note });
      }
      return;
    }
    report.push({ path, ok: false, error: 'not_a_router', note });
  }

  use('/api/v1/interplatform', safeRequire('./interplatformRoutes'), 'interplatform fabric');
  use('/api/v1/grade10', safeRequire('./industryGradeRoutes'), 'grade10 engines');
  use('/api/v1/features', safeRequire('./featureActivationRoutes'), 'hidden features hub');
  use('/api/v1/baseline', safeRequire('./baselinePlatformRoutes'), 'baseline platform');
  use('/api/v1/dynamic-pricing', safeRequire('./dynamicPricingRoutes'), 'dynamic pricing');
  use('/api/v1/modules', safeRequire('./universalModuleRoutes'), 'universal module runtime');

  // wallet / contract / preseason uses .mount(app)
  use(null, safeRequire('./walletContractPreseasonRoutes'), 'wallet+contract+preseason');

  // Research-grade surface if routes exist
  const rg = safeRequire('./researchGradeRoutes');
  if (!rg.__error) use('/api/v1/research-grade', rg, 'research-grade');

  const layers = safeRequire('./layerBoundaryRoutes');
  if (!layers.__error) use('/api/v1/layers', layers, 'layer boundary');

  const checkout = safeRequire('./ecommerceCheckoutRoutes');
  if (!checkout.__error) use('/api/v1/ecommerce', checkout, 'checkout/rma');

  app.get('/api/v1/afrera/wiring-report', (req, res) => {
    res.json({
      success: true,
      mounts: report,
      ok_count: report.filter((r) => r.ok).length,
      fail_count: report.filter((r) => !r.ok).length,
    });
  });

  return report;
}

module.exports = { mount };
