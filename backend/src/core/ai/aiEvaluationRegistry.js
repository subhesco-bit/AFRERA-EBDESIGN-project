'use strict';

const fs=require('fs');
const path=require('path');
const harness=require('./evaluationHarness');

const BACKINGS=Object.freeze({
  offlineHarness:'core/ai/evaluationHarness.js',
  outcomeResolver:'core/outcomeResolver.js',
  outcomeSink:'core/outcomeSink.js',
  predictionSchema:'database/migrations/990_ai_outcomes.sql',
  legacyEvaluationService:'services/aiEvaluationService.js',
});

function exists(relative){return fs.existsSync(path.resolve(__dirname,'../..',relative));}

function status(){
  const backings={};
  for(const [name,relative] of Object.entries(BACKINGS))backings[name]={path:'backend/src/'+relative,exists:exists(relative)};
  return {
    status:backings.offlineHarness.exists&&backings.outcomeResolver.exists&&backings.outcomeSink.exists?'ready':'degraded',
    backings,
    authoritativeEvaluationPaths:[
      'offline deterministic metrics for held-out examples',
      'resolved prediction/outcome calibration from outcomeSink/outcomeResolver',
    ],
    quarantinedOrLimited:[
      'legacy aiEvaluationService metrics are not treated as evaluation authority because some methods collapse precision/recall to accuracy or assume success.',
    ],
  };
}
function evaluate(kind,rows,options={}){return harness.evaluate(kind,rows,options);}
async function liveCalibration(){return require('../outcomeSink').getCalibration();}
async function liveAccuracy(){return require('../outcomeSink').getAccuracy();}
async function gateFor(actorId){return require('../outcomeResolver').gateFor(actorId);}

module.exports={BACKINGS,status,evaluate,liveCalibration,liveAccuracy,gateFor};
