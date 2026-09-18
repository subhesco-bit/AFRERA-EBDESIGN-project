'use strict';

/** Model-agnostic ML application service. Training/inference adapters are injected. */
class MLService {
  constructor({ modelRepository = null, adapter = null } = {}) { this.modelRepository = modelRepository; this.adapter = adapter; }

  validateFeatures(features) {
    if (!features || typeof features !== 'object' || Array.isArray(features)) throw Object.assign(new Error('features object is required'), { code: 'VALIDATION_ERROR' });
    return features;
  }

  async predict({ model, features }) {
    if (!model) throw Object.assign(new Error('model is required'), { code: 'VALIDATION_ERROR' });
    this.validateFeatures(features);
    if (!this.adapter?.predict) throw Object.assign(new Error('ML inference adapter is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    const result = await this.adapter.predict({ model, features });
    return { model, prediction: result, generatedAt: new Date().toISOString() };
  }

  async train({ datasetId, model, options = {} }) {
    if (!datasetId || !model) throw Object.assign(new Error('datasetId and model are required'), { code: 'VALIDATION_ERROR' });
    if (!this.adapter?.train) throw Object.assign(new Error('ML training adapter is not configured'), { code: 'DEPENDENCY_NOT_CONFIGURED' });
    const result = await this.adapter.train({ datasetId, model, options });
    if (this.modelRepository?.save) await this.modelRepository.save(result);
    return result;
  }
}

module.exports = new MLService();
module.exports.MLService = MLService;
