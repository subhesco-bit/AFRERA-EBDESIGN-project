const { logger } = require('../../utils/logger');

// Minimal scaffold for the image-provider adapter referenced by
// regionalVarietyService.js. Real providers (openai_images, etc.) are not
// wired up yet; callers get a clear "not configured" result instead of a
// crash.
async function callImageProvider(providerKey, prompt) {
  logger.warn('productMediaAIService: image provider not configured', { providerKey });
  return { success: false, error: 'Image provider not configured', provider: providerKey, prompt };
}

module.exports = { callImageProvider };
