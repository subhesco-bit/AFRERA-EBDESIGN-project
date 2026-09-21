'use strict';

process.env.NODE_ENV = 'test';
process.env.SKIP_AUTH = 'true';

const path = require('path');
const DynamicRouteLoader = require('../src/core/dynamicRouteLoader');

const ROOT = path.resolve(__dirname, '..');

describe('canonical backend module live wiring', () => {
  test('root bridge filename maps to the public backend-modules mount', () => {
    const loader = new DynamicRouteLoader({ use: jest.fn() });
    expect(loader._toMountSegment('backendModulesRoutes')).toBe('backend-modules');
  });

  test('canonical root route delegates to the real module bridge', () => {
    const canonical = require('../src/routes/backendModulesRoutes');
    const bridge = require('../src/routes/claude/backendModuleBridge');
    expect(canonical).toBe(bridge);
    expect(bridge.__ebdesign.canonicalMount).toBe('/api/v1/backend-modules');
    expect(bridge.__ebdesign.realServiceDispatch).toBe(true);
    expect(bridge.__ebdesign.fakeSuccessStubs).toBe(false);
  });

  test('M041 live service exposes the real Village Registry operations', () => {
    const service = require(path.join(ROOT, 'src/modules/M041/service.js'));
    const operations = Object.keys(service).filter(key => typeof service[key] === 'function');
    expect(operations).toEqual(expect.arrayContaining([
      'createVillage',
      'addVillageResource',
      'getVillageAnalytics',
    ]));
  });
});
