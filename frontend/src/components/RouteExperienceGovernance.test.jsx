const fs = require('fs');
const path = require('path');

describe('UI route experience governance', () => {
  const root = path.resolve(__dirname, '../../..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.audit/phase-program/ui-experience-catalog/manifest.json'), 'utf8'));
  const routes = JSON.parse(fs.readFileSync(path.join(root, '.audit/phase-program/ui-experience-catalog/explicit-routes.json'), 'utf8'));

  it('has no duplicate explicit route paths', () => {
    expect(manifest.duplicateExplicitPathCount).toBe(0);
    const paths = routes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps wallet authenticated-only', () => {
    const wallet = routes.filter((route) => route.path === '/wallet');
    expect(wallet).toHaveLength(1);
    expect(wallet[0].protection).toBe('authenticated');
  });

  it('does not treat the unused auto-route generator as live routing', () => {
    expect(manifest.activeAutoRouteCount).toBe(0);
    expect(manifest.potentialAutoRouteCount).toBeGreaterThan(0);
    expect(manifest.unroutedPageCount).toBeGreaterThan(0);
  });

  it('maps the physical enterprise page estate through the protected dynamic route', () => {
    expect(manifest.enterpriseDynamicPageCount).toBe(790);
    expect(manifest.enterpriseDynamicRoute).toContain('ProtectedRoute');
  });

  it('uses a single canonical route guard implementation', () => {
    const compat = fs.readFileSync(path.join(root, 'frontend/src/components/ProtectedRoute.jsx'), 'utf8');
    expect(manifest.canonicalGuard).toBe('frontend/src/components/RouteGuard.jsx');
    expect(compat).toContain("from './RouteGuard'");
  });
});
