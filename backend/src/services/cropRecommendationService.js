const { logger } = require('../utils/logger');
const claudeAICoordinator = require('../core/claudeAICoordinator');

// Previously returned hardcoded canned data (a fixed Rice/Wheat/Corn list
// with fabricated confidence scores, static guidance strings, and a
// Math.random()-generated market price) while presenting itself as AI-driven
// crop advisory. Now routes through the real Claude AI coordinator
// (agent 'farmer-advisor') and falls back to labeled static data - never a
// fabricated number - only when the AI call fails (e.g. ANTHROPIC_API_KEY
// not configured). See __tests__/cropRecommendationService.test.js for the
// exact contract this implements.
class CropRecommendationService {
  async recommendCrops(farmerId, location, season) {
    try {
      const result = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'conversational',
        query: `Recommend the best crops to plant in ${location} for the ${season} season, with expected ROI for each.`,
        agentPreference: 'farmer-advisor',
        userId: farmerId,
        context: { location, season },
      });
      return {
        farmer_id: farmerId, season, location,
        recommendations: result.response,
        source: 'ai',
      };
    } catch (error) {
      logger.warn(`AI crop recommendation unavailable, using static fallback: ${error.message}`);
      return {
        farmer_id: farmerId, season, location,
        recommendations: [
          { crop: 'Rice' },
          { crop: 'Wheat' },
          { crop: 'Corn' },
        ],
        source: 'fallback',
      };
    }
  }

  async getCropGuidance(cropType, phase) {
    const staticGuidance = {
      preparation: 'Prepare soil 2 weeks before planting',
      planting: 'Sow seeds at recommended depth',
      growth: 'Monitor irrigation and nutrition',
      harvest: 'Pick at optimal ripeness',
    };

    try {
      const result = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'conversational',
        query: `Provide ${phase}-stage growing guidance for ${cropType}.`,
        agentPreference: 'farmer-advisor',
        context: { cropType, phase },
      });
      return { crop: cropType, phase, guidance: result.response, source: 'ai' };
    } catch (error) {
      logger.warn(`AI crop guidance unavailable, using static fallback: ${error.message}`);
      return {
        crop: cropType, phase,
        guidance: staticGuidance[phase] || 'Standard care',
        source: 'fallback',
      };
    }
  }

  async getMarketOutlook(cropType) {
    try {
      const result = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'conversational',
        query: `Summarize the current market demand and price trend outlook for ${cropType}.`,
        agentPreference: 'farmer-advisor',
        context: { cropType },
      });
      return { crop: cropType, outlook: result.response, source: 'ai' };
    } catch (error) {
      // Deliberately no expected_price / price_trend / demand fields here -
      // there is no real market-price data source wired in yet, and a
      // fabricated number is worse than no number.
      logger.warn(`AI market outlook unavailable, no price data to fall back to: ${error.message}`);
      return { crop: cropType, source: 'fallback' };
    }
  }

  async calculateROI(crop, inputs) {
    try {
      const roi = ((inputs.expected_yield * inputs.expected_price) - inputs.input_cost) / inputs.input_cost * 100;
      return { crop, roi: Math.round(roi), profitability: roi > 20 ? 'high' : 'moderate' };
    } catch (error) { logger.error(`ROI calc failed: ${error.message}`); throw error; }
  }
}

module.exports = new CropRecommendationService();
