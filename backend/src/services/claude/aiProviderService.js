class AIProviderService {
  async initialize() { console.log('[AIProviderService] Initialized'); }
  async getProvider() { return { provider: 'Claude AI' }; }
  async init() { return this.initialize(); }
}
module.exports = new AIProviderService();
