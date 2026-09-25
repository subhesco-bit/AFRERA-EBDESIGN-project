'use strict';

const { logger } = require('../../utils/logger');

const OPERATORS = new Set(['eq','neq','gt','gte','lt','lte','in','not_in','contains','exists','between']);

function getPath(object, dotted) {
  if (!dotted) return undefined;
  return String(dotted).split('.').reduce((value, key) => value == null ? undefined : value[key], object);
}

function compare(actual, operator, expected) {
  switch (operator) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'gt': return Number(actual) > Number(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    case 'in': return Array.isArray(expected) && expected.includes(actual);
    case 'not_in': return Array.isArray(expected) && !expected.includes(actual);
    case 'contains': return Array.isArray(actual) ? actual.includes(expected) : String(actual ?? '').includes(String(expected));
    case 'exists': return expected === false ? actual == null : actual != null;
    case 'between': return Array.isArray(expected) && expected.length === 2 && Number(actual) >= Number(expected[0]) && Number(actual) <= Number(expected[1]);
    default: throw new Error('Unsupported rule operator: ' + operator);
  }
}

function validateCondition(node, path = 'conditions') {
  const errors = [];
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [path + ' must be an object'];
  const groups = ['all','any','not'].filter((key) => key in node);
  if (groups.length) {
    if (groups.length > 1) errors.push(path + ' may use only one of all/any/not');
    if ('all' in node || 'any' in node) {
      const key = 'all' in node ? 'all' : 'any';
      if (!Array.isArray(node[key]) || node[key].length === 0) errors.push(path + '.' + key + ' must be a non-empty array');
      else node[key].forEach((child, index) => errors.push(...validateCondition(child, path + '.' + key + '[' + index + ']')));
    } else if ('not' in node) errors.push(...validateCondition(node.not, path + '.not'));
    return errors;
  }
  if (!node.field || typeof node.field !== 'string') errors.push(path + '.field is required');
  if (!OPERATORS.has(node.operator)) errors.push(path + '.operator is invalid');
  if (node.operator !== 'exists' && !('value' in node)) errors.push(path + '.value is required');
  if (node.operator === 'between' && (!Array.isArray(node.value) || node.value.length !== 2)) errors.push(path + '.value must contain two bounds');
  return errors;
}

function evaluateCondition(node, context, trace = []) {
  if ('all' in node) {
    const children = node.all.map((child) => evaluateCondition(child, context, trace));
    return { passed: children.every((x) => x.passed), mode: 'all', children };
  }
  if ('any' in node) {
    const children = node.any.map((child) => evaluateCondition(child, context, trace));
    return { passed: children.some((x) => x.passed), mode: 'any', children };
  }
  if ('not' in node) {
    const child = evaluateCondition(node.not, context, trace);
    return { passed: !child.passed, mode: 'not', child };
  }
  const actual = getPath(context, node.field);
  const passed = compare(actual, node.operator, node.value);
  const result = { passed, field: node.field, operator: node.operator, expected: node.value, actual };
  trace.push(result);
  return result;
}

class RulesEngine {
  constructor(options = {}) {
    this.initialized = false;
    this.rules = new Map();
    this.actionHandlers = new Map();
    this.repository = options.repository || null;
  }

  async initialize(dependencies = {}) {
    this.repository = dependencies.ruleRepository || dependencies.repository || this.repository;
    if (this.repository && typeof this.repository.listRules === 'function') {
      const persisted = await this.repository.listRules({ enabled: true });
      for (const rule of persisted || []) this.registerRule(rule.code || rule.ruleCode, rule, { persist: false });
    }
    this.initialized = true;
    logger.info('RulesEngine initialized', { rules: this.rules.size, repository: Boolean(this.repository) });
    return this.health();
  }

  validateRule(ruleCode, definition = {}) {
    const errors = [];
    if (!ruleCode || typeof ruleCode !== 'string') errors.push('ruleCode is required');
    if (!definition.conditions) errors.push('conditions are required');
    else errors.push(...validateCondition(definition.conditions));
    if (definition.actions && !Array.isArray(definition.actions)) errors.push('actions must be an array');
    if (definition.priority != null && !Number.isFinite(Number(definition.priority))) errors.push('priority must be numeric');
    for (const key of ['effectiveFrom','effectiveTo']) {
      if (definition[key] && Number.isNaN(Date.parse(definition[key]))) errors.push(key + ' must be an ISO-compatible date');
    }
    if (definition.effectiveFrom && definition.effectiveTo && Date.parse(definition.effectiveFrom) > Date.parse(definition.effectiveTo)) errors.push('effectiveFrom must not exceed effectiveTo');
    return { valid: errors.length === 0, errors };
  }

  _normalize(ruleCode, definition = {}) {
    const result = this.validateRule(ruleCode, definition);
    if (!result.valid) {
      const error = new Error('Invalid rule ' + ruleCode + ': ' + result.errors.join('; '));
      error.code = 'RULE_DEFINITION_INVALID'; error.details = result.errors; throw error;
    }
    return {
      code: ruleCode,
      name: definition.name || ruleCode,
      category: definition.category || 'general',
      version: String(definition.version || '1.0.0'),
      enabled: definition.enabled !== false,
      priority: Number(definition.priority || 0),
      effectiveFrom: definition.effectiveFrom || null,
      effectiveTo: definition.effectiveTo || null,
      conditions: definition.conditions,
      actions: definition.actions || [],
      source: definition.source || 'runtime',
      metadata: definition.metadata || {},
    };
  }

  async registerRule(ruleCode, ruleDefinition, options = {}) {
    const normalized = this._normalize(ruleCode, ruleDefinition);
    this.rules.set(ruleCode, normalized);
    if (options.persist !== false && this.repository && typeof this.repository.saveRule === 'function') await this.repository.saveRule(normalized);
    return { success: true, rule: normalized };
  }

  registerActionHandler(type, handler) {
    if (!type || typeof handler !== 'function') throw new Error('action handler requires type and function');
    this.actionHandlers.set(type, handler);
  }

  _isEffective(rule, at = new Date()) {
    const time = at instanceof Date ? at.getTime() : new Date(at).getTime();
    if (!rule.enabled) return false;
    if (rule.effectiveFrom && time < Date.parse(rule.effectiveFrom)) return false;
    if (rule.effectiveTo && time > Date.parse(rule.effectiveTo)) return false;
    return true;
  }

  async evaluateRule(ruleCode, context = {}, options = {}) {
    let rule = this.rules.get(ruleCode);
    if (!rule && this.repository && typeof this.repository.getRule === 'function') {
      const persisted = await this.repository.getRule(ruleCode);
      if (persisted) { await this.registerRule(ruleCode, persisted, { persist: false }); rule = this.rules.get(ruleCode); }
    }
    if (!rule) { const error = new Error('Rule not found: ' + ruleCode); error.code = 'RULE_NOT_FOUND'; throw error; }
    const at = options.at || new Date();
    if (!this._isEffective(rule, at)) return { ruleCode, version: rule.version, applicable: false, passed: false, reason: 'Rule is disabled or outside effective dates', actions: [], trace: [] };
    const trace = [];
    const evaluation = evaluateCondition(rule.conditions, context, trace);
    return { ruleCode, version: rule.version, category: rule.category, applicable: true, passed: evaluation.passed, reason: evaluation.passed ? 'Conditions satisfied' : 'Conditions not satisfied', actions: evaluation.passed ? rule.actions : [], trace, source: rule.source, evaluatedAt: new Date(at).toISOString() };
  }

  async getApplicableRules(ruleCategory, context = {}, options = {}) {
    const candidates = [...this.rules.values()].filter((rule) => (!ruleCategory || rule.category === ruleCategory) && this._isEffective(rule, options.at || new Date())).sort((a,b) => b.priority - a.priority || a.code.localeCompare(b.code));
    const matches = [];
    for (const rule of candidates) {
      const result = await this.evaluateRule(rule.code, context, options);
      if (result.passed) matches.push({ rule, evaluation: result });
    }
    return matches;
  }

  async executeRuleActions(ruleOrCode, context = {}, options = {}) {
    const rule = typeof ruleOrCode === 'string' ? this.rules.get(ruleOrCode) : ruleOrCode;
    if (!rule) throw new Error('Rule not found');
    const evaluation = await this.evaluateRule(rule.code, context, options);
    if (!evaluation.passed) return { executed: false, results: [], evaluation };
    const results = [];
    for (const action of rule.actions) {
      const handler = this.actionHandlers.get(action.type);
      if (!handler) { const error = new Error('No registered action handler for ' + action.type); error.code = 'RULE_ACTION_HANDLER_MISSING'; throw error; }
      results.push({ type: action.type, result: await handler({ context, action, rule, evaluation }) });
    }
    return { executed: true, results, evaluation };
  }

  async evaluateRules(ruleCodes, context = {}, options = {}) {
    const results = {};
    for (const ruleCode of ruleCodes) results[ruleCode] = await this.evaluateRule(ruleCode, context, options);
    return { allPassed: Object.values(results).every((r) => r.passed), results };
  }

  listRules(filter = {}) {
    return [...this.rules.values()].filter((rule) => (!filter.category || rule.category === filter.category) && (filter.enabled == null || rule.enabled === filter.enabled)).sort((a,b) => b.priority - a.priority || a.code.localeCompare(b.code));
  }

  health() { return { status: 'healthy', initialized: this.initialized, rules: this.rules.size, actionHandlers: this.actionHandlers.size, repository: Boolean(this.repository), operators: [...OPERATORS] }; }
}

const singleton = new RulesEngine();
module.exports = singleton;
module.exports.RulesEngine = RulesEngine;
module.exports.OPERATORS = OPERATORS;
module.exports.validateCondition = validateCondition;
module.exports.evaluateCondition = evaluateCondition;
