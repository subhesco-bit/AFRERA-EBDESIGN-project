/**
 * AI Feedback Service
 * Tracks user feedback on AI responses for continuous learning
 */

const { getPostgreSQL } = require('../database/connection');

class AIFeedbackService {
  constructor() {
    this.pool = null;
  }

  async getPool() {
    if (!this.pool) {
      this.pool = await getPostgreSQL();
    }
    return this.pool;
  }

  /**
   * Record user feedback on AI response
   */
  async recordFeedback(feedbackData) {
    try {
      const pool = await this.getPool();
      const {
        sessionId,
        userId,
        aiResponseId,
        feedbackType,
        feedbackRating,
        feedbackText,
        contextData
      } = feedbackData;

      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const query = `
        INSERT INTO ai_feedback (id, session_id, user_id, ai_response_id, feedback_type, feedback_rating, feedback_text, context_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          feedback_type = EXCLUDED.feedback_type,
          feedback_rating = EXCLUDED.feedback_rating,
          feedback_text = EXCLUDED.feedback_text,
          context_data = EXCLUDED.context_data,
          updated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(query, [
        feedbackId,
        sessionId,
        userId,
        aiResponseId,
        feedbackType,
        feedbackRating,
        feedbackText,
        JSON.stringify(contextData || {})
      ]);

      // Update learning metrics
      await this.updateLearningMetrics(feedbackType, feedbackRating);

      return {
        success: true,
        feedbackId,
        message: 'Feedback recorded successfully'
      };
    } catch (error) {
      console.error('Error recording AI feedback:', error);
      throw new Error('Failed to record feedback');
    }
  }

  /**
   * Update learning metrics based on feedback
   */
  async updateLearningMetrics(feedbackType, rating) {
    try {
      let pool = await this.getPool();
      const metricId = `metric_${feedbackType}_${Date.now()}`;

      let query = `
        INSERT INTO ai_learning_metrics (id, metric_type, metric_value, metric_count, metadata)
        VALUES ($1, $2, $3, 1, $4)
        ON CONFLICT (metric_type) DO UPDATE SET
          metric_value = (ai_learning_metrics.metric_value * ai_learning_metrics.metric_count + $3) / (ai_learning_metrics.metric_count + 1),
          metric_count = ai_learning_metrics.metric_count + 1,
          calculated_at = CURRENT_TIMESTAMP
      `;

      await pool.query(query, [
        metricId,
        feedbackType,
        rating || 3,
        JSON.stringify({ last_updated: new Date().toISOString() })
      ]);
    } catch (error) {
      console.error('Error updating learning metrics:', error);
    }
  }

  /**
   * Get feedback statistics for a session
   */
  async getSessionFeedbackStats(sessionId) {
    try {
      let pool = await this.getPool();
      let query = `
        SELECT 
          feedback_type,
          COUNT(*) as count,
          AVG(feedback_rating) as avg_rating
        FROM ai_feedback
        WHERE session_id = $1
        GROUP BY feedback_type
      `;

      const result = await pool.query(query, [sessionId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting session feedback stats:', error);
      return [];
    }
  }

  /**
   * Get overall AI performance metrics
   */
  async getOverallMetrics() {
    try {
      let pool = await this.getPool();
      let query = `
        SELECT 
          metric_type,
          metric_value,
          metric_count,
          calculated_at
        FROM ai_learning_metrics
        ORDER BY calculated_at DESC
        LIMIT 20
      `;

      let result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting overall metrics:', error);
      return [];
    }
  }

  /**
   * Identify patterns in negative feedback
   */
  async analyzeNegativeFeedback() {
    try {
      let pool = await this.getPool();
      let query = `
        SELECT 
          feedback_type,
          COUNT(*) as count,
          AVG(feedback_rating) as avg_rating
        FROM ai_feedback
        WHERE feedback_type IN ('not_helpful', 'needs_improvement', 'inaccurate')
          AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY feedback_type
        ORDER BY count DESC
      `;

      let result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error analyzing negative feedback:', error);
      return [];
    }
  }

  /**
   * Generate improvement suggestions based on feedback
   */
  async generateImprovementSuggestions() {
    try {
      const negativePatterns = await this.analyzeNegativeFeedback();
      const suggestions = [];

      negativePatterns.forEach(pattern => {
        if (pattern.count > 10 && pattern.avg_rating < 2.5) {
          suggestions.push({
            type: pattern.feedback_type,
            priority: 'high',
            suggestion: `Significant negative feedback detected for ${pattern.feedback_type}. Consider reviewing response patterns and adjusting AI behavior.`,
            affectedResponses: pattern.count
          });
        } else if (pattern.count > 5 && pattern.avg_rating < 3.0) {
          suggestions.push({
            type: pattern.feedback_type,
            priority: 'medium',
            suggestion: `Moderate negative feedback for ${pattern.feedback_type}. Monitor this pattern closely.`,
            affectedResponses: pattern.count
          });
        }
      });

      return suggestions;
    } catch (error) {
      console.error('Error generating improvement suggestions:', error);
      return [];
    }
  }
}

module.exports = new AIFeedbackService();