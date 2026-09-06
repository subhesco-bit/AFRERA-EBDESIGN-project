const decisionService = require('../services/supplyChainDecisionService');

describe('supply-chain decision service', () => {
  test('filters ineligible farmers before ranking eligible candidates', () => {
    const result = decisionService.selectFarmers([
      { farmer: 'wrong-region', region: 'south', availableQuantityKg: 100, qualityGrade: 'A', certifications: ['organic'] },
      { farmer: 'eligible', region: 'assam', availableQuantityKg: 200, qualityGrade: 'A', certifications: ['organic'], fulfillmentRate: 95, qualityScore: 90, pricePerKg: 20, distanceKm: 10, fdiScore: 80 },
    ], { quantityKg: 100, region: 'assam', qualityGrade: 'A', requiredCertification: 'organic' });

    expect(result.status).toBe('ranked');
    expect(result.ranked).toHaveLength(1);
    expect(result.ranked[0].farmer.farmer).toBe('eligible');
    expect(result.explainability.aiMayNotOverrideEligibility).toBe(true);
  });

  test('never selects a vehicle that violates capacity or temperature constraints', () => {
    const result = decisionService.planDelivery({
      origin: 'Assam',
      destination: 'Guwahati',
      constraints: { weightKg: 1000, temperatureRangeC: [2, 8] },
      vehicles: [
        { id: 'unsafe', capacityKg: 5000, minTemperatureC: 10, maxTemperatureC: 20 },
        { id: 'safe', capacityKg: 1500, minTemperatureC: 0, maxTemperatureC: 10 },
      ],
    });

    expect(result.selectedVehicle.id).toBe('safe');
    expect(result.explainability.aiMayNotOverrideFeasibility).toBe(true);
  });
});
