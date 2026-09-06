/**
 * AI Feedback Service
 * Captures and processes feedback from AI operations
 */

class AIFeedbackService {
  constructor() {
    this.feedbackBuffer = [];
    this.maxBufferSize = 1000;
  }

  async initialize() {
    console.log('[AIFeedbackService] Initialized');
  }

  async recordFeedback(operationId, feedback) {
    this.feedbackBuffer.push({
      operationId,
      feedback,
      timestamp: new Date(),
    });

    if (this.feedbackBuffer.length > this.maxBufferSize) {
      this.feedbackBuffer.shift();
    }

    return true;
  }

  async getFeedback(operationId) {
    return this.feedbackBuffer.filter(
      (f) => f.operationId === operationId
    );
  }

  async analyzeFeedback() {
    return {
      totalFeedbackCount: this.feedbackBuffer.length,
      feedbackItems: this.feedbackBuffer.slice(-10),
    };
  }

  async init() {
    return this.initialize();
  }
}

module.exports = new AIFeedbackService();
