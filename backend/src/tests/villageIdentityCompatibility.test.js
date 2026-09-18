jest.mock('../database/pool', () => ({ query: jest.fn() }));
jest.mock('../core/claudeAICoordinator', () => ({}));

const pool = require('../database/pool');
const { normalizeVillageId } = require('../modules/M041/identifiers');
const villageUUID = '31440cc6-d080-48a5-9429-19d4bce84442';

describe('village identifier compatibility', () => {
  test.each([villageUUID, villageUUID.toUpperCase()])('preserves UUID %s without numeric conversion', value => {
    expect(normalizeVillageId(value)).toBe(value);
  });
  test.each([41, '41'])('retains a legacy numeric village ID %s', value => {
    expect(normalizeVillageId(value)).toBe(41);
  });
  test.each([null, undefined, true, {}, [], 0, -1, '1e3', '9007199254740993', '-'.repeat(36)])(
    'rejects ambiguous or invalid identity %j', value => {
      expect(() => normalizeVillageId(value)).toThrow('Valid village id');
    },
  );
});

describe.each([
  ['village registry', require('../modules/M041/service').getVillageProfile],
  ['completeness', require('../modules/M041/villageCompletenessService').getCompleteness],
  ['production potential', require('../modules/M041/villageProductionPotentialService').productionPotential],
  ['project intelligence', require('../modules/M041/villageProjectIntelligenceService').listProjects],
  ['geography', require('../modules/M041/villageEconomyGeoService').getVillageGeo],
  ['external supply', require('../modules/M041/villageExternalSupplyService').supplyPlan],
  ['household ERP', require('../modules/M041/villageERPService').listHouseholds],
])('%s database identity boundary', (_name, operation) => {
  beforeEach(() => pool.query.mockReset());

  test('passes a canonical UUID unchanged to the database', async () => {
    const databaseError = new Error('Database boundary reached');
    pool.query.mockRejectedValueOnce(databaseError);
    await expect(operation(villageUUID)).rejects.toBe(databaseError);
    expect(pool.query.mock.calls[0][1]).toContain(villageUUID);
  });

  test('rejects invalid identity before any database operation', async () => {
    await expect(operation('invalid-id')).rejects.toThrow('Valid village id');
    expect(pool.query).not.toHaveBeenCalled();
  });
});
