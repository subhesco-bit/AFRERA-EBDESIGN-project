/**
 * Human interaction layer — visualisation payloads + audio/TTS narratives
 * Frontends render charts from viz_spec; TTS engines speak audio_script.
 */

const decisionEng = require('./DecisionQualityEngine');

function buildVisualization(input = {}) {
  const charts = [];

  if (input.confidence != null || input.confidence_signals) {
    const fused = input.confidence?.value != null
      ? input.confidence
      : decisionEng.fuseConfidence(input.confidence_signals || []);
    charts.push({
      type: 'gauge',
      id: 'confidence_gauge',
      title: 'Decision confidence',
      value: Math.round((fused.value || 0) * 100),
      max: 100,
      bands: [
        { to: 40, color: 'red' },
        { to: 70, color: 'amber' },
        { to: 100, color: 'green' },
      ],
    });
  }

  if (input.escalation?.score != null) {
    charts.push({
      type: 'bar',
      id: 'escalation_factors',
      title: 'Escalation factors',
      data: (input.escalation.factors || []).map((f) => ({
        label: f.id,
        value: f.pts,
      })),
    });
  }

  if (input.herd_risk?.score != null) {
    charts.push({
      type: 'gauge',
      id: 'herd_risk',
      title: 'Herd risk',
      value: input.herd_risk.score,
      max: 100,
    });
  }

  if (input.microbiome_indices) {
    const idx = input.microbiome_indices;
    charts.push({
      type: 'radar',
      id: 'soil_biology',
      title: 'Soil biology indices',
      axes: [
        { label: 'Fertility', value: idx.fertility_index || 0 },
        { label: 'Disease suppression', value: idx.disease_suppression_index || 0 },
        { label: 'Carbon biology', value: idx.carbon_biology_index || 0 },
      ],
    });
  }

  if (input.bmi_dual) {
    charts.push({
      type: 'dual_marker',
      id: 'bmi_dual',
      title: 'BMI WHO vs Asian cutoffs',
      value: input.bmi_dual.value,
      markers: [
        { label: 'WHO overweight', at: 25 },
        { label: 'Asian increased risk', at: 23 },
      ],
    });
  }

  if (input.workflow?.history) {
    charts.push({
      type: 'timeline',
      id: 'workflow_timeline',
      title: 'Case workflow',
      events: input.workflow.history.map((h) => ({
        label: h.state,
        at: h.at,
      })),
    });
  }

  return {
    viz_spec_version: '1.0',
    charts,
    layout_hint: 'dashboard_cards',
    accessibility: { color_blind_safe: true, labels_required: true },
  };
}

function buildAudioScript(input = {}) {
  const lang = input.lang || 'en';
  const decision = input.decision || {};
  const conf = Math.round((decision.confidence?.value || input.confidence || 0) * 100);

  // Short spoken narrative for TTS
  const en = [
    input.greeting || 'Here is your decision support summary.',
    decision.action ? `Recommended action: ${String(decision.action).replace(/_/g, ' ')}.` : '',
    conf ? `Confidence is about ${conf} percent.` : '',
    decision.escalation?.band
      ? `Escalation level: ${decision.escalation.band.replace(/_/g, ' ')}.`
      : '',
    input.key_point || '',
    'This is guidance only. Please consult a qualified professional for final decisions.',
  ]
    .filter(Boolean)
    .join(' ');

  // Hindi short variant (transliteration for TTS engines that accept Latin)
  const hi = [
    'Yeh aapke decision support ka saar hai.',
    decision.action ? `Sujhav: ${String(decision.action).replace(/_/g, ' ')}.` : '',
    conf ? `Vishwas lagbhag ${conf} pratishat hai.` : '',
    'Yeh keval margdarshan hai. Antim nirnay ke liye yogya peshevar se salah lein.',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    audio_script_version: '1.0',
    language: lang,
    text: lang === 'hi' ? hi : en,
    alternatives: { en, hi },
    tts_hints: {
      rate: 'medium',
      pause_after_sentences: true,
      max_seconds: 45,
    },
  };
}

function buildInteractionBundle(input = {}) {
  const decision =
    input.decision ||
    decisionEng.buildDecisionPackage({
      action: input.action,
      confidence: input.confidence,
      confidence_signals: input.confidence_signals,
      urgency: input.urgency,
      notifiable: input.notifiable,
      summary: input.summary,
      rationale: input.rationale,
      modules_touched: input.modules_touched,
      next_steps: input.next_steps,
    });

  return {
    interaction_id: decision.decision_id,
    decision,
    visualization: buildVisualization({
      confidence: decision.confidence,
      escalation: decision.escalation,
      herd_risk: input.herd_risk,
      microbiome_indices: input.microbiome_indices,
      bmi_dual: input.bmi_dual,
      workflow: input.workflow,
    }),
    audio: buildAudioScript({
      decision,
      lang: input.lang,
      key_point: input.key_point,
      greeting: input.greeting,
    }),
    human_channels: {
      plain_text: decision.human_message,
      cards: [
        { title: 'Action', body: decision.action },
        { title: 'Confidence', body: `${Math.round(decision.confidence.value * 100)}%` },
        { title: 'Escalation', body: decision.escalation.band },
      ],
      accessibility: {
        screen_reader_summary: decision.human_message,
        high_contrast_ok: true,
      },
    },
  };
}

module.exports = {
  buildVisualization,
  buildAudioScript,
  buildInteractionBundle,
};
