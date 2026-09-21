/**
 * Multitask tests: Option 1 MEP→BOQ + Option 2 Clinic→Animal Health
 *
 * Run: npx jest backend/src/__tests__/mepBoqAndClinicHealth.multitask.test.js
 */

'use strict';

jest.mock('../services/legacy/engineeringProjectService', () => ({
  createCostEstimate: jest.fn(),
  getProject: jest.fn(),
  listProjects: jest.fn(),
}));

jest.mock('../services/legacy/animalHealthService', () => ({
  listExaminations: jest.fn(),
  listOutbreaks: jest.fn(),
  listQuarantines: jest.fn(),
  getHealthOverview: jest.fn(),
  getActiveOutbreaks: jest.fn(),
  getActiveQuarantines: jest.fn(),
}));

const engineeringProjectService = require('../services/legacy/engineeringProjectService');
const animalHealthService = require('../services/legacy/animalHealthService');
const mepBoqBridge = require('../services/legacy/mepBoqBridge');
const healthBridge = require('../services/legacy/clinicAnimalHealthBridge');

describe('Option 1 — MEP → BOQ bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('previewBoqFromMep returns cold_storage draft lines without DB', () => {
    const preview = mepBoqBridge.previewBoqFromMep('cold_storage');
    expect(preview.lineCount).toBeGreaterThanOrEqual(4);
    expect(preview.items[0]).toEqual(
      expect.objectContaining({
        category: expect.any(String),
        description: expect.any(String),
        unit: expect.any(String),
        quantity: expect.any(Number),
        itemCode: expect.any(String),
      }),
    );
    expect(preview.items.every((i) => i.specifications.source === 'mep_design_package')).toBe(true);
  });

  test('quantity and unitRate overrides apply by itemCode', () => {
    const preview = mepBoqBridge.previewBoqFromMep('cold_storage', {
      quantityOverrides: { 'MEP-CS-INS-01': 520 },
      unitRateOverrides: { 'MEP-CS-INS-01': 1850 },
    });
    const ins = preview.items.find((i) => i.itemCode === 'MEP-CS-INS-01');
    expect(ins.quantity).toBe(520);
    expect(ins.unitRate).toBe(1850);
  });

  test('createEstimateFromMep succeeds when engineering service resolves rates', async () => {
    engineeringProjectService.createCostEstimate.mockResolvedValue({
      estimate: { id: 'est-1', total_capex: 500000, contingency_amount: 50000 },
      boqItems: [{ id: 'boq-1', total_amount: 100000 }],
    });

    const result = await mepBoqBridge.createEstimateFromMep({
      facilityType: 'cold_storage',
      projectId: 'proj-1',
      userId: 'user-1',
      unitRateOverrides: {
        'MEP-CS-INS-01': 100,
        'MEP-CS-REF-01': 100,
        'MEP-CS-EL-01': 100,
        'MEP-CS-EL-02': 100,
        'MEP-CS-PL-01': 100,
      },
    });

    expect(result.ok).toBe(true);
    expect(result.estimate.id).toBe('est-1');
    expect(engineeringProjectService.createCostEstimate).toHaveBeenCalledWith(
      'proj-1',
      'user-1',
      false,
      expect.objectContaining({
        items: expect.any(Array),
        estimateType: 'preliminary',
      }),
    );
  });

  test('createEstimateFromMep surfaces UNRESOLVED_RATES without inventing money', async () => {
    const err = new Error('Cannot resolve a unit rate for one or more BOQ lines');
    err.code = 'UNRESOLVED_RATES';
    err.unresolvedLines = [{ line: 0, description: 'Insulated panel', reason: 'no rate' }];
    engineeringProjectService.createCostEstimate.mockRejectedValue(err);

    const result = await mepBoqBridge.createEstimateFromMep({
      facilityType: 'cold_storage',
      projectId: 'proj-1',
      userId: 'user-1',
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe('UNRESOLVED_RATES');
    expect(result.unresolvedLines).toHaveLength(1);
    expect(result.draftItems.length).toBeGreaterThan(0);
    expect(result.estimate).toBeUndefined();
  });

  test('createEstimateFromMep requires projectId', async () => {
    await expect(
      mepBoqBridge.createEstimateFromMep({ facilityType: 'dairy', userId: 'u1' }),
    ).rejects.toThrow(/projectId/);
  });
});

describe('Option 2 — Clinic → Animal Health bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mapAnimalType maps cow to Cattle', () => {
    expect(healthBridge.mapAnimalType('cow')).toBe('Cattle');
    expect(healthBridge.mapAnimalType('poultry')).toBe('Poultry');
    expect(healthBridge.mapAnimalType('plant')).toBeNull();
  });

  test('loadHealthContext for plant is not applicable', async () => {
    const ctx = await healthBridge.loadHealthContext('plant');
    expect(ctx.applicable).toBe(false);
    expect(ctx.examinations).toEqual([]);
  });

  test('loadHealthContext for cow pulls examinations/outbreaks/quarantines', async () => {
    animalHealthService.listExaminations.mockResolvedValue({
      rows: [
        {
          id: 'ex1',
          animal_type: 'Cattle',
          examination_date: '2026-09-01',
          findings: 'Mild mastitis right rear quarter',
          health_status: 'Watch',
        },
      ],
    });
    animalHealthService.listOutbreaks.mockResolvedValue({ rows: [] });
    animalHealthService.listQuarantines.mockResolvedValue({ rows: [] });

    const ctx = await healthBridge.loadHealthContext('cow');

    expect(ctx.applicable).toBe(true);
    expect(ctx.animalType).toBe('Cattle');
    expect(ctx.examinations).toHaveLength(1);
    expect(ctx.summaryText).toMatch(/mastitis/i);
    expect(ctx.provenance['clinic.healthContext.examinations'].source).toBe('db');
    expect(animalHealthService.listExaminations).toHaveBeenCalledWith(
      expect.objectContaining({ animal_type: 'Cattle' }),
    );
  });

  test('loadHealthContext records unavailable when AH service throws', async () => {
    animalHealthService.listExaminations.mockRejectedValue(new Error('relation does not exist'));
    animalHealthService.listOutbreaks.mockRejectedValue(new Error('relation does not exist'));
    animalHealthService.listQuarantines.mockRejectedValue(new Error('relation does not exist'));

    const ctx = await healthBridge.loadHealthContext('goat');

    expect(ctx.applicable).toBe(true);
    expect(ctx.examinations).toEqual([]);
    expect(ctx.provenance['clinic.healthContext.examinations'].source).toBe('unavailable');
  });
});

describe('Multitask — both bridges in parallel', () => {
  test('MEP preview and health context resolve together', async () => {
    animalHealthService.listExaminations.mockResolvedValue({ rows: [] });
    animalHealthService.listOutbreaks.mockResolvedValue({ rows: [] });
    animalHealthService.listQuarantines.mockResolvedValue({ rows: [] });

    const [boq, health] = await Promise.all([
      Promise.resolve(mepBoqBridge.previewBoqFromMep('dairy')),
      healthBridge.loadHealthContext('cow'),
    ]);

    expect(boq.items.some((i) => /milk/i.test(i.description))).toBe(true);
    expect(health.animalType).toBe('Cattle');
  });
});
