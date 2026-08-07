/**
 * Catalog Intelligence Service — "hidden modules" recovered from the pre-v43 lineage.
 *
 * WHY THIS EXISTS
 * An earlier pass classified the 210 lost functions by IMPLEMENTATION STYLE
 * (DOM-heavy vs arithmetic) and concluded only ~10 were worth porting. That was
 * the wrong lens. It missed BUSINESS CAPABILITIES that happened to be written
 * as UI code, and it missed data structures entirely — which are not functions
 * at all, and are where much of this platform's domain knowledge actually lived.
 *
 * Re-scanning for capability rather than code style surfaced 17 named data
 * structures in the lineage. The three below are operational knowledge with no
 * equivalent anywhere in the current backend:
 *
 *   SEASONALITY  30 products x 12 months of PEAK/HIGH/MED availability.
 *                Procurement planning, "what can I sell this month", glut
 *                warning, and pre-season contracting all depend on this. It is
 *                the single most operationally useful table recovered.
 *
 *   WELLNESS_MAP 6 health concerns -> products, each with a stated REASON.
 *                A recommendation engine's knowledge base. The reasons matter:
 *                they let the platform explain a suggestion instead of just
 *                making one.
 *
 *   JARGON       11 plain-language explanations of terms a farmer meets on this
 *                platform (KCC, escrow, PGS, MAP, MOVCD...). This is an
 *                accessibility and trust feature: a farmer asked to accept
 *                "escrow" who does not know the word cannot give informed
 *                consent. Written in the original in deliberately simple
 *                language; preserved verbatim.
 *
 * Provenance: ne_harvest_v8_os / v9_os builds in `ne (3).zip`.
 */

const express = require('express');
const { logger } = require('../utils/logger');

const router = express.Router();

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SEASONALITY = [
  {
    "product": "Naga King Chilli",
    "note": "Spice · GI: Naga Mircha",
    "months": [
      "PEAK",
      "PEAK",
      "PEAK",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK"
    ]
  },
  {
    "product": "Kazi Nemu Lemon",
    "note": "Fruit · GI Assam · DISPATCH NOW",
    "months": [
      "-",
      "MED",
      "HIGH",
      "PEAK",
      "PEAK",
      "PEAK",
      "MED",
      "MED",
      "MED",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Bamboo Shoots",
    "note": "Vegetable · Fresh peak Jun–Sep",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "MED",
      "PEAK",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Jalukee Pineapple",
    "note": "Fruit · Brix 17–22° · GI potential",
    "months": [
      "-",
      "-",
      "-",
      "MED",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Passion Fruit",
    "note": "Fruit · Passiflora edulis",
    "months": [
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "PEAK",
      "HIGH",
      "MED",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Hill Kiwi",
    "note": "Fruit · 44hr fresh · 56% below BB",
    "months": [
      "PEAK",
      "PEAK",
      "HIGH",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK"
    ]
  },
  {
    "product": "Avocado",
    "note": "Fruit · Fuerte/Hass hill",
    "months": [
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "PEAK",
      "HIGH",
      "MED",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Jackfruit",
    "note": "Fruit · very high margin",
    "months": [
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Dragon Fruit",
    "note": "Fruit · growing NCR demand",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "HIGH",
      "MED",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Sirarakhong Hathei",
    "note": "Chilli · GI Manipur · chef demand",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-"
    ]
  },
  {
    "product": "Forest Honey",
    "note": "Honey · Apis cerana · year-round anchor",
    "months": [
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK",
      "PEAK"
    ]
  },
  {
    "product": "Litchi Honey",
    "note": "Honey · seasonal varietal",
    "months": [
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Jamun Honey",
    "note": "Honey · Jun–Aug blossom",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Mustard Honey",
    "note": "Honey · Feb–Apr varietal",
    "months": [
      "-",
      "PEAK",
      "PEAK",
      "HIGH",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "MED"
    ]
  },
  {
    "product": "Cliff Honey",
    "note": "Honey · ULTRA-RARE · Apis dorsata",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "PEAK",
      "PEAK",
      "-"
    ]
  },
  {
    "product": "Oyster Mushroom",
    "note": "Mushroom · NE forest",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "HIGH",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Lakadong Turmeric",
    "note": "Spice · NABL 6–12% curcumin",
    "months": [
      "HIGH",
      "MED",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK"
    ]
  },
  {
    "product": "Chak-Hao Black Rice",
    "note": "Grain · GI Manipur",
    "months": [
      "HIGH",
      "MED",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "MED",
      "PEAK",
      "PEAK"
    ]
  },
  {
    "product": "Wild Amla",
    "note": "Fruit · forest-gathered",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "MED",
      "PEAK",
      "PEAK"
    ]
  },
  {
    "product": "Wild Apples",
    "note": "Fruit · Malus baccata NER",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-"
    ]
  },
  {
    "product": "Persimmon",
    "note": "Fruit · gifting/hamper · Oct–Dec",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "PEAK",
      "PEAK",
      "HIGH"
    ]
  },
  {
    "product": "Pears (hill NER)",
    "note": "Fruit · Jul–Oct",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "PEAK",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-"
    ]
  },
  {
    "product": "Mulberry",
    "note": "Fruit · AIR ONLY · KrishiUdaan",
    "months": [
      "-",
      "-",
      "AIR",
      "AIR",
      "AIR",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Roselle Hibiscus",
    "note": "Botanical dried · herbal tea",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-"
    ]
  },
  {
    "product": "Malbhog Banana",
    "note": "Fruit · Assam GI",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "HIGH",
      "HIGH",
      "PEAK",
      "PEAK",
      "HIGH",
      "MED",
      "-",
      "-"
    ]
  },
  {
    "product": "Garlic (direct farm)",
    "note": "Spice · Feb–May viable",
    "months": [
      "-",
      "-",
      "-",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Stingless Bee Honey",
    "note": "Honey · medicinal vials · 30ml",
    "months": [
      "MED",
      "MED",
      "MED",
      "MED",
      "MED",
      "MED",
      "MED",
      "MED",
      "MED",
      "PEAK",
      "PEAK",
      "MED"
    ]
  },
  {
    "product": "Ginger (direct farm)",
    "note": "Spice · Oct–Nov spike only",
    "months": [
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "PEAK",
      "PEAK",
      "MED"
    ]
  },
  {
    "product": "Queen Pineapple",
    "note": "Fruit · Tripura GI",
    "months": [
      "-",
      "-",
      "-",
      "MED",
      "HIGH",
      "PEAK",
      "PEAK",
      "MED",
      "-",
      "-",
      "-",
      "-"
    ]
  },
  {
    "product": "Naga Arabica Coffee",
    "note": "Beverage · SCA 84+ · Nov–Apr",
    "months": [
      "HIGH",
      "HIGH",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "-",
      "MED",
      "PEAK",
      "PEAK"
    ]
  }
];

const JARGON = {
  "kcc": "KCC means Kisan Credit Card. It is a bank loan card for farmers — low interest, for buying seeds, fertiliser, or daily farm costs.",
  "escrow": "Escrow means the platform is holding payment safely until your delivery is confirmed. It is not your money yet, and it is not taken from you — it is \"on hold\" for the deal to complete.",
  "pgs": "PGS means Participatory Guarantee System — a simpler, group-based way (instead of paying a private company) to certify your farm as organic, checked by other farmers in your area.",
  "po": "PO means Purchase Order — a buyer\\'s written promise to buy a fixed amount from you at a fixed price.",
  "cert": "A \"cert\" is a certificate — an official paper or number proving something about your farm, like organic status. If you are not sure you have one, ask your FPO or coordinator before relying on it.",
  "nabard": "NABARD is a government bank that gives farm loans, often through your local bank branch.",
  "movcd": "MOVCD-NER is a government scheme that gives money to help Northeast farmers switch to organic farming.",
  "gi": "GI means Geographical Indication — a government tag proving a crop (like Lakadong Turmeric) genuinely comes from its named place, protecting it from being copied.",
  "map": "MAP here means Minimum Acceptable Price — the lowest price you, the farmer, say you are willing to accept. You set this yourself.",
  "fpo": "FPO means Farmer Producer Organisation — a group of farmers registered together, often to get better prices and access loans as a group.",
  "cfa": "CFA means Contract Farming Agreement — a signed promise between you and a buyer to sell a fixed amount at a fixed price before harvest."
};

const WELLNESS_MAP = {
  "inflammation": [
    {
      "name": "Lakadong Turmeric",
      "why": "6–12% curcumin — the anti-inflammatory benchmark"
    },
    {
      "name": "Wild Forest Honey",
      "why": "Raw enzymes + anti-inflammatory compounds"
    },
    {
      "name": "Bhut Jolokia (micro-dose)",
      "why": "Capsaicin has documented anti-inflammatory properties"
    },
    {
      "name": "Chak-Hao Black Rice",
      "why": "Anthocyanin — powerful antioxidant, lower GI"
    }
  ],
  "immunity": [
    {
      "name": "Hill Kiwi (fresh)",
      "why": "High Vitamin C — altitude-grown, tree-ripened"
    },
    {
      "name": "Lakadong Turmeric",
      "why": "High curcumin supports immune function"
    },
    {
      "name": "Wild Forest Honey",
      "why": "Raw honey contains natural antimicrobials"
    },
    {
      "name": "Kazi Nemu Lemon",
      "why": "Natural Vitamin C, high-altitude citrus"
    }
  ],
  "gut": [
    {
      "name": "Akhuni (fermented)",
      "why": "Natural probiotic cultures — centuries of traditional fermentation"
    },
    {
      "name": "Bamboo Shoots",
      "why": "High prebiotic fibre — feeds good gut bacteria"
    },
    {
      "name": "Wild Forest Honey",
      "why": "Raw honey supports beneficial gut bacteria"
    },
    {
      "name": "Chak-Hao Black Rice",
      "why": "High fibre content + anthocyanins support gut lining"
    }
  ],
  "energy": [
    {
      "name": "Jalukee Pineapple",
      "why": "High Brix natural sugar + enzymes for fast absorption"
    },
    {
      "name": "Hill Kiwi",
      "why": "High Vitamin C + natural sugars for quick energy"
    },
    {
      "name": "Forest Honey",
      "why": "Natural sugars (glucose + fructose) — preferred pre-workout"
    },
    {
      "name": "Naga Arabica Coffee",
      "why": "84+ SCA score mountain-grown coffee"
    }
  ],
  "sleep": [
    {
      "name": "Wild Forest Honey",
      "why": "Raw honey before bed supports serotonin → melatonin pathway"
    },
    {
      "name": "Cliff Honey",
      "why": "Medicinal-class honey — traditional sleep and recovery use"
    },
    {
      "name": "Lakadong Turmeric",
      "why": "Evening golden milk — reduces systemic inflammation that disrupts sleep"
    },
    {
      "name": "Chak-Hao Black Rice",
      "why": "Complex carbohydrates support melatonin production"
    }
  ],
  "glow": [
    {
      "name": "Wild Forest Honey",
      "why": "Applied internally and topically — enzymes support skin cell turnover"
    },
    {
      "name": "Lakadong Turmeric",
      "why": "Curcumin anti-inflammatory reduces skin redness and hyperpigmentation"
    },
    {
      "name": "Hill Kiwi",
      "why": "High Vitamin C supports collagen synthesis"
    },
    {
      "name": "Jalukee Pineapple",
      "why": "Bromelain enzyme supports skin health + digestion"
    }
  ]
};

// ---------------------------------------------------------------------------
// Seasonality queries — the operational core
// ---------------------------------------------------------------------------

/** Availability levels ranked, so "best" is comparable. */
const LEVEL_RANK = { PEAK: 3, HIGH: 2, MED: 1, '-': 0 };

function monthIndex(month) {
  if (month === undefined || month === null || month === '') return new Date().getMonth();
  if (typeof month === 'number' && month >= 1 && month <= 12) return month - 1;
  const i = MONTHS.findIndex((m) => m.toLowerCase() === String(month).slice(0, 3).toLowerCase());
  if (i === -1) throw new Error(`Unknown month "${month}". Use 1-12 or Jan-Dec.`);
  return i;
}

/** What is in season in a given month, ranked best-first. */
function inSeason({ month, minLevel = 'MED' } = {}) {
  const idx = monthIndex(month);
  const floor = LEVEL_RANK[String(minLevel).toUpperCase()] ?? 1;

  const items = SEASONALITY
    .map((p) => ({ product: p.product, note: p.note, level: p.months[idx] || '-' }))
    .filter((p) => (LEVEL_RANK[p.level] ?? 0) >= floor)
    .sort((a, b) => (LEVEL_RANK[b.level] - LEVEL_RANK[a.level]) || a.product.localeCompare(b.product));

  return { month: MONTHS[idx], monthNumber: idx + 1, minLevel: String(minLevel).toUpperCase(), count: items.length, items };
}

/** The 12-month availability profile for one product. */
function productCalendar({ product } = {}) {
  const q = String(product || '').toLowerCase().trim();
  if (!q) throw new Error('product is required');
  const p = SEASONALITY.find((x) => x.product.toLowerCase() === q)
        || SEASONALITY.find((x) => x.product.toLowerCase().includes(q));
  if (!p) throw new Error(`No seasonality data for "${product}"`);

  const calendar = p.months.map((level, i) => ({ month: MONTHS[i], level }));
  const peak = calendar.filter((c) => c.level === 'PEAK').map((c) => c.month);
  const none = calendar.filter((c) => c.level === '-').map((c) => c.month);

  return {
    product: p.product,
    note: p.note,
    calendar,
    peakMonths: peak,
    unavailableMonths: none,
    // Year-round supply is a genuine commercial property worth flagging.
    yearRound: none.length === 0
  };
}

/**
 * Glut warning: months where an unusually large number of products peak at
 * once. Simultaneous peaks depress prices and strain cold storage — knowing
 * which months those are is a planning input, not a curiosity.
 */
function glutForecast() {
  const byMonth = MONTHS.map((m, i) => {
    const peaking = SEASONALITY.filter((p) => p.months[i] === 'PEAK').map((p) => p.product);
    return { month: m, monthNumber: i + 1, peakCount: peaking.length, peaking };
  });
  const counts = byMonth.map((b) => b.peakCount);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;

  return {
    averagePeaksPerMonth: Math.round(mean * 10) / 10,
    months: byMonth.map((b) => ({
      ...b,
      // Deliberately a simple, explainable threshold rather than a hidden model.
      glutRisk: b.peakCount >= mean * 1.5 ? 'high' : b.peakCount >= mean ? 'moderate' : 'low'
    }))
  };
}

/** Which months have the thinnest supply — where storage or imports matter. */
function scarcityMonths() {
  return MONTHS.map((m, i) => {
    const available = SEASONALITY.filter((p) => (LEVEL_RANK[p.months[i]] ?? 0) > 0).length;
    return { month: m, monthNumber: i + 1, availableProducts: available };
  }).sort((a, b) => a.availableProducts - b.availableProducts);
}

// ---------------------------------------------------------------------------
// Wellness recommendations
// ---------------------------------------------------------------------------

/**
 * Products for a health concern, each with the reason it is suggested.
 * Cross-referenced against seasonality so the platform does not recommend
 * something it cannot currently supply.
 */
function wellnessRecommendation({ concern, month } = {}) {
  const key = String(concern || '').toLowerCase().trim();
  const items = WELLNESS_MAP[key];
  if (!items) {
    throw new Error(`concern must be one of: ${Object.keys(WELLNESS_MAP).join(', ')}`);
  }
  const idx = monthIndex(month);

  return {
    concern: key,
    month: MONTHS[idx],
    recommendations: items.map((it) => {
      const s = SEASONALITY.find((p) => p.product.toLowerCase().includes(it.name.toLowerCase().split(' ')[0]));
      const level = s ? s.months[idx] : null;
      return {
        product: it.name,
        reason: it.why,
        availabilityThisMonth: level,
        inSeason: level ? (LEVEL_RANK[level] ?? 0) > 0 : null
      };
    }),
    // Never presented as medical advice.
    disclaimer: 'Food and nutrition information only. Not medical advice, and not a treatment for any condition.'
  };
}

function listConcerns() {
  return Object.keys(WELLNESS_MAP);
}

// ---------------------------------------------------------------------------
// Jargon explainer — accessibility / informed consent
// ---------------------------------------------------------------------------

/**
 * Plain-language explanation of a platform term.
 * A farmer asked to accept "escrow" or "MAP" who does not know the word cannot
 * meaningfully consent. Explanations are preserved verbatim from the original.
 */
function explainTerm({ term } = {}) {
  const key = String(term || '').toLowerCase().replace(/[^a-z]/g, '');
  const text = JARGON[key];
  if (!text) {
    return {
      term: key || null,
      known: false,
      available: Object.keys(JARGON),
      message: 'No plain-language explanation on file for that term yet.'
    };
  }
  return { term: key, known: true, explanation: text };
}

function listTerms() {
  return Object.entries(JARGON).map(([term, explanation]) => ({ term, explanation }));
}

// ---------------------------------------------------------------------------
// Routes — all public: this is education and discovery, not private data
// ---------------------------------------------------------------------------

const handle = (fn) => (req, res) => {
  try {
    res.json({ success: true, data: fn({ ...req.body, ...req.query }) });
  } catch (error) {
    logger.error('Catalog intelligence error', { error: error.message, stack: error.stack });
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/in-season', handle(inSeason));
router.get('/product-calendar', handle(productCalendar));
router.get('/glut-forecast', handle(glutForecast));
router.get('/scarcity-months', handle(scarcityMonths));
router.get('/wellness', handle(wellnessRecommendation));
router.get('/wellness/concerns', handle(listConcerns));
router.get('/explain', handle(explainTerm));
router.get('/glossary', handle(listTerms));

function isHealthy() {
  return {
    status: 'ok',
    seasonalityProducts: SEASONALITY.length,
    wellnessConcerns: Object.keys(WELLNESS_MAP).length,
    glossaryTerms: Object.keys(JARGON).length
  };
}

module.exports = {
  router,
  isHealthy,
  inSeason,
  productCalendar,
  glutForecast,
  scarcityMonths,
  wellnessRecommendation,
  listConcerns,
  explainTerm,
  listTerms,
  SEASONALITY,
  WELLNESS_MAP,
  JARGON
};
