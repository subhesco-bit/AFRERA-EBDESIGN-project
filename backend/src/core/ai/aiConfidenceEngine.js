'use strict';

const { logger } = require('../../utils/logger');

const CONFIDENCE_DIMENSIONS = {
  MODEL_CONFIDENCE:'model_confidence',
  SOURCE_CONFIDENCE:'source_confidence',
  RETRIEVAL_CONFIDENCE:'retrieval_confidence',
  RULE_CONFIDENCE:'rule_confidence',
  DATA_QUALITY:'data_quality',
  CONSISTENCY:'consistency',
  HISTORICAL_ACCURACY:'historical_accuracy',
};

const DEFAULT_THRESHOLDS={AUTO_EXECUTE:0.9,HUMAN_REVIEW:0.7,REJECT:0.5};
const WEIGHTS={
  [CONFIDENCE_DIMENSIONS.MODEL_CONFIDENCE]:0.25,
  [CONFIDENCE_DIMENSIONS.SOURCE_CONFIDENCE]:0.20,
  [CONFIDENCE_DIMENSIONS.RETRIEVAL_CONFIDENCE]:0.15,
  [CONFIDENCE_DIMENSIONS.RULE_CONFIDENCE]:0.15,
  [CONFIDENCE_DIMENSIONS.DATA_QUALITY]:0.10,
  [CONFIDENCE_DIMENSIONS.CONSISTENCY]:0.10,
  [CONFIDENCE_DIMENSIONS.HISTORICAL_ACCURACY]:0.05,
};

function normalizeScore(v){
  const n=Number(v);
  if(!Number.isFinite(n))return null;
  return Math.max(0,Math.min(1,n));
}
function getDecision(confidence,thresholds=DEFAULT_THRESHOLDS){
  if(confidence>=thresholds.AUTO_EXECUTE)return 'auto_execute';
  if(confidence>=thresholds.HUMAN_REVIEW)return 'human_review';
  if(confidence>=thresholds.REJECT)return 'fallback';
  return 'reject';
}
function calculateOverallConfidence(scores){
  if(!scores||Object.keys(scores).length===0)return {overall:0,dimensions:{},decision:'reject'};
  let weightedSum=0,totalWeight=0;
  const clean={};
  for(const [dimension,raw] of Object.entries(scores)){
    const score=normalizeScore(raw);
    if(score==null)continue;
    const weight=WEIGHTS[dimension]||0.1;
    clean[dimension]=score;
    weightedSum+=score*weight;
    totalWeight+=weight;
  }
  const overall=totalWeight?weightedSum/totalWeight:0;
  return {overall:Math.round(overall*100)/100,dimensions:clean,decision:getDecision(overall)};
}
function criteriaToScores(criteria={}){
  const scores={};
  if(criteria.modelScore!==undefined)scores[CONFIDENCE_DIMENSIONS.MODEL_CONFIDENCE]=criteria.modelScore;
  if(criteria.sourceReliability!==undefined)scores[CONFIDENCE_DIMENSIONS.SOURCE_CONFIDENCE]=criteria.sourceReliability;
  if(criteria.retrievalScore!==undefined)scores[CONFIDENCE_DIMENSIONS.RETRIEVAL_CONFIDENCE]=criteria.retrievalScore;
  if(criteria.ruleMatchStrength!==undefined)scores[CONFIDENCE_DIMENSIONS.RULE_CONFIDENCE]=criteria.ruleMatchStrength;
  if(criteria.dataFreshness!==undefined)scores[CONFIDENCE_DIMENSIONS.DATA_QUALITY]=criteria.dataFreshness;
  if(criteria.consistencyScore!==undefined)scores[CONFIDENCE_DIMENSIONS.CONSISTENCY]=criteria.consistencyScore;
  if(criteria.historicalAccuracy!==undefined)scores[CONFIDENCE_DIMENSIONS.HISTORICAL_ACCURACY]=criteria.historicalAccuracy;
  return scores;
}
function evaluateConfidence(criteria){return calculateOverallConfidence(criteriaToScores(criteria));}

function evaluateConfidenceStrict(criteria={},options={}){
  const scores=criteriaToScores(criteria);
  const required=options.requiredDimensions||Object.values(CONFIDENCE_DIMENSIONS);
  const base=calculateOverallConfidence(scores);
  const known=required.filter((d)=>normalizeScore(scores[d])!=null);
  const coverage=required.length?known.length/required.length:1;
  const adjusted=Math.round(base.overall*coverage*1000)/1000;
  return {
    overall:adjusted,
    rawOverall:base.overall,
    dimensions:base.dimensions,
    decision:getDecision(adjusted,options.thresholds||DEFAULT_THRESHOLDS),
    evidenceCoverage:Math.round(coverage*1000)/1000,
    knownDimensions:known,
    missingDimensions:required.filter((d)=>!known.includes(d)),
    strict:true,
  };
}
function meetsThreshold(confidence,threshold){return Number(confidence?.overall||0)>=threshold;}
function getRecommendedAction(confidenceResult){
  switch(confidenceResult.decision){
    case 'auto_execute':return {action:'proceed',reason:'Measured confidence meets auto-execution threshold',requiresHumanApproval:false};
    case 'human_review':return {action:'review',reason:'Measured confidence requires human review',requiresHumanApproval:true};
    case 'fallback':return {action:'fallback',reason:'Confidence is insufficient for autonomous use; use deterministic/fallback path',requiresHumanApproval:false};
    default:return {action:'reject',reason:'Confidence/evidence is insufficient; reject or obtain more evidence',requiresHumanApproval:true};
  }
}
function updateHistoricalAccuracy(engineId,predicted,actual){
  logger.info('Historical accuracy observation received',{engineId,predicted,actual,note:'Persistence/calibration is handled by outcomeResolver/outcomeSink.'});
}

module.exports={
  CONFIDENCE_DIMENSIONS,DEFAULT_THRESHOLDS,WEIGHTS,normalizeScore,calculateOverallConfidence,getDecision,
  evaluateConfidence,evaluateConfidenceStrict,meetsThreshold,getRecommendedAction,updateHistoricalAccuracy,
};
