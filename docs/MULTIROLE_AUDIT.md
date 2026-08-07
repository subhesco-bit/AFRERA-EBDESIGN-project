# EBDESIGN — multi-role audit

**Date:** 2026-08-04
**Status:** DESCRIPTIVE (measured against the code) — **PARTIAL: 6 of ~13 lenses completed**
**Method:** every number below was counted from the repository, not estimated.

---

## Scope note, honestly

This is a first pass. I completed six lenses before hitting a session limit:
Amazon/marketplace, PolicyBazaar/aggregator, airline/yield, metasearch/price
extraction, AI, and frontend. The remaining lenses (ERP process, architecture,
security, travel-agency bundling, mobile/desktop) are **not** covered here —
see "Not yet audited" at the end. I have not padded them with generic advice.

---

## 1. Amazon lens — marketplace mechanics

*What a marketplace strategist looks for: discovery, conversion, seller quality,
repeat purchase.*

| Capability | Services | Migrations | Verdict |
|---|---|---|---|
| Search | 17 | 9 | present but **fragmented** |
| Recommendations | 30 | 15 | present |
| Reviews / ratings | 18 | 14 | present |
| **Wishlist / save-for-later** | **0** | **0** | **absent** |
| **Upsell / cross-sell** | **0** | **0** | **absent** |
| **Buy box logic** | **0** | **0** | **absent** |
| **Seller ranking / score** | **0** | **0** | **absent** |
| Cart abandonment | 1 | 1 | barely present |

**The finding that matters:** search logic is spread across **17 services**.
There is no single ranking authority. That means relevance cannot be tuned,
measured, or A/B tested — seventeen places would each need changing, and they
will drift. Amazon's entire discovery advantage comes from *one* ranking service
that everything queries.

**Buy box absence is structural, not cosmetic.** When two farmers list the same
Lakadong turmeric, nothing decides whose listing wins. Without that rule the
marketplace cannot reward quality, reliability or fair pricing — it silently
rewards whoever listed first. For a platform whose stated purpose is farmer
equity, this is the single most consequential commercial gap found.

**Wishlist absence** removes the cheapest retention mechanism that exists, and
for seasonal produce it is more valuable here than at Amazon: a buyer wanting
Chak-Hao rice out of season has no way to be told when it returns.

---

## 2. PolicyBazaar lens — aggregation and comparison

*What an aggregator looks for: can a user compare offers from multiple providers
and understand why one is better?*

| Capability | Services | Migrations |
|---|---|---|
| Premium handling | 14 | 7 |
| Claims | 9 | 11 |
| Quotes | 6 | 4 |
| Eligibility | 9 | 4 |
| Comparison | 8 | 3 |
| **Insurer (the counterparties)** | **1** | **1** |

**The contradiction:** 14 services handle premiums but only **one** knows what
an insurer is. You cannot aggregate across providers you do not model. Today
this is an insurance *sales* module wearing aggregator vocabulary — it can quote
and claim, but it cannot answer "which of these four policies is best for me and
why", which is the entire PolicyBazaar proposition.

**What exists and is genuinely good:** `insurance_plan_catalog` (migration 992)
stores `covers`, `excludes` **and** `required_documents` per plan, with
`excludes` NOT NULL. That constraint is worth more than it looks — a policy
listing only what it covers is how a farmer discovers at claim time that they
were never insured. Most Indian insurance UX fails exactly here.

**Gap:** no `insurers` table, no per-insurer claim settlement ratio, no
turnaround-time record. Those three fields are what make comparison honest
rather than a price sort.

---

## 3. Airline lens — yield and perishable inventory

*This lens matters more than it first appears: **a truck slot is a seat**. Both
are perishable inventory that becomes worthless at departure.*

| Capability | Services | Migrations |
|---|---|---|
| Capacity | 10 | 10 |
| Yield / revenue management | 8 | 6 |
| **Overbooking** | **0** | **0** |
| **Waitlist** | **0** | **0** |
| **No-show handling** | 0 | 1 |
| **Cancellation policy / fee** | **0** | **0** |
| **Surge / dynamic pricing** | 1 | 0 |

`freight_slots` (992) already models the hard part correctly — total capacity
split into an FPO reservation and a general pool, with database constraints
preventing oversell. That is airline seat-class inventory, built right.

**What is missing is everything that makes it economic:**

1. **No cancellation policy.** A farmer can book 3 tonnes and not show up. The
   truck departs with empty space nobody could rebook. Airlines solve this with
   fare rules; there is no equivalent field anywhere.
2. **No waitlist.** When a slot is full, demand is simply lost. A waitlist costs
   one table and converts that demand when a cancellation happens.
3. **No overbooking.** Deliberately controversial, and arguably it *should* stay
   absent — a farmer bumped from a truck with perishable produce loses the crop,
   which is not comparable to a rebooked passenger. **I would not recommend
   adding it.** But the decision should be recorded rather than accidental.
4. **Time-based pricing is absent.** `TM_SLOTS` in v42 carried `hoursToDep` —
   hours until departure — and nothing uses it. Empty space 6 hours out is worth
   less than the same space 6 days out. This is the clearest revenue gap found.

---

## 4. Metasearch / price-extraction lens

*What a comparison site looks for: can it see prices it does not own?*

| Capability | Services | Migrations |
|---|---|---|
| **Scraping (puppeteer/cheerio/crawler)** | **0** | **0** |
| Competitor | 3 | **0** |
| External / market price | 6 | 2 |
| Mandi / Agmarknet | 2 | 2 |
| Price history | 1 | 1 |
| Cache / TTL | 5 | 7 |
| Freshness / staleness | 4 | 3 |

**There is no price extraction capability at all.** Zero scraping libraries,
zero competitor-price tables. Three services mention "competitor" and none has a
schema behind it.

This is the largest strategic gap in the audit, because the platform's core
promise — that a farmer gets a fair price — **cannot be substantiated without an
external reference price**. Right now the platform's price is self-referential:
it is fair because the platform says so.

The two `mandi` references suggest someone intended Agmarknet integration
(India's government mandi price feed, freely available). That is the correct
starting point and it is not built.

**Minimum viable version:** one `reference_prices` table (commodity, market,
date, price, source, fetched_at), a daily Agmarknet pull, and a "you are being
offered X% above/below the nearest mandi" line on every listing. `price_history`
already exists to compare against.

**Caveat worth stating:** scraping competitor marketplaces carries legal and
ToS exposure. Agmarknet is public government data and does not.

---

## 5. AI lens — how much of it is real

| Signal | Count |
|---|---|
| **`Math.random()` in services** | **37** |
| Files using the tested statistics module | **3** |
| Services referencing drift / retrain / model_version | 6 |
| Services with feedback / outcome tracking | 7 |
| TODO / FIXME / stub markers | 5 |

**37 `Math.random()` calls remain in service code.** Earlier work replaced the
worst offenders with tested statistics (Holt linear forecasting, MCDA, real
confidence derived from data provenance) — but that reached only **3 files**.
The rest still fabricate outputs.

This is the most serious integrity issue in the audit. A random number presented
as an AI score is not a weak prediction; it is a false statement with a
confidence attached. A farmer shown a fabricated yield forecast or credit score
has been misled, and the system cannot tell them so.

**What is genuinely sound:** the agent architecture. 15 agents across 13 domains
in `core/erpAgents.js`, every one of which *proposes* and none of which
executes, with a database CHECK constraint making approval without a named human
structurally impossible. Each returns `null` when it has nothing to say. That
design is better than most production ERP AI layers.

**The gap between those two facts is the problem:** an excellent decision
framework fed partly by fabricated inputs. Priority is not more agents — it is
replacing the remaining 37 random calls with either real computation or an
explicit "insufficient data" response.

---

## 6. Frontend / UI lens

| Signal | Count |
|---|---|
| Responsive breakpoints (`sm:` `md:` `lg:` `xl:`) | 159 |
| Loading / skeleton states | 33 files |
| Images with `alt` | 6 of 6 ✓ |
| **`aria-*` attributes** | **0** |
| **Error boundaries** | **0** |

**Zero ARIA attributes across 45 components.** This is awkward for me to report,
because I built an `AccessibilityProvider` with kiosk/voice/SMS modes earlier
today. That provider changes type size, target size and focus rings — but a
screen reader still encounters unlabelled controls. **CSS-level accessibility
without semantic markup is the appearance of accessibility, not accessibility.**
My own work is incomplete on exactly this point.

For a platform whose stated users include low-literacy and low-vision farmers,
and which ships a "voice" mode, this is a functional failure rather than a
compliance checkbox.

**Zero error boundaries** means any single component throwing takes the whole
React tree to a blank white screen. On a rural connection with partial data,
that is not a rare path.

Responsive coverage (159 breakpoints) and loading states (33 files) are healthy.

---

## Priority ranking across all six lenses

Ranked by consequence, not effort:

| # | Finding | Lens | Why it ranks here |
|---|---|---|---|
| 1 | 37 `Math.random()` calls presented as AI output | AI | Actively misleads users; undermines every other claim |
| 2 | No external reference price | Metasearch | The "fair price" promise cannot be substantiated |
| 3 | Zero ARIA across 45 components | Frontend | Voice/kiosk modes don't function for their intended users |
| 4 | No buy box / seller ranking | Amazon | Marketplace silently rewards first-lister, not best farmer |
| 5 | No cancellation policy or waitlist on freight slots | Airline | Perishable capacity lost with no recovery mechanism |
| 6 | Only 1 service models an insurer | PolicyBazaar | Cannot compare across providers |
| 7 | Search spread across 17 services | Amazon | Relevance cannot be tuned or measured |
| 8 | Zero error boundaries | Frontend | One component fault blanks the app |

---

## Not yet audited

These lenses were requested and are **not** covered. Treating this document as
complete would repeat the exact failure mode `EBDESIGN_ALIGNMENT.md` warns
about — a document read as descriptive when it is partial.

- ERP process specialist (forms, period close, master data governance)
- Solution architect (coupling, service boundaries, scaling limits)
- Security specialist
- Travel-agency lens (bundling, packages, multi-supplier itineraries)
- Mobile platform
- Desktop platform
- Coding-standards deep review (the 68 services have never had a line-level review)
