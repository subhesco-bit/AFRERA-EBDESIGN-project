const fs = require('fs');
const path = require('path');

describe('AI production truth paths', () => {
  it('specialist gateway returns explicit unimplemented crop prediction instead of fabricated yield', async () => {
    const gateway = require('../services/ai/aiGatewayService');
    const result = await gateway.predict('crop_yield', { crop_type: 'rice' });
    expect(result.implemented).toBe(false);
    expect(result.predicted_yield).toBeNull();
    expect(result.confidence).toBeNull();
    expect(result.status).toBe('not_implemented');
  });

  it('fertilizer gateway never emits a hard-coded product or dosage without a governed provider', async () => {
    const gateway = require('../services/ai/aiGatewayService');
    const result = await gateway.recommend('fertilizer', { crop_type: 'rice' });
    expect(result.fertilizer_type).toBeNull();
    expect(result.application_rate).toBeNull();
    expect(result.confidence).toBeNull();
    expect(['not_configured','generated_advisory']).toContain(result.status);
  });

  it('agricultural helper functions fail closed when specialist evidence is unavailable', () => {
    const agri = require('../services/agriculture/agriculturalIntelligenceService');
    expect(agri.generateFertilizerRecommendations({ implemented:false, nutrient_levels:{ nitrogen:10 } })).toEqual([]);
    expect(agri.generateIrrigationRecommendations({ implemented:false, soil_health_score:20 })).toEqual([]);
    expect(agri.generatePestPreventiveMeasures({ implemented:false })).toEqual([]);
    const treatment = agri.generatePestTreatmentRecommendations({ implemented:false });
    expect(treatment.status).toBe('unavailable');
    expect(treatment.requiresQualifiedReview).toBe(true);
  });

  it('legacy specialist gateway runtime is quarantined behind the sanitized canonical adapter', () => {
    const current = require('../services/ai/aiGatewayService');
    const legacy = require('../services/legacy/aiGatewayService');
    expect(legacy).toBe(current);
  });

  it('does not leave canned transcription text in reachable voice implementations', () => {
    const files = [
      path.resolve(__dirname,'../services/advancedVoiceAI.js'),
      path.resolve(__dirname,'../services/ai/advancedVoiceAI.js'),
      path.resolve(__dirname,'../services/ai/omnichannelAIService.js'),
      path.resolve(__dirname,'../services/legacy/omnichannelAIService.js'),
    ];
    for (const file of files) {
      const src = fs.readFileSync(file,'utf8');
      expect(src).not.toMatch(/mock transcription of the audio content/i);
      expect(src).not.toMatch(/What is the current price of rice in the local market\?/i);
    }
  });

  it('uses the correct relative market-price truth import in both voice service locations', () => {
    const top = fs.readFileSync(path.resolve(__dirname,'../services/advancedVoiceAI.js'),'utf8');
    const nested = fs.readFileSync(path.resolve(__dirname,'../services/ai/advancedVoiceAI.js'),'utf8');
    expect(top).toContain("require('./commerce/marketPriceTruthService')");
    expect(nested).toContain("require('../commerce/marketPriceTruthService')");
  });

  it('alternate advisory scaffold contains no placeholder database query', () => {
    const src = fs.readFileSync(path.resolve(__dirname,'../services/ai/aiAdvisoryService.js'),'utf8');
    expect(src).not.toMatch(/_placeholder/);
    expect(src).toContain("storage: 'ephemeral_in_memory'");
  });
});
