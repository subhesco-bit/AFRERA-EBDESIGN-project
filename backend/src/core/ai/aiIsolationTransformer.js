'use strict';

const crypto = require('crypto');

const DATA_CLASSIFICATION = Object.freeze({
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  PERSONAL: 'personal',
  SENSITIVE_PERSONAL: 'sensitive-personal',
  FINANCIAL: 'financial',
  REGULATED: 'regulated',
  SECRET: 'secret',
});

const CLASSIFICATION_RANK = Object.freeze({
  public: 0,
  internal: 1,
  confidential: 2,
  personal: 3,
  financial: 4,
  regulated: 5,
  'sensitive-personal': 6,
  secret: 7,
});

const COGNITIVE_TIER = Object.freeze({
  DETERMINISTIC_INTERNAL: 0,
  LOCAL_INTELLIGENCE: 1,
  EXTERNAL_SPECIALIST: 2,
  EXTERNAL_MULTI_AGENT: 3,
});

const AUTHORITY_TIER = Object.freeze({
  OBSERVE: 0,
  ADVISE: 1,
  PROPOSE: 2,
  EXECUTE_APPROVED: 3,
  REFLEX_PREAUTHORIZED: 4,
});

const EXTERNAL_AUTHORITY_CEILING = AUTHORITY_TIER.PROPOSE;

const DEFAULT_POLICY = Object.freeze({
  maxOutboundBytes: 96 * 1024,
  allowedExternalClassifications: ['public', 'internal'],
  blockedKeys: [
    'password','passphrase','secret','clientsecret','privatekey','apikey','api_key',
    'authorization','cookie','session','accesstoken','access_token','refreshtoken','refresh_token',
    'aadhaar','aadhar','pan','bankaccount','bank_account','ifsc','cardnumber','card_number',
    'cvv','otp','biometric','healthrecord','medicalrecord',
  ],
  promptInjectionPatterns: [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /ignore\s+(the\s+)?system\s+prompt/i,
    /reveal\s+(the\s+)?system\s+prompt/i,
    /developer\s+message/i,
    /bypass\s+(the\s+)?guardrails/i,
    /disable\s+(the\s+)?safety/i,
    /exfiltrat(e|ion)/i,
  ],
  allowConfidentialWithExplicitApproval: true,
  neverExternal: ['secret', 'sensitive-personal'],
  externalToolsReadOnly: true,
  requireProvenance: true,
  requireHumanReviewForHighRisk: true,
});

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(value).sort().map((k)=>JSON.stringify(k)+':'+stableStringify(value[k])).join(',') + '}';
}

function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : stableStringify(value)).digest('hex');
}

function normalizeKey(key) {
  return String(key || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
}

function isBlockedKey(key, policy=DEFAULT_POLICY) {
  const k=normalizeKey(key);
  return policy.blockedKeys.some((candidate)=>k.includes(normalizeKey(candidate)));
}

function redactValue(value, policy=DEFAULT_POLICY, path='') {
  if (Array.isArray(value)) return value.map((v,i)=>redactValue(v,policy,`${path}[${i}]`));
  if (value && typeof value === 'object') {
    const out={};
    for (const [key,val] of Object.entries(value)) {
      const childPath=path ? `${path}.${key}` : key;
      if (isBlockedKey(key,policy)) {
        out[key]={redacted:true,reason:'isolation_transformer_sensitive_key'};
      } else {
        out[key]=redactValue(val,policy,childPath);
      }
    }
    return out;
  }
  return value;
}

function selectAllowlistedPaths(input, allowlistedPaths=[]) {
  if (!allowlistedPaths.length) return input;
  const out={};
  for (const path of allowlistedPaths) {
    const parts=String(path).split('.').filter(Boolean);
    let src=input;
    for (const part of parts) {
      if (src == null || typeof src !== 'object' || !(part in src)) { src=undefined; break; }
      src=src[part];
    }
    if (src === undefined) continue;
    let dst=out;
    for (let i=0;i<parts.length-1;i++) dst=dst[parts[i]]||(dst[parts[i]]={});
    dst[parts[parts.length-1]]=src;
  }
  return out;
}

function detectPromptInjection(value, policy=DEFAULT_POLICY) {
  const text=typeof value==='string' ? value : stableStringify(value);
  const matches=[];
  for (const pattern of policy.promptInjectionPatterns) {
    const found=text.match(pattern);
    if (found) matches.push({pattern:String(pattern),match:found[0].slice(0,120)});
  }
  return {detected:matches.length>0,matches};
}

function classificationAllowed(classification, policy=DEFAULT_POLICY, options={}) {
  const c=String(classification||DATA_CLASSIFICATION.INTERNAL).toLowerCase();
  if (policy.neverExternal.includes(c)) {
    return {allowed:false,reason:'classification_never_external',classification:c};
  }
  if (policy.allowedExternalClassifications.includes(c)) {
    return {allowed:true,reason:'classification_allowed',classification:c};
  }
  if (
    policy.allowConfidentialWithExplicitApproval
    && ['confidential','personal','financial','regulated'].includes(c)
    && options.explicitExternalApproval === true
    && Array.isArray(options.allowlistedPaths)
    && options.allowlistedPaths.length>0
  ) {
    return {allowed:true,reason:'explicit_approved_minimized_transfer',classification:c};
  }
  return {allowed:false,reason:'classification_requires_explicit_minimized_approval',classification:c};
}

function prepareOutbound({
  domainCode,
  task,
  dataClassification='internal',
  purpose='external_reasoning',
  allowlistedPaths=[],
  explicitExternalApproval=false,
  policy={},
  correlationId,
}={}) {
  const p={...DEFAULT_POLICY,...policy};
  const decision=classificationAllowed(dataClassification,p,{explicitExternalApproval,allowlistedPaths});
  if (!decision.allowed) {
    return {
      allowed:false,
      circuitBreaker:'DATA_ISOLATION',
      reason:decision.reason,
      classification:decision.classification,
      authorityTier:AUTHORITY_TIER.OBSERVE,
    };
  }

  const sourceHash=sha256(task||{});
  const minimized=selectAllowlistedPaths(task||{},allowlistedPaths);
  const redacted=redactValue(minimized,p);
  const injection=detectPromptInjection(redacted,p);
  const bytes=Buffer.byteLength(JSON.stringify(redacted));

  if (bytes>p.maxOutboundBytes) {
    return {
      allowed:false,
      circuitBreaker:'OUTBOUND_SIZE',
      reason:'isolated_payload_exceeds_limit',
      bytes,
      maxBytes:p.maxOutboundBytes,
      sourceHash,
    };
  }

  return {
    allowed:true,
    envelope:{
      isolationVersion:'1.0',
      correlationId:correlationId||crypto.randomUUID(),
      domainCode,
      purpose,
      classification:decision.classification,
      sourceHash,
      payloadHash:sha256(redacted),
      payload:redacted,
      transfer:{
        direction:'internal_to_external',
        dataMinimized:true,
        sensitiveKeysRedacted:true,
        promptInjectionDetected:injection.detected,
        promptInjectionSignals:injection.matches,
        externalMutationAuthority:false,
        externalToolPolicy:p.externalToolsReadOnly?'read_only':'governed',
      },
      authority:{
        inboundToExternal:AUTHORITY_TIER.OBSERVE,
        externalAuthorityCeiling:EXTERNAL_AUTHORITY_CEILING,
      },
    },
    warnings:injection.detected ? ['PROMPT_INJECTION_SIGNAL_ISOLATED'] : [],
  };
}

function deriveInternalConfidence(internalResult, fallback=null) {
  const candidates=[
    internalResult?.confidence,
    internalResult?.result?.confidence,
    internalResult?.result?.confidence?.value,
    internalResult?.result?.result?.confidence,
    fallback,
  ];
  for (const candidate of candidates) {
    const n=Number(candidate);
    if (Number.isFinite(n)) return n>1 ? Math.min(1,n/100) : Math.max(0,n);
  }
  return null;
}

function decideCognitiveStepUp({
  internalResult,
  internalConfidence,
  internalEngineAvailable=true,
  requiresExternalResearch=false,
  complexity='medium',
  crossDomain=false,
  dataClassification='internal',
  externalRuntimeAvailable=false,
  riskClass='standard',
  forceExternal=false,
  policy={},
}={}) {
  const p={...DEFAULT_POLICY,...policy};
  const cls=String(dataClassification||'internal').toLowerCase();
  const confidence=deriveInternalConfidence(internalResult,internalConfidence);

  if (p.neverExternal.includes(cls)) {
    return {
      stepUp:false,
      targetTier:COGNITIVE_TIER.LOCAL_INTELLIGENCE,
      mode:'islanded',
      reason:'classification_prohibits_external_transfer',
      confidence,
    };
  }

  if (!externalRuntimeAvailable) {
    return {
      stepUp:false,
      targetTier:internalEngineAvailable?COGNITIVE_TIER.LOCAL_INTELLIGENCE:COGNITIVE_TIER.DETERMINISTIC_INTERNAL,
      mode:'islanded',
      reason:'external_runtime_unavailable',
      confidence,
    };
  }

  const lowConfidence=confidence==null || confidence<0.82;
  const complex=['high','very_high'].includes(String(complexity).toLowerCase());
  const need=forceExternal || requiresExternalResearch || !internalEngineAvailable || lowConfidence || complex || crossDomain;

  if (!need) {
    return {
      stepUp:false,
      targetTier:COGNITIVE_TIER.LOCAL_INTELLIGENCE,
      mode:'internal_sufficient',
      reason:'internal_evidence_and_confidence_sufficient',
      confidence,
    };
  }

  const multi=complex || crossDomain;
  return {
    stepUp:true,
    targetTier:multi?COGNITIVE_TIER.EXTERNAL_MULTI_AGENT:COGNITIVE_TIER.EXTERNAL_SPECIALIST,
    mode:'isolated_step_up',
    reason:requiresExternalResearch?'external_evidence_required':
      !internalEngineAvailable?'internal_capability_gap':
      lowConfidence?'internal_confidence_below_threshold':
      multi?'complex_cross_domain_reasoning':'explicit_step_up',
    confidence,
    executionAuthorityCeiling:riskClass==='high'?AUTHORITY_TIER.ADVISE:EXTERNAL_AUTHORITY_CEILING,
  };
}

function normalizeExternalOutput(output) {
  if (output == null) return {text:'',raw:null};
  if (typeof output === 'string') return {text:output,raw:output};
  if (typeof output.text === 'string') return {text:output.text,raw:output};
  if (typeof output.result?.text === 'string') return {text:output.result.text,raw:output};
  return {text:stableStringify(output),raw:output};
}

function stepDownExternalOutput({
  domainCode,
  output,
  correlationId,
  riskClass='standard',
  evidence=[],
  policy={},
}={}) {
  const p={...DEFAULT_POLICY,...policy};
  const normalized=normalizeExternalOutput(output);
  const injection=detectPromptInjection(normalized.text,p);
  const authorityCeiling=riskClass==='high'?AUTHORITY_TIER.ADVISE:EXTERNAL_AUTHORITY_CEILING;

  return {
    transformerVersion:'1.0',
    correlationId:correlationId||crypto.randomUUID(),
    domainCode,
    source:'external_agentic_backbone',
    trustState:'UNTRUSTED_UNTIL_RECONCILED',
    proposal:{
      text:normalized.text,
      rawHash:sha256(normalized.raw||normalized.text),
      evidence:Array.isArray(evidence)?evidence:[],
    },
    protection:{
      outputInjectionSignal:injection.detected,
      outputInjectionMatches:injection.matches,
      externalSideEffectsAllowed:false,
      directExecutionAllowed:false,
      requiresDeterministicValidation:true,
      requiresHumanReview:Boolean(riskClass==='high'||p.requireHumanReviewForHighRisk||injection.detected),
    },
    authority:{
      tier:authorityCeiling,
      name:authorityCeiling===AUTHORITY_TIER.ADVISE?'ADVISE':'PROPOSE',
      mayExecute:false,
      mayMutate:false,
    },
  };
}

function reconcile({
  embedded,
  external,
  riskClass='standard',
  calculable=false,
  deterministicValidation=null,
  evidenceConflict=false,
}={}) {
  if (!external) {
    return {
      status:'INTERNAL_ONLY',
      authoritativePath:'embedded',
      actionAuthority:'internal_policy_only',
      embedded,
      external:null,
    };
  }

  const deterministicPass=deterministicValidation===true;
  const deterministicFail=deterministicValidation===false;
  const highRisk=riskClass==='high';

  if (calculable && deterministicFail) {
    return {
      status:'EXTERNAL_REJECTED_BY_DETERMINISTIC_CHECK',
      authoritativePath:'embedded',
      actionAuthority:'none_external',
      embedded,
      external,
      requiresHumanReview:highRisk,
    };
  }

  if (evidenceConflict) {
    return {
      status:'CONFLICT_REVIEW_REQUIRED',
      authoritativePath:'none_until_reviewed',
      actionAuthority:'none',
      embedded,
      external,
      requiresHumanReview:true,
    };
  }

  return {
    status:calculable?'DETERMINISTIC_ANCHOR_WITH_AGENTIC_EXPLANATION':'HYBRID_CONVERGED',
    authoritativePath:calculable?'embedded':'reconciled',
    actionAuthority:highRisk?'human_approval_required':'internal_workflow_only',
    embedded,
    external,
    deterministicValidation:deterministicPass?true:null,
    requiresHumanReview:highRisk || external.protection?.requiresHumanReview || false,
  };
}

module.exports={
  DATA_CLASSIFICATION,
  CLASSIFICATION_RANK,
  COGNITIVE_TIER,
  AUTHORITY_TIER,
  EXTERNAL_AUTHORITY_CEILING,
  DEFAULT_POLICY,
  stableStringify,
  sha256,
  redactValue,
  detectPromptInjection,
  classificationAllowed,
  prepareOutbound,
  deriveInternalConfidence,
  decideCognitiveStepUp,
  stepDownExternalOutput,
  reconcile,
};
