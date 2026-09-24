/**
 * Deep Systems Analytics — health OS quantitative layer
 */

function scoreProtocolCoverage(matchedProtocols = []) {
  const cats = new Set(matchedProtocols.map((p) => p.category));
  return {
    protocol_hits: matchedProtocols.length,
    categories_touched: [...cats],
    coverage_score: Math.min(100, matchedProtocols.length * 12 + cats.size * 8),
  };
}

function computeCompositeRisk({ herd_risk, clinical_flags = [], interactions = [], urgency }) {
  let score = 0;
  const factors = [];
  if (herd_risk?.score) {
    score += herd_risk.score * 0.5;
    factors.push({ id: 'herd', points: herd_risk.score * 0.5 });
  }
  score += clinical_flags.length * 8;
  if (clinical_flags.length) factors.push({ id: 'clinical_flags', points: clinical_flags.length * 8 });
  score += interactions.filter((i) => i.severity === 'major').length * 15;
  score += interactions.filter((i) => i.severity === 'moderate').length * 6;
  if (urgency === 'emergency') score += 40;
  if (urgency === 'urgent') score += 20;
  score = Math.min(100, Math.round(score));
  let band = 'low';
  if (score >= 70) band = 'critical';
  else if (score >= 45) band = 'high';
  else if (score >= 25) band = 'moderate';
  return { composite_risk_score: score, band, factors };
}

function analyticsBundle(payload = {}) {
  const protocol_coverage = scoreProtocolCoverage(payload.protocols || []);
  const composite = computeCompositeRisk(payload);
  return {
    engine: 'SystemsAnalyticsEngine',
    protocol_coverage,
    composite_risk: composite,
    population_hooks: {
      note: 'Ready for longitudinal store: adherence, outbreak curves, medication interaction rates',
      suggested_kpis: [
        'time_to_escalation',
        'notifiable_detection_rate',
        'ams_alert_rate',
        'asian_bmi_risk_band_distribution',
        'protocol_match_precision',
      ],
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  analyticsBundle,
  computeCompositeRisk,
  scoreProtocolCoverage,
};
