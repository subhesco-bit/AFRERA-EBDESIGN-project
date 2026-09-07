const logger = require('../utils/logger');
const claudeAICoordinator = require('../core/claudeAICoordinator');

/**
 * Previously this service returned hardcoded canned data (a fixed
 * Rice/Wheat/Corn list, static guidance text, a random market price) while
 * claiming to be an AI-driven crop advisory - it never called any AI layer.
 * It now routes through claudeAICoordinator (the same coordinator/agent
 * used by the mounted /api/v1/ai/* routes, agent 'farmer-advisor', whose
 * documented capabilities already include crop recommendations, guidance,
 * and market timing). The static data below is kept ONLY as a last-resort
 * fallback for when the AI call fails (e.g. ANTHROPIC_API_KEY not
 * configured, a known current platform gap - see CLAUDE.md), so callers
 * always get a response instead of a 500, but a `source` field on every
 * response tells the caller whether it's real AI output or the fallback.
 */
class CropRecommendationService {
  async recommendCrops(farmerId, location, season) {
    const fallback = {
      farmer_id: farmerId,
      season,
      location,
      recommendations: [
        { crop: 'Rice', confidence: 0.92, roi: 25 },
        { crop: 'Wheat', confidence: 0.85, roi: 20 },
        { crop: 'Corn', confidence: 0.78, roi: 22 },
      ],
      source: 'fallback',
    };
    try {
      const query = `Recommend the best crops to plant for a farmer in ${location || 'Northeast India'} `
        + `for the ${season || 'current'} season. Consider local soil, climate, and market demand. `
        + `Respond with a short ranked list of crops, each with a confidence score (0-1) and expected ROI percent.`;
      const result = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'conversational',
        query,
        context: { location, season },
        userId: farmerId,
        sessionId: `crop-recommendation-${farmerId}`,
        agentPreference: 'farmer-advisor',
      });
      logger.info(`AI crop recommendations generated for farmer ${farmerId}`);
      return {
        farmer_id: farmerId, season, location,
        recommendations: result.response,
        agent: result.agent,
        source: 'ai',
      };
    } catch (error) {
      logger.error(`AI crop recommendation failed, using fallback: ${error.message}`);
      return fallback;
    }
  }

  async getCropGuidance(cropType, phase) {
    const staticGuidance = {
      preparation: 'Prepare soil 2 weeks before planting',
      planting: 'Sow seeds at recommended depth',
      growth: 'Monitor irrigation and nutrition',
      harvest: 'Pick at optimal ripeness',
    };
    const fallback = { crop: cropType, phase, guidance: staticGuidance[phase] || 'Standard care', source: 'fallback' };
    try {
      const query = `Give practical, specific ${phase || 'general'}-phase growing guidance for ${cropType} `
        + `suited to a smallholder farmer in Northeast India.`;
      const result = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'conversational',
        query,
        context: { cropType, phase },
        userId: 'anonymous',
        sessionId: `crop-guidance-${cropType}`,
        agentPreference: 'farmer-advisor',
      });
      return { crop: cropType, phase, guidance: result.response, agent: result.agent, source: 'ai' };
    } catch (error) {
      logger.error(`AI crop guidance failed, using fallback: ${error.message}`);
      return fallback;
    }
  }

  async getMarketOutlook(cropType) {
    const fallback = {
      crop: cropType,
      price_trend: 'unknown',
      demand: 'unknown',
      source: 'fallback',
      note: 'AI market outlook unavailable; no live market feed configured.',
    };
    try {
      const query = `Summarize the current market outlook (price trend, demand, and timing advice) for ${cropType} `
        + `for farmers selling in Northeast India.`;
      const result = await claudeAICoordinator.coordinateAIRequest({
        requestType: 'conversational',
        query,
        context: { cropType },
        userId: 'anonymous',
        sessionId: `crop-market-outlook-${cropType}`,
        agentPreference: 'farmer-advisor',
      });
      return { crop: cropType, outlook: result.response, agent: result.agent, source: 'ai' };
    } catch (error) {
      logger.error(`AI market outlook failed, using fallback: ${error.message}`);
      return fallback;
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
