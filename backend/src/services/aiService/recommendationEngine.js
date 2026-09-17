/**
 * Personalized (collaborative/content/context) recommendation engine. Split
 * out of the former monolithic services/aiService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL, getMongoDatabase } = require('../../database/connection');

/**
 * Generate personalized recommendations
 */
async function generateRecommendations(userId, context = {}) {
  try {
    const pg = getPostgreSQL();
    const mongo = getMongoDatabase();

    // Get user's purchase history
    const historyQuery = `
      SELECT
        p.category_id,
        p.state_id,
        COUNT(*) as purchase_count,
        AVG(oi.price) as avg_spent
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY p.category_id, p.state_id
      ORDER BY purchase_count DESC
      LIMIT 10
    `;

    const historyData = await pg.query(historyQuery, [userId]);

    // Get collaborative filtering recommendations
    const collaborativeRecs = await getCollaborativeRecommendations(userId, historyData.rows);

    // Get content-based recommendations
    const contentRecs = await getContentBasedRecommendations(historyData.rows);

    // Get context-aware recommendations
    const contextRecs = await getContextualRecommendations(context);

    // Combine and rank recommendations
    const recommendations = combineRecommendations(
      collaborativeRecs,
      contentRecs,
      contextRecs
    );

    logger.info(`Generated ${recommendations.length} recommendations for user ${userId}`);

    return {
      user_id: userId,
      recommendations: recommendations.slice(0, 20), // Top 20
      categories: {
        collaborative: collaborativeRecs.length,
        content_based: contentRecs.length,
        contextual: contextRecs.length
      },
      explanation: generateRecommendationExplanation(recommendations)
    };
  } catch (error) {
    logger.error('Error generating recommendations', { error: error.message, stack: error.stack });
    throw error;
  }
}

async function getCollaborativeRecommendations(userId, history) {
  // Not implemented - honestly returns no recommendations from this
  // source rather than fabricating any.
  return [];
}

async function getContentBasedRecommendations(history) {
  // Not implemented - honestly returns no recommendations from this
  // source rather than fabricating any.
  return [];
}

async function getContextualRecommendations(context) {
  // Not implemented - honestly returns no recommendations from this
  // source rather than fabricating any.
  return [];
}

function combineRecommendations(collaborative, content, contextual) {
  // Combine and rank recommendations from different sources
  return [...collaborative, ...content, ...contextual];
}

function generateRecommendationExplanation(recommendations) {
  // All three source functions above are unimplemented stubs that always
  // return [] - this used to unconditionally claim "based on your
  // purchase history, similar users, and current market conditions"
  // regardless, which is never true yet (recommendations is always empty).
  if (recommendations.length === 0) {
    return 'No personalized recommendations are available yet - collaborative, content-based, and contextual recommendation sources are not implemented.';
  }
  return 'Recommendations based on your purchase history, similar users, and current market conditions.';
}

module.exports = {
  generateRecommendations,
  getCollaborativeRecommendations,
  getContentBasedRecommendations,
  getContextualRecommendations,
  combineRecommendations,
  generateRecommendationExplanation
};
