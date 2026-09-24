/**
 * Trust & reputation — transaction and dispute adjusted (not vanity stars only)
 */

'use strict';

const actors = new Map();

function getOrCreate(actor_id, type = 'seller') {
  if (!actors.has(actor_id)) {
    actors.set(actor_id, {
      actor_id,
      type,
      identity_level: 'unverified', // unverified | kyc_basic | kyc_full | institutional
      completed_tx: 0,
      disputed_tx: 0,
      cancelled_tx: 0,
      on_time_deliveries: 0,
      late_deliveries: 0,
      quality_passes: 0,
      quality_fails: 0,
      review_score_sum: 0,
      review_count: 0,
      chain_of_custody_events: 0,
    });
  }
  return actors.get(actor_id);
}

function recordEvent(actor_id, event) {
  const a = getOrCreate(actor_id, event.type);
  switch (event.kind) {
    case 'tx_complete':
      a.completed_tx += 1;
      break;
    case 'tx_dispute':
      a.disputed_tx += 1;
      break;
    case 'tx_cancel':
      a.cancelled_tx += 1;
      break;
    case 'delivery_on_time':
      a.on_time_deliveries += 1;
      break;
    case 'delivery_late':
      a.late_deliveries += 1;
      break;
    case 'quality_pass':
      a.quality_passes += 1;
      break;
    case 'quality_fail':
      a.quality_fails += 1;
      break;
    case 'review':
      a.review_score_sum += Number(event.score) || 0;
      a.review_count += 1;
      break;
    case 'custody':
      a.chain_of_custody_events += 1;
      break;
    case 'identity':
      a.identity_level = event.level || a.identity_level;
      break;
    default:
      break;
  }
  return score(actor_id);
}

function score(actor_id) {
  const a = getOrCreate(actor_id);
  const tx = a.completed_tx + a.disputed_tx + a.cancelled_tx;
  const disputeRate = tx ? a.disputed_tx / tx : 0;
  const onTime =
    a.on_time_deliveries + a.late_deliveries
      ? a.on_time_deliveries / (a.on_time_deliveries + a.late_deliveries)
      : 0.5;
  const quality =
    a.quality_passes + a.quality_fails
      ? a.quality_passes / (a.quality_passes + a.quality_fails)
      : 0.5;
  const review = a.review_count ? a.review_score_sum / a.review_count / 5 : 0.5;
  const identityBoost =
    { unverified: 0, kyc_basic: 0.05, kyc_full: 0.1, institutional: 0.12 }[a.identity_level] || 0;

  // Weighted trust 0–100
  let raw =
    (1 - Math.min(1, disputeRate * 2)) * 30 +
    onTime * 25 +
    quality * 25 +
    review * 15 +
    identityBoost * 100 * 0.05;
  // Volume confidence dampener for low N
  const volumeFactor = Math.min(1, Math.log10(Math.max(1, a.completed_tx) + 1) / 2);
  const trust = Math.round(Math.max(0, Math.min(100, raw * (0.5 + 0.5 * volumeFactor))));

  return {
    actor_id,
    trust_score: trust,
    components: {
      dispute_rate: Math.round(disputeRate * 1000) / 1000,
      on_time_rate: Math.round(onTime * 1000) / 1000,
      quality_rate: Math.round(quality * 1000) / 1000,
      review_avg: a.review_count ? Math.round((a.review_score_sum / a.review_count) * 100) / 100 : null,
      identity_level: a.identity_level,
      completed_tx: a.completed_tx,
      volume_factor: Math.round(volumeFactor * 1000) / 1000,
    },
    explain:
      'Trust from completed txs, dispute rate, on-time delivery, quality, reviews, identity — not popularity alone.',
    confidence: 0.5 + 0.5 * volumeFactor,
    advisory: true,
  };
}

async function operate(data = {}) {
  const action = data.action || 'score';
  if (action === 'record') return recordEvent(data.actor_id, data);
  if (action === 'score') return score(data.actor_id);
  if (action === 'snapshot') return { actor: getOrCreate(data.actor_id) };
  return { error: 'Unknown action' };
}

module.exports = { operate, recordEvent, score, getOrCreate };
