'use strict';

function finiteSeries(values=[]) {
  return (values||[]).map(Number).filter(Number.isFinite);
}
function mean(values){return values.reduce((a,b)=>a+b,0)/(values.length||1);}
function stdDev(values){
  if(values.length<2)return 0;
  const m=mean(values);
  const variance=values.reduce((s,v)=>s+((v-m)**2),0)/(values.length-1);
  return Math.sqrt(Math.max(variance,0));
}
function percentile(sorted,p){
  if(!sorted.length)return null;
  const idx=(sorted.length-1)*p;
  const lo=Math.floor(idx), hi=Math.ceil(idx);
  if(lo===hi)return sorted[lo];
  return sorted[lo]+(sorted[hi]-sorted[lo])*(idx-lo);
}
function analyze({history=[],value,zThreshold=3,minSamples=5}={}){
  const series=finiteSeries(history);
  const current=Number(value);
  if(!Number.isFinite(current)) {
    return {status:'invalid_input',available:false,reason:'value must be finite'};
  }
  if(series.length<minSamples) {
    return {status:'insufficient_data',available:false,sampleSize:series.length,minSamples,value:current};
  }
  const m=mean(series), sd=stdDev(series);
  const z=sd===0?(current===m?0:Infinity):Math.abs((current-m)/sd);
  const sorted=[...series].sort((a,b)=>a-b);
  const q1=percentile(sorted,0.25), q3=percentile(sorted,0.75);
  const iqr=q3-q1;
  const low=q1-1.5*iqr, high=q3+1.5*iqr;
  const iqrOutlier=current<low||current>high;
  const zOutlier=z>=zThreshold;
  const score=Number.isFinite(z)?Math.min(1,z/(zThreshold*1.5)):1;
  return {
    status:'evaluated',
    available:true,
    sampleSize:series.length,
    value:current,
    baseline:{mean:m,stdDev:sd,q1,q3,iqr,lowerFence:low,upperFence:high},
    signals:{absoluteZScore:Number.isFinite(z)?z:null,zThreshold,zOutlier,iqrOutlier},
    anomaly:Boolean(zOutlier||iqrOutlier),
    anomalyScore:Math.round(score*1000)/1000,
    method:'z-score + Tukey IQR',
    limitations:['univariate','not causal','requires representative baseline history'],
  };
}
module.exports={analyze,finiteSeries,mean,stdDev,percentile};
