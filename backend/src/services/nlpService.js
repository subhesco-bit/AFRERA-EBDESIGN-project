const db = require('../database/dbConnection');
const logger = require('../utils/logger');
class NLPService {
  async analyzeText(text) {
    try { const id = require('uuid').v4(); const sentiment = text.length > 0 ? 'positive' : 'neutral'; await db('nlp_analyses').insert({ id, text, sentiment, created_at: new Date() }); return { analysis_id: id, sentiment }; }
    catch (error) { logger.error('Analyze text failed'); throw error; }
  }
}
module.exports = new NLPService();
