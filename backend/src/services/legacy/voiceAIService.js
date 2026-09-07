// DISABLED FOR MVP - Voice AI - not tested
module.exports = {
  // All methods return "not_configured" in MVP
  execute: async () => ({ configured: false, reason: 'Voice AI - not tested' }),
  initialize: async () => ({ configured: false, reason: 'Voice AI - not tested' })
};
