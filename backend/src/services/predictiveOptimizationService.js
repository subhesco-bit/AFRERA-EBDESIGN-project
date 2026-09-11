const crypto = require('crypto');
const { getPostgreSQL } = require('../database');
const id = () => crypto.randomUUID();

class PredictiveOptimizationService {
  constructor() { this.db = getPostgreSQL(); }

  forecast({ values = [], horizon = 7 }) {
    const nums = values.map(Number).filter(Number.isFinite);
    if (!nums.length) return { horizon, forecast: [], confidence: 0 };
    const mean = nums.reduce((a,b)=>a+b,0)/nums.length;
    const recent = nums.slice(-Math.min(7, nums.length));
    const recentMean = recent.reduce((a,b)=>a+b,0)/recent.length;
    const trend = recent.length > 1 ? (recent[recent.length-1]-recent[0])/(recent.length-1) : 0;
    const forecast = Array.from({length: horizon}, (_,i)=>Math.max(0,recentMean + trend*(i+1)));
    const variance = nums.reduce((s,v)=>s+(v-mean)**2,0)/nums.length;
    const confidence = Math.max(0, Math.min(1, 1/(1 + Math.sqrt(variance)/(Math.abs(mean)+1))));
    return { horizon, forecast, confidence: Number(confidence.toFixed(4)), method: 'bounded_trend_forecast' };
  }

  optimizeAllocations({ supply = [], demand = [] }) {
    const remaining = supply.map(x=>({...x, remaining:Number(x.quantity)||0}));
    const recommendations=[];
    for (const d of demand) {
      let need=Number(d.quantity)||0;
      for (const s of remaining) {
        if (need<=0) break;
        const qty=Math.min(need,s.remaining);
        if(qty>0){ recommendations.push({demand_id:d.id,supply_id:s.id,quantity:qty}); need-=qty; s.remaining-=qty; }
      }
      if(need>0) recommendations.push({demand_id:d.id,unmet_quantity:need});
    }
    return { recommendations, unmet_quantity: recommendations.filter(x=>x.unmet_quantity).reduce((a,x)=>a+x.unmet_quantity,0) };
  }

  async persistPrediction(input, result) {
    const q=await this.db.query(`INSERT INTO ai_intelligence_runs (id,correlation_id,run_type,status,input_data,output_data) VALUES ($1,$2,$3,'completed',$4,$5) RETURNING *`,[id(),input.correlationId||id(),input.runType||'predictive_optimization',JSON.stringify(input),JSON.stringify(result)]);
    return q.rows[0];
  }
}
module.exports = new PredictiveOptimizationService();
