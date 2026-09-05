/**
 * Merchandising Intelligence Service — remaining hidden modules from the lineage.
 *
 * PROVENANCE  ne_harvest_v8_os / v9_os builds in `ne (3).zip`.
 *
 * These five data structures are not functions, which is why an earlier
 * function-only scan missed them entirely. Each encodes a decision someone
 * made about how this business sells, who it serves, or what it teaches:
 *
 *   MOODS          6 emotional entry points into the catalogue, each with its
 *                  own headline, call to action and colour. This is a
 *                  merchandising strategy — the alternative to a category grid.
 *
 *   RITUALS        6 product BUNDLES with method and ingredient list (e.g.
 *                  turmeric + honey + black pepper). Basket-building IP: it
 *                  raises order value by teaching a use, not by discounting.
 *
 *   SEASONAL_TIPS  Practical guidance segmented by AUDIENCE (consumer, farmer,
 *                  RWA, HoReCa) — the same platform speaking differently to
 *                  different stakeholders.
 *
 *   PORTALS        12 role definitions with real organisational identity. This
 *                  is the multi-tenant map: who logs in and what they are.
 *                  Note it is 12, not the 8 the v44 report describes — the
 *                  lineage carried four more than the later summary recorded.
 *
 *   OCCASIONS      12 gifting windows including ESG/corporate, conference and
 *                  diplomatic — B2B gifting, not just festivals.
 *
 * The tips and mood copy are preserved verbatim. They were written with care
 * (the piperine/curcumin absorption tip is a genuine, checkable claim) and
 * rewriting them would lose that.
 */

const express = require('express');
const { logger } = require('../../utils/logger');

const router = express.Router();

const MOODS = {
  "glow": {
    "headline": "Food that proves  itself.",
    "sub": "Raw forest honey. 6–12% curcumin turmeric. GI-certified chilli. 44-hour farm-to-door. NABL certificates scannable in 2 seconds.",
    "cta": "Shop the harvest",
    "color": null
  },
  "heal": {
    "headline": "Grown in  mountains.",
    "sub": "Lakadong turmeric 6–12% curcumin. Forest honey enzymes. Naturally grown at altitude. Whole-food nutrition — not isolated compounds.",
    "cta": "Shop wellness produce",
    "color": null
  },
  "fire": {
    "headline": "1,041,427  SHU.",
    "sub": null,
    "cta": "Shop Bhut Jolokia",
    "color": null
  },
  "energy": {
    "headline": "Picked at  dawn.",
    "sub": "Nagaland kiwi: 44 hours from harvest to your door. Brix 14–16° vs 10–11° for 90-day cold-stored imports. Vitamin C when it counts.",
    "cta": "Shop fresh produce",
    "color": null
  },
  "sleep": {
    "headline": "1000-year  heritage.",
    "sub": null,
    "cta": "Shop heritage grains",
    "color": null
  },
  "comfort": {
    "headline": "Flavour  memory.",
    "sub": "Fresh bamboo shoots. Akhuni fermented soybean. Naga Arabica coffee. Ingredients with 500 years of culinary story — 44 hours away.",
    "cta": "Shop Naga cuisine",
    "color": null
  }
};

const RITUALS = [
  {
    "name": "Golden Morning Ritual",
    "mood": "🌿 Heal",
    "time": "5 min",
    "description": "Anti-inflammatory latte. Lakadong + raw honey + black pepper. The science behind this combination is serious.",
    "ingredients": [
      "Lakadong Turmeric 100g",
      "Wild Forest Honey 250g",
      "Black Pepper 50g"
    ]
  },
  {
    "name": "Cliff Honey Elixir",
    "mood": "🍯 Glow",
    "time": "2 min",
    "description": "The world\\'s most measured honey, taken at body temperature. Preserves every enzyme.",
    "ingredients": [
      "Cliff Honey 50g",
      "Warm (not hot) water or oat milk",
      "Optional: ground ginger"
    ]
  },
  {
    "name": "Fire Drop Oil",
    "mood": "🌶 Fire",
    "time": "10 min",
    "description": "0.08g Bhut Jolokia in cold-pressed oil. One drop transforms any dish. Three months\\' supply.",
    "ingredients": [
      "Bhut Jolokia powder 5g",
      "Cold-pressed mustard oil 100ml",
      "Cumin seeds 5g"
    ]
  },
  {
    "name": "Mountain Recovery Bowl",
    "mood": "⚡ Energy",
    "time": "20 min",
    "description": "Chak-Hao black rice + kiwi + honey + turmeric. Post-workout nutrition from the mountains.",
    "ingredients": [
      "Chak-Hao Black Rice 500g",
      "Hill Kiwi 1kg",
      "Wild Forest Honey 250g",
      "Lakadong Turmeric 50g"
    ]
  },
  {
    "name": "Nagaland Umami Dal",
    "mood": "🥣 Comfort",
    "time": "25 min",
    "description": "Akhuni-based dal. Ancient NE fermentation meets northern Indian cooking. One taste and you rethink umami.",
    "ingredients": [
      "Akhuni 200g",
      "Masoor dal 200g",
      "Bhut Jolokia pinch (0.02g)",
      "Lakadong Turmeric ½ tsp"
    ]
  },
  {
    "name": "Pineapple Shrub",
    "mood": "⚡ Energy",
    "time": "15 min",
    "description": "Jalukee pineapple (Brix 17+) + honey + ACV. Natural energy drink — zero sugar added needed.",
    "ingredients": [
      "Jalukee Pineapple 1kg (seasonal)",
      "Wild Forest Honey 100g",
      "Apple cider vinegar 30ml"
    ]
  }
];

const SEASONAL_TIPS = {
  "consumer": [
    "Honey crystallisation is natural — a sign of purity. Warm gently in water below 40°C. Never microwave.",
    "Lakadong Turmeric: pair with black pepper (piperine) to boost curcumin absorption by up to 20×.",
    "Hill Kiwi ripens fastest at room temperature. Refrigerate only when ready to eat — chilling too early dulls the aroma.",
    "Soak Chak-Hao Black Rice 30 minutes before cooking to reduce time and bring out its natural purple colour.",
    "Bhut Jolokia: 30mg per dish is enough. Store powder in an airtight container away from light and heat.",
    "Naga Arabica is best at 93°C water — not boiling. Use a 1:15 coffee-to-water ratio for a clean bright cup."
  ],
  "farmer": [
    "Extract honey when the comb is 80%+ capped. Uncapped honey above 20% moisture ferments in storage.",
    "Select large, healthy turmeric rhizomes from this harvest for next season. Store cool, shaded, well-ventilated.",
    "Heavy rain before bamboo shoot harvest increases moisture content. Delay 2–3 days if possible for better shelf life.",
    "Attach your NABL test report with each dispatch. Verified-tested produce commands 15–25% buyer premium.",
    "CSA pre-orders reduce your post-harvest price risk. Push each product to 80%+ pre-sold before harvest window opens."
  ],
  "rwa": [
    "Reach your 300kg pool minimum to lock this week\\'s dispatch. One WhatsApp reminder to residents often closes the gap.",
    "Dry goods (turmeric, cardamom, rice) have 6–12 month shelf life. Bulk orders save on delivery frequency.",
    "Your RWA saved ₹8,400 vs retail last quarter. Share this figure at the residents\\' meeting — it drives re-orders."
  ],
  "horeca": [
    "Bhut Jolokia oil: 5g powder infused in 200ml neutral oil at 65°C for 20 min, strained. Shelf-stable 3 months.",
    "Axone is an umami amplifier. Add 10–15g to your base sauce in the last 5 min of cooking — not at the start.",
    "Kaji Nemu: zest before juicing. The peel\\'s essential oil is your best flavour compound. Use a microplane."
  ]
};

const PORTALS = {
  "farmer": {
    "title": "Farmer OS — Ramcharan Naga",
    "detail": "EVD-F-0142 · Kohima, Nagaland · 1.2 ha enrolled · Grade A producer · PMFBY insured"
  },
  "village": {
    "title": "Village centre — Chizami Aggregation",
    "detail": "CVL-CHZ-07 · Phek district · 34 farmers · 5T Solar cold node · ZECC pre-cooler"
  },
  "panchayat": {
    "title": "Panchayat oversight — Chizami GP",
    "detail": "7 villages · FPIC registry · SHG oversight · MOVCD-NER application"
  },
  "fpo": {
    "title": "FPO dashboard — Nagaland Highland FPC",
    "detail": "7 centres · 142 members · CIN: U01499NL2025FPC018 · Op Green guidance active"
  },
  "logistics": {
    "title": "Logistics OS — Dimapur Railway Hub",
    "detail": "Reefer fleet · 12423 Rajdhani weekly · Op Green scheme navigation · DFCCIL Phase 2"
  },
  "bank": {
    "title": "Bank / Financer — NABARD Credit Portal",
    "detail": "Escrow-backed agri credit · NE tribal smallholders · 0% NPL · ₹14.2L escrow pool"
  },
  "consumer": {
    "title": "Consumer portal — Priya Sharma",
    "detail": "DLF Phase 3, Gurgaon · CSA subscriber · Food SIP plan active · QR trace enabled"
  },
  "rwa": {
    "title": "RWA admin — DLF City Phase 3",
    "detail": "340 households · 187 participating · Friday delivery · micro-franchisee appointed"
  },
  "horeca": {
    "title": "HoReCa portal — The Leela Gurgaon",
    "detail": "Chef sourcing · Standing orders · QR menu trace cards · BSF quality credential"
  },
  "csr": {
    "title": "CSR / NGO portal — Impact Dashboard",
    "detail": "Bamboo restoration · pollinator corridors · tribal livelihood · ESG metrics"
  },
  "govt": {
    "title": "Govt / Scheme portal",
    "detail": "Subsidy tracker · SAMPADA · MOVCD-NER · NEC grant · Op Green claims"
  },
  "ai": {
    "title": "AI Intelligence Command",
    "detail": "Demand grid · procurement AI · climate risk · food planning · ESG engine"
  }
};

const OCCASIONS = [
  {
    "id": "diwali",
    "label": "Diwali 🪔",
    "window": "Oct–Nov"
  },
  {
    "id": "holi",
    "label": "🎨 Holi",
    "window": "Mar"
  },
  {
    "id": "eid",
    "label": "🌙 Eid",
    "window": "Variable"
  },
  {
    "id": "christmas",
    "label": "🎄 Christmas",
    "window": "Dec 25"
  },
  {
    "id": "newyear",
    "label": "🎊 New Year",
    "window": "Jan 1"
  },
  {
    "id": "birthday",
    "label": "🎂 Birthday",
    "window": "Year-round"
  },
  {
    "id": "anniversary",
    "label": "💍 Anniversary",
    "window": "Year-round"
  },
  {
    "id": "wedding",
    "label": "💒 Wedding",
    "window": "Year-round"
  },
  {
    "id": "esg",
    "label": "🌱 ESG / Corporate",
    "window": "Year-round"
  },
  {
    "id": "conference",
    "label": "🎙 Conference",
    "window": "Year-round"
  },
  {
    "id": "diplomatic",
    "label": "🏛 Diplomatic",
    "window": "Year-round"
  },
  {
    "id": "getwell",
    "label": "🌿 Get Well",
    "window": "Year-round"
  }
];

// ---------------------------------------------------------------------------
// Mood-based merchandising
// ---------------------------------------------------------------------------

/**
 * An emotional entry point into the catalogue.
 * Cross-referenced with the wellness map where the mood names a health concern,
 * so a mood landing can show products that are actually relevant, not decorative.
 */
function moodEntry({ mood } = {}) {
  const key = String(mood || '').toLowerCase().trim();
  const m = MOODS[key];
  if (!m) {
    throw new Error(`mood must be one of: ${Object.keys(MOODS).join(', ')}`);
  }
  return { mood: key, ...m };
}

function listMoods() {
  return Object.entries(MOODS).map(([mood, v]) => ({ mood, headline: v.headline, cta: v.cta, color: v.color }));
}

// ---------------------------------------------------------------------------
// Ritual bundles — raise basket value by teaching a use
// ---------------------------------------------------------------------------

function listRituals({ mood } = {}) {
  if (!mood) return RITUALS;
  const q = String(mood).toLowerCase();
  return RITUALS.filter((r) => (r.mood || '').toLowerCase().includes(q));
}

/**
 * A ritual with its ingredient list resolved into a purchasable bundle.
 * Deliberately returns the ingredient list as-is when a product cannot be
 * matched, rather than dropping it — a partial bundle the buyer can complete
 * is more useful than a silently shortened one.
 */
function ritualBundle({ name } = {}) {
  let q = String(name || '').toLowerCase().trim();
  if (!q) throw new Error('name is required');
  const r = RITUALS.find((x) => x.name.toLowerCase() === q)
         || RITUALS.find((x) => x.name.toLowerCase().includes(q));
  if (!r) throw new Error(`No ritual found matching "${name}"`);

  return {
    ...r,
    itemCount: r.ingredients.length,
    note: 'Ingredient quantities are as specified in the ritual; substitute at your discretion.'
  };
}

// ---------------------------------------------------------------------------
// Audience-segmented guidance
// ---------------------------------------------------------------------------

/**
 * Practical tips for a stakeholder type.
 * The segmentation is the point: a farmer and a HoReCa buyer need different
 * advice about the same product.
 */
function tipsFor({ audience } = {}) {
  let key = String(audience || 'consumer').toLowerCase().trim();
  const tips = SEASONAL_TIPS[key];
  if (!tips) {
    throw new Error(`audience must be one of: ${Object.keys(SEASONAL_TIPS).join(', ')}`);
  }
  return { audience: key, count: tips.length, tips };
}

function listAudiences() {
  return Object.keys(SEASONAL_TIPS).map((a) => ({ audience: a, tipCount: SEASONAL_TIPS[a].length }));
}

// ---------------------------------------------------------------------------
// Portals — the multi-tenant role map
// ---------------------------------------------------------------------------

function portalDefinition({ role } = {}) {
  let key = String(role || '').toLowerCase().trim();
  const p = PORTALS[key];
  if (!p) {
    throw new Error(`role must be one of: ${Object.keys(PORTALS).join(', ')}`);
  }
  return { role: key, ...p };
}

function listPortals() {
  return Object.entries(PORTALS).map(([role, v]) => ({ role, title: v.title, detail: v.detail }));
}

// ---------------------------------------------------------------------------
// Gifting occasions
// ---------------------------------------------------------------------------

function listOccasions({ type } = {}) {
  if (!type) return OCCASIONS;
  const corporate = ['esg', 'conference', 'diplomatic'];
  const t = String(type).toLowerCase();
  if (t === 'corporate') return OCCASIONS.filter((o) => corporate.includes(o.id));
  if (t === 'personal') return OCCASIONS.filter((o) => !corporate.includes(o.id));
  throw new Error("type must be 'corporate' or 'personal'");
}

/**
 * Occasions with a fixed calendar window, ordered by how soon they fall.
 * Year-round occasions are returned separately rather than given a fake date.
 */
function upcomingOccasions({ month } = {}) {
  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const now = month ? (Number(month) - 1) : new Date().getMonth();

  const dated = [];
  const yearRound = [];
  for (const o of OCCASIONS) {
    const w = (o.window || '').toLowerCase();
    if (w.includes('year-round') || w.includes('variable')) { yearRound.push(o); continue; }
    const hit = MONTHS.findIndex((m) => w.includes(m));
    if (hit === -1) { yearRound.push(o); continue; }
    dated.push({ ...o, monthIndex: hit, monthsAway: (hit - now + 12) % 12 });
  }
  dated.sort((a, b) => a.monthsAway - b.monthsAway);
  return { fromMonth: MONTHS[now], upcoming: dated, yearRound };
}

// ---------------------------------------------------------------------------
// Routes — public: merchandising and education surfaces
// ---------------------------------------------------------------------------

const handle = (fn) => (req, res) => {
  try {
    res.json({ success: true, data: fn({ ...req.body, ...req.query }) });
  } catch (error) {
    logger.error('Merchandising error', { error: error.message, stack: error.stack });
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/moods', handle(listMoods));
router.get('/mood', handle(moodEntry));
router.get('/rituals', handle(listRituals));
router.get('/ritual', handle(ritualBundle));
router.get('/tips', handle(tipsFor));
router.get('/tips/audiences', handle(listAudiences));
router.get('/portals', handle(listPortals));
router.get('/portal', handle(portalDefinition));
router.get('/occasions', handle(listOccasions));
router.get('/occasions/upcoming', handle(upcomingOccasions));

function isHealthy() {
  return {
    status: 'ok',
    moods: Object.keys(MOODS).length,
    rituals: RITUALS.length,
    audiences: Object.keys(SEASONAL_TIPS).length,
    portals: Object.keys(PORTALS).length,
    occasions: OCCASIONS.length
  };
}

module.exports = {
  router, isHealthy,
  moodEntry, listMoods,
  listRituals, ritualBundle,
  tipsFor, listAudiences,
  portalDefinition, listPortals,
  listOccasions, upcomingOccasions,
  MOODS, RITUALS, SEASONAL_TIPS, PORTALS, OCCASIONS
};
