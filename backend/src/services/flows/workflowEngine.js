/**
 * Workflow Engine - Multi-Step Process Execution
 *
 * Executes complex workflows with branching, compensation, and rollback.
 * From pine-shadow: flows/catalog.ts, flows/run.ts
 */

'use strict';

const { randomUUID } = require('crypto');
const { workflowRegistry: defaultWorkflowRegistry } = require('../../core/workflowDefinitionRegistry');

class WorkflowEngine {
  constructor(options = {}) {
    this.registry = options.registry || defaultWorkflowRegistry;
    this.workflows = new Map();      // workflowId → definition
    this.executions = new Map();     // executionId → execution record
    this.stepHandlers = new Map();   // stepType → handler function
  }

  /**
   * Register a workflow definition
   */
  registerWorkflow(workflowId, definition) {
    const governed = this.registry.register(workflowId, {
      ...definition,
      source: definition.source || 'runtime',
    });
    this.workflows.set(workflowId, {
      ...governed,
      createdAt: new Date(),
    });
    return this.workflows.get(workflowId);
  }

  /**
   * Register a step handler (executor for a step type)
   */
  registerStepHandler(stepType, handler) {
    this.stepHandlers.set(stepType, handler);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, context) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = `EXEC-${workflowId}-${randomUUID()}`;
    const execution = {
      id: executionId,
      workflowId,
      status: 'running',
      context,
      steps: [],
      startedAt: new Date(),
      completedAt: null,
      error: null,
      compensations: [],
    };

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepExecution = await this._executeStep(step, context);

        execution.steps.push(stepExecution);
        context = {...context, ...stepExecution.output}; // Carry forward output

        if (stepExecution.status === 'failed') {
          // Compensation logic
          execution.compensations = await this._compensate(workflow.steps.slice(0, i).reverse(), context);
          execution.status = 'failed';
          execution.error = stepExecution.error;
          break;
        }
      }

      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }
    } catch (e) {
      execution.status = 'failed';
      execution.error = e.message;
      // Attempt compensation
      execution.compensations = await this._compensate([...workflow.steps].reverse(), context);
    }

    execution.completedAt = new Date();
    this.executions.set(executionId, execution);
    return execution;
  }

  /**
   * Execute a single step
   */
  async _executeStep(step, context) {
    const handler = this.stepHandlers.get(step.type);
    if (!handler) {
      return {
        stepId: step.id,
        type: step.type,
        status: 'failed',
        error: `No handler for step type ${step.type}`,
        timestamp: new Date(),
      };
    }

    try {
      const startTime = Date.now();
      const output = await handler(context, step.config);
      const duration = Date.now() - startTime;

      return {
        stepId: step.id,
        type: step.type,
        status: 'completed',
        output,
        duration,
        timestamp: new Date(),
      };
    } catch (e) {
      return {
        stepId: step.id,
        type: step.type,
        status: 'failed',
        error: e.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Compensation (rollback) logic
   */
  async _compensate(reversedSteps, context) {
    const outcomes = [];
    for (const step of reversedSteps) {
      if (!step.compensation) continue;
      const record = { stepId: step.id, type: step.compensation.type, status: 'skipped', error: null };
      try {
        const handler = this.stepHandlers.get(step.compensation.type);
        if (handler) {
          record.output = await handler(context, step.compensation.config);
          record.status = 'completed';
        } else {
          record.error = 'No handler for compensation type ' + step.compensation.type;
        }
      } catch (e) {
        record.status = 'failed';
        record.error = e.message;
        console.error(`Compensation failed for step ${step.id}:`, e);
      }
      outcomes.push(record);
    }
    return outcomes;
  }

  /**
   * Get execution status
   */
  getExecution(executionId) {
    return this.executions.get(executionId) || null;
  }

  /**
   * List all executions for a workflow
   */
  listExecutions(workflowId, limit = 10) {
    const executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);

    return {
      advisory: true,
      workflowId,
      executions,
      count: executions.length,
    };
  }

  /**
   * Get workflow analytics
   */
  getAnalytics(workflowId) {
    const execs = Array.from(this.executions.values())
      .filter(e => e.workflowId === workflowId);

    if (execs.length === 0) {
      return { workflowId, executions: 0 };
    }

    const completed = execs.filter(e => e.status === 'completed').length;
    const failed = execs.filter(e => e.status === 'failed').length;
    const avgDuration = execs.reduce((sum, e) => sum + (e.completedAt - e.startedAt), 0) / execs.length;

    return {
      advisory: true,
      workflowId,
      totalExecutions: execs.length,
      completed,
      failed,
      successRate: (completed / execs.length) * 100,
      averageDuration: avgDuration,
      basis: 'Execution history analysis',
    };
  }
}

module.exports = { WorkflowEngine };
