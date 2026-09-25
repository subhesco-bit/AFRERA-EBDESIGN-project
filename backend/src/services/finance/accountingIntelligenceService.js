'use strict';

const crypto = require('crypto');
const dualAI = require('../../core/ai/dualBackboneOrchestrator');

const MONEY_SCALE = 10000n;
const PERCENT_SCALE = 10000n;

function decimalUnits(value, field='amount') {
  const raw=String(value ?? '').trim();
  if(!/^-?\d+(?:\.\d{1,4})?$/.test(raw)) throw new Error(field+' must be a decimal with at most four places');
  const negative=raw.startsWith('-');
  const clean=negative?raw.slice(1):raw;
  const [whole,fraction='']=clean.split('.');
  const units=BigInt(whole)*MONEY_SCALE+BigInt(fraction.padEnd(4,'0'));
  return negative?-units:units;
}

function unitsNumber(units){ return Number(units)/Number(MONEY_SCALE); }

function percentUnits(value, field='ratePct') {
  const raw=String(value ?? '').trim();
  if(!/^\d+(?:\.\d{1,4})?$/.test(raw)) throw new Error(field+' must be a non-negative percent with at most four decimals');
  const [whole,fraction='']=raw.split('.');
  return BigInt(whole)*PERCENT_SCALE+BigInt(fraction.padEnd(4,'0'));
}

function applyPercent(amountUnits, pctUnits) {
  const denominator=100n*PERCENT_SCALE;
  const numerator=amountUnits*pctUnits;
  const sign=numerator<0n?-1n:1n;
  const abs=numerator<0n?-numerator:numerator;
  return sign*((abs+denominator/2n)/denominator);
}

function isoDate(value, field='date') {
  const s=String(value||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(field+' must be YYYY-MM-DD');
  const d=new Date(s+'T00:00:00Z');
  if(Number.isNaN(d.getTime())) throw new Error(field+' is invalid');
  return s;
}

function selectVerifiedRule(rules=[], query={}) {
  const date=isoDate(query.date,'date');
  const matches=rules.filter((r)=>
    r.status==='verified'
    && r.jurisdiction===(query.jurisdiction||'IN')
    && r.taxType===query.taxType
    && r.ruleCode===query.ruleCode
    && r.effectiveFrom<=date
    && (!r.effectiveTo||r.effectiveTo>=date)
    && r.sourceUrl
    && r.verifiedAt
  );
  if(matches.length===0) {
    const e=new Error('No verified effective tax rule is available for the requested date');
    e.code='ACCOUNTING_RULE_NOT_VERIFIED';
    throw e;
  }
  if(matches.length>1) {
    const e=new Error('Multiple verified tax rules overlap for the requested date');
    e.code='ACCOUNTING_RULE_AMBIGUOUS';
    throw e;
  }
  return JSON.parse(JSON.stringify(matches[0]));
}

function computeGST({taxableAmount, supplyType, rule}) {
  if(!rule||rule.status!=='verified'||!rule.sourceUrl||!rule.verifiedAt) {
    const e=new Error('A verified, sourced GST rule is required');
    e.code='GST_RULE_REQUIRED';
    throw e;
  }
  const amount=decimalUnits(taxableAmount,'taxableAmount');
  if(amount<0n) throw new Error('taxableAmount must be non-negative');
  const rate=percentUnits(rule.parameters?.ratePct ?? rule.parameters?.gstRatePct,'GST rate');
  const cess=percentUnits(rule.parameters?.cessRatePct ?? 0,'cess rate');
  const totalGST=applyPercent(amount,rate);
  const cessAmount=applyPercent(amount,cess);
  const type=String(supplyType||'').toLowerCase();
  if(!['intra_state','inter_state'].includes(type)) throw new Error('supplyType must be intra_state or inter_state');
  const cgst=type==='intra_state'?totalGST/2n:0n;
  const sgst=type==='intra_state'?totalGST-cgst:0n;
  const igst=type==='inter_state'?totalGST:0n;
  return {
    taxableAmount:unitsNumber(amount),
    ratePct:Number(rate)/Number(PERCENT_SCALE),
    supplyType:type,
    cgst:unitsNumber(cgst),
    sgst:unitsNumber(sgst),
    igst:unitsNumber(igst),
    cess:unitsNumber(cessAmount),
    totalTax:unitsNumber(totalGST+cessAmount),
    grossAmount:unitsNumber(amount+totalGST+cessAmount),
    rule:{ruleCode:rule.ruleCode,effectiveFrom:rule.effectiveFrom,effectiveTo:rule.effectiveTo||null,sourceUrl:rule.sourceUrl,sourceHash:rule.sourceHash||null},
    authority:'DETERMINISTIC_FROM_VERIFIED_RULE',
  };
}

function computeWithholding({amount,cumulativeBefore=0,rule}) {
  if(!rule||!['TDS','TCS'].includes(rule.taxType)||rule.status!=='verified'||!rule.sourceUrl||!rule.verifiedAt) {
    const e=new Error('A verified, sourced TDS/TCS rule is required');
    e.code='WITHHOLDING_RULE_REQUIRED';
    throw e;
  }
  const current=decimalUnits(amount,'amount');
  const before=decimalUnits(cumulativeBefore,'cumulativeBefore');
  if(current<0n||before<0n) throw new Error('withholding amounts must be non-negative');
  const threshold=decimalUnits(rule.parameters?.thresholdAmount ?? 0,'thresholdAmount');
  const rate=percentUnits(rule.parameters?.ratePct,'ratePct');
  const mode=rule.parameters?.thresholdMode||'annual_aggregate';
  const excessOnly=Boolean(rule.parameters?.applyOnExcessOnly);
  let base=current;
  let thresholdCrossed=true;
  if(mode==='per_transaction') {
    thresholdCrossed=current>threshold;
    if(!thresholdCrossed)base=0n;
    else if(excessOnly)base=current-threshold;
  } else if(mode==='annual_aggregate') {
    const after=before+current;
    thresholdCrossed=after>threshold;
    if(!thresholdCrossed)base=0n;
    else if(excessOnly)base=after-threshold-(before>threshold?before-threshold:0n);
  } else {
    throw new Error('Unsupported thresholdMode: '+mode);
  }
  const tax=applyPercent(base,rate);
  return {
    taxType:rule.taxType,
    amount:unitsNumber(current),
    cumulativeBefore:unitsNumber(before),
    threshold:unitsNumber(threshold),
    thresholdCrossed,
    withholdingBase:unitsNumber(base),
    ratePct:Number(rate)/Number(PERCENT_SCALE),
    withholdingAmount:unitsNumber(tax),
    rule:{ruleCode:rule.ruleCode,effectiveFrom:rule.effectiveFrom,effectiveTo:rule.effectiveTo||null,sourceUrl:rule.sourceUrl,sourceHash:rule.sourceHash||null},
    authority:'DETERMINISTIC_FROM_VERIFIED_RULE',
  };
}

function normalizeRef(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}

function reconcile(sourceRows=[], targetRows=[], options={}) {
  const tolerance=Number(options.amountTolerance ?? 0);
  if(!Number.isFinite(tolerance)||tolerance<0) throw new Error('amountTolerance must be non-negative');
  const used=new Set();
  const matches=[];
  const exceptions=[];
  for(const src of sourceRows) {
    const sAmount=Number(src.amount);
    const sRef=normalizeRef(src.reference);
    const candidates=targetRows
      .map((t,i)=>({t,i,amount:Number(t.amount),ref:normalizeRef(t.reference)}))
      .filter(x=>!used.has(x.i)&&Number.isFinite(sAmount)&&Number.isFinite(x.amount)&&Math.abs(x.amount-sAmount)<=tolerance)
      .map(x=>({...x,refScore:sRef&&x.ref?(sRef===x.ref?1:(sRef.includes(x.ref)||x.ref.includes(sRef)?0.8:0)):0}))
      .sort((a,b)=>b.refScore-a.refScore||Math.abs(a.amount-sAmount)-Math.abs(b.amount-sAmount));
    const best=candidates[0];
    if(!best) {
      exceptions.push({source:src,reason:'NO_AMOUNT_MATCH'});
      continue;
    }
    used.add(best.i);
    const amountDiff=Math.abs(best.amount-sAmount);
    const score=Math.max(0,Math.min(1,(best.refScore*0.6)+(amountDiff===0?0.4:Math.max(0,0.4-(amountDiff/(Math.abs(sAmount)||1))))));
    matches.push({source:src,target:best.t,amountDifference:amountDiff,matchScore:Math.round(score*10000)/10000,status:score>=0.8?'matched':'review'});
  }
  const unmatchedTargets=targetRows.filter((_,i)=>!used.has(i));
  return {matches,exceptions,unmatchedTargets,complete:exceptions.length===0&&unmatchedTargets.length===0};
}

function reviewJournal({lines=[],duplicateReference=false,periodStatus='open'}={}) {
  const findings=[];
  if(!Array.isArray(lines)||lines.length<2)findings.push({code:'INSUFFICIENT_LINES',severity:'block'});
  let debit=0n,credit=0n;
  for(const [i,line] of (lines||[]).entries()) {
    try{
      const d=decimalUnits(line.debit??0,'debit');
      const c=decimalUnits(line.credit??0,'credit');
      if((d>0n)===(c>0n))findings.push({code:'INVALID_DEBIT_CREDIT_LINE',severity:'block',line:i});
      debit+=d;credit+=c;
    }catch(error){findings.push({code:'INVALID_AMOUNT',severity:'block',line:i,reason:error.message});}
  }
  if(debit!==credit)findings.push({code:'UNBALANCED_JOURNAL',severity:'block'});
  if(duplicateReference)findings.push({code:'DUPLICATE_REFERENCE',severity:'review'});
  if(periodStatus!=='open')findings.push({code:'PERIOD_NOT_OPEN',severity:'block'});
  return {pass:findings.every(x=>x.severity!=='block'),findings,totalDebit:unitsNumber(debit),totalCredit:unitsNumber(credit),authority:'DETERMINISTIC_CONTROL'};
}

function closeReadiness(input={}) {
  const controls=[
    ['trial_balance',input.trialBalanceBalanced===true,true],
    ['bank_reconciliation',input.bankReconciled===true,true],
    ['tax_reconciliation',input.taxReconciled===true,true],
    ['subledger_reconciliation',input.subledgersReconciled===true,true],
    ['draft_journals',Number(input.openDraftJournals||0)===0,true],
    ['high_risk_exceptions',Number(input.unresolvedHighRiskExceptions||0)===0,true],
    ['intercompany_reconciliation',input.intercompanyRequired?input.intercompanyReconciled===true:true,Boolean(input.intercompanyRequired)],
  ].map(([code,pass,blocking])=>({code,pass:Boolean(pass),blocking:Boolean(blocking)}));
  const blockers=controls.filter(c=>c.blocking&&!c.pass);
  return {ready:blockers.length===0,controls,blockers,authority:'DETERMINISTIC_CLOSE_GATE'};
}

function cashFlowSummary(transactions=[]){
  let inflow=0n,outflow=0n;
  const byCategory={};
  for(const row of transactions){
    const amount=decimalUnits(row.amount,'transaction amount');
    if(amount<0n)throw new Error('transaction amount must be non-negative');
    const direction=String(row.direction||'').toLowerCase();
    if(!['inflow','outflow'].includes(direction))throw new Error('transaction direction must be inflow or outflow');
    if(direction==='inflow')inflow+=amount; else outflow+=amount;
    const category=String(row.category||'uncategorized');
    byCategory[category]=byCategory[category]||{inflow:0n,outflow:0n};
    byCategory[category][direction]+=amount;
  }
  return {
    inflow:unitsNumber(inflow),outflow:unitsNumber(outflow),netCashFlow:unitsNumber(inflow-outflow),
    byCategory:Object.fromEntries(Object.entries(byCategory).map(([k,v])=>[k,{inflow:unitsNumber(v.inflow),outflow:unitsNumber(v.outflow),net:unitsNumber(v.inflow-v.outflow)}])),
    authority:'DETERMINISTIC_RECORDED_TRANSACTIONS_ONLY',
  };
}

function workingCapitalMetrics(input={}){
  const ar=decimalUnits(input.accountsReceivable??0,'accountsReceivable');
  const inventory=decimalUnits(input.inventory??0,'inventory');
  const ap=decimalUnits(input.accountsPayable??0,'accountsPayable');
  const revenue=Number(input.annualRevenue);
  const cogs=Number(input.annualCogs);
  if([ar,inventory,ap].some(x=>x<0n))throw new Error('working-capital balances must be non-negative');
  const net=ar+inventory-ap;
  const dso=Number.isFinite(revenue)&&revenue>0?unitsNumber(ar)/revenue*365:null;
  const dio=Number.isFinite(cogs)&&cogs>0?unitsNumber(inventory)/cogs*365:null;
  const dpo=Number.isFinite(cogs)&&cogs>0?unitsNumber(ap)/cogs*365:null;
  const ccc=dso!=null&&dio!=null&&dpo!=null?dso+dio-dpo:null;
  return {
    netWorkingCapital:unitsNumber(net),
    daysSalesOutstanding:dso==null?null:Math.round(dso*100)/100,
    daysInventoryOutstanding:dio==null?null:Math.round(dio*100)/100,
    daysPayablesOutstanding:dpo==null?null:Math.round(dpo*100)/100,
    cashConversionCycleDays:ccc==null?null:Math.round(ccc*100)/100,
    authority:'DETERMINISTIC_FROM_SUPPLIED_ACCOUNTING_BALANCES',
  };
}

function accountingAIPlan(task={},options={}) {
  return dualAI.plan('FINANCE',task,{
    mode:'hybrid_step_up',
    dataClassification:options.dataClassification||'financial',
    complexity:options.complexity||'medium',
    requiresExternalResearch:Boolean(options.requiresExternalResearch),
    allowlistedPaths:options.allowlistedPaths||[],
    explicitExternalApproval:Boolean(options.explicitExternalApproval),
    internalConfidence:options.internalConfidence,
  });
}

function proposalEnvelope(capability,proposal,evidence={}) {
  const canonical=JSON.stringify({capability,proposal,evidence});
  return {
    proposalId:'AIP-'+crypto.createHash('sha256').update(canonical).digest('hex').slice(0,24).toUpperCase(),
    capability,
    proposal,
    evidence,
    authority:'proposal_only',
    directLedgerMutation:false,
    directTaxFiling:false,
    directPaymentAuthority:false,
    humanReviewRequired:true,
  };
}

module.exports={
  decimalUnits,unitsNumber,percentUnits,applyPercent,selectVerifiedRule,computeGST,computeWithholding,
  reconcile,reviewJournal,closeReadiness,cashFlowSummary,workingCapitalMetrics,accountingAIPlan,proposalEnvelope,
};
