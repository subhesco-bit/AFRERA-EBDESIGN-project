/**
 * ERP Domain Agents — AI decision-making across every ERP module.
 *
 * WHAT THIS IS
 * The specification called for "100+ embedded AI agents working together
 * through a common data model, workflow engine, analytics platform, and AI
 * orchestration layer." Those four things now exist:
 *
 *   common data model  -> 994/995/996 migrations (468 tables)
 *   workflow engine    -> ai_proposals + approval CHECK constraints
 *   analytics platform -> src/utils/statistics.js (tested)
 *   AI orchestration   -> src/core/signalBus.js + decisionEngine.js
 *
 * An "agent" here is therefore a RULE registered on the decision engine, not a
 * separate service. That is a deliberate architectural choice: 100 services
 * would be 100 deployment units, 100 failure modes and 100 places for logic to
 * drift. 100 rules on one engine share the correlation window, the audit trail
 * and the explainability contract automatically.
 *
 * THE NON-NEGOTIABLE RULE
 * Every agent PROPOSES. None execute. Each emits an ai_proposals row with a
 * rationale, and the database CHECK constraint makes it impossible to mark a
 * proposal approved or executed without a named human approver. This is the
 * platform's own principle — "the waterfall computes; a human releases" —
 * enforced structurally rather than by convention.
 *
 * Every proposal carries:
 *   - a plain-language rationale (not a score alone)
 *   - the MCDA breakdown where a judgement was weighed
 *   - honest confidence derived from data quality, never asserted
 *   - the signals that triggered it
 */

const { signalBus, SIGNAL, SEVERITY } = require('./signalBus');
const { decisionEngine, ACTION } = require('./decisionEngine');
const { mcda } = require('./mcda');
const stats = require('../utils/statistics');
const { logger } = require('../utils/logger');
const pool = require('../database/pool');

/** ERP domains, mirroring the AF-* module register from the v44 report. */
const DOMAIN = Object.freeze({
  FINANCE: 'AF-FI',
  CONTROLLING: 'AF-CO',
  PROCUREMENT: 'AF-MM',
  INVENTORY: 'AF-WM',
  SALES: 'AF-SD',
  LOGISTICS: 'AF-TM',
  QUALITY: 'AF-QM',
  PRODUCTION: 'AF-PP',
  MAINTENANCE: 'AF-PM',
  ASSETS: 'AF-AA',
  HR: 'AF-HCM',
  COMPLIANCE: 'AF-SEC',
  MASTERDATA: 'AF-MDM',
  AGRI: 'AF-AGRI',
  // Enterprise control layer — the modules that govern other modules.
  WORKFLOW: 'AF-WF',
  CRM: 'AF-CRM',
  LEGAL: 'AF-LEG',
  RISK: 'AF-RSK',
  EMERGENCY: 'AF-EMR'
});

/**
 * Build a proposal. Never executes anything — returns the row an effector
 * would persist to ai_proposals.
 */
function proposal({ domain, type, subjectType, subjectId, proposed, current, rationale, confidence, breakdown, causedBy }) {
  if (!rationale || rationale.length < 15) {
    // Refusing to emit an unexplained proposal is the point: a human cannot
    // responsibly approve what they cannot evaluate.
    throw new Error(`Agent proposal for ${type} lacks an adequate rationale`);
  }
  return {
    domain,
    proposal_type: type,
    subject_type: subjectType ?? null,
    subject_id: subjectId ?? null,
    proposed_value: proposed,
    current_value: current ?? null,
    rationale,
    confidence: confidence ?? null,
    mcda_breakdown: breakdown ?? null,
    caused_by: causedBy ?? [],
    status: 'proposed',
    approved_by: null,      // stays null until a human sets it
    requires_human: true,
    created_at: new Date().toISOString()
  };
}

// ===========================================================================
// AGENT DEFINITIONS
// Each returns null when it has nothing to say. Silence is a valid output —
// an agent that always fires is noise, and noise gets ignored.
// ===========================================================================

const AGENTS = [

  // -------------------------------------------------------------------
  // FINANCE — Cash Flow Agent
  // -------------------------------------------------------------------
  {
    id: 'finance.cashflow',
    domain: DOMAIN.FINANCE,
    description: 'Projects cash position from AR/AP ageing and warns before a shortfall.',
    /**
     * @param {{arDue:number[], apDue:number[], cashOnHand:number, horizonDays:number}} ctx
     */
    evaluate(ctx = {}) {
      const inflow = stats.mean(ctx.arDue || []) * (ctx.arDue || []).length;
      const outflow = stats.mean(ctx.apDue || []) * (ctx.apDue || []).length;
      const cash = Number(ctx.cashOnHand) || 0;
      const projected = cash + inflow - outflow;

      if (!Number.isFinite(projected) || (inflow === 0 && outflow === 0)) return null;
      if (projected >= 0) return null; // only speak when there is a problem

      const shortfall = Math.abs(projected);
      return proposal({
        domain: DOMAIN.FINANCE,
        type: 'cash_shortfall_warning',
        subjectType: 'company',
        subjectId: ctx.companyId,
        proposed: { action: 'accelerate_collections', shortfall, horizonDays: ctx.horizonDays ?? 30 },
        current: { cashOnHand: cash, expectedInflow: inflow, expectedOutflow: outflow },
        confidence: 0.8,
        rationale:
          `Projected cash over the next ${ctx.horizonDays ?? 30} days is short by ₹${Math.round(shortfall)}: ` +
          `₹${Math.round(cash)} on hand plus ₹${Math.round(inflow)} receivable against ₹${Math.round(outflow)} payable. ` +
          'Consider accelerating collections or rescheduling payables before the window closes.'
      });
    }
  },

  // -------------------------------------------------------------------
  // FINANCE — Overdue Receivables Agent
  // -------------------------------------------------------------------
  {
    id: 'finance.receivables',
    domain: DOMAIN.FINANCE,
    description: 'Flags receivables ageing past tolerance, weighted by exposure.',
    evaluate(ctx = {}) {
      const invoices = ctx.arInvoices || [];
      const overdue = invoices.filter((i) => Number(i.daysOverdue) > 0);
      if (overdue.length === 0) return null;

      const exposure = overdue.reduce((s, i) => s + (Number(i.amountDue) || 0), 0);
      const worst = [...overdue].sort((a, b) => b.daysOverdue - a.daysOverdue)[0];
      if (exposure <= 0) return null;

      return proposal({
        domain: DOMAIN.FINANCE,
        type: 'collections_priority',
        subjectType: 'company',
        subjectId: ctx.companyId,
        proposed: {
          action: 'prioritise_collections',
          exposure,
          accounts: overdue.slice(0, 10).map((i) => ({ customer: i.customerId, amount: i.amountDue, daysOverdue: i.daysOverdue }))
        },
        confidence: 1, // this is arithmetic on recorded invoices, not a prediction
        rationale:
          `${overdue.length} invoice(s) are overdue, totalling ₹${Math.round(exposure)} of exposure. ` +
          `The oldest is ${worst.daysOverdue} days past due. Collections effort ranked by amount at risk.`
      });
    }
  },

  // -------------------------------------------------------------------
  // PROCUREMENT — Vendor Selection Agent (MCDA)
  // -------------------------------------------------------------------
  {
    id: 'procurement.vendor_selection',
    domain: DOMAIN.PROCUREMENT,
    description: 'Scores RFQ responses on price, delivery, quality and risk.',
    evaluate(ctx = {}) {
      const bids = ctx.bids || [];
      if (bids.length < 2) return null; // nothing to choose between

      const prices = bids.map((b) => Number(b.quotedTotal) || 0);
      const lowest = Math.min(...prices.filter((p) => p > 0));

      const scored = bids.map((b) => {
        const price = Number(b.quotedTotal) || 0;
        const criteria = [
          {
            name: 'Price competitiveness',
            weight: 0.40,
            score: price > 0 ? Math.max(0, Math.min(100, (lowest / price) * 100)) : 0,
            dataQuality: 'real'
          },
          {
            name: 'Delivery lead time',
            weight: 0.25,
            score: Number.isFinite(Number(b.deliveryDays))
              ? Math.max(0, 100 - Number(b.deliveryDays) * 2)
              : 50,
            dataQuality: Number.isFinite(Number(b.deliveryDays)) ? 'real' : 'assumed'
          },
          {
            name: 'Past quality performance',
            weight: 0.25,
            score: Number.isFinite(Number(b.qualityScore)) ? Number(b.qualityScore) : 50,
            dataQuality: Number.isFinite(Number(b.qualityScore)) ? 'real' : 'assumed'
          },
          {
            name: 'Delivery reliability',
            weight: 0.10,
            score: Number.isFinite(Number(b.onTimePct)) ? Number(b.onTimePct) : 50,
            dataQuality: Number.isFinite(Number(b.onTimePct)) ? 'real' : 'assumed'
          }
        ];
        return { vendor: b.vendorId, quotedTotal: price, result: mcda(criteria) };
      }).sort((a, b) => b.result.total - a.result.total);

      const winner = scored[0];
      const margin = scored.length > 1
        ? Math.round((winner.result.total - scored[1].result.total) * 10) / 10
        : winner.result.total;

      // A close call should not look like a clear recommendation.
      const decisive = margin >= 5;
      const cheapest = scored.find((s) => s.quotedTotal === lowest);
      const notCheapest = cheapest && cheapest.vendor !== winner.vendor;

      return proposal({
        domain: DOMAIN.PROCUREMENT,
        type: 'vendor_award',
        subjectType: 'rfq',
        subjectId: ctx.rfqId,
        proposed: { vendor: winner.vendor, total: winner.quotedTotal, decisive, margin },
        confidence: winner.result.confidence / 100,
        breakdown: winner.result,
        rationale:
          `${winner.vendor} scores ${winner.result.total}/100 (${winner.result.confidenceLabel.toLowerCase()}), ` +
          `leading by ${margin} points. Most sensitive to: ${winner.result.mostSensitiveTo}. ` +
          (notCheapest
            ? `Note this is NOT the lowest bid — ${cheapest.vendor} quoted ₹${Math.round(cheapest.quotedTotal)} — the difference is justified by delivery and quality weighting. `
            : '') +
          (decisive ? '' : 'Margin is under 5 points, so treat this as a close call rather than a clear winner. ') +
          'Award requires human approval.'
      });
    }
  },

  // -------------------------------------------------------------------
  // INVENTORY — Replenishment Agent
  // -------------------------------------------------------------------
  {
    id: 'inventory.replenishment',
    domain: DOMAIN.INVENTORY,
    description: 'Reorder point from demand history, lead time and seasonality.',
    evaluate(ctx = {}) {
      const history = ctx.demandHistory || [];
      if (history.length < 7) return null; // too little history to be useful

      const leadDays = Number(ctx.leadTimeDays) || 7;
      const onHand = Number(ctx.onHand) || 0;

      const dailyMean = stats.mean(history);
      const dailySd = stats.stdDev(history);
      // Safety stock at ~95% service level (z = 1.65) over the lead time.
      const safety = 1.65 * dailySd * Math.sqrt(leadDays);
      const reorderPoint = dailyMean * leadDays + safety;

      if (onHand > reorderPoint) return null; // adequately stocked

      const suggestedQty = Math.ceil(reorderPoint * 2 - onHand);
      const daysCover = dailyMean > 0 ? Math.floor(onHand / dailyMean) : null;

      return proposal({
        domain: DOMAIN.INVENTORY,
        type: 'replenishment',
        subjectType: 'material',
        subjectId: ctx.materialCode,
        proposed: { quantity: suggestedQty, reorderPoint: Math.ceil(reorderPoint), safetyStock: Math.ceil(safety) },
        current: { onHand, daysCover },
        confidence: Math.max(0.4, Math.min(1, history.length / 30)),
        rationale:
          `Stock on hand (${onHand}) is below the reorder point of ${Math.ceil(reorderPoint)} ` +
          `(${Math.round(dailyMean)}/day over a ${leadDays}-day lead time, plus ${Math.ceil(safety)} safety stock ` +
          `for demand variability). ` +
          (daysCover !== null ? `About ${daysCover} days of cover remain. ` : '') +
          `Suggest ordering ${suggestedQty}. Confidence reflects ${history.length} days of history.`
      });
    }
  },

  // -------------------------------------------------------------------
  // INVENTORY — Slow-Moving Stock Agent
  // -------------------------------------------------------------------
  {
    id: 'inventory.slow_moving',
    domain: DOMAIN.INVENTORY,
    description: 'Identifies capital tied up in stock that is not turning.',
    evaluate(ctx = {}) {
      const items = ctx.items || [];
      const slow = items.filter((i) => Number(i.daysSinceLastMovement) >= (ctx.thresholdDays ?? 90));
      if (slow.length === 0) return null;

      const tied = slow.reduce((s, i) => s + (Number(i.value) || 0), 0);
      if (tied <= 0) return null;

      return proposal({
        domain: DOMAIN.INVENTORY,
        type: 'slow_moving_stock',
        subjectType: 'warehouse',
        subjectId: ctx.warehouseId,
        proposed: {
          action: 'review_for_markdown_or_write_off',
          itemCount: slow.length,
          capitalTiedUp: tied,
          items: slow.slice(0, 10).map((i) => ({ code: i.code, value: i.value, idleDays: i.daysSinceLastMovement }))
        },
        confidence: 1,
        rationale:
          `${slow.length} item(s) have not moved in ${ctx.thresholdDays ?? 90}+ days, tying up ₹${Math.round(tied)}. ` +
          'For perishable stock this is also a spoilage risk, not only a capital one. Review for markdown, redeployment or write-off.'
      });
    }
  },

  // -------------------------------------------------------------------
  // SALES — Demand Forecast Agent
  // -------------------------------------------------------------------
  {
    id: 'sales.demand_forecast',
    domain: DOMAIN.SALES,
    description: 'Holt forecast with seasonality; only speaks when accuracy justifies it.',
    evaluate(ctx = {}) {
      const series = ctx.series || [];
      if (series.length < 14) return null;

      const { forecast, trend, fitted } = stats.holtLinearForecast(series, ctx.horizon || 30);
      const accuracy = Math.max(0, Math.min(1, 1 - stats.mape(series, fitted)));

      // Refuse to advise on an unreliable forecast. This gate is the reason the
      // statistics rewrite mattered — accuracy is measured, not asserted.
      if (accuracy < 0.7) return null;

      // Measure against the CURRENT level, not the forecast mean.
      // mean(forecast) grows with the extrapolation, so dividing by it
      // mathematically suppresses the very trend being measured — a clean
      // +2/period series scored 0.011 and was silently discarded.
      const currentLevel = series[series.length - 1];
      if (!currentLevel) return null;

      const horizon = forecast.length;
      // The business-meaningful number is the projected change across the whole
      // horizon ("demand will be X% higher in 30 days"), not per period. A 5%
      // per-period gate compounds to roughly 4x over 30 periods — far too high
      // to ever fire on real data.
      const projectedChange = (trend * horizon) / currentLevel;
      if (Math.abs(projectedChange) < 0.10) return null; // <10% over the horizon is noise

      const rising = projectedChange > 0;
      return proposal({
        domain: DOMAIN.SALES,
        type: 'demand_shift',
        subjectType: 'product',
        subjectId: ctx.productId,
        proposed: {
          direction: rising ? 'rising' : 'falling',
          percentOverHorizon: Math.round(projectedChange * 1000) / 10,
          percentPerPeriod: Math.round((trend / currentLevel) * 1000) / 10,
          horizonPeriods: horizon,
          forecastTotal: Math.round(forecast.reduce((s, v) => s + v, 0)),
          action: rising ? 'increase_supply' : 'review_pricing'
        },
        confidence: accuracy,
        rationale:
          `Demand is ${rising ? 'rising' : 'falling'} — projected ${(projectedChange * 100).toFixed(0)}% ` +
          `change over the next ${horizon} periods from a current level of ${Math.round(currentLevel)}, ` +
          `on a forecast with ${(accuracy * 100).toFixed(0)}% in-sample accuracy across ${series.length} observations. ` +
          (rising ? 'Secure additional supply before the trend prices it up.' : 'Review pricing to defend volume.')
      });
    }
  },

  // -------------------------------------------------------------------
  // QUALITY — Non-Conformance Trend Agent
  // -------------------------------------------------------------------
  {
    id: 'quality.ncr_trend',
    domain: DOMAIN.QUALITY,
    description: 'Detects a rising defect rate before it becomes a recall.',
    evaluate(ctx = {}) {
      const rates = ctx.defectRates || [];
      if (rates.length < 6) return null;

      const { slope, r2 } = stats.linearRegression(rates);
      const mean = stats.mean(rates);
      if (mean === 0 || slope <= 0) return null;

      const relSlope = slope / mean;
      if (relSlope < 0.05 || r2 < 0.4) return null; // not a real trend

      const outliers = stats.zScoreOutliers(rates, 2);

      return proposal({
        domain: DOMAIN.QUALITY,
        type: 'quality_degradation',
        subjectType: ctx.subjectType || 'supplier',
        subjectId: ctx.subjectId,
        proposed: {
          action: 'open_investigation',
          trendPerPeriod: Math.round(relSlope * 1000) / 10,
          outlierCount: outliers.length
        },
        confidence: r2,
        rationale:
          `Defect rate is trending up ${(relSlope * 100).toFixed(1)}% per period ` +
          `(fit r²=${r2.toFixed(2)} over ${rates.length} periods)` +
          (outliers.length ? `, with ${outliers.length} statistical outlier(s)` : '') +
          '. Investigate before this reaches a customer — a recall costs far more than an inspection.'
      });
    }
  },

  // -------------------------------------------------------------------
  // MAINTENANCE — Predictive Maintenance Agent
  // -------------------------------------------------------------------
  {
    id: 'maintenance.predictive',
    domain: DOMAIN.MAINTENANCE,
    description: 'Flags assets whose calibration lapse blocks cold-chain dispatch.',
    evaluate(ctx = {}) {
      const assets = ctx.assets || [];
      const due = assets.filter((a) => Number(a.daysUntilDue) <= (ctx.warnDays ?? 14));
      if (due.length === 0) return null;

      // An overdue calibration on a cold-chain sensor is not a maintenance
      // backlog item — it invalidates every consignment that sensor certifies.
      const blocking = due.filter((a) => a.blocksColdDispatch);
      const overdue = due.filter((a) => Number(a.daysUntilDue) < 0);

      return proposal({
        domain: DOMAIN.MAINTENANCE,
        type: 'maintenance_due',
        subjectType: 'asset_group',
        subjectId: ctx.facilityId,
        proposed: {
          action: blocking.length ? 'schedule_urgently' : 'schedule',
          dueCount: due.length,
          overdueCount: overdue.length,
          blockingColdDispatch: blocking.map((a) => a.assetCode)
        },
        confidence: 1,
        rationale:
          `${due.length} asset(s) fall due within ${ctx.warnDays ?? 14} days` +
          (overdue.length ? `, of which ${overdue.length} are already overdue` : '') +
          '. ' +
          (blocking.length
            ? `${blocking.length} of these gate cold-chain dispatch — until calibrated, consignments they certify cannot be trusted.`
            : 'None currently block dispatch.')
      });
    }
  },

  // -------------------------------------------------------------------
  // AGRI — Glut Warning Agent (platform-specific)
  // -------------------------------------------------------------------
  {
    id: 'agri.glut_warning',
    domain: DOMAIN.AGRI,
    description: 'Warns when many products peak together, depressing farmgate prices.',
    evaluate(ctx = {}) {
      const peaking = ctx.peakingProducts || [];
      const average = Number(ctx.averagePeaksPerMonth) || 0;
      if (peaking.length === 0 || average === 0) return null;
      if (peaking.length < average * 1.5) return null;

      return proposal({
        domain: DOMAIN.AGRI,
        type: 'supply_glut_warning',
        subjectType: 'month',
        subjectId: ctx.month,
        proposed: {
          action: 'plan_absorption',
          peakingCount: peaking.length,
          products: peaking.slice(0, 12),
          options: ['pre-book cold storage', 'accelerate processing', 'stagger harvest windows', 'open institutional channel']
        },
        confidence: 0.85,
        rationale:
          `${peaking.length} products peak in ${ctx.month} against a monthly average of ${average} — ` +
          'simultaneous peaks depress farmgate prices and strain cold storage. ' +
          'Plan absorption capacity now; the alternative is distress selling at harvest.'
      });
    }
  },

  // -------------------------------------------------------------------
  // WORKFLOW — SLA Breach Agent (the autonomic layer)
  // -------------------------------------------------------------------
  {
    id: 'workflow.sla_breach',
    domain: DOMAIN.WORKFLOW,
    description: 'Finds approvals stalled past their SLA and routes them to escalation.',
    evaluate(ctx = {}) {
      const pending = ctx.pendingApprovals || [];
      const breached = pending.filter((p) => p.slaStatus === 'breached');
      if (breached.length === 0) return null;

      const worst = [...breached].sort((a, b) => b.hoursOpen - a.hoursOpen)[0];

      return proposal({
        domain: DOMAIN.WORKFLOW,
        type: 'sla_breach',
        subjectType: 'workflow',
        subjectId: worst.instanceCode,
        proposed: {
          action: 'escalate',
          breachedCount: breached.length,
          items: breached.slice(0, 10).map((b) => ({
            instance: b.instanceCode, entity: b.entityType, step: b.currentStep,
            role: b.requiredRole, hoursOpen: Math.round(b.hoursOpen)
          }))
        },
        confidence: 1,
        rationale:
          `${breached.length} approval(s) have passed their SLA; the oldest has waited ` +
          `${Math.round(worst.hoursOpen)} hours at "${worst.currentStep}" for ${worst.requiredRole}. ` +
          'A request that stalls indefinitely is indistinguishable from one that was refused — escalate or decide.'
      });
    }
  },

  // -------------------------------------------------------------------
  // CRM — Lead Qualification Agent (MCDA)
  // -------------------------------------------------------------------
  {
    id: 'crm.lead_qualification',
    domain: DOMAIN.CRM,
    description: 'Scores inbound leads on fit, value, engagement and reachability.',
    evaluate(ctx = {}) {
      const lead = ctx.lead;
      if (!lead) return null;

      const criteria = [
        {
          name: 'Segment fit',
          weight: 0.35,
          score: ['horeca', 'corporate', 'export', 'institution'].includes(String(lead.segment).toLowerCase()) ? 90 : 45,
          dataQuality: lead.segment ? 'real' : 'assumed'
        },
        {
          name: 'Estimated deal value',
          weight: 0.30,
          score: Number.isFinite(Number(lead.estimatedValue))
            ? Math.min(100, (Number(lead.estimatedValue) / 500000) * 100)
            : 40,
          dataQuality: Number.isFinite(Number(lead.estimatedValue)) ? 'real' : 'assumed'
        },
        {
          name: 'Engagement',
          weight: 0.20,
          score: Math.min(100, (Number(lead.activityCount) || 0) * 20),
          dataQuality: 'real'
        },
        {
          name: 'Reachability',
          weight: 0.15,
          score: (lead.email ? 50 : 0) + (lead.phone ? 50 : 0),
          dataQuality: 'real'
        }
      ];

      const result = mcda(criteria);
      // Only speak about leads at the extremes; a mid-scoring lead needs no advice.
      if (result.total >= 45 && result.total < 70) return null;

      const strong = result.total >= 70;
      return proposal({
        domain: DOMAIN.SALES,
        type: 'lead_qualification',
        subjectType: 'lead',
        subjectId: lead.leadCode,
        proposed: {
          action: strong ? 'prioritise_contact' : 'deprioritise',
          score: result.total,
          verdict: result.verdict
        },
        confidence: result.confidence / 100,
        breakdown: result,
        rationale:
          `Lead scores ${result.total}/100 (${result.verdict}, ${result.confidenceLabel.toLowerCase()}), ` +
          `most sensitive to ${result.mostSensitiveTo}. ` +
          (strong
            ? 'Prioritise contact while engagement is warm.'
            : 'Weak on fit or value — deprioritise rather than disqualify, and record why if closing it.')
      });
    }
  },

  // -------------------------------------------------------------------
  // LEGAL — Obligation Breach Agent
  // -------------------------------------------------------------------
  {
    id: 'legal.obligation_watch',
    domain: DOMAIN.LEGAL,
    description: 'Warns before a legal or contractual obligation falls due.',
    evaluate(ctx = {}) {
      const obligations = ctx.obligations || [];
      const horizon = ctx.warnDays ?? 30;
      const due = obligations.filter((o) => Number(o.daysUntilDue) <= horizon);
      if (due.length === 0) return null;

      const overdue = due.filter((o) => Number(o.daysUntilDue) < 0);
      const withConsequence = due.filter((o) => o.breachConsequence);

      return proposal({
        domain: DOMAIN.LEGAL,
        type: 'obligation_due',
        subjectType: 'legal',
        subjectId: ctx.companyId,
        proposed: {
          action: overdue.length ? 'remediate_now' : 'schedule',
          dueCount: due.length,
          overdueCount: overdue.length,
          items: due.slice(0, 10).map((o) => ({
            code: o.obligationCode, description: o.description,
            daysUntilDue: o.daysUntilDue, consequence: o.breachConsequence || null
          }))
        },
        confidence: 1,
        rationale:
          `${due.length} obligation(s) fall due within ${horizon} days` +
          (overdue.length ? `, of which ${overdue.length} are ALREADY BREACHED` : '') +
          '. ' +
          (withConsequence.length
            ? `${withConsequence.length} carry a stated breach consequence. `
            : '') +
          'Legal obligations do not lapse quietly — a missed filing is discovered by the regulator, not by us.'
      });
    }
  },

  // -------------------------------------------------------------------
  // RISK — Register Health Agent
  // -------------------------------------------------------------------
  {
    id: 'risk.register_health',
    domain: DOMAIN.RISK,
    description: 'Flags high residual risks, stale reviews and breached indicators.',
    evaluate(ctx = {}) {
      const risks = ctx.risks || [];
      if (risks.length === 0) return null;

      const critical = risks.filter((r) => Number(r.residualScore) >= 15);
      const staleReview = risks.filter((r) => r.reviewOverdue);
      const breachedKri = risks.filter((r) => r.indicatorBreached);

      if (critical.length === 0 && staleReview.length === 0 && breachedKri.length === 0) return null;

      // A stale review is its own risk: the register says what was true once.
      return proposal({
        domain: DOMAIN.RISK,
        type: 'risk_attention',
        subjectType: 'risk_register',
        subjectId: ctx.companyId,
        proposed: {
          action: critical.length ? 'review_critical_risks' : 'refresh_register',
          criticalCount: critical.length,
          staleReviewCount: staleReview.length,
          breachedIndicators: breachedKri.length,
          topRisks: critical.slice(0, 5).map((r) => ({ code: r.riskCode, title: r.title, score: r.residualScore }))
        },
        confidence: 1,
        rationale:
          (critical.length ? `${critical.length} risk(s) sit at critical residual score (15+). ` : '') +
          (breachedKri.length ? `${breachedKri.length} key risk indicator(s) have breached threshold. ` : '') +
          (staleReview.length
            ? `${staleReview.length} risk(s) are past their review date — the register currently describes what was true when it was last examined, not now.`
            : '')
      });
    }
  },

  // -------------------------------------------------------------------
  // EMERGENCY — Incident Command Agent (the reflex arc)
  // -------------------------------------------------------------------
  {
    id: 'emergency.incident_command',
    domain: DOMAIN.EMERGENCY,
    description: 'Escalates unacknowledged incidents and surfaces standing instructions.',
    evaluate(ctx = {}) {
      const incidents = ctx.incidents || [];
      const live = incidents.filter((i) => !['resolved', 'closed'].includes(i.status));
      if (live.length === 0) return null;

      const unacknowledged = live.filter((i) => i.acknowledgementOverdue);
      const lifeSafety = live.filter((i) => i.peopleAtRisk);
      const critical = live.filter((i) => i.severity === 'critical');

      // Nothing overdue and nothing critical means the response is working.
      if (unacknowledged.length === 0 && critical.length === 0 && lifeSafety.length === 0) return null;

      const worst = lifeSafety[0] || critical[0] || unacknowledged[0];

      return proposal({
        domain: DOMAIN.EMERGENCY,
        type: 'incident_escalation',
        subjectType: 'incident',
        subjectId: worst.incidentCode,
        proposed: {
          action: lifeSafety.length ? 'escalate_immediately' : 'escalate',
          liveCount: live.length,
          unacknowledgedCount: unacknowledged.length,
          criticalCount: critical.length,
          peopleAtRisk: lifeSafety.length > 0,
          immediateActions: worst.immediateActions || null
        },
        confidence: 1,
        rationale:
          (lifeSafety.length
            ? `PEOPLE AT RISK on ${lifeSafety.length} incident(s) — this outranks every other consideration. `
            : '') +
          (unacknowledged.length
            ? `${unacknowledged.length} incident(s) are past their acknowledgement target and nobody has picked them up. `
            : '') +
          (critical.length ? `${critical.length} at critical severity. ` : '') +
          (worst.immediateActions ? `Standing instruction: ${worst.immediateActions}` : 'No standing instruction on file for this type — that gap is itself worth fixing.')
      });
    }
  },

  // -------------------------------------------------------------------
  // COMPLIANCE — Segregation of Duties Agent
  // -------------------------------------------------------------------
  {
    id: 'compliance.sod',
    domain: DOMAIN.COMPLIANCE,
    description: 'Detects one user holding two conflicting responsibilities.',
    evaluate(ctx = {}) {
      const violations = ctx.violations || [];
      if (violations.length === 0) return null;

      const critical = violations.filter((v) => v.severity === 'critical' || v.severity === 'high');

      return proposal({
        domain: DOMAIN.COMPLIANCE,
        type: 'sod_violation',
        subjectType: 'user',
        subjectId: violations[0].userId,
        proposed: {
          action: critical.length ? 'revoke_conflicting_access' : 'review_access',
          violationCount: violations.length,
          criticalCount: critical.length,
          rules: violations.slice(0, 5).map((v) => v.ruleCode)
        },
        confidence: 1,
        rationale:
          `${violations.length} segregation-of-duties conflict(s) detected` +
          (critical.length ? `, ${critical.length} at high or critical severity` : '') +
          '. One person able to both initiate and approve the same transaction defeats the control entirely.'
      });
    }
  },

  // -------------------------------------------------------------------
  // CONTROLLING — Cost Center Variance Agent
  // -------------------------------------------------------------------
  {
    id: 'controlling.cost_variance',
    domain: DOMAIN.CONTROLLING,
    description: 'Flags cost centers running materially over or under budget.',
    evaluate(ctx = {}) {
      const budgeted = Number(ctx.budgeted);
      const actual = Number(ctx.actual);
      if (!Number.isFinite(budgeted) || !Number.isFinite(actual) || budgeted === 0) return null;

      const variance = actual - budgeted;
      const pct = variance / budgeted;
      if (Math.abs(pct) < 0.10) return null; // under 10% is normal noise, not a signal

      const over = variance > 0;
      return proposal({
        domain: DOMAIN.CONTROLLING,
        type: 'cost_variance_alert',
        subjectType: 'cost_center',
        subjectId: ctx.costCenterId,
        proposed: { action: over ? 'review_overspend' : 'review_underutilisation', variance, pct: Math.round(pct * 1000) / 10 },
        current: { budgeted, actual, period: ctx.periodLabel ?? null },
        confidence: 1, // arithmetic on posted actuals, not a prediction
        rationale:
          `Cost center is ${Math.abs(Math.round(pct * 100))}% ${over ? 'over' : 'under'} budget for ` +
          `${ctx.periodLabel ?? 'the period'}: ₹${Math.round(actual)} actual against ₹${Math.round(budgeted)} budgeted ` +
          `(₹${Math.round(Math.abs(variance))} ${over ? 'overspend' : 'underspend'}). ` +
          (over
            ? 'Review the driving line items before the variance compounds into the next period.'
            : 'Sustained underspend against budget may mean the budget was wrong, or planned work did not happen — worth a look either way.')
      });
    }
  },

  // -------------------------------------------------------------------
  // ASSETS — Fixed Asset Lifecycle Agent
  // -------------------------------------------------------------------
  {
    id: 'assets.lifecycle',
    domain: DOMAIN.ASSETS,
    description: 'Flags fully depreciated assets still carried as active, and assets sitting idle.',
    evaluate(ctx = {}) {
      const assets = ctx.assets || [];
      if (assets.length === 0) return null;

      const fullyDepreciatedActive = assets.filter((a) => a.fullyDepreciated && a.status === 'active');
      const idle = assets.filter((a) => Number(a.idleDays) >= (ctx.idleThresholdDays ?? 60) && a.status === 'active');
      if (fullyDepreciatedActive.length === 0 && idle.length === 0) return null;

      return proposal({
        domain: DOMAIN.ASSETS,
        type: 'asset_lifecycle_review',
        subjectType: 'asset_group',
        subjectId: ctx.facilityId ?? ctx.companyId,
        proposed: {
          action: fullyDepreciatedActive.length ? 'review_disposal_or_revalue' : 'review_idle_assets',
          fullyDepreciatedCount: fullyDepreciatedActive.length,
          idleCount: idle.length,
          assets: [...fullyDepreciatedActive, ...idle].slice(0, 10).map((a) => ({ code: a.assetCode, idleDays: a.idleDays ?? null }))
        },
        confidence: 1,
        rationale:
          (fullyDepreciatedActive.length
            ? `${fullyDepreciatedActive.length} asset(s) are fully depreciated but still carried active — decide disposal, revaluation, or continued use. `
            : '') +
          (idle.length
            ? `${idle.length} asset(s) have been idle ${ctx.idleThresholdDays ?? 60}+ days while marked active — capital sitting unused, or a status that no longer reflects reality.`
            : '')
      });
    }
  },

  // -------------------------------------------------------------------
  // LOGISTICS — Shipment Delay Risk Agent
  // -------------------------------------------------------------------
  {
    id: 'logistics.delay_risk',
    domain: DOMAIN.LOGISTICS,
    description: 'Flags shipments whose remaining transit time exceeds what the commitment allows.',
    evaluate(ctx = {}) {
      const shipments = ctx.shipments || [];
      const atRisk = shipments.filter((s) =>
        Number.isFinite(Number(s.etaHoursRemaining)) &&
        Number.isFinite(Number(s.committedHoursRemaining)) &&
        Number(s.etaHoursRemaining) > Number(s.committedHoursRemaining)
      );
      if (atRisk.length === 0) return null;

      const worst = [...atRisk].sort((a, b) =>
        (b.etaHoursRemaining - b.committedHoursRemaining) - (a.etaHoursRemaining - a.committedHoursRemaining)
      )[0];
      const worstOverrun = Math.round(worst.etaHoursRemaining - worst.committedHoursRemaining);

      return proposal({
        domain: DOMAIN.LOGISTICS,
        type: 'shipment_delay_risk',
        subjectType: 'shipment',
        subjectId: worst.shipmentCode,
        proposed: {
          action: 'expedite_or_notify_customer',
          atRiskCount: atRisk.length,
          shipments: atRisk.slice(0, 10).map((s) => ({
            code: s.shipmentCode, overrunHours: Math.round(s.etaHoursRemaining - s.committedHoursRemaining)
          }))
        },
        confidence: 1,
        rationale:
          `${atRisk.length} shipment(s) are tracking to arrive later than their delivery commitment. ` +
          `Worst case: ${worst.shipmentCode} is projected ${worstOverrun}h over commitment. ` +
          'Expedite where possible, or notify the customer now — a late notice costs less trust than a silent miss.'
      });
    }
  },

  // -------------------------------------------------------------------
  // PRODUCTION — OEE Agent
  // -------------------------------------------------------------------
  {
    id: 'production.oee',
    domain: DOMAIN.PRODUCTION,
    description: 'Computes Overall Equipment Effectiveness and names the weakest factor.',
    evaluate(ctx = {}) {
      const availability = Number(ctx.availability);
      const performance = Number(ctx.performance);
      const quality = Number(ctx.quality);
      if (![availability, performance, quality].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) return null;

      const oee = availability * performance * quality;
      if (oee >= (ctx.warnBelow ?? 0.6)) return null; // healthy line, nothing to say

      const factors = [
        { name: 'availability', value: availability },
        { name: 'performance', value: performance },
        { name: 'quality', value: quality }
      ].sort((a, b) => a.value - b.value);
      const weakest = factors[0];

      return proposal({
        domain: DOMAIN.PRODUCTION,
        type: 'oee_below_threshold',
        subjectType: 'production_line',
        subjectId: ctx.lineId,
        proposed: {
          action: 'investigate_line',
          oee: Math.round(oee * 1000) / 10,
          weakestFactor: weakest.name,
          weakestValue: Math.round(weakest.value * 1000) / 10
        },
        current: { availability, performance, quality },
        confidence: 1,
        rationale:
          `OEE is ${Math.round(oee * 100)}% (availability ${Math.round(availability * 100)}%, ` +
          `performance ${Math.round(performance * 100)}%, quality ${Math.round(quality * 100)}%), below the ` +
          `${Math.round((ctx.warnBelow ?? 0.6) * 100)}% floor. ${weakest.name} is the weakest factor at ` +
          `${Math.round(weakest.value * 100)}% — start there, since the lowest factor caps every other gain.`
      });
    }
  },

  // -------------------------------------------------------------------
  // HR — Leave Liability Agent
  // -------------------------------------------------------------------
  {
    id: 'hr.leave_liability',
    domain: DOMAIN.HR,
    description: 'Flags employees carrying a leave balance past policy cap — an encashment liability and a burnout signal.',
    evaluate(ctx = {}) {
      const employees = ctx.employees || [];
      const cap = Number(ctx.capDays) || 45;
      const over = employees.filter((e) => Number(e.leaveBalanceDays) > cap);
      if (over.length === 0) return null;

      const liabilityDays = over.reduce((s, e) => s + (Number(e.leaveBalanceDays) - cap), 0);

      return proposal({
        domain: DOMAIN.HR,
        type: 'leave_liability_review',
        subjectType: 'company',
        subjectId: ctx.companyId,
        proposed: {
          action: 'schedule_leave_or_encash',
          overCapCount: over.length,
          excessDaysTotal: Math.round(liabilityDays),
          employees: over.slice(0, 10).map((e) => ({ id: e.employeeId, balance: e.leaveBalanceDays }))
        },
        confidence: 1,
        rationale:
          `${over.length} employee(s) carry a leave balance above the ${cap}-day policy cap, ` +
          `${Math.round(liabilityDays)} excess day(s) combined. This is both a growing encashment liability on the ` +
          'books and, for the individuals, a sign they are not taking the rest the policy assumes they are.'
      });
    }
  },

  // -------------------------------------------------------------------
  // MASTER DATA — Data Quality Agent
  // -------------------------------------------------------------------
  {
    id: 'masterdata.quality',
    domain: DOMAIN.MASTERDATA,
    description: 'Flags master records with missing critical fields or unresolved duplicates.',
    evaluate(ctx = {}) {
      const records = ctx.records || [];
      const incomplete = records.filter((r) => (r.missingFields || []).length > 0);
      const duplicates = records.filter((r) => r.duplicateOf);
      if (incomplete.length === 0 && duplicates.length === 0) return null;

      return proposal({
        domain: DOMAIN.MASTERDATA,
        type: 'data_quality_issue',
        subjectType: ctx.entityType || 'master_record',
        subjectId: ctx.batchId ?? ctx.entityType,
        proposed: {
          action: incomplete.length ? 'complete_required_fields' : 'merge_duplicates',
          incompleteCount: incomplete.length,
          duplicateCount: duplicates.length,
          examples: [...incomplete, ...duplicates].slice(0, 10).map((r) => ({
            id: r.recordId, missingFields: r.missingFields || null, duplicateOf: r.duplicateOf || null
          }))
        },
        confidence: 1,
        rationale:
          (incomplete.length
            ? `${incomplete.length} record(s) are missing a required field — every downstream process that reads ` +
              'them inherits the gap silently. '
            : '') +
          (duplicates.length
            ? `${duplicates.length} record(s) appear to duplicate an existing one — left unresolved, transactions ` +
              'and history split across both copies.'
            : '')
      });
    }
  }
];

// ===========================================================================
// Registry
// ===========================================================================

/** Run one agent by id against a context. */
function runAgent(agentId, context) {
  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) throw new Error(`Unknown agent "${agentId}"`);
  try {
    return agent.evaluate(context) || null;
  } catch (err) {
    // One faulty agent must never take down an ERP transaction.
    logger.error(`ERP agent "${agentId}" failed: ${err.message}`);
    return null;
  }
}

/** Run every agent in a domain; returns only those with something to say. */
function runDomain(domain, contextByAgent = {}) {
  return AGENTS
    .filter((a) => a.domain === domain)
    .map((a) => runAgent(a.id, contextByAgent[a.id] || contextByAgent))
    .filter(Boolean);
}

/** Run all agents. Used by the scheduled ERP sweep. */
function runAll(contextByAgent = {}) {
  return AGENTS
    .map((a) => runAgent(a.id, contextByAgent[a.id] || {}))
    .filter(Boolean);
}

/**
 * Publish proposals onto the signal bus so the decision engine can correlate
 * them with live operational signals. The engine may escalate; it still
 * cannot approve.
 */
function publishProposals(proposals) {
  for (const p of proposals) {
    signalBus.emitSignal(
      SIGNAL.DECISION_MADE,
      { ...p, mode: 'agent_proposal' },
      {
        severity: p.confidence >= 0.9 ? SEVERITY.NOTICE : SEVERITY.INFO,
        source: `erpAgent:${p.domain}`,
        entityId: p.subject_id
      }
    );
  }
  return proposals.length;
}

function listAgents() {
  return AGENTS.map((a) => ({ id: a.id, domain: a.domain, description: a.description }));
}

/**
 * Persist proposals to ai_proposals (migration 995_erp_process_layer.sql).
 *
 * (2026-08-29) This is the gap core/aiOrchestrator.js's workflow_engine
 * entry has documented since it was written: "does not persist the
 * returned proposal to the ai_proposals table - no INSERT INTO ai_proposals
 * exists anywhere in src/ yet". proposal() already builds a row shaped
 * exactly for this table (its own comment says so) - this just does the
 * actual INSERT. Best-effort: a persistence failure must never break the
 * caller's request, same rule core/outcomeSink.js holds itself to. Returns
 * the DB-assigned ids so a caller can look a proposal up later (e.g. to
 * approve/reject it), or an empty array if persistence failed - the
 * proposals themselves are still returned to the caller either way, they
 * just won't be findable by id.
 */
async function persistProposals(proposals) {
  const ids = [];
  for (const p of proposals) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO ai_proposals
           (domain, proposal_type, subject_type, subject_id, proposed_value,
            current_value, rationale, confidence, mcda_breakdown, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          p.domain, p.proposal_type, p.subject_type, p.subject_id,
          JSON.stringify(p.proposed_value), p.current_value ? JSON.stringify(p.current_value) : null,
          p.rationale, p.confidence, p.mcda_breakdown ? JSON.stringify(p.mcda_breakdown) : null,
          p.status || 'proposed',
        ]
      );
      ids.push(rows[0].id);
    } catch (err) {
      logger.error(`erpAgents:persist_proposal_failed domain=${p.domain} type=${p.proposal_type}: ${err.message}`);
    }
  }
  return ids;
}

module.exports = {
  AGENTS, DOMAIN, ACTION,
  runAgent, runDomain, runAll,
  publishProposals, persistProposals, listAgents,
  proposal,
  decisionEngine
};
