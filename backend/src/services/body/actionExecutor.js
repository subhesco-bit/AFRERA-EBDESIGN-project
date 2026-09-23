/**
 * Action Executor - Queue & Execute Actions with History
 * Enables system-wide action queuing, execution, and tracking
 */

'use strict';

class ActionExecutor {
  constructor() {
    this.actions = new Map();
    this.queue = [];
    this.executing = false;
    this.history = [];
  }

  registerAction(actionId, config) {
    this.actions.set(actionId, {
      id: actionId,
      name: config.name || actionId,
      handler: config.handler,
      timeout: config.timeout || 5000,
      retryable: config.retryable !== false,
      compensation: config.compensation || null,
      createdAt: new Date(),
    });
    return this.actions.get(actionId);
  }

  async execute(actionId, context, options = {}) {
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Action ${actionId} not found`);

    const executionId = `EXEC-${actionId}-${Date.now()}`;
    const execution = {
      id: executionId,
      actionId,
      status: 'queued',
      context,
      startTime: null,
      endTime: null,
      result: null,
      error: null,
      queuedAt: new Date(),
    };

    this.queue.push(execution);
    if (!this.executing && !options.defer) {
      await this._processQueue();
    }

    return executionId;
  }

  async _processQueue() {
    if (this.executing || this.queue.length === 0) return;
    this.executing = true;

    while (this.queue.length > 0) {
      const execution = this.queue.shift();
      const action = this.actions.get(execution.actionId);

      try {
        execution.status = 'running';
        execution.startTime = new Date();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), action.timeout)
        );

        const result = await Promise.race([
          action.handler(execution.context),
          timeoutPromise,
        ]);

        execution.status = 'completed';
        execution.result = result;
      } catch (e) {
        execution.status = 'failed';
        execution.error = e.message;

        if (action.compensation && action.retryable) {
          try {
            await action.compensation(execution.context);
          } catch (compError) {
            console.error(`Compensation failed: ${compError.message}`);
          }
        }
      }

      execution.endTime = new Date();
      this.history.push(execution);

      if (this.history.length > 100) this.history.shift();
    }

    this.executing = false;
  }

  getExecution(executionId) {
    return this.history.find(e => e.id === executionId) || null;
  }

  getHistory(actionId, limit = 20) {
    const filtered = this.history.filter(e => e.actionId === actionId);
    return filtered.slice(-limit);
  }

  getStats() {
    const completed = this.history.filter(e => e.status === 'completed').length;
    const failed = this.history.filter(e => e.status === 'failed').length;
    return {
      total: this.history.length,
      completed,
      failed,
      successRate: this.history.length > 0 ? (completed / this.history.length) * 100 : 0,
      queued: this.queue.length,
    };
  }
}

module.exports = { ActionExecutor };
