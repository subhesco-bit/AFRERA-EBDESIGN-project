// DISABLED FOR MVP - Claude API - not tested
module.exports = {
  // All methods return "not_configured" in MVP
  execute: async () => ({ configured: false, reason: 'Claude API - not tested' }),
  initialize: async () => ({ configured: false, reason: 'Claude API - not tested' })
};
