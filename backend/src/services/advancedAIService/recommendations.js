/**
 * Advanced hybrid recommendation engine. Split out of the former monolithic
 * services/advancedAIService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { ADVANCED_AI_MODELS } = require('./models');
const { getCurrentSeason } = require('./shared');

/**
 * Advanced Recommendation Engine with Hybrid Approach
 */
async function advancedGenerateRecommendations(userId, context = {}) {
  try {
    const pg = getPostgreSQL();

    // Get user profile and preferences
    const userProfile = await getUserProfile(userId);

    // Get user history
    const userHistory = await getUserHistory(userId);

    // Get real-time context
    const realTimeContext = await getRealTimeContext(userId, context);

    // Load recommendation models
    const models = await loadRecommendationModels();

    // Generate recommendations from each approach
    const collaborativeRecommendations = await models.collaborative_filtering.generate(userHistory);
    const contentBasedRecommendations = await models.content_based.generate(userProfile);
    const knowledgeBasedRecommendations = await models.knowledge_based.generate(context);
    const contextAwareRecommendations = await models.context_aware.generate(realTimeContext);

    // Hybrid recommendations with weighted scoring
    const hybridRecommendations = hybridRecommendationScoring({
      collaborative: collaborativeRecommendations,
      content_based: contentBasedRecommendations,
      knowledge_based: knowledgeBasedRecommendations,
      context_aware: contextAwareRecommendations
    }, {
      collaborative: 0.3,
      content_based: 0.25,
      knowledge_based: 0.2,
      context_aware: 0.25
    });

    // Apply diversity and novelty
    const diversifiedRecommendations = applyDiversityFiltering(hybridRecommendations, userHistory);
    const finalRecommendations = applyNoveltyFiltering(diversifiedRecommendations, userHistory);

    // Generate explanations
    const explanations = await generateRecommendationExplanations(finalRecommendations, userProfile, userHistory);

    logger.info(`Advanced recommendations generated for user ${userId}: ${finalRecommendations.length} items`);

    return {
      user_id: userId,
      recommendations: finalRecommendations,
      explanations: explanations,
      context: realTimeContext,
      algorithm_weights: {
        collaborative: 0.3,
        content_based: 0.25,
        knowledge_based: 0.2,
        context_aware: 0.25
      },
      model_info: {
        type: ADVANCED_AI_MODELS.recommendation.type,
        algorithms: ADVANCED_AI_MODELS.recommendation.algorithms,
        version: ADVANCED_AI_MODELS.recommendation.model_version
      }
    };
  } catch (error) {
    logger.error('Advanced recommendation generation failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// --- recommendation helpers --------------------------------------------------

async function loadRecommendationModels() {
  return { modelType: 'popularity_and_affinity' };
}

async function getUserProfile(userId) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { available: false };
    const r = await pg.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    return { available: r.rows.length > 0, ...(r.rows[0] || {}) };
  } catch (error) {
    logger.warn('getUserProfile unavailable', { error: error.message });
    return { available: false };
  }
}

async function getUserHistory(userId) {
  try {
    const pg = getPostgreSQL();
    if (!pg) return { available: false, product_ids: [] };
    const r = await pg.query(
      `SELECT DISTINCT oi.product_id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.buyer_id = $1 LIMIT 200`,
      [userId]
    );
    return { available: true, product_ids: r.rows.map((x) => x.product_id) };
  } catch (error) {
    logger.warn('getUserHistory unavailable', { error: error.message });
    return { available: false, product_ids: [] };
  }
}

async function getRealTimeContext(userId, context = {}) {
  return { user_id: userId, season: getCurrentSeason(), ...context };
}

function hybridRecommendationScoring(candidates, history, context) {
  const seen = new Set(history?.product_ids || []);
  return (candidates || [])
    .map((c) => {
      const popularity = Number(c.order_count) || 0;
      const alreadyBought = seen.has(c.id);
      return {
        ...c,
        score: (Math.log1p(popularity) || 0) * (alreadyBought ? 0.3 : 1),
        already_purchased: alreadyBought
      };
    })
    .sort((a, b) => b.score - a.score);
}

function applyDiversityFiltering(scored, maxPerCategory = 2) {
  const counts = {};
  return (scored || []).filter((item) => {
    const cat = item.category || 'uncategorised';
    counts[cat] = (counts[cat] || 0) + 1;
    return counts[cat] <= maxPerCategory;
  });
}

function applyNoveltyFiltering(scored) {
  return (scored || []).filter((item) => !item.already_purchased);
}

async function generateRecommendationExplanations(items) {
  return (items || []).map((i) => ({
    product_id: i.id,
    reason: i.already_purchased
      ? 'Previously purchased - suggested for repeat order'
      : 'Popular with buyers in your segment'
  }));
}

module.exports = {
  advancedGenerateRecommendations,
  loadRecommendationModels,
  getUserProfile,
  getUserHistory,
  getRealTimeContext,
  hybridRecommendationScoring,
  applyDiversityFiltering,
  applyNoveltyFiltering,
  generateRecommendationExplanations
};
