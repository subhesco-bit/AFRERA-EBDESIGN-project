'use strict';
const { ReadinessManager } = require('./readiness');
const { LoginManager } = require('./login');
const { StateError } = require('./errors');

class AppData {
  constructor(opts = {}) {
    this.readiness = new ReadinessManager();
    this.login = new LoginManager();
    this.store = new Map();
    this.listeners = [];
    this.config = opts.config || {};
  }

  async initialize() {
    // Setup core features
    this.readiness.defineFeature('auth', { label: 'Authentication' });
    this.readiness.defineFeature('database', { label: 'Database' });
    this.readiness.defineFeature('api', { label: 'API Server', deps: ['auth', 'database'] });
    this.readiness.defineFeature('frontend', { label: 'Frontend', deps: ['api'] });
    return { status: 'initialized' };
  }

  set(key, value) {
    this.store.set(key, value);
    this.notifyListeners({ type: 'SET', key, value });
  }

  get(key) {
    const val = this.store.get(key);
    if (val === undefined && !this.store.has(key)) throw new StateError(`Key ${key} not found`);
    return val;
  }

  has(key) {
    return this.store.has(key);
  }

  delete(key) {
    this.store.delete(key);
    this.notifyListeners({ type: 'DELETE', key });
  }

  clear() {
    this.store.clear();
    this.notifyListeners({ type: 'CLEAR' });
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  notifyListeners(evt) {
    for (const fn of this.listeners) fn(evt);
  }

  getState() {
    const state = {};
    for (const [k, v] of this.store) state[k] = v;
    return state;
  }
}

module.exports = { AppData };
