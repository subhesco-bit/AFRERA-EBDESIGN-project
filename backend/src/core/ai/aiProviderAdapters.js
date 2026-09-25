/**
 * AI Provider Adapters
 * Provider-agnostic configuration metadata. This module never reads or emits
 * credential values; it only reports whether named configuration inputs exist.
 */

'use strict';

const PROVIDER_ENV = Object.freeze({
  claude: { primary: 'ANTHROPIC_API_KEY', anyOf: ['ANTHROPIC_API_KEY'], mode: 'direct-adapter-metadata' },
  openai: { primary: 'OPENAI_API_KEY', anyOf: ['OPENAI_API_KEY'], mode: 'direct-adapter-metadata' },
  gemini: { primary: 'GEMINI_API_KEY', alt: 'GOOGLE_API_KEY', anyOf: ['GEMINI_API_KEY','GOOGLE_API_KEY'], mode: 'direct-adapter-metadata' },
  deepseek: { primary: 'DEEPSEEK_API_KEY', anyOf: ['DEEPSEEK_API_KEY'], mode: 'direct-adapter-metadata' },
  grok: { primary: 'XAI_API_KEY', anyOf: ['XAI_API_KEY'], mode: 'direct-adapter-metadata' },
  vercel_gateway: { primary: 'AI_GATEWAY_API_KEY', alt: 'VERCEL_OIDC_TOKEN', anyOf: ['AI_GATEWAY_API_KEY','VERCEL_OIDC_TOKEN'], optional: ['AI_AGENT_DEFAULT_MODEL','AI_GATEWAY_DEFAULT_MODEL'], mode: 'live-agent-runtime' },
  azure_openai: { primary: 'AZURE_OPENAI_API_KEY', allOf: ['AZURE_OPENAI_API_KEY','AZURE_OPENAI_ENDPOINT'], optional: ['AZURE_OPENAI_API_VERSION'], mode: 'declared-external-provider' },
  ollama: { primary: 'OLLAMA_BASE_URL', allOf: ['OLLAMA_BASE_URL'], optional: ['OLLAMA_MAX_TOKENS'], mode: 'declared-local-provider' },
  huggingface: { primary: 'HUGGINGFACE_API_KEY', anyOf: ['HUGGINGFACE_API_KEY'], mode: 'declared-external-provider' },
  devin: { primary: 'DEVIN_API_KEY', allOf: ['DEVIN_API_KEY','DEVIN_API_URL'], mode: 'declared-agent-service' },
});

function namesFor(env={}) {
  return [...new Set([...(env.allOf||[]),...(env.anyOf||[]),...(env.optional||[])])];
}

function configurationState(env={}, source=process.env) {
  const allOf=env.allOf||[];
  const anyOf=env.anyOf||([]);
  const missingAll=allOf.filter((name)=>!source[name]);
  const anySatisfied=anyOf.length===0||anyOf.some((name)=>Boolean(source[name]));
  const configured=missingAll.length===0&&anySatisfied;
  const missingRequired=[...missingAll];
  if(!anySatisfied&&anyOf.length)missingRequired.push('one-of:'+anyOf.join('|'));
  return {configured,missingRequired};
}

function providerStatus(providerKey, source=process.env) {
  const env=PROVIDER_ENV[providerKey];
  if(!env)return {provider:providerKey,known:false,configured:false};
  const state=configurationState(env,source);
  return {
    provider:providerKey,
    known:true,
    configured:state.configured,
    missingRequired:state.missingRequired,
    configurationNames:namesFor(env),
    envVar:env.alt?env.primary+' or '+env.alt:env.primary,
    mode:env.mode||'declared',
  };
}

function listProviders(source=process.env){return Object.keys(PROVIDER_ENV).map((key)=>providerStatus(key,source));}
function listConfiguredProviders(source=process.env){return listProviders(source).filter((p)=>p.configured);}
function getProviderEnv(providerKey){return PROVIDER_ENV[providerKey];}

function validateProviderConfig(providerKey, source=process.env) {
  const env=PROVIDER_ENV[providerKey];
  if(!env)return {valid:false,reason:'Unknown provider'};
  const state=configurationState(env,source);
  const hasPrimary=Boolean(env.primary&&source[env.primary]);
  const hasAlt=Boolean(env.alt&&source[env.alt]);
  return state.configured
    ? {valid:true,hasPrimary,hasAlt,missingRequired:[]}
    : {valid:false,reason:'Required provider configuration is missing',hasPrimary,hasAlt,missingRequired:state.missingRequired};
}

module.exports={PROVIDER_ENV,providerStatus,listProviders,listConfiguredProviders,getProviderEnv,validateProviderConfig,configurationState};
