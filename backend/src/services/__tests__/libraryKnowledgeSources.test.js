/**
 * The library index must tell the truth about what it was built from.
 *
 * Two claims in CLAUDE.md were wrong, and both were invisible at runtime:
 *
 *  1. It named `_EBDESIGN_LIBRARY/` with "524 cards". That directory does not
 *     exist in this repository. Every indexer that reads it opens with
 *     `if (!fs.existsSync(...)) return;` -- correct defensive code, but it made
 *     the absence silent: initialize() reported success and a populated index
 *     while several of its sources had contributed nothing.
 *
 *  2. 176 of the 192 manifests under `modules/` declare `"status": "WIRED"`.
 *     Route auto-discovery walks `backend/src/routes` and
 *     `backend/src/services` only; it never walks `modules/`. WIRED therefore
 *     means PACKAGED, not MOUNTED.
 *
 * These tests pin both, so neither claim can quietly come back.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { singleton } = require('../../../../modules/M645100_LIBRARYKNOWLEDGE/backend/service');

let status;

beforeAll(async () => {
  await singleton.initialize({ syncDatabase: false });
  status = singleton.getSourceStatus();
}, 60000);

describe('library source reporting', () => {
  it('reports every configured source, present or absent', () => {
    expect(Array.isArray(status.sources)).toBe(true);
    expect(status.sources.length).toBeGreaterThanOrEqual(3);
    status.sources.forEach((source) => {
      expect(typeof source.present).toBe('boolean');
      expect(typeof source.indexedItems).toBe('number');
    });
  });

  it('names an absent source root instead of hiding it behind a successful init', () => {
    const absent = status.sources.filter((source) => !source.present);
    absent.forEach((source) => {
      expect(source.indexedItems).toBe(0);
      expect(source.note).toMatch(/does not exist/);
      expect(status.missingSources).toContain(source.root);
    });
  });

  it('agrees with the filesystem about which roots exist', () => {
    status.sources.forEach((source) => {
      expect(source.present).toBe(fs.existsSync(source.root));
    });
  });

  it('indexes the real library — modules/ — and accounts for every item', () => {
    const modulesSource = status.sources.find((source) => source.label.startsWith('modules/'));
    expect(modulesSource.present).toBe(true);
    expect(modulesSource.indexedItems).toBeGreaterThan(100);

    const total = status.sources.reduce((sum, source) => sum + source.indexedItems, 0);
    expect(total).toBe(status.totalItems);
  });
});

describe('a WIRED manifest is not a mounted endpoint', () => {
  it('records the manifest status separately from the mount reality', () => {
    const runtimeModules = [...singleton.index.values()].filter((item) => item.type === 'runtime-module');
    expect(runtimeModules.length).toBeGreaterThan(100);

    runtimeModules.forEach((item) => {
      expect(item.data.mounted).toBe(false);
      expect(item.data).toHaveProperty('declaredStatus');
    });
  });

  it('carries a note saying why declaredStatus is not a mount', () => {
    const one = [...singleton.index.values()].find((item) => item.type === 'runtime-module');
    expect(one.data.mountedNote).toMatch(/not walked by the server route loader/);
  });

  it('confirms the route loader really does not walk modules/', () => {
    // If this ever stops being true, `mounted: false` above becomes a lie and
    // this test is the thing that catches it.
    const indexSource = fs.readFileSync(path.join(__dirname, '..', '..', 'index.js'), 'utf8');
    const mountsRootModules = /discoverAndMountRoutes\([^)]*['"`][^'"`]*\.\.\/modules/.test(indexSource)
      || /routesDir\s*=\s*path\.join\([^)]*['"]\.\.['"],\s*['"]\.\.['"],\s*['"]modules['"]/.test(indexSource);
    expect(mountsRootModules).toBe(false);
  });
});
