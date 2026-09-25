'use strict';

const contract = require('../../../.ai/autonomous-program/DISCOVERY_WIRE_CONTRACT.json');

function normalizeWords(values) {
  return [...new Set((values || []).flatMap((value) => String(value || '').toLowerCase().split(/[^a-z0-9]+/)).filter((value) => value.length > 1))].sort();
}

function normalizeDiscoveryMetadata(input = {}) {
  const discovery = input.discovery || {};
  const moduleId = input.moduleId || input.module_id || input.id;
  const name = input.name || input.ModuleName || moduleId;
  const capabilities = [...new Set([...(input.capabilities || []), ...(discovery.capabilities || [])].map(String))];
  const keywords = normalizeWords([name, ...(input.keywords || []), ...(discovery.keywords || []), ...capabilities]);
  return {
    moduleId: moduleId ? String(moduleId) : '',
    name: name ? String(name) : '',
    version: String(input.version || '0.0.0-unverified'),
    domainId: String(input.domainId || input.domain || input.category || 'DOMAIN:UNCLASSIFIED'),
    capabilities,
    keywords,
    contexts: input.contexts || discovery.contexts || {},
    dependencies: input.dependencies || { modules:[], services:[], data:[], external:[], tools:[] },
    interfaces: input.interfaces || {},
    naturalLanguage: input.naturalLanguage || discovery.naturalLanguage || { intents:[], examples:[], disambiguation:[] },
  };
}

function validateDiscoveryMetadata(metadata) {
  const errors=[];
  for(const field of contract.required){ if(!(field in metadata)) errors.push('missing '+field); }
  if(metadata.moduleId && !(new RegExp(contract.moduleIdPattern)).test(metadata.moduleId)) errors.push('invalid moduleId');
  if(!Array.isArray(metadata.capabilities)) errors.push('capabilities must be an array');
  if(!Array.isArray(metadata.keywords)) errors.push('keywords must be an array');
  if(typeof metadata.dependencies !== 'object' || metadata.dependencies === null) errors.push('dependencies must be an object');
  if(typeof metadata.interfaces !== 'object' || metadata.interfaces === null) errors.push('interfaces must be an object');
  if(typeof metadata.naturalLanguage !== 'object' || metadata.naturalLanguage === null) errors.push('naturalLanguage must be an object');
  return { valid:errors.length===0, errors };
}

function matchDiscovery(metadata, query, context = {}) {
  const terms=normalizeWords([query]);
  const haystack=normalizeWords([metadata.name, ...metadata.keywords, ...metadata.capabilities, ...(metadata.naturalLanguage?.intents||[]), ...(metadata.naturalLanguage?.examples||[])]);
  const hits=terms.filter((term)=>haystack.some((value)=>value===term || value.includes(term) || term.includes(value)));
  const contextHits=Object.entries(context).filter(([key,value])=>JSON.stringify(metadata.contexts||{}).toLowerCase().includes(String(value).toLowerCase())).map(([key])=>key);
  return { moduleId:metadata.moduleId, score:terms.length ? hits.length/terms.length : 0, matchedTerms:hits, matchedContexts:contextHits, evidence:{name:metadata.name,capabilities:metadata.capabilities,keywords:metadata.keywords} };
}

module.exports={ contract, normalizeDiscoveryMetadata, validateDiscoveryMetadata, matchDiscovery, normalizeWords };
