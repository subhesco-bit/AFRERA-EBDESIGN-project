// DISABLED FOR MVP - AI image generation
module.exports = {
  // All methods return "not_configured" in MVP
  execute: async () => ({ configured: false, reason: 'AI image generation' }),
  initialize: async () => ({ configured: false, reason: 'AI image generation' })
};
