from pathlib import Path

# Extend accounting intelligence with treasury/working-capital pure analytics
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\finance\accountingIntelligenceService.js')
t=p.read_text(encoding='utf-8')
anchor='function accountingAIPlan(task={},options={}) {'
insert=r'''function cashFlowSummary(transactions=[]){
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

'''
if 'function cashFlowSummary' not in t:
    if anchor not in t: raise RuntimeError('accounting AI plan anchor missing')
    t=t.replace(anchor,insert+anchor,1)
old="""  reconcile,reviewJournal,closeReadiness,accountingAIPlan,proposalEnvelope,
};"""
new="""  reconcile,reviewJournal,closeReadiness,cashFlowSummary,workingCapitalMetrics,accountingAIPlan,proposalEnvelope,
};"""
if old not in t: raise RuntimeError('accounting exports anchor missing')
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')

# Add finance-specialist agent prompts/templates to enterprise extension before return.
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\enterpriseAgentTemplateExtensions.js')
t=p.read_text(encoding='utf-8')
anchor='  return {promptRegistry, agentRegistry};'
block=r'''  addPrompt('accounting.close', [
    'Act as an accounting close-review specialist. Evaluate trial-balance balance, bank/tax/subledger/intercompany reconciliation, open draft journals and high-risk exceptions.',
    'Do not close or reopen a fiscal period. Produce a close-readiness proposal with evidence and blocking controls for an authorized finance approver.',
  ]);
  register('ACCOUNTING_CLOSE_AGENT', {
    ...shared,name:'Accounting Close Review Agent',stream:'finance',domain:'FINANCE',pattern:'human_approval_workflow',riskClass:'high',
    promptId:'accounting.close',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:8,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['accounting','period-close','reconciliation'],
  });

  addPrompt('accounting.gst.reconcile', [
    'Act as a GST reconciliation assistant. Compare source invoices, recorded tax transactions, ITC/2B evidence and filing-period records using only validated evidence.',
    'Do not invent GST rates, HSN/SAC classifications, ITC eligibility or filing status. Statutory calculations require an effective-dated verified rule.',
    'Output exceptions and clarification items; do not file, accept ITC or alter tax ledgers autonomously.',
  ]);
  register('GST_RECONCILIATION_AGENT', {
    ...shared,name:'GST Reconciliation Agent',stream:'finance',domain:'FINANCE',pattern:'evaluator_optimizer',riskClass:'high',
    promptId:'accounting.gst.reconcile',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['gst','itc','reconciliation','tax'],
  });

  addPrompt('accounting.treasury', [
    'Act as a treasury and working-capital assistant. Use recorded cash, receivable, payable, inventory and settlement evidence plus deterministic metrics.',
    'Separate actual cash flow from forecast scenarios. Never release payment, alter credit limits, borrow funds or move cash autonomously.',
  ]);
  register('TREASURY_WORKING_CAPITAL_AGENT', {
    ...shared,name:'Treasury & Working Capital Agent',stream:'finance',domain:'FINANCE',pattern:'tool_loop',riskClass:'high',
    promptId:'accounting.treasury',tools:['knowledge_search','workflow_catalog','deterministic_calculation'],maxSteps:10,
    approvalPolicy:{humanReviewRequired:true,finalizationRequiresHuman:true,mutationToolsRequireApproval:true},
    tags:['treasury','working-capital','cash-flow'],
  });

'''
if 'ACCOUNTING_CLOSE_AGENT' not in t:
    if anchor not in t: raise RuntimeError('agent extension return anchor missing')
    t=t.replace(anchor,block+anchor,1)
p.write_text(t,encoding='utf-8')
print('accounting treasury analytics and finance specialist agents added')