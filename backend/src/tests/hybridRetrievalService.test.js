const fs = require('fs');
const os = require('os');
const path = require('path');

const LibraryKnowledgeService = require('../../../modules/M645100_LIBRARYKNOWLEDGE/backend/service');
const HybridRetrievalService = require('../services/hybridRetrievalService');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hybrid-retrieval-'));
  const libraryRoot = path.join(root, '_EBDESIGN_LIBRARY');
  const modulesRoot = path.join(root, 'modules');
  const backendModulesRoot = path.join(root, 'backend-modules');

  fs.mkdirSync(path.join(libraryRoot, '00_CATALOG'), { recursive: true });
  fs.mkdirSync(path.join(libraryRoot, '01_MODULE_CARDS'), { recursive: true });
  fs.mkdirSync(path.join(modulesRoot, 'M900_RETRIEVAL', 'backend'), { recursive: true });
  fs.mkdirSync(path.join(modulesRoot, 'M901_LOGISTICS', 'backend'), { recursive: true });
  fs.mkdirSync(backendModulesRoot, { recursive: true });

  fs.writeFileSync(
    path.join(libraryRoot, '00_CATALOG', 'MODULE_CARD_INDEX.csv'),
    '"moduleId","name","description"\n"M900_RETRIEVAL","Hybrid Retrieval","BM25 semantic graph retrieval"\n'
  );

  fs.writeFileSync(
    path.join(libraryRoot, '01_MODULE_CARDS', 'retrieval.json'),
    JSON.stringify({
      moduleId: 'CARD_RETRIEVAL',
      name: 'Knowledge Retrieval',
      description: 'Semantic search and knowledge graph discovery',
      category: 'ai',
      status: 'production',
      discovery: {
        keywords: ['semantic', 'retrieval', 'knowledge'],
        capabilities: ['hybrid search', 'knowledge graph'],
      },
    })
  );

  fs.writeFileSync(
    path.join(modulesRoot, 'M900_RETRIEVAL', 'module.json'),
    JSON.stringify({
      moduleId: 'M900_RETRIEVAL',
      name: 'Hybrid Retrieval Engine',
      description: 'Hybrid semantic and lexical retrieval',
      category: 'ai',
      status: 'production',
      discovery: {
        keywords: ['bm25', 'semantic', 'retrieval'],
        capabilities: ['hybrid search'],
      },
      dependencies: { modules: ['M901_LOGISTICS'] },
    })
  );
  fs.writeFileSync(path.join(modulesRoot, 'M900_RETRIEVAL', 'backend', 'service.js'), 'module.exports = {};');

  fs.writeFileSync(
    path.join(modulesRoot, 'M901_LOGISTICS', 'module.json'),
    JSON.stringify({
      moduleId: 'M901_LOGISTICS',
      name: 'Cold Chain Logistics',
      description: 'Temperature-aware shipment planning',
      category: 'logistics',
      status: 'production',
      discovery: {
        keywords: ['cold chain', 'shipment'],
        capabilities: ['route planning'],
      },
      dependencies: { modules: [] },
    })
  );
  fs.writeFileSync(path.join(modulesRoot, 'M901_LOGISTICS', 'backend', 'service.js'), 'module.exports = {};');

  const knowledge = new LibraryKnowledgeService({ libraryRoot, modulesRoot, backendModulesRoot });
  return {
    root,
    knowledge,
    retrieval: new HybridRetrievalService({ knowledgeService: knowledge }),
  };
}

describe('HybridRetrievalService', () => {
  let ctx;

  beforeEach(async () => {
    ctx = fixture();
    await ctx.knowledge.initialize();
  });

  afterEach(() => {
    fs.rmSync(ctx.root, { recursive: true, force: true });
  });

  it('ranks retrieval-specific modules above unrelated modules with fused evidence', async () => {
    const result = await ctx.retrieval.search('semantic retrieval knowledge graph', { limit: 5 });

    expect(result.success).toBe(true);
    expect(result.mode).toBe('hybrid-deterministic');
    expect(result.semanticMode).toBe('hashed-vector-fallback');
    expect(result.results[0].key).toMatch(/RETRIEVAL/i);
    expect(result.results[0].channels).toEqual(
      expect.objectContaining({
        lexical: expect.any(Object),
        field: expect.any(Object),
        semantic: expect.any(Object),
      })
    );
    expect(result.results[0].provenance.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('supports metadata filters without leaking non-matching categories', async () => {
    const result = await ctx.retrieval.search('shipment planning', {
      filters: { category: 'logistics' },
      limit: 10,
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((item) => item.category === 'logistics')).toBe(true);
  });

  it('uses dependency graph evidence as a separate RRF channel', async () => {
    const result = await ctx.retrieval.search('M901 logistics', { limit: 10 });
    const retrievalModule = result.results.find((item) => item.key === 'M900_RETRIEVAL');

    expect(retrievalModule).toBeDefined();
    expect(retrievalModule.channels.graph).toEqual(expect.any(Object));
  });

  it('uses a configured embedding provider and reports the semantic mode', async () => {
    const provider = {
      embedTexts: async (texts) => texts.map((text) => {
        const lower = text.toLowerCase();
        return lower.includes('logistics') || lower.includes('shipment') ? [1, 0] : [0, 1];
      }),
    };

    const service = new HybridRetrievalService({
      knowledgeService: ctx.knowledge,
      vectorProvider: provider,
    });

    const result = await service.search('logistics shipment', { limit: 5 });

    expect(result.mode).toBe('hybrid-embedding');
    expect(result.semanticMode).toBe('embedding-provider');
    expect(result.results.some((item) => item.channels.semantic)).toBe(true);
  });

  it('rejects empty and oversized queries', async () => {
    await expect(ctx.retrieval.search('')).rejects.toThrow('query is required');
    await expect(ctx.retrieval.search('x'.repeat(501))).rejects.toThrow('at most 500');
  });
});
