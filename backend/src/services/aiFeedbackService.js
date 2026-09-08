'use strict';

const { getPostgreSQL } = require('../database/connection');

async function recordFeedback(feedbackData = {}) {
  const {
    userId,
    sessionId,
    feedbackType,
    feedbackRating,
    comment,
    requestId
  } = feedbackData;

  if (!feedbackType || !Number.isInteger(Number(feedbackRating))
    || Number(feedbackRating) < 1 || Number(feedbackRating) > 5) {
    throw new Error('feedbackType and a rating from 1 to 5 are required');
  }

  const result = await getPostgreSQL().query(
    `INSERT INTO ai_response_feedback
      (user_id, session_id, request_id, feedback_type, rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, created_at`,
    [userId || null, sessionId || null, requestId || null, feedbackType,
      Number(feedbackRating), comment || null]
  );
  return { success: true, feedback: result.rows[0] };
}

async function getOverallMetrics() {
  const result = await getPostgreSQL().query(
    `SELECT feedback_type, COUNT(*)::int AS total,
            ROUND(AVG(rating)::numeric, 2)::float AS average_rating
       FROM ai_response_feedback
      GROUP BY feedback_type
      ORDER BY feedback_type`
  );
  return result.rows;
}

async function generateImprovementSuggestions() {
  const metrics = await getOverallMetrics();
  return metrics
    .filter(metric => metric.average_rating < 3)
    .map(metric => `Review ${metric.feedback_type} responses (average rating ${metric.average_rating})`);
}

module.exports = { recordFeedback, getOverallMetrics, generateImprovementSuggestions };
