const fs = require('fs');
const path = require('path');

describe('External integration catalog completeness', () => {
  const root = path.resolve(__dirname, '../../..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.audit/phase-program/external-integration-catalog/manifest.json'), 'utf8'));
  const hubSource = fs.readFileSync(path.join(root, 'backend/src/platform/integration/integrationHub.js'), 'utf8');
  const pluginPolicy = JSON.parse(fs.readFileSync(path.join(root, '.ai/autonomous-program/PLUGIN_TOOLCHAIN_POLICY.json'), 'utf8'));

  it('leaves no unexplained integration-like configuration names', () => {
    expect(manifest.unexplainedIntegrationEnvNames).toEqual([]);
    expect(manifest.canonicalProviders).toBeGreaterThanOrEqual(30);
  });

  it('does not retain fake-success integration hub behavior', () => {
    expect(hubSource).not.toMatch(/Stub:\s*In real implementation/);
    expect(hubSource).not.toMatch(/connected:\s*true[\s\S]{0,80}latency:\s*0/);
    expect(hubSource).toContain('INTEGRATION_ADAPTER_MISSING');
    expect(hubSource).toContain('WEBHOOK_SIGNATURE_INVALID');
  });

  it('records plugin use as an evidence-bearing engineering policy', () => {
    expect(pluginPolicy.toolchain.some((item) => item.area === 'frontend-react')).toBe(true);
    expect(pluginPolicy.toolchain.some((item) => item.area === 'browser-e2e')).toBe(true);
    expect(pluginPolicy.toolchain.some((item) => item.area === 'ai-agents')).toBe(true);
    expect(pluginPolicy.toolchain.some((item) => item.area === 'backend-deployment-ops')).toBe(true);
  });
});
