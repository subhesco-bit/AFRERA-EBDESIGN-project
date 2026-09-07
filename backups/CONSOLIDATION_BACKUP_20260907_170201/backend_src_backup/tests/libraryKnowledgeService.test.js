const { execFileSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../..');

function runServiceHarness(extraSetup = '') {
  const script = `
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const Service = require('./modules/M645100_LIBRARYKNOWLEDGE/backend/service.js');

    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'library-knowledge-'));
    const libraryRoot = path.join(root, '_EBDESIGN_LIBRARY');
    const modulesRoot = path.join(root, 'modules');
    const backendModulesRoot = path.join(root, 'backend-modules');

    fs.mkdirSync(path.join(libraryRoot, '00_CATALOG'), { recursive: true });
    fs.mkdirSync(path.join(libraryRoot, '01_MODULE_CARDS'), { recursive: true });
    fs.mkdirSync(path.join(libraryRoot, '01_MODULES', 'MODULAR_SYSTEM'), { recursive: true });
    fs.mkdirSync(path.join(modulesRoot, 'M900_TEST', 'backend'), { recursive: true });
    fs.mkdirSync(path.join(backendModulesRoot, 'M026'), { recursive: true });

    fs.writeFileSync(
      path.join(libraryRoot, '00_CATALOG', 'LIBRARY_MANIFEST.json'),
      '\\uFEFF' + JSON.stringify({ generatedAt: '2026-08-28', name: 'Test manifest' })
    );
    fs.writeFileSync(
      path.join(libraryRoot, '00_CATALOG', 'MODULE_CARD_INDEX.csv'),
      '"moduleId","name","description"\\n"M900","Test Module","Production library module"\\n'
    );
    fs.writeFileSync(
      path.join(libraryRoot, '01_MODULE_CARDS', 'MOD-M900.json'),
      JSON.stringify({ moduleId: 'MOD-M900', name: 'Library Card', domain: 'test' })
    );
    fs.writeFileSync(
      path.join(libraryRoot, '01_MODULES', 'MODULAR_SYSTEM', 'SYS-MOD-TEST.json'),
      JSON.stringify({ systemId: 'SYS-MOD-TEST', name: 'Library System' })
    );
    fs.writeFileSync(
      path.join(modulesRoot, 'M900_TEST', 'module.json'),
      JSON.stringify({ moduleId: 'M900_TEST', name: 'Runtime Test Module', status: 'production' })
    );
    fs.writeFileSync(path.join(modulesRoot, 'M900_TEST', 'backend', 'service.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(backendModulesRoot, 'M026', 'service.js'), 'module.exports = {};');
    ${extraSetup}

    (async () => {
      const service = new Service({ libraryRoot, modulesRoot, backendModulesRoot });
      const init = await service.initialize();
      const statistics = service.getStatistics();
      const modules = await service.listModules();
      const searchResults = await service.searchLibrary('runtime test');
      const verification = await service.verifyCatalogIntegrity();

      console.log(JSON.stringify({ init, statistics, modules, searchResults, verification }));
      fs.rmSync(root, { recursive: true, force: true });
    })().catch((error) => {
      fs.rmSync(root, { recursive: true, force: true });
      console.error(error);
      process.exit(1);
    });
  `;

  const output = execFileSync(process.execPath, ['-e', script], {
    cwd: projectRoot,
    encoding: 'utf8',
  });

  return JSON.parse(output);
}

describe('LibraryKnowledgeService', () => {
  it('initializes catalogues, modules, systems, and backend module scaffolds', () => {
    const result = runServiceHarness();

    expect(result.init.success).toBe(true);
    expect(result.init.indexedItems).toBe(6);
    expect(result.init.contentHashes).toBe(5);
    expect(result.statistics.byType).toMatchObject({
      catalogue: 2,
      'library-module-card': 1,
      'modular-system-card': 1,
      'runtime-module': 1,
      'backend-module': 1,
    });
    expect(result.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moduleId: 'M900_TEST', backend: true }),
        expect.objectContaining({ moduleId: 'M026', backend: true }),
      ])
    );
    expect(result.searchResults[0]).toEqual(expect.objectContaining({ key: 'M900_TEST' }));
    expect(result.verification.verified).toBe(true);
  });

  it('keeps indexing alive and reports verification issues for invalid JSON', () => {
    const result = runServiceHarness(`
      fs.writeFileSync(path.join(libraryRoot, '01_MODULE_CARDS', 'BROKEN.json'), '{bad json');
    `);

    expect(result.init.success).toBe(true);
    expect(result.init.indexingWarnings).toBe(1);
    expect(result.verification.verified).toBe(false);
    expect(result.verification.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'BROKEN', type: 'invalid_json' }),
      ])
    );
  });
});
