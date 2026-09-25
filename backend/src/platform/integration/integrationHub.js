'use strict';

const { randomUUID } = require('crypto');
const { logger } = require('../../utils/logger');
const { ExternalIntegrationRegistry } = require('../../core/integration/externalIntegrationRegistry');

function timeoutPromise(ms, label) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(label + ' timed out after ' + ms + 'ms');
      error.code = 'INTEGRATION_TIMEOUT';
      reject(error);
    }, ms);
    if (typeof timer.unref === 'function') timer.unref();
  });
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

class IntegrationHub {
  constructor(options = {}) {
    this.initialized = false;
    this.registry = options.registry || new ExternalIntegrationRegistry();
    this.failures = new Map();
    this.idempotency = new Map();
    this.failureThreshold = Number(options.failureThreshold || 5);
    this.circuitCooldownMs = Number(options.circuitCooldownMs || 30000);
  }

  async initialize(dependencies = {}) {
    this.db = dependencies.db || null;
    if (dependencies.registry) this.registry = dependencies.registry;
    for (const item of dependencies.integrations || []) {
      await this.registerIntegration(item.id || item.serviceName, item.contract || item.config || {}, item.adapter || null);
    }
    this.initialized = true;
    logger.info('IntegrationHub initialized', { integrations: this.registry.list().length });
    return this.health();
  }

  _circuit(serviceName) {
    const state = this.failures.get(serviceName) || { count: 0, openedAt: null };
    if (state.openedAt && Date.now() - state.openedAt >= this.circuitCooldownMs) {
      const reset = { count: 0, openedAt: null };
      this.failures.set(serviceName, reset);
      return reset;
    }
    return state;
  }

  _assertCircuit(serviceName) {
    const state = this._circuit(serviceName);
    if (state.openedAt) {
      const error = new Error('Integration circuit is open: ' + serviceName);
      error.code = 'INTEGRATION_CIRCUIT_OPEN';
      throw error;
    }
  }

  _recordSuccess(serviceName) { this.failures.set(serviceName, { count: 0, openedAt: null }); }

  _recordFailure(serviceName) {
    const state = this._circuit(serviceName);
    state.count += 1;
    if (state.count >= this.failureThreshold) state.openedAt = Date.now();
    this.failures.set(serviceName, state);
  }

  async registerIntegration(serviceName, integrationConfig, adapter = null) {
    if (!serviceName) throw new Error('serviceName is required');
    const result = this.registry.register(serviceName, integrationConfig, adapter);
    logger.info('Integration registered', { serviceName, provider: result.provider, category: result.category, adapterBound: result.adapterBound });
    return result;
  }

  bindAdapter(serviceName, adapter) { return this.registry.bindAdapter(serviceName, adapter); }

  async callService(serviceName, operation, data = {}, options = {}) {
    if (!this.initialized) { const e = new Error('IntegrationHub is not initialized'); e.code = 'INTEGRATION_HUB_NOT_INITIALIZED'; throw e; }
    this._assertCircuit(serviceName);
    const status = this.registry.status(serviceName);
    if (status.state === 'unknown') { const e = new Error('Integration not registered: ' + serviceName); e.code = 'INTEGRATION_NOT_REGISTERED'; throw e; }
    if (!status.configuration.configured) { const e = new Error('Integration not configured: ' + serviceName); e.code = 'INTEGRATION_NOT_CONFIGURED'; e.missingRequiredEnv = status.configuration.missingRequiredEnv; throw e; }
    const adapter = this.registry.getAdapter(serviceName);
    if (!adapter) { const e = new Error('Integration adapter not bound: ' + serviceName); e.code = 'INTEGRATION_ADAPTER_MISSING'; throw e; }
    const handler = adapter[operation] || (typeof adapter.call === 'function' ? ((payload, ctx) => adapter.call(operation, payload, ctx)) : null);
    if (typeof handler !== 'function') { const e = new Error('Integration operation not supported: ' + serviceName + '.' + operation); e.code = 'INTEGRATION_OPERATION_UNSUPPORTED'; throw e; }

    const contract = this.registry.get(serviceName);
    const requestId = options.requestId || randomUUID();
    const idempotencyKey = options.idempotencyKey || null;
    const idempotent = contract.idempotentOperations.includes(operation) || Boolean(idempotencyKey);
    const cacheKey = idempotencyKey ? serviceName + ':' + operation + ':' + idempotencyKey : null;
    if (cacheKey && this.idempotency.has(cacheKey)) return { ...this.idempotency.get(cacheKey), replayed: true };

    const maxAttempts = idempotent ? Math.max(1, Math.min(Number(options.maxAttempts || contract.maxAttempts), 10)) : 1;
    const timeoutMs = Number(options.timeoutMs || contract.timeoutMs);
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const started = Date.now();
        const context = { requestId, idempotencyKey, attempt, maxAttempts, serviceName, operation };
        const result = await Promise.race([Promise.resolve(handler.call(adapter, data, context)), timeoutPromise(timeoutMs, serviceName + '.' + operation)]);
        const response = { success: true, serviceName, operation, requestId, attempt, durationMs: Date.now() - started, data: result, replayed: false };
        this._recordSuccess(serviceName);
        if (cacheKey) this.idempotency.set(cacheKey, response);
        return response;
      } catch (error) {
        lastError = error;
        this._recordFailure(serviceName);
        const retryable = idempotent && attempt < maxAttempts && (!error.statusCode || contract.retryableStatusCodes.includes(Number(error.statusCode)));
        logger.warn('Integration call failed', { serviceName, operation, requestId, attempt, retryable, error: error.message });
        if (!retryable) break;
        await sleep(Math.min(250 * (2 ** (attempt - 1)), 2000));
        this._assertCircuit(serviceName);
      }
    }
    throw lastError;
  }

  async handleWebhook(serviceName, webhookData, context = {}) {
    const contract = this.registry.get(serviceName);
    const adapter = this.registry.getAdapter(serviceName);
    if (!contract) { const e = new Error('Integration not registered: ' + serviceName); e.code = 'INTEGRATION_NOT_REGISTERED'; throw e; }
    if (!adapter) { const e = new Error('Integration adapter not bound: ' + serviceName); e.code = 'INTEGRATION_ADAPTER_MISSING'; throw e; }
    if (contract.webhookVerification) {
      if (typeof adapter.verifyWebhook !== 'function' && typeof adapter.verifyWebhookSignature !== 'function') {
        const e = new Error('Webhook verification required but adapter has no verifier: ' + serviceName); e.code = 'WEBHOOK_VERIFIER_MISSING'; throw e;
      }
      const verifier = adapter.verifyWebhook || adapter.verifyWebhookSignature;
      const verified = await verifier.call(adapter, webhookData, context.signature, context.secret);
      if (!verified) { const e = new Error('Webhook signature verification failed'); e.code = 'WEBHOOK_SIGNATURE_INVALID'; throw e; }
    }
    if (typeof adapter.handleWebhook !== 'function') { const e = new Error('Webhook handler not implemented: ' + serviceName); e.code = 'WEBHOOK_HANDLER_MISSING'; throw e; }
    return adapter.handleWebhook(webhookData, context);
  }

  async getIntegrationStatus(serviceName) {
    const status = this.registry.status(serviceName);
    const circuit = this._circuit(serviceName);
    return { ...status, circuit: { state: circuit.openedAt ? 'open' : 'closed', failures: circuit.count, openedAt: circuit.openedAt ? new Date(circuit.openedAt).toISOString() : null } };
  }

  async testConnection(serviceName) {
    const status = await this.getIntegrationStatus(serviceName);
    if (!status.available) return { serviceName, connected: false, state: status.state, reason: status.configuration?.configured ? 'adapter unavailable' : 'configuration missing', missingRequiredEnv: status.configuration?.missingRequiredEnv || [] };
    const adapter = this.registry.getAdapter(serviceName);
    const operation = status.healthOperation;
    if (operation && typeof adapter[operation] === 'function') {
      const started = Date.now();
      const result = await this.callService(serviceName, operation, {}, { maxAttempts: 1 });
      return { serviceName, connected: true, state: 'verified', latencyMs: Date.now() - started, result: result.data };
    }
    if (typeof adapter.health === 'function') {
      const started = Date.now();
      const result = await Promise.race([Promise.resolve(adapter.health()), timeoutPromise(status.timeoutMs, serviceName + '.health')]);
      return { serviceName, connected: true, state: 'verified', latencyMs: Date.now() - started, result };
    }
    return { serviceName, connected: null, state: 'adapter_ready_unverified', reason: 'No explicit health operation is defined; no fake connectivity result is returned.' };
  }

  async getIntegrations() { return Promise.all(this.registry.list().map((item) => this.getIntegrationStatus(item.id))); }

  health() { return { status: 'healthy', initialized: this.initialized, integrations: this.registry.list().length, circuits: [...this.failures.entries()].filter(([, value]) => value.openedAt).length }; }
}

module.exports = new IntegrationHub();
module.exports.IntegrationHub = IntegrationHub;
