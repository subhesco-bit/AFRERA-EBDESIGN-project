const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class AutomationService {
  async triggerWorkflow(workflowId, params) {
    try {
      const id = require('uuid').v4();
      await db('automation_logs').insert({
        id, workflow_id: workflowId, params: JSON.stringify(params), status: 'executed', created_at: new Date()
      });
      logger.info(`Workflow triggered: ${workflowId}`);
      return { execution_id: id, workflow_id: workflowId, status: 'executed' };
    } catch (error) { logger.error(`Trigger workflow failed: ${error.message}`); throw error; }
  }
}

module.exports = new AutomationService();
