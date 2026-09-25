'use strict';

function safeDivide(a,b){return b? a/b : null;}
function classification(rows=[]){
  const valid=rows.filter(r=>r&&r.actual!=null&&r.predicted!=null);
  if(!valid.length)return {status:'insufficient_data',samples:0};
  const labels=[...new Set(valid.flatMap(r=>[String(r.actual),String(r.predicted)]))];
  const perLabel={};
  const correct=valid.filter((r)=>String(r.actual)===String(r.predicted)).length;
  for(const label of labels){
    let tp=0,fp=0,fn=0;
    for(const r of valid){
      const a=String(r.actual),p=String(r.predicted);
      if(a===label&&p===label)tp++;
      else if(a!==label&&p===label)fp++;
      else if(a===label&&p!==label)fn++;
    }
    const precision=safeDivide(tp,tp+fp), recall=safeDivide(tp,tp+fn);
    perLabel[label]={tp,fp,fn,precision,recall,f1:precision==null||recall==null||precision+recall===0?null:2*precision*recall/(precision+recall)};
  }
  return {status:'evaluated',samples:valid.length,accuracy:correct/valid.length,labels:perLabel};
}
function regression(rows=[]){
  const valid=rows.map(r=>({a:Number(r.actual),p:Number(r.predicted)})).filter(r=>Number.isFinite(r.a)&&Number.isFinite(r.p));
  if(!valid.length)return {status:'insufficient_data',samples:0};
  const errors=valid.map(r=>r.p-r.a);
  const abs=errors.map(Math.abs);
  const squared=errors.map(e=>e*e);
  const nonZero=valid.filter(r=>r.a!==0);
  return {
    status:'evaluated',samples:valid.length,
    mae:abs.reduce((a,b)=>a+b,0)/valid.length,
    rmse:Math.sqrt(squared.reduce((a,b)=>a+b,0)/valid.length),
    mape:nonZero.length?nonZero.reduce((s,r)=>s+Math.abs((r.p-r.a)/r.a),0)/nonZero.length:null,
  };
}
function abstention(rows=[]){
  const valid=rows.filter(Boolean);
  if(!valid.length)return {status:'insufficient_data',samples:0};
  const abstained=valid.filter(r=>r.abstained===true);
  const answered=valid.filter(r=>r.abstained!==true);
  const supportedAnswered=answered.filter(r=>r.supported!==false);
  return {
    status:'evaluated',samples:valid.length,
    abstentionRate:abstained.length/valid.length,
    unsupportedAnswerRate:answered.length?safeDivide(answered.length-supportedAnswered.length,answered.length):null,
  };
}
function calibration(rows=[],bins=10){
  const valid=rows.map(r=>({c:Number(r.confidence),y:r.correct===true?1:r.correct===false?0:null}))
    .filter(r=>Number.isFinite(r.c)&&r.c>=0&&r.c<=1&&r.y!=null);
  if(!valid.length)return {status:'insufficient_data',samples:0};
  const out=[];
  let ece=0;
  for(let i=0;i<bins;i++){
    const lo=i/bins,hi=(i+1)/bins;
    const bucket=valid.filter(r=>r.c>=lo&&(i===bins-1?r.c<=hi:r.c<hi));
    if(!bucket.length)continue;
    const conf=bucket.reduce((s,r)=>s+r.c,0)/bucket.length;
    const acc=bucket.reduce((s,r)=>s+r.y,0)/bucket.length;
    ece+=Math.abs(conf-acc)*(bucket.length/valid.length);
    out.push({lo,hi,samples:bucket.length,meanConfidence:conf,accuracy:acc});
  }
  return {status:'evaluated',samples:valid.length,ece,bins:out};
}
function evaluate(kind,rows,options={}){
  if(kind==='classification')return classification(rows);
  if(kind==='regression')return regression(rows);
  if(kind==='abstention')return abstention(rows);
  if(kind==='calibration')return calibration(rows,options.bins||10);
  const e=new Error('unknown evaluation kind');e.code='AI_EVALUATION_KIND_UNKNOWN';throw e;
}
module.exports={classification,regression,abstention,calibration,evaluate};
