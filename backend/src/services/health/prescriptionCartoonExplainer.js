/**
 * AI prescription → educational cartoon storyboard
 * Nutrition + Veterinary: what / how / why / benefits sequence
 * Returns structured scenes for image/video generators (not fake binary images).
 */

'use strict';

const { randomUUID } = require('crypto');

function nutritionScenes(rx = {}) {
  const item = rx.item || rx.food || rx.supplement || 'balanced plate';
  const condition = rx.condition || 'general wellness';
  const amount = rx.amount || rx.portion || 'as advised';
  return [
    {
      scene: 1,
      title: 'What is recommended',
      narration: `We recommend ${item} (${amount}) for ${condition}.`,
      visual: `Friendly cartoon plate highlighting ${item}, soft clinic colors, no brand logos`,
      captions: ['WHAT', item],
    },
    {
      scene: 2,
      title: 'How to take / prepare',
      narration: rx.how || `Take ${item} with regular meals unless your clinician says otherwise.`,
      visual: 'Cartoon clock + simple step icons: measure, prepare, consume',
      captions: ['HOW', 'Simple steps'],
    },
    {
      scene: 3,
      title: 'Why this helps',
      narration:
        rx.why ||
        `${item} supports nutrient needs linked to ${condition}. This is educational, not a substitute for a licensed clinician.`,
      visual: 'Cartoon body silhouette with gentle highlight on relevant system (gut/energy/bone)',
      captions: ['WHY', condition],
    },
    {
      scene: 4,
      title: 'Benefits sequence',
      narration: rx.benefits_sequence || 'Day 1–3: habit · Week 1: energy/digestion cues · Ongoing: clinical follow-up',
      visual: 'Timeline cartoon: seed → plant → fruit metaphor for gradual benefit',
      captions: ['BENEFITS', 'Over time'],
    },
    {
      scene: 5,
      title: 'Safety',
      narration:
        rx.safety ||
        'Stop and contact a licensed professional if symptoms worsen. Not for emergency use.',
      visual: 'Cartoon warning soft-style: call clinician icon',
      captions: ['SAFETY', 'Licensed care first'],
    },
  ];
}

function veterinaryScenes(rx = {}) {
  const drug = rx.drug || rx.medicine || rx.treatment || 'prescribed treatment';
  const species = rx.species || 'cattle';
  const dose = rx.dose || 'as per label / vet order';
  return [
    {
      scene: 1,
      title: 'What is prescribed',
      narration: `For your ${species}: ${drug} — ${dose}. Only under a licensed veterinarian.`,
      visual: `Cartoon ${species} with medicine bottle icon, calm farm background`,
      captions: ['WHAT', drug],
    },
    {
      scene: 2,
      title: 'How to give',
      narration: rx.how || 'Follow route (oral/injectable) exactly as the veterinarian demonstrated.',
      visual: 'Step cartoon: restrain safely → measure dose → administer → record',
      captions: ['HOW', 'Vet method'],
    },
    {
      scene: 3,
      title: 'Why',
      narration:
        rx.why ||
        `This targets the diagnosed issue. Do not share leftover drugs across animals without vet advice.`,
      visual: 'Simple germ/injury cartoon being resolved — non-graphic',
      captions: ['WHY', 'Targeted care'],
    },
    {
      scene: 4,
      title: 'Withdrawal & benefits',
      narration:
        rx.withdrawal ||
        'Observe milk/meat withdrawal if applicable. Benefits appear after the full course — do not stop early unless the vet says so.',
      visual: 'Calendar cartoon + milk/meat pause icon if food animal',
      captions: ['WITHDRAWAL', 'Full course'],
    },
    {
      scene: 5,
      title: 'When to call the vet',
      narration: rx.escalation || 'Call the vet if breathing is hard, animal collapses, or condition worsens in 24h.',
      visual: 'Phone + vet cartoon, emergency soft alert',
      captions: ['ALERT', 'Call vet'],
    },
  ];
}

function explain(domain, prescription = {}) {
  const d = (domain || prescription.domain || 'nutrition').toLowerCase();
  const scenes =
    d === 'veterinary' || d === 'vet' || d === 'animal'
      ? veterinaryScenes(prescription)
      : nutritionScenes(prescription);
  const storyboard_id = `SB-${randomUUID().slice(0, 8)}`;
  return {
    storyboard_id,
    domain: d.startsWith('vet') ? 'veterinary' : 'nutrition',
    style: 'educational_cartoon',
    audience: d.startsWith('vet') ? 'farmer_livestock_keeper' : 'patient_family',
    scenes,
    image_prompts: scenes.map((s) => ({
      scene: s.scene,
      prompt: `${s.visual}. Style: clean educational 2D cartoon, high readability, Indian rural-friendly, no text overload, ${s.captions.join(' / ')}`,
    })),
    render_contract: {
      engine: 'external_image_or_video_generator',
      formats: ['png_sequence', 'mp4_slideshow', 'whatsapp_sticker_pack'],
      note: 'This service emits storyboard + prompts; actual pixels require Grok Imagine / SD / vendor API keys',
    },
    safety_floor:
      'Educational only. Veterinary drugs and clinical diets require licensed professional authority. Not emergency care.',
    confidence: 0.88,
    advisory: true,
  };
}

module.exports = { explain, nutritionScenes, veterinaryScenes };
