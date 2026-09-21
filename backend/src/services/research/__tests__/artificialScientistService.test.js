'use strict';

jest.mock('../../../database/pool', () => ({ connect: jest.fn(), query: jest.fn() }));
jest.mock('../../aiGatewayService', () => ({ run: jest.fn() }));

const pool = require('../../../database/pool');
const aiGateway = require('../../aiGatewayService');
const scientist = require('../artificialScientistService');

const digest = 'a'.repeat(64);
const reproducibility = {
  codeRevision: '8486ddd9', runtime: 'node-24/postgres-16', environmentDigest: digest, randomSeed: 42,
  datasets: [{ uri: 's3://research/soil-v3.parquet', sha256: digest }],
};

describe('artificialScientistService governance', () => {
  afterEach(() => jest.clearAllMocks());

  test('allows only explicit hypothesis, protocol, experiment and run lifecycle edges', () => {
    expect(() => scientist.assertTransition('hypothesis', 'draft', 'approved')).not.toThrow();
    expect(() => scientist.assertTransition('hypothesis', 'draft', 'retired')).toThrow(/invalid hypothesis/i);
    expect(() => scientist.assertTransition('protocol', 'draft', 'approved')).not.toThrow();
    expect(() => scientist.assertTransition('experiment', 'draft', 'running')).toThrow(/invalid experiment/i);
    expect(() => scientist.assertTransition('run', 'succeeded', 'running')).toThrow(/invalid run/i);
  });

  test('requires complete reproducibility metadata and verified dataset identities', () => {
    expect(scientist.validateReproducibility(reproducibility)).toEqual(reproducibility);
    expect(() => scientist.validateReproducibility({ ...reproducibility, randomSeed: 1.5 })).toThrow(/randomSeed/i);
    expect(() => scientist.validateReproducibility({ ...reproducibility, environmentDigest: 'latest' })).toThrow(/environmentDigest/i);
    expect(() => scientist.validateReproducibility({ ...reproducibility, datasets: [{ uri: 'x', sha256: 'bad' }] })).toThrow(/sha256/i);
  });

  test('rejects experiments without operational steps, variables and a decision rule', () => {
    expect(() => scientist.validateExperimentalDesign({ protocol: {}, variables: {}, acceptanceCriteria: {}, reproducibility }))
      .toThrow(/protocol.steps/i);
    expect(() => scientist.validateExperimentalDesign({
      protocol: { steps: ['randomize plots'] }, variables: { independent: ['treatment'], dependent: ['yield'] },
      acceptanceCriteria: { primaryMetric: 'yield_kg_ha', decisionRule: 'p < 0.05 and effect > 5%' }, reproducibility,
    })).not.toThrow();
  });

  test('creates hypothesis and audit event atomically', async () => {
    const queries = [];
    const client = { release: jest.fn(), query: jest.fn(async (sql) => {
      queries.push(sql);
      if (sql.includes('INSERT INTO research_hypotheses')) return { rows: [{ id: 'hyp-1', state: 'draft' }] };
      return { rows: [] };
    }) };
    pool.connect.mockResolvedValue(client);
    await expect(scientist.createHypothesis({ title: 'Biochar improves yield', statement: 'Biochar raises maize yield above control', rationale: 'Soil carbon retention', domain: 'agronomy' }, 'user-1'))
      .resolves.toMatchObject({ id: 'hyp-1', state: 'draft' });
    expect(queries[0]).toBe('BEGIN');
    expect(queries.some((sql) => sql.includes('INSERT INTO research_audit_events'))).toBe(true);
    expect(queries).toContain('COMMIT');
  });

  test('rolls back hypothesis and audit together on persistence failure', async () => {
    const client = { release: jest.fn(), query: jest.fn(async (sql) => {
      if (sql.includes('research_hypotheses')) throw new Error('db unavailable');
      return { rows: [] };
    }) };
    pool.connect.mockResolvedValue(client);
    await expect(scientist.createHypothesis({ title: 'Valid title', statement: 'A sufficiently long statement', rationale: 'Evidence', domain: 'soil' }, 'user-1')).rejects.toThrow('db unavailable');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  test('uses only the governed gateway and persists AI output as a checksummed artifact', async () => {
    aiGateway.run.mockResolvedValue({ success: true, content: 'Review result', provider: 'openai', safety: { humanReviewRequired: true } });
    const client = { release: jest.fn(), query: jest.fn(async (sql) => {
      if (sql.includes('INSERT INTO research_artifacts')) return { rows: [{ id: 'artifact-1', kind: 'ai_output' }] };
      return { rows: [] };
    }) };
    pool.connect.mockResolvedValue(client);
    const result = await scientist.requestAIAssistance({ operation: 'hypothesis_review', prompt: 'Assess falsifiability', hypothesisId: 'hyp-1' }, 'user-1');
    expect(aiGateway.run).toHaveBeenCalledWith(expect.objectContaining({ moduleId: 'artificial-scientist', capability: 'hypothesis_review' }));
    expect(result).toMatchObject({ success: true, artifactId: 'artifact-1', persisted: true });
    const insert = client.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO research_artifacts'));
    expect(insert[1][7]).toMatch(/^[0-9a-f]{64}$/);
  });
});
