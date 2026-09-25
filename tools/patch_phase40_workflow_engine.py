from pathlib import Path

p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\flows\workflowEngine.js')
t=p.read_text(encoding='utf-8')

if "randomUUID" not in t:
    t=t.replace("'use strict';", "'use strict';\n\nconst { randomUUID } = require('crypto');\nconst { workflowRegistry: defaultWorkflowRegistry } = require('../../core/workflowDefinitionRegistry');", 1)

t=t.replace(
    "class WorkflowEngine {\n  constructor() {\n    this.workflows = new Map();",
    "class WorkflowEngine {\n  constructor(options = {}) {\n    this.registry = options.registry || defaultWorkflowRegistry;\n    this.workflows = new Map();"
)

old="""  registerWorkflow(workflowId, definition) {
    this.workflows.set(workflowId, {
      id: workflowId,
      name: definition.name,
      description: definition.description,
      steps: definition.steps, // [{id, type, config, compensation}]
      triggers: definition.triggers || [],
      createdAt: new Date(),
    });
    return this.workflows.get(workflowId);
  }"""
new="""  registerWorkflow(workflowId, definition) {
    const governed = this.registry.register(workflowId, {
      ...definition,
      source: definition.source || 'runtime',
    });
    this.workflows.set(workflowId, {
      ...governed,
      createdAt: new Date(),
    });
    return this.workflows.get(workflowId);
  }"""
if old not in t: raise RuntimeError('registerWorkflow block not found')
t=t.replace(old,new)

t=t.replace('const executionId = `EXEC-${workflowId}-${Date.now()}`;', 'const executionId = `EXEC-${workflowId}-${randomUUID()}`;')
t=t.replace("      error: null,\n    };", "      error: null,\n      compensations: [],\n    };", 1)
t=t.replace("          await this._compensate(workflow.steps.slice(0, i).reverse(), context);", "          execution.compensations = await this._compensate(workflow.steps.slice(0, i).reverse(), context);")
t=t.replace("      await this._compensate(workflow.steps.reverse(), context);", "      execution.compensations = await this._compensate([...workflow.steps].reverse(), context);")

old2="""  async _compensate(reversedSteps, context) {
    for (const step of reversedSteps) {
      if (!step.compensation) continue;

      try {
        const handler = this.stepHandlers.get(step.compensation.type);
        if (handler) {
          await handler(context, step.compensation.config);
        }
      } catch (e) {
        console.error(`Compensation failed for step ${step.id}:`, e);
        // Continue with other compensations even if one fails
      }
    }
  }"""
new2="""  async _compensate(reversedSteps, context) {
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
  }"""
if old2 not in t: raise RuntimeError('compensate block not found')
t=t.replace(old2,new2)
p.write_text(t,encoding='utf-8')
print('workflowEngine governed')
