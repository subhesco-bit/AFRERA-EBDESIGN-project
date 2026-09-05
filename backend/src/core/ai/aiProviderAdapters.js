/**
 * AI Provider Adapters
 * Component ID: EBD-CMP-00000002
 * Purpose: Provider-agnostic LLM provider interfaces
 * 
 * This module provides a unified interface for multiple AI providers
 * ensuring the system is not coupled to any single vendor.
 */

'use strict';

const { logger } = require('../../utils/logger');

/**
 * Provider environment configuration
 * Maps provider keys to their required environment variables
 */
const PROVIDER_ENV = {
  claude: { primary: 'ANTHROPIC_API_KEY' },
  openai: { primary: 'OPENAI_API_KEY' },
  gemini: { primary: 'GEMINI_API_KEY', alt: 'GOOGLE_API_KEY' },
  deepseek: { primary: 'DEEPSEEK_API_KEY' },
};

/**
 * Provider configuration state
 * Returns configuration status without exposing actual key values
 */
function providerStatus(providerKey) {
  const env = PROVIDER_ENV[providerKey];
  if (!env) return { provider: providerKey, known: false, configured: false };
  
  const configured = Boolean(process.env[env.primary] || (env.alt && process.env[env.alt]));
  return {
    provider: providerKey,
    known: true,
    envVar: env.alt ? `${env.primary} or ${env.alt}` : env.primary,
    configured,
  };
}

/**
 * Get all provider statuses
 */
function listProviders() {
  return Object.keys(PROVIDER_ENV).map(key => providerStatus(key));
}

/**
 * Get configured providers only
 */
function listConfiguredProviders() {
  return listProviders().filter(p => p.configured);
}

/**
 * Get provider environment variables
 */
function getProviderEnv(providerKey) {
  return PROVIDER_ENV[providerKey];
}

/**
 * Validate provider configuration
 */
function validateProviderConfig(providerKey) {
  let env = PROVIDER_ENV[providerKey];
  if (!env) {
    return { valid: false, reason: 'Unknown provider' };
  }
  
  const hasPrimary = Boolean(process.env[env.primary]);
  const hasAlt = env.alt && Boolean(process.env[env.alt]);
  
  if (!hasPrimary && !hasAlt) {
    return { valid: false, reason: 'No API key configured' };
  }
  
  return { valid: true, hasPrimary, hasAlt };
}

module.exports = {
  PROVIDER_ENV,
  providerStatus,
  listProviders,
  listConfiguredProviders,
  getProviderEnv,
  validateProviderConfig,
};