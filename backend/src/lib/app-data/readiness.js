'use strict';
const { ReadinessStatus } = require('./types');
const { ReadinessError } = require('./errors');

class ReadinessManager {
  constructor() {
    this.features = new Map();
    this.schedule = new Map();
  }

  defineFeature(name, opts = {}) {
    if (this.features.has(name)) throw new ReadinessError(`Feature ${name} already defined`);
    this.features.set(name, {
      status: opts.initialStatus || ReadinessStatus.NOT_READY,
      label: opts.label || name,
      deps: opts.deps || [],
      config: opts.config || {}
    });
  }

  async checkReadiness(name) {
    const feat = this.features.get(name);
    if (!feat) throw new ReadinessError(`Feature ${name} not found`);
    return feat.status === ReadinessStatus.READY;
  }

  async getReadinessStatus(name) {
    const feat = this.features.get(name);
    if (!feat) throw new ReadinessError(`Feature ${name} not found`);
    return feat.status;
  }

  setReadiness(name, status) {
    const feat = this.features.get(name);
    if (!feat) throw new ReadinessError(`Feature ${name} not found`);
    feat.status = status;
  }

  getAllFeatures() {
    const result = {};
    for (const [name, feat] of this.features) {
      result[name] = { status: feat.status, label: feat.label };
    }
    return result;
  }

  getFeaturesDependingOn(name) {
    const deps = [];
    for (const [fname, feat] of this.features) {
      if (feat.deps.includes(name)) deps.push(fname);
    }
    return deps;
  }
}

module.exports = { ReadinessManager };
