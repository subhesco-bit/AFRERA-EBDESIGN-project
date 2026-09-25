from pathlib import Path
root=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN')

# Route GST computation through verified-rule accounting intelligence.
p=root/'backend/src/routes/embeddedAiErpRoutes.js'
t=p.read_text(encoding='utf-8')
if "accountingIntelligenceService" not in t:
    t=t.replace("const { authMiddleware } = require('../middleware/auth');", "const { authMiddleware } = require('../middleware/auth');\nconst accountingIntelligence = require('../services/finance/accountingIntelligenceService');",1)
old="""router.post('/finance/gst/compute', (req, res) => {
  try {
    res.json({ success: true, data: fin.computeGst(req.body || {}), disclaimer: fin.FIN_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});"""
new="""router.post('/finance/gst/compute', (req, res) => {
  try {
    const body=req.body||{};
    if(!body.rule) return res.status(409).json({success:false,error:'A verified effective-dated GST rule is required',code:'GST_RULE_REQUIRED'});
    const data=accountingIntelligence.computeGST({
      taxableAmount:body.taxableAmount ?? body.taxable_value,
      supplyType:String(body.supplyType ?? body.supply_type ?? '').toLowerCase().startsWith('inter')?'inter_state':'intra_state',
      rule:body.rule,
    });
    res.json({success:true,data,authority:'DETERMINISTIC_FROM_VERIFIED_RULE'});
  } catch(e) {
    res.status(400).json({success:false,error:e.message,code:e.code||'GST_COMPUTE_ERROR'});
  }
});"""
if old not in t: raise RuntimeError('GST route anchor missing')
t=t.replace(old,new,1)
t=t.replace("res.json({ success: true, data: { rates: fin.GST_RATE_CARDS, hsn_hints: fin.HSN_HINTS, disclaimer: fin.FIN_DISCLAIMER } })", "res.json({ success: true, data: { rates: fin.GST_RATE_CARDS, hsn_hints: fin.HSN_HINTS, authoritative:false, status:'illustrative_legacy_reference_only', disclaimer: fin.FIN_DISCLAIMER } })")
p.write_text(t,encoding='utf-8')

# Remove simulated statutory identifiers from GSP dry-run output.
p=root/'backend/src/modules/platform/erp/GspEInvoiceAdapter.js'
t=p.read_text(encoding='utf-8')
t=t.replace("      simulated_irn: ctx.live ? null : `SIM-IRN-${randomUUID().slice(0, 12).toUpperCase()}`,\n", "      irn: null,\n      authoritative: false,\n")
t=t.replace("      simulated_ewb: `SIM-EWB-${Date.now()}`,\n", "      eway_bill_number: null,\n      authoritative: false,\n")
p.write_text(t,encoding='utf-8')
print('GST route authority and GSP dry-run truth patched')