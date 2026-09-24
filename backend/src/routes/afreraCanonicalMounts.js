/**
 * AFRERA canonical route mounts
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
    if (mod && typeof mod.mount === 'function') {
      try {
        mod.mount(app);
        report.push({ path: path || '(mount-fn)', ok: true, note });
      } catch (e) {
        report.push({ path, ok: false, error: e.message, note });
      }
      return;
    }
    if (typeof mod === 'function' || (mod && mod.stack)) {
      app.use(path, mod);
      report.push({ path, ok: true, note });
      return;
    }
    report.push({ path, ok: false, error: 'not_a_router', note });
  }

  use('/api/v1/afrera', safeRequire('./afreraRoutes'), 'unified afrera OS');
  use('/api/v1/interplatform', safeRequire('./interplatformRoutes'), 'interplatform');
  use('/api/v1/grade10', safeRequire('./industryGradeRoutes'), 'grade10');
  use('/api/v1/features', safeRequire('./featureActivationRoutes'), 'features');
  use('/api/v1/baseline', safeRequire('./baselinePlatformRoutes'), 'baseline');
  use('/api/v1/dynamic-pricing', safeRequire('./dynamicPricingRoutes'), 'pricing');
  use('/api/v1/modules', safeRequire('./universalModuleRoutes'), 'modules');
  use('/api/v1/research-grade', safeRequire('./researchGradeRoutes'), 'research-grade');
  use('/api/v1/ecommerce', safeRequire('./ecommerceCheckoutRoutes'), 'checkout');
  use('/api/v1/layers', safeRequire('./layerBoundaryRoutes'), 'layers');
  use('/api/v1/escrow', safeRequire('./escrowIssueRoutes'), 'escrow+issues');
  use(null, safeRequire('./walletContractPreseasonRoutes'), 'wallet+preseason');

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
