jest.mock('../services/legacy/nutritionIntelligenceService', () => ({
  searchFoodProfiles: jest.fn(),
}));

const nutritionService = require('../services/legacy/nutritionIntelligenceService');
const recipeService = require('../services/legacy/recipeIntelligenceService');

describe('verified recipe nutrition', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calculates from the matched food profile and includes provenance', async () => {
    nutritionService.searchFoodProfiles.mockResolvedValue([
      { id: 'food-rice', food_name: 'Rice', nutrition_data: { CAL: 130, PRO: 2.7, CARB: 28, FAT: 0.3, FIB: 0.4 } },
    ]);

    const result = await recipeService.calculateRecipeNutrition([
      { name: 'Rice', quantityGrams: 200, unit: 'g' },
    ], 2);

    expect(result.calories).toBe(130);
    expect(result.protein).toBe(3);
    expect(result.provenance).toContain('food_nutrition_profiles');
    expect(result.sources[0].profileId).toBe('food-rice');
  });

  test('rejects ingredients without verified composition data', async () => {
    nutritionService.searchFoodProfiles.mockResolvedValue([]);

    await expect(recipeService.calculateRecipeNutrition([
      { name: 'Unknown crop', quantityGrams: 100, unit: 'g' },
    ], 1)).rejects.toMatchObject({ code: 'VERIFIED_NUTRITION_DATA_REQUIRED' });
  });
});
