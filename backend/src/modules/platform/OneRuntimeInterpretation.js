/**
 * One-Runtime Interpretation
 * Single pass: domain result → financial/GST meaning → human + machine interpretation
 * Fills the "once run time interpretation" gap across vet / nutrition / agro.
 */

const { randomUUID } = require('crypto');
const fin = require('./FinancialERP');
const decisionEng = require('./DecisionQualityEngine');
const interaction = require('./InteractionLayer');

function interpretMoneyImpact(module, context = {}) {
  const hints = [];
  if (module === 'veterinary') {
    if (context.notifiable) {
      hints.push({
        type: 'cost_risk',
        text: 'Notifiable disease may trigger movement control, culling risk, and unplanned treatment cost — budget contingency',
      });
    }
    if (context.treatment_lines?.length) {
      hints.push({ type: 'erp', text: 'Issue medicines from inventory (treatment_order) and post expense journal' });
    }
  }
  if (module === 'nutrition') {
    hints.push({ type: 'revenue', text: 'Consult session may be invoiced as service (SAC often 9983 — verify, often GST 18%)' });
  }
  if (module === 'agro') {
    if (context.vision_severity === 'high') {
      hints.push({ type: 'cost_risk', text: 'High disease pressure → input spend (spray/labour) and possible yield loss in P&L' });
    }
    if (context.organic) {
      hints.push({ type: 'compliance_cost', text: 'NPOP certification fees and record-keeping are operating costs; premium sales may lift income' });
    }
  }
  return hints;
}

/**
 * One runtime: take enhanced module payload OR raw input and produce unified interpretation
 */
function interpretOnce(input = {}) {
  const module = input.module || input.enhanced?.module || 'agro';
  const enhanced = input.enhanced || input;
  const decision = enhanced.decision_quality || null;

  const money = interpretMoneyImpact(module, {
    notifiable: enhanced.analysis?.notifiable,
    vision_severity: enhanced.analysis?.vision_severity,
    organic: !!enhanced.certification,
    treatment_lines: input.treatment_lines,
  });

  // Optional live GST computation if commercial lines provided
  let gst_preview = null;
  if (input.invoice_lines?.length) {
    gst_preview = fin.createInvoice({
      module,
      lines: input.invoice_lines,
      supply_type: input.supply_type || 'intra',
      party: input.party,
      party_gstin: input.party_gstin,
      own_gstin: input.own_gstin,
    });
  } else if (input.taxable_value != null) {
    gst_preview = {
      line: fin.computeGst({
        taxable_value: input.taxable_value,
        gst_card: input.gst_card || 'gst18',
        supply_type: input.supply_type || 'intra',
        hsn: input.hsn,
      }),
    };
  }

  const finDash = fin.financialDashboard(module);

  const narrative_parts = [];
  if (decision?.human_message) narrative_parts.push(decision.human_message);
  narrative_parts.push(...money.map((m) => m.text));
  if (gst_preview?.totals) {
    narrative_parts.push(
      `Invoice preview grand total ₹${gst_preview.totals.grand_total} (taxable ₹${gst_preview.totals.taxable}).`,
    );
  }
  narrative_parts.push(fin.FIN_DISCLAIMER);

  const interpretation = {
    interpretation_id: randomUUID(),
    module,
    runtime: 'one_pass',
    clinical_or_domain: {
      action: decision?.action || enhanced.analysis || null,
      confidence: decision?.confidence || null,
      escalation: decision?.escalation || null,
    },
    financial: {
      money_hints: money,
      gst_preview,
      pnl_snapshot: finDash.pnl,
      gst_ledger_snapshot: finDash.gst,
    },
    accounting: {
      suggested_journals: money.some((m) => m.type === 'erp')
        ? ['Dr Expense / Cr Inventory on issue', 'Dr AR / Cr Sales+GST on invoice']
        : ['None required unless stock or invoice posted'],
    },
    human_narrative: narrative_parts.join(' '),
    machine: {
      tags: [
        module,
        decision?.escalation?.band,
        gst_preview ? 'gst_computed' : null,
        money.length ? 'money_impact' : null,
      ].filter(Boolean),
    },
    disclaimer: fin.FIN_DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };

  // Attach viz/audio for the interpretation itself
  const interactionBundle = interaction.buildInteractionBundle({
    action: decision?.action || 'INTERPRETATION_READY',
    confidence: decision?.confidence?.value,
    confidence_signals: decision?.confidence ? undefined : [{ value: 0.6, source: 'interpret' }],
    urgency: decision?.escalation?.band === 'escalate_now' ? 'emergency' : 'routine',
    summary: interpretation.human_narrative.slice(0, 280),
    rationale: 'One-runtime domain + financial interpretation',
    modules_touched: [module, 'financial_erp', 'gst'],
    lang: input.lang || 'en',
    key_point: money[0]?.text || null,
  });

  return {
    ...interpretation,
    interaction: interactionBundle,
    evaluation: decisionEng.evaluateDecisionPackage({
      action: interpretation.clinical_or_domain.action,
      safety_floor: fin.FIN_DISCLAIMER,
      confidence: decision?.confidence?.value ?? 0.6,
      rationale: interpretation.human_narrative,
      modules_touched: [module, 'financial'],
      escalation: decision?.escalation || { band: 'monitor' },
    }),
  };
}

module.exports = {
  interpretOnce,
  interpretMoneyImpact,
};
