# AFRERA — MASTER BUILD DIRECTIVE FOR CLAUDE

**Owner:** Ethnoverde Dynamics Pvt. Ltd.
**Working folder:** `C:\Users\DIYA GOEL\Downloads\EBDESIGN`
**Compiled:** 2026-08-07
**Status of this document:** authoritative. It supersedes any earlier module count, completion report, or "missing modules" list in this folder.

---

## PART 0 — READ THIS BEFORE WRITING ANY CODE

### 0.1 The most expensive mistake available to you

This repository contains **112 wired modules, 799 endpoints, 523 tables, 71 services**. Several earlier reports in this folder claim large numbers of modules are missing. **Those reports are wrong**, and building from them will produce duplicate implementations of working code — two places that disagree about the same business rule, which is the one class of damage that cannot be cheaply undone.

A content scan of all 1,652 backend and frontend source files against the 150-module catalogue (`docs/registry/SOURCE_CATALOGUE.json`) returns:

| Verdict | Count | Meaning | Safe to build? |
|---|---:|---|---|
| FOUND | 3 | a file is named for this module | **No** |
| HIDDEN | 73 | exists under a *different name* | **No** — extend it |
| CLUBBED | 20 | features folded into a larger module | **No** — extract first |
| LEAD | 49 | one weak word match, unverified | **No** — hand-check first |
| ABSENT | 4 | no trace anywhere in the folder | **Yes** |
| UNSCORABLE | 1 | name has no distinguishing words | Hand-check |

Tool: `tools/find-hidden-modules.js` → `docs/registry/19_HIDDEN_MODULES.{md,json}`

**The earlier figure of "57 absent modules" was wrong by more than ten times.** It was produced by matching catalogue names against *file names*, which cannot see a capability implemented under a different label. `ClimateWeatherPage.jsx` does not lexically match "Weather Monitoring", so working UI read as missing.

### 0.2 The only modules confirmed safe to build

Confirmed by direct content probe across all source files (occurrence counts hand-verified, not inferred):

| Module | Probe | Occurrences | Verdict |
|---|---|---:|---|
| M148 Precision Horticulture | `precisionhorticulture` | 0 | **Build** |
| M050 Rural Development Management | `ruraldevelopment` | 0 | **Build** |
| M029 Farmer Health & Welfare | `farmerhealth` | 0 | **Build** |
| Pixel & Retargeting Integration | `retargeting` | 0 | **Build** |
| M125 Sheep Farming Management | `sheep` | 1 (incidental, `insurancePremiumService.js`) | **Hand-check** — likely a livestock enum, not a module |

### 0.3 Modules the scan called ABSENT that ARE ALREADY BUILT

**This is a correction to my own tool. Do not trust the ABSENT column alone.** Hand probing found these four "named-missing" modules fully present:

| Claimed missing | Actually at | Occurrences |
|---|---|---:|
| GSTR-1 & GSTR-3B Auto-Population | `migrations/047_gst_tables.sql` | `gstr1` ×3, `gstr3b` ×3 |
| Reverse Charge Mechanism (RCM) Handler | `migrations/047_gst_tables.sql` | `reversecharge` ×4 |
| Asset Capitalization & Depreciation | `migrations/056_named_missing_modules.sql` | `depreciation` ×5 |
| Multi-Location FPO Cost Centers | `migrations/995_erp_process_layer.sql` | `costcenter` ×4 |

**Root cause of the tool's error:** a module named `GSTR-1 & GSTR-3B Auto-Population` tokenises to `gstr1, gstr3b, auto, population`, and the scan requires *every* term to co-occur. "auto" and "population" are not in a GST schema, so a fully implemented module reported as absent.

**Standing rule for Claude: the scan's ABSENT verdict is a hypothesis, not a fact. Probe the actual term before building. Every single time.**

### 0.4 Mandatory pre-build gate

Before creating **any** module, run and record all four:

```bash
node tools/find-hidden-modules.js     # is it hiding under another name?
node tools/schema-collisions.js       # will my tables silently collide?
node tools/module-audit.js            # what already covers this domain?
grep -ril "<core-noun>" backend/src frontend/src   # the hand probe — never skip
```

Then answer in writing, in the PR:

1. What is the single most distinguishing noun of this module?
2. How many files contain it? Name three.
3. If the count is greater than zero — why is extending the existing code the wrong choice?
4. Which existing module currently owns any of these features? (the CLUBBED question)

**A PR that creates a module without these four answers must be rejected.**

### 0.5 Naming constraint — non-negotiable

> "Renaming of a module is permitted if required, but it must not create a duplicate or parallel module."

If a capability exists under a different name, **rename or extend it**. Never stand up a parallel implementation. A prior session created a `competitor_price_observations` table that duplicated the existing `price_intelligence` module; it was caught and deleted. That must not recur.

---

## PART 1 — VISION AND ARCHITECTURAL MANDATE

### 1.1 Primary mission

- Do **not** build a conventional ERP.
- Do **not** build an ERP with AI bolted on.
- Do **not** build an AI chatbot.
- Do **not** build isolated microservices.

Build AFRERA as a **Living Digital Organism** — an AI-native Enterprise Operating System whose architecture derives from biology, neuroscience, distributed intelligence, and high-performance computing.

Every component must possess: Structure, Function, Intelligence, Communication, Memory, Energy, Protection, Adaptation, Healing, Evolution.

The architecture is **recursive** — the same principles apply from the smallest instruction to the whole platform.

### 1.2 The discipline that makes this real rather than decorative

For every biological structure, process, or control mechanism:

1. Identify its purpose in nature.
2. Determine whether it has a *meaningful* software equivalent.
3. Design an enterprise-grade implementation.
4. Reuse the pattern consistently.

> **Do not force analogies that add no engineering value. Every mapping must produce a measurable architectural benefit.**

This constraint is the difference between an architecture and a metaphor. If you cannot state the measurable benefit — a latency number, a recovery time, a defect class prevented — do not implement the analogy. A "Spleen Service" that only renames existing validation is a liability: it adds a layer of indirection and teaches the team a vocabulary that carries no information.

**Claude: when a mapping fails this test, say so and skip it. Reporting "this analogy adds no value" is a correct and expected outcome, not a failure to deliver.**

### 1.3 Software Biology Hierarchy

```
Enterprise
 └ Domain
    └ Organ System
       └ Module (Organ)
          └ Submodule
             └ Capability (Tissue)
                └ Feature
                   └ Service (Cell Cluster)
                      └ Business Cell
                         └ Function (Organelle)
                            └ Algorithm (Protein)
                               └ Config / Rule / Prompt / Formula (DNA)
```

Every level inherits enterprise capabilities.

### 1.4 The Business Cell — smallest independently executable intelligent unit

Every Business Cell must contain all 24:

Input · Validation · Context Builder · Knowledge Retrieval · Rule Engine · Business Logic · AI Intelligence · Decision Engine · Optimization · Simulation · Recommendation · Workflow · Automation · Storage · Events · Notifications · Security · Monitoring · Logging · Audit · Explainability · Learning · Recovery · Performance Metrics

**Implementation note:** this is a large surface. Build it as a *composable base* (`backend/src/core/businessCell.js`) that supplies defaults for all 24 concerns, so a cell declares only what differs. Hand-writing 24 concerns per cell across 112 modules guarantees drift — the same drift that put 13 wrong column mappings in the test mock (§4.1).

---

## PART 2 — DIGITAL ORGAN SYSTEMS

### 2.1 Skeleton — structural integrity
Enterprise Architecture · Domain Model · Framework · Module Hierarchy · Object Model · Database Schema · Master Data Model · Naming Standards · Coding Standards · Architecture Standards · Dependency Rules

### 2.2 Muscular — execute work
Workflow Engine · Automation Engine · Execution Engine · Business Process Engine · Robotics · IoT Actuation · Batch Processing · Task Execution

**Tendons** — service adapters, execution connectors, middleware, integration adapters
**Ligaments** — module integration, inter-service contracts, dependency management
**Joints** — APIs, plugin interfaces, extension points, workflow transitions, microservice contracts

### 2.3 Brain System — never use one AI for everything

| Brain | Responsibility |
|---|---|
| Strategic | business planning, enterprise reasoning |
| Operational | ERP decisions, resource allocation, scheduling |
| Analytical | BI, forecasting, simulation |
| Creative | UX, content, design, innovation |
| Executive | corporate strategy, investment, expansion, risk |
| Left | logic, mathematics, compliance, finance, engineering, optimization |
| Right | creativity, innovation, visualization, branding, human interaction |
| Hippocampus | enterprise memory, knowledge graph, case library, lessons learned |
| Amygdala | risk, fraud, threat detection, emergency prioritization |
| Cerebellum | fine tuning, optimization, resource balancing, scheduling precision |
| Brain Stem | runtime, scheduler, health, heartbeat, failover, recovery |

**Existing foundation:** `backend/src/core/mcda.js` (multi-criteria decision analysis with `DATA_QUALITY_WEIGHT` = real 1.0 / estimated 0.7 / assumed 0.4), `core/decisionEngine.js` (6 rules), `core/outcomeResolver.js` (calibration gates). **Extend these — do not replace them.**

### 2.4 Nervous System

- **Central** — Enterprise AI Orchestrator, Global Decision Engine, Policy Distribution, Mission Control
- **Peripheral** — module communication, event mesh, API communication, service mesh
- **Autonomic** — background jobs, maintenance, auto-scaling, auto-optimization, self-healing
- **Sympathetic** — emergency mode, disaster response, cyber-attack response
- **Parasympathetic** — maintenance, energy saving, learning, optimization

**Reflex System — deterministic, no LLM, no reasoning, milliseconds only.**
Pump overpressure · fire detection · animal isolation · cyber-attack blocking · fraud freeze · equipment shutdown · emergency valve closure.

> A reflex that calls an LLM is not a reflex. If an animal must be isolated or a pump shut down, the decision path must be a pure function with a bounded execution time and no network call. Implement as `core/reflexEngine.js` with an enforced timeout budget and a test that fails if any registered reflex exceeds it.

**Current state:** signal bus exists (`emitSignal(type, payload, meta)`) — 5 afferent, 0 efferent, **69 denervated modules**. Wiring these is higher value than any new module.

### 2.5 Sensory System
Eyes (CV, OCR, drone, satellite, medical imaging) · Ears (speech, machine acoustics, animal sounds) · Nose (gas, environmental, chemical) · Tongue (food/water/feed quality) · Skin (temperature, humidity, pressure, vibration) · Location (GPS, IoT, external APIs, documents)

**All sensory inputs feed a Context Builder before any intelligence executes.**

### 2.6 Circulatory
Heart (workflow heartbeat, scheduler, health pulse) · Blood (data, knowledge, commands, events, telemetry, AI context) · Arteries (high-priority pipelines) · Veins (feedback, audit, learning) · Capillaries (dependency injection, shared services, config propagation)

### 2.7 Digestive & Metabolic — knowledge intake

Mouth (intake) → Stomach (parsing, OCR, translation, chunking) → Small Intestine (knowledge/rule/relationship extraction) → Large Intestine (historical mining) → Liver (transformation, normalization, enrichment, conflict resolution) → Kidneys (validation, filtering, QA, dedup) → Spleen (integrity, fraud, quality control) → Gallbladder (transformation rules) → Pancreas (resource regulation) → Bloodstream (distribution) → Excretion (archive, purge, retention, quarantine)

**External AI systems (Claude, ChatGPT, Gemini, DeepSeek, Qwen) are knowledge *sources*, not the platform's brain.**

> Knowledge digestion must always carry **provenance, confidence scoring, conflict resolution, and governance** before enterprise adoption. This is already partly enforced: `DATA_QUALITY_WEIGHT` downgrades assumed data to 0.4. Extend that principle to every ingested fact.

### 2.8 Immune System
Cybersecurity · fraud detection · threat detection · model integrity · data integrity · sensor integrity · prompt-injection protection · identity protection · access control · policy enforcement
**Antibodies** (threat signatures) · **Vaccination** (preventive baselines) · **Antibiotics** (targeted remediation, rollback, isolation, patch) · **Healing** (self-repair, retry, rebuild, reconnect)

### 2.9 Growth & Evolution
Growth (knowledge/module/capability expansion) · Evolution (learning, architecture improvement, model replacement, rule optimization) · Mutation (controlled experimentation, A/B testing, simulation) · Natural selection (performance-based model selection)

**Self-development:** continuously identify missing capabilities, repeated manual work, workflow bottlenecks, knowledge gaps, automation opportunities. **Improvement proposals require governance before adoption.**

---

## PART 3 — MULTI-ORGANISM & COMPUTATIONAL INTELLIGENCE

Adopt only where a measurable benefit exists (§1.2).

| Source | Capability | Software pattern | Measurable benefit |
|---|---|---|---|
| Human | reasoning, planning | AI planning, knowledge graph | decision quality |
| Octopus | independent arm neurons | parallel independent AI agents | no single-brain bottleneck |
| Ant colony | no central control | swarm optimization, routing | fleet/warehouse cost |
| Bee colony | division of work | distributed workers, task allocation | throughput |
| Elephant | long memory | enterprise memory, case library | fewer repeated errors |
| Crow | tool use | AI-generated automation | manual-work reduction |
| Mycelium | underground network | knowledge propagation, event mesh | context reach |
| Starfish | regeneration | module self-rebuild | MTTR |
| Tardigrade | extreme resilience | disaster recovery, offline survival | RTO/RPO |
| Bat | echolocation | sensor fusion, 3D mapping | navigation accuracy |
| Eagle | long-distance vision | satellite/drone analytics | early detection |
| Falcon | extreme speed | ultra-low-latency path | p99 latency |
| Chameleon | camouflage | adaptive UI, context-aware security | usability/security |
| Dog | smell | anomaly & fraud detection | fraud caught |
| Penguin | collective survival | HA clustering, fault tolerance | uptime |
| Woodpecker | shock absorption | fault isolation, graceful degradation | blast radius |
| Tree | hierarchical growth | module/knowledge inheritance | reuse |
| DNA | mutation + selection | A/B testing, model selection | measured lift |
| Spider | web-building, network optimization | workflow DAG / dependency-graph topology optimization | shorter critical path in `Workflow Engine` (§2.2) |
| Owl | night vision, silent/passive observation | low-light CV, passive (non-alerting) audit monitoring | detection accuracy in low-light livestock/warehouse feeds where Eagle's satellite/drone view does not reach |
| Shark | electromagnetic sensing of what is not directly visible | undocumented-dependency and hidden-call-path detection from indirect signals (network flow, not source) | closes the same blind spot TISMP's architecture-recovery mining targets, at runtime instead of at repo-scan time |
| Jellyfish | distributed nervous system, no central brain | fully decentralized edge nodes that keep functioning with zero central connectivity | directly addresses the §4.6 finding — a farmer's device with no signal must still work |
| Gecko | adheres to and moves across any surface | one codebase deployable across web / desktop / mobile without a rewrite | already a live constraint — `afrera-web`, `afrera-desktop` (Tauri), `afrera-mobile` exist as separate targets from one frontend |
| Camel | stores energy for use without resupply | offline-mode duration, aggressive local caching before connectivity is needed | same §4.6 gap — cache hit rate for farmers who are offline more than they are online |
| Squirrel | anticipatory storage, not reactive | predictive prefetch of likely-needed data *before* connectivity drops | complements Camel: Camel is endurance once offline, Squirrel is what gets stored before going offline |
| Snake | infrared/heat sensing | thermal-signal fusion for early anomaly detection | direct product tie-in: heat stress and mastitis detection already listed at §5.9 |
| Termites | large collaborative structures built without a blueprint held by one worker | autonomous infrastructure provisioning (IaC agents that build without a human holding the whole plan) | applies directly to `infra/terraform`, `infra/k8s`, `afrera-infrastructure/` which already exist as provisioning targets |

| Dolphin | signature whistles (individually-identifying calls) + real-time pod coordination during a hunt | direct peer-to-peer agent negotiation with identity verification — two agents settle something between themselves, not routed through the central Brain and not broadcast through Mycelium | fewer round-trips through the orchestrator for agent-to-agent agreements (e.g. Finance-AI and Legal-AI settling contract terms); agreement survives if the central Brain is degraded, and the transcript still names which agent said what |
| Cuttlefish | skin carries two signals at once — camouflage for predators, a separate pattern conspecifics can read that predators cannot | a covert internal-telemetry channel riding inside normal-looking API/UI output: internal monitoring reads it, an external caller sees nothing unusual | fraud/audit signals travel with the transaction itself — no separate side-channel infrastructure to build, deploy, or secure |
| Raven | caches food for a need days away, and changes caching behavior when it knows it is being watched (fake-caches, relocates later) | anticipatory resource pre-provisioning ahead of predicted demand, paired with adversary-aware fraud simulation that models an actor adapting once it knows it is monitored | shorter provisioning lead time; fraud rules get tested against an adversary that reacts, not a static test case |

**Rule for the three rows above:** they are deliberately *not* generic "communication," "adaptation," or "planning" — that framing is what made them look redundant with Mycelium, Chameleon, and Human/Strategic brain on a first pass. Each row exists only because of its specific mechanism (identity-verified peer negotiation; a dual-channel signal; watched-vs-unwatched behavior change), not the general trait. If an implementation drifts back to the generic version of the behavior, it has collapsed into the row it was distinguished from and should be merged, not kept as decoration.

**Computational layer:** supercomputing (parallel execution) · distributed computing (horizontal scale) · edge computing (local intelligence) · swarm computing · HPC/GPU · quantum-inspired optimization · event-driven/reactive · digital twins.

---

## PART 3A — REOS / REVENUE OPERATING SYSTEM RECONCILIATION

A separate strategic proposal — REOS (Rural Economic Operating System), three documents written 2026-07-28, plus a 9-layer restatement in `DOCUMENTATION/Volume_13_Rural_Economic_Operating_System.md` — was never reconciled against this directive or the M0XX catalogue until now. Full reconciliation: `REOS_MODULE_CATALOGUE_RECONCILIATION.md` (grep-verified against real code, not REOS's own self-reported completion percentages, which were wrong in both directions).

**Verdict on 39 reconciled top-level REOS items:** 9 MAPS TO EXISTING (already built under a different name — e.g. `costService.js`, `revenueService.js`, `demandService.js` mounted at `/api/v1/{costs,revenue,demand}` are REOS's "Cost Breakup Engine," "Revenue Decision Engine," and "Demand Intelligence Platform"), 17 PARTIAL (extend a real, mounted service — never rebuild), 12 GENUINELY NEW, 1 pure re-framing checklist with no distinct capability.

**Highest-leverage single fix found:** `backend/src/services/sharedInfraService.js` (605 lines, real business logic, mounted at boot) is a pure mock — every write path ends in the literal comment `// In production, save to database` (lines 55, 171, 427, 446, 476), with **zero** `pool.query` calls anywhere in the file. A real, matching table (`shared_infrastructure_access`, migration `041_rural_life_os_schema.sql`) sits unused right next to it. Wire the existing logic to the existing table — this is not a new module, it is finishing one that's already 90% written.

**Other unwired-table opportunities** (real schema, zero service/route references — confirmed via grep): `village_profiles` (052, even seeded), `procurement_subscriptions` and `buying_clubs` (042). Write a service against the existing table before proposing new schema for any of these — same rule as §0.4's pre-build gate.

**New M1XX modules recommended** (full reasoning in the reconciliation doc §5): Household Budget & Consumption Optimisation and LPG/Electricity/Water Household Cost Tracking (the one genuinely new **domain** — "Household Economy" — since none of the 16 existing domains model the farm family as a consumer rather than a producer), RWA/Society Commerce (extend FPO domain), Contract Farming Lifecycle (extend FPO/Operations), Buyer Intelligence (extend Operations/Marketplace-adjacent), District Cost-of-Living Database (extend Operations, wire `village_profiles`). **Not recommended, with reasons stated**: Village Digital Twin, AI Crop Portfolio, B2B Marketplace as a platform distinct from Institutional Procurement, AI Project Recommendation Engine (duplicates `core/mcda.js`) — each fails the §1.2 measurable-benefit test as currently justified.

**Standing rule from this reconciliation:** before building anything REOS-shaped, check `REOS_MODULE_CATALOGUE_RECONCILIATION.md` §3 first. A document written without reading the codebase (REOS's own `Volume_13A` integration doc never cites one file:line) is not evidence of what's missing — only a grep is.

---

## PART 3B — FINANCIAL SERVICES PLATFORM RECONCILIATION

`AFRERA_FINANCIAL_SERVICES_PLATFORM_SPECIFICATION.md` and its module-implementation doc (from the earlier 16-document specification set, see `EARLIER_SPECIFICATION_SET_STATUS.md`) proposed KYC, escrow, cross-border payments (SWIFT/RTGS), connected banking, and a "Fraud Detection ML Model." A quality review found the spec used real regulatory vocabulary but shipped almost no code behind it — KYC/AML/SWIFT/RTGS/escrow together had 2 incidental grep hits across a 3282-line implementation doc — and the one thing that was built, "Fraud Detection ML," was not ML at all: hardcoded heuristic weights (0.3/0.25/0.2/0.25) with no tuning methodology, mislabeled.

**Disposition:**
- **KYC, AML, SWIFT/cross-border, RTGS, escrow — explicitly out of scope for this codebase to build unsupervised.** These require real regulatory/compliance expertise this repository cannot fabricate. Do not attempt them without a named compliance owner reviewing the result.
- **Credit/risk scoring — the genuinely buildable, safe piece — is done.** `backend/src/services/financialService.js` now has `getBuyerCreditEligibility()` (real B2B credit-term gating: net0/net30/net60 by turnover + vintage, against real `buyers` columns) and `farmerCreditRiskScore()` (a real MCDA-based 0-100 score via `core/mcda.js`, using FDI score, loan/EMI repayment history, settled-payment history, and order track record — each signal labeled `real` or `assumed` for confidence weighting). Both are wired into the outcome-resolution loop (`core/outcomeResolver.js`/`outcomeSink.js`): predictions are logged and scored against real repayment behavior 180 days out, so the score's own accuracy becomes measurable rather than a number nobody checks. This is the standard "ML" claims must meet in this codebase — if it isn't in the outcome loop, don't call it learned.
- **Never label a static weighted-rule engine "ML."** Call it a rule engine or a weighted score. The original spec's mislabeling is exactly the failure mode §1.2 and Standing Rule 10 exist to catch.

---

## PART 4 — PUBLIC DATA INTELLIGENCE PLATFORM (FOUNDATION LAYER)

This is **not** data mining and **not** hacking. It is lawful collection of public-domain data, AI extraction, enrichment, classification, and business-rule filtering.

### 4.1 Legal boundary — absolute

- Collect **only** legally accessible public-domain data.
- **Never** access private systems or bypass access controls.
- Honour `robots.txt`, rate limits, and site terms.
- Record `collection_method` on every record (`public_api` | `crawl` | `upload`).
- Prefer documented public APIs over scraping. Precedent in this repo: `backend/src/jobs/loadMandiPrices.js` uses the data.gov.in Agmarknet API and records `"_collection_method": "public_api"` with the licence.

### 4.2 Pipeline

```
PUBLIC SOURCES
  Government portals · company websites · open APIs · tender portals · research papers
  news · blogs · social (where permitted) · patents · court judgments · satellite
  agriculture · weather · market prices · trade data · PDF · Excel · images · video
        ↓
DATA COLLECTION LAYER
  web crawlers · scrapers · API connectors · RSS · document import · email import · DB connectors
        ↓
DATA EXTRACTION ENGINE
  OCR · PDF extraction · table extraction · entity recognition · metadata · image recognition
  speech-to-text · translation
        ↓
AI PROCESSING LAYER
  LLMs · NER · classification · summarization · topic detection · keyword extraction
  dedup · relationship mapping · sentiment · risk detection · quality scoring
        ↓
KNOWLEDGE GRAPH · VECTOR DB · SEARCH INDEX · SQL
        ↓
BUSINESS RULE ENGINE
  filters · industry rules · geography · language · priority · category
  confidence score · alert rules · AI recommendation
        ↓
DASHBOARDS & APIs
  search · analytics · reports · AI chat · export · alerts · workflows
```

### 4.3 Modules

| Module | Purpose |
|---|---|
| Data Connector | connects to websites, APIs, databases |
| Web Crawler | discovers new pages |
| Web Scraper | extracts structured information |
| Document Intelligence | reads PDF, Word, Excel, images |
| OCR Engine | reads scanned documents |
| AI Extraction | finds entities, tables, products, companies |
| Data Cleaning | removes duplicates and errors |
| Knowledge Graph | links people, companies, products, locations |
| Vector Database | semantic search via embeddings |
| AI Search | natural-language questions |
| Business Rule Engine | custom filtering logic |
| Dashboard | visualizes insights |
| Alert Engine | notifies on new matching data |
| Workflow Engine | automates downstream actions |

**Before building any of these: run the §0.4 gate.** Several already exist in some form — `marketDataService`, `priceIntelligence`, the signal bus, and the MCDA rule engine all overlap this list.

### 4.4 Open-source stack

| Layer | Options |
|---|---|
| Crawling | Apache Nutch, StormCrawler, Crawl4AI, Scrapy |
| Browser automation | Playwright, Selenium |
| Extraction | BeautifulSoup, Trafilatura, Unstructured |
| OCR | Tesseract, PaddleOCR |
| PDF | Apache Tika, PDFPlumber, PyMuPDF |
| ETL | Apache NiFi, Airbyte |
| Queue | Kafka, RabbitMQ |
| Workflow | Airflow, Prefect |
| Search | Elasticsearch, OpenSearch |
| Vector DB | Qdrant, Milvus, Weaviate |
| Graph DB | Neo4j, JanusGraph |
| SQL | PostgreSQL *(already in use — do not add a second SQL engine)* |
| Data lake | MinIO |
| Models | Llama, Mistral, DeepSeek, Qwen |
| RAG | LangChain, LlamaIndex, Haystack |
| Dashboards | Grafana, Metabase, Superset |

### 4.5 AI filtering — semantic, not keyword

- "Find startups working on hydroponics in North East India with funding below ₹50 crore."
- "Find all government tenders related to cold storage over ₹10 crore published in the last 90 days."
- "Find companies manufacturing biofloc equipment in India with ISO certification."

### 4.6 The North East data gap — a first-class product finding

The Agmarknet loader's first live run returned **54 records nationally, zero from any North East state**.

> A farmer in Meghalaya has no published price to check. When a trader offers ₹25/kg there is no public number to argue against. Every feature that assumes "look up the mandi rate" returns nothing for exactly the users this platform exists to serve.

**The failure mode is silent:** an empty result renders as a *flat market* rather than *missing data*.

**Mandatory rule for every data surface:** absence of data must be rendered as absence, never as zero, flat, or unchanged. Precedent: `frontend/src/components/common/DataPrimitives.jsx` — `Value` never renders null as 0; `ProvenanceBadge` marks data origin. **Every new UI must use these primitives.**

---

## PART 5 — VETERINARY / ANIMAL HEALTH INTELLIGENCE LAYER

Position as an **Animal Health Intelligence Platform**, not a medical-coding tool.

### 5.1 Species layer
Dairy cattle · buffalo · goat · sheep · pig · poultry · duck · turkey · rabbit · horse · camel · yak · fish · shrimp · honey bee · companion animals · wildlife (optional)

*(Note: `goat` and `poultry` already exist in `migrations/041_rural_life_os_schema.sql`. `sheep` appears once, incidentally. Extend that schema — do not create a parallel species table.)*

### 5.2 Disease intelligence
Example (poultry): Newcastle · avian influenza · IBD · coccidiosis · Marek's · salmonellosis · CRD · heat stress · nutritional disorders

### 5.3 Clinical AI
**Input:** species, age, weight, symptoms, temperature, feed intake, mortality, images, video
**Output:** likely diseases, confidence, differential diagnosis, urgency, isolation requirement, laboratory tests

### 5.4 Medical coding layer
Support configurable mappings — veterinary diagnosis codes, disease taxonomies, laboratory codes, pharmaceutical and vaccine classifications, procedure codes, pathology classifications.

> Coding standards vary by country and organisation. **Support configurable mappings rather than hard-coding one global standard.**

### 5.5 Laboratory intelligence
Blood · milk · fecal · urine · PCR · culture · histopathology · water quality · feed analysis
**Existing:** `laboratoryERPService.js` + `sample_registrations`, `test_assignments`, `certification_reports`, `sample_tracking`. **Extend it.**

### 5.6 Medical imaging AI
Photo · X-ray · ultrasound · microscope · skin lesion · hoof · eye · mouth · wing · leg

### 5.7 Drug intelligence
Medicine database · interactions · **withdrawal periods (milk, egg, meat)** · side effects · dosage · contraindications

> Withdrawal periods are a food-safety control, not a convenience feature. A wrong milk-withdrawal figure puts antibiotic residue into the human food chain. Treat this table as safety-critical: versioned, sourced, and never AI-generated without a cited authority.

### 5.8 Natural therapy layer — with explicit evidence labelling

Present natural approaches as **complementary options**, each carrying its level of supporting evidence, and advise veterinary consultation for serious or infectious conditions.

- **Herbal** — neem, turmeric, tulsi, garlic, aloe vera, ashwagandha, giloy, moringa, fenugreek, licorice
- **Ayurveda** — traditional formulations, rasayana, digestive/liver support, stress management
- **Ethnoveterinary** — traditional farmer knowledge, regional and community remedies
- **Nutrition therapy** — minerals, vitamins, electrolytes, pre/probiotics, yeast, feed additives
- **Essential oils** — only veterinary-safe oils where evidence supports use, **with species-specific toxicity warnings**
- **Homeopathy** — if included, label as a separate modality with transparent information about the current scientific evidence, so users can distinguish it from evidence-based treatment
- **Acupuncture / physiotherapy / heat / cold / massage / laser**

**Mandatory schema field:** every therapy row carries `evidence_level` and `requires_vet_consultation`. The UI must render evidence level next to the recommendation, not in a footnote. For an infectious or notifiable disease, the platform must lead with veterinary escalation regardless of which therapies it also lists.

### 5.9 Predictive AI
Disease outbreak forecasting · weather-linked disease prediction · heat stress · mastitis · lameness · feed conversion · mortality · reproductive performance

### 5.10 Integration points
Livestock ERP · farm management · feed · breeding · vaccination · LIS · pharmacy · IoT sensors · wearables · smart cameras · RFID/ear tags · government disease surveillance · insurance · traceability · marketplace

### 5.11 Strategic positioning
An AI-powered **One Health** platform linking crop health, animal health, food safety, environmental monitoring, and farm economics — valuable to farmers, veterinarians, FPOs, agribusiness, researchers, and government.

---

## PART 6 — AI ARCHITECTURE STANDARD

**AI ≠ LLM.** The platform must include: Rule Engine · Knowledge Graph · Enterprise Memory · Business Logic Engine · Decision Engine · Forecasting Engine · Optimization Engine · Simulation Engine · Vision Engine · OCR Engine · Speech Engine · Recommendation Engine · Workflow Engine · Agent Orchestrator · LLMs.

**The AI Orchestrator selects the appropriate engine per task.**

### 6.1 Every AI feature must define
Business objective · data sources · context · knowledge sources · algorithms · rules · models · decision logic · optimization · risk · confidence · evidence · alternatives · workflow · automation · learning · monitoring · feedback · **human approval requirements**

### 6.2 The learning loop already exists — use it

`migrations/990_ai_outcomes.sql` + `core/outcomeResolver.js` implement autonomous outcome resolution with calibration gates. `v_ai_agent_gate` derives an `authority_multiplier` from *measured* accuracy — an agent that predicts badly loses authority automatically.

Critical constraint already encoded:

```sql
CONSTRAINT proxy_cannot_claim_full_weight CHECK (
  resolution_mode <> 'proxy' OR verdict_weight < 1.00
)
```

A proxy signal can never claim the authority of observed ground truth. **Every new AI agent must register here.** An agent that cannot be scored cannot be trusted, and `outcomeResolver` fails **closed** when the gate is unreadable — preserve that.

---

## PART 7 — INTERNAL ARCHITECTURE DELIVERABLES

For every Domain, Module, Submodule, Capability, Feature, Service, Business Cell, and Function:

1. Business Architecture · 2. Functional Architecture · 3. Internal Component Architecture · 4. Service Architecture · 5. Data Architecture · 6. Knowledge Architecture · 7. AI Architecture · 8. Rule Architecture · 9. Decision Architecture · 10. Workflow Architecture · 11. State Machine · 12. Sequence Diagrams · 13. Event Architecture · 14. Algorithm Specifications · 15. API Contracts · 16. Database Design · 17. Security Design · 18. Monitoring Strategy · 19. Performance Strategy · 20. Recovery Strategy · 21. Self-Healing Strategy · 22. Learning Strategy · 23. Testing Strategy · 24. Deployment Strategy · 25. Governance Strategy · 26. Documentation

### Definition of COMPLETE

A module is **not** complete because UI exists, APIs exist, a database exists, CRUD works, or AI responds.

A module is **complete** only when: the biological architecture exists · the internal architecture exists · AI is embedded in business logic · knowledge is governed · decisions are explainable · reflexes exist for immediate actions · self-healing exists · monitoring exists · learning exists · evolution mechanisms exist · every business cell follows the Digital Organism standard · every capability is documented and testable.

---

## PART 8 — KNOWN DEFECTS AND FOUNDATION WORK (DO THESE FIRST)

The foundation is weaker than the module count suggests. **These outrank any new module.**

### 8.1 Test mock invents schema — 13 handlers drifting

`backend/src/database/pool.js` contained hand-written per-table mock handlers that fabricate rows from *guessed* column names. Measured against real service statements: **13 handlers drifting, 13 invented columns, 63 dropped columns.**

This made correct code look broken. `laboratoryERPService` failed 5 tests because the mock returned `lab_code: true` and `name: "LAB-001"` — a row matching no schema in the repo. **The service was never at fault.**

**Fixed:** a generic handler now parses the column list out of the statement itself and zips it against the real params, handling literals mixed with placeholders (`VALUES ($1, $2, 'received')`). It cannot drift. Two bad handlers removed; all 14 lab tests pass.

**Remaining — 11 handlers still drifting. Start with `insurance_policies`**, which invents `user_id`/`policy_type`/`coverage_amount` where the service uses `policyholder_id`/`insurance_type`/`quote_id`. Same bug class, in a money module. Audit tool: `node /tmp/mockdrift.js` pattern — reproduce it as `tools/mock-drift.js`.

### 8.2 Transactions were untested — `connect()` was a black hole

The mock's `connect()` returned `{rows: []}` for everything, so **every BR-08 transaction boundary was invisible to tests**. A boundary could write the wrong columns or nothing at all and assertions would pass identically. **Fixed** — `connect()` now routes through the real handler; BEGIN/COMMIT/ROLLBACK are acknowledged but not simulated (real rollback semantics need real PostgreSQL, and `pgserver` is already wired for that).

### 8.3 Twenty BR-08 boundaries remain

Helper ready at `backend/src/core/withTransaction.js`. It deliberately does **not** retry — "retrying a payment because the database was busy is how one charge becomes two."

Remaining: money 4 · identity 4 · sync 4 · lifecycle 7 · other 1.

**Per-boundary judgement required.** Do not wrap blanket-style: holding row locks across external HTTP calls converts a data-integrity bug into a throughput bug that only appears under load. Precedent: `orderService.processPayment` starts its transaction *after* the gateway call, and its rollback logs `PAYMENT RECORDED AT GATEWAY BUT NOT IN LEDGER — needs manual reconciliation`.

### 8.4 Boot time — 29s → 16.7s (fixed, pattern to continue)

`require('src/index')` cost 29s; **12s was the MongoDB driver** — in a PostgreSQL project, loaded eagerly by `connection.js`, which 22 services import for `getPostgreSQL` while exactly one touches Mongo. Made lazy, with `twilio` (2s, already in "mock mode") and `qrcode` (1.2s). Verified none load at boot; QR generation still produces a real PNG data URL.

**Rule:** no heavy SDK at module top level. Load it where it is used.

### 8.5 Nervous system — 69 denervated modules

5 afferent signals, **0 efferent**, 69 modules emitting nothing. Per §2.4 this is the platform's nervous system and it is largely unwired. **Higher value than any new module.**

### 8.6 Other open items

- Organic-traceability test failures are **mock expectations, not product bugs**
- ERP domains missing: **AF-CO, AF-AA, AF-PS** (3 of 18)
- 37 modules with weak controls (<4/7)
- 19 schema collisions ruled on; guard is `tools/schema-collisions.js` — keep it in CI
- Feeds still empty: weather, DBT, driver_location (Open-Meteo unreachable through the current fetch path)
- **6 AI model slots unassigned — blocked on a data-residency decision (DPDP Act 2023).** This is a business/legal call, not an engineering one.

### 8.7 Recurring failure mode — read this twice

> **Regex and name-based inference over this codebase produces confident, wrong numbers.**

Corrected six times: "78 dropped columns" (wrong 3× — 190→78→15→2, comment words parsed as SQL) · a duplication report listing tables named `is`, `and`, `makes` · `v_trial_balance` collision · a duplicate `competitor_price_observations` table · and in *this* document's own scan, four built GST/finance modules reported ABSENT (§0.3).

**Every count in this repository must be verified against a live database or a hand probe before it is acted on.** A number you cannot check is a number you may not use.

---

## PART 9 — EXECUTION ORDER

**Phase 1 — Foundation (blocking, no new modules)**
1. Run the full test suite; confirm no regression from the mock parser and lazy requires
2. Remove the 11 drifting mock handlers, `insurance_policies` first
3. Fix organic-traceability mock expectations
4. Complete the 20 BR-08 boundaries with per-boundary judgement
5. Wire the 69 denervated modules to the signal bus; add efferent effectors

**Phase 2 — Verify before building**
6. Hand-probe all 49 LEAD and 20 CLUBBED modules; record verdicts
7. Decide extend-vs-extract for every HIDDEN and CLUBBED module
8. Publish a corrected module register

**Phase 3 — Build only what is confirmed absent**
9. Precision Horticulture · Rural Development Management · Farmer Health & Welfare · Pixel & Retargeting Integration (+ Sheep Farming after hand-check)
10. Each as a full Business Cell (§1.4) with all 26 deliverables (§7)

**Phase 4 — Foundation layers**
11. Public Data Intelligence Platform (§4) — API-first, lawful collection only
12. Veterinary Intelligence Layer (§5) — extend `laboratoryERPService` and `041_rural_life_os_schema.sql`
13. Reflex Engine (§2.4) with enforced timeout budget
14. Business Cell composable base (§1.4)

**Phase 5 — Organism**
15. Multi-brain orchestration (§2.3), Digestive knowledge governance (§2.7), Immune system (§2.8), Growth & Evolution (§2.9)

---

## PART 10 — INDEX OF AUTHORITATIVE ARTEFACTS

| Artefact | Path | What it settles |
|---|---|---|
| Hidden-module report | `docs/registry/19_HIDDEN_MODULES.md` | what is truly absent |
| Hidden-module scanner | `tools/find-hidden-modules.js` | the pre-build gate |
| Master index | `docs/registry/00_MASTER_INDEX.{json,md}` | 685 objects, statuses |
| Module inventory | `docs/registry/01_MODULE_INVENTORY.md` | modules |
| API registry | `docs/registry/02_API_REGISTRY.md` | 799 endpoints |
| Database registry | `docs/registry/03_DATABASE_REGISTRY.md` | 523 tables |
| AI registry | `docs/registry/04_AI_REGISTRY.md` | 138 AI applications |
| Gap register | `docs/registry/05_GAP_REGISTER.md` | open gaps |
| Duplication report | `docs/registry/06_DUPLICATION_REPORT.md` | 19 collisions |
| Module audit | `docs/registry/11_MODULE_AUDIT.md` | per-module detail |
| ERP coverage | `docs/registry/12_ERP_COVERAGE.md` | 15/18 domains |
| Nervous system | `docs/registry/13_NERVOUS_SYSTEM.md` | 69 denervated |
| System wireframe | `docs/registry/15_SYSTEM_WIREFRAME.md` | boundaries |
| Module boundaries | `docs/registry/16_MODULE_BOUNDARIES.md` | ownership |
| Source catalogue | `docs/registry/SOURCE_CATALOGUE.json` | M001–M150 spec |
| Live status page | `PROJECT_STATUS.html` | browser view |
| Transaction helper | `backend/src/core/withTransaction.js` | BR-08 pattern |
| Decision framework | `backend/src/core/mcda.js` | MCDA + data quality |
| Learning loop | `backend/src/core/outcomeResolver.js` | calibration gates |
| Data primitives | `frontend/src/components/common/DataPrimitives.jsx` | absence ≠ zero |
| Live mandi feed | `backend/src/jobs/loadMandiPrices.js` | lawful ingestion precedent |
| Collision guard | `tools/schema-collisions.js` | CI gate |

---

## PART 11 — STANDING RULES FOR CLAUDE

1. **Never create a module without running the §0.4 gate.**
2. **Never create a parallel or duplicate module.** Rename or extend.
3. **Never trust a count you have not verified** against a live database or hand probe (§8.7).
4. **Never render missing data as zero, flat, or unchanged** (§4.6).
5. **Never put an LLM in a reflex path** (§2.4).
6. **Never wrap transactions blanket-style** — judge each boundary (§8.3).
7. **Never load a heavy SDK at module top level** (§8.4).
8. **Never bypass provenance, confidence, and governance** on ingested knowledge (§2.7).
9. **Never collect data that is not lawfully public** (§4.1).
10. **Report an analogy that adds no engineering value as exactly that** (§1.2). Saying "this does not help" is a correct deliverable.
11. **Foundation defects outrank new features.** Phase 1 blocks everything.

## Part 3C — Ledger Architecture Decision (resolves the "one ledger vs. 9 economies" contradiction)

`AFRERA_INTEGRATED_PLATFORM_ARCHITECTURE.md` states the canonical philosophy explicitly: "one identity, one ledger, one ERP, one AI engine, one logistics engine, one finance engine, one workflow, one event model." The intended and correct architecture is a single hash-chained double-entry ledger (`journal_entries`/`journal_lines`, migration 990-series, exposed at `LedgerPage.jsx`), which GST invoicing, AF-AA (asset accounting), AF-CO (cost control), and AF-PS (project systems) all post to via `withTransaction`.

**Correction (2026-08-11, cross-module integrity audit):** a second, live, fully disconnected ledger was found and was NOT caught when this section was first written — `recoveredFinanceService.appendLedgerEntry()` posts to its own hash-chained `gl_ledger_chain` table, with its own `trialBalance()`/`verifyLedger()` reads, mounted at `/api/v1/finance/ledger/*`. It has a `journalEntryId` param that appears intended to link back to the canonical ledger but nothing populates it, meaning `/api/v1/finance/ledger/trial-balance` today silently reports a balance blind to every real GST/asset/cost-control posting. No frontend caller was found for either the `/finance/ledger/*` routes or `recoveredFinanceService.gstFor()` (a second, independent GST-rate authority in the same file) — but per this directive's own caution about hard-to-reverse financial-data decisions, reconciling or deprecating a live, hash-chained ledger is being held for an explicit human decision rather than executed autonomously. See `RESEARCH_CORPUS_RECONCILIATION.md` and the cross-module integrity audit's report for full evidence. **The "one ledger" rule below stands as the target state — it is not yet true today.**

**Second correction (2026-08-15):** a third ledger-adjacent system was found live and mounted at `/api/v1/unified-ledger` — `backend/src/services/unifiedLedgerService.js`, whose own docstring explicitly implements "9 distinct economic zones" with "economy-aware transaction routing" and "cross-economy reconciliation" — the literal interpretation this directive rejects above. It also imports from a second, disconnected `utils/signalBus.js` (a duplicate of `core/signalBus.js` with the same export shape but separate state), so nothing it emits reaches the real reflex/decision engine.

**Decision (2026-08-15, explicit authorization given):** all financial-authority forks resolved the same way — deprecated in place (HTTP 410 with a `canonical` pointer), never deleted, so every decision is reversible if something unknown depended on a route:
1. `unifiedLedgerService`'s entire route surface (`routes/unifiedLedgerRoutes.js`) — deprecated via one blanket middleware.
2. `recoveredFinanceService.gstFor()`/`buildInvoice()` (`routes/recoveredFinanceRoutes.js`'s `/gst/*`) — deprecated, points to `gstService.resolveGSTRate()`/`generateGSTInvoice()`. The file's unrelated real capabilities (`/schemes/*`, `/enwr/*`, `/freight/*`, `/subsidy/*`, `/risk/*`) were left untouched — they are not part of this fork.
3. `recoveredFinanceService.appendLedgerEntry()`/`trialBalance()`/`verifyLedger()` (`routes/recoveredFinanceRoutes.js`'s `/ledger/*`) — deprecated, points to the canonical `/api/v1/ledger`.
4. `aiService.assessCreditRisk()` and `advancedAIService.advancedAssessCreditRisk()` — not deprecated but delegated: their routes now call `financialService.farmerCreditRiskScore()` directly and return its real result, so the API contract stays live for any unknown caller while the underlying computation is no longer duplicated.

The "one ledger" rule is now true in practice, not just in target-state documentation — verified by a clean backend boot after these changes.

The apparent contradiction — REOS's "9 economies" framing — is resolved, not live tension. `REOS_MODULE_CATALOGUE_RECONCILIATION.md` §"REOS is not a single coherent proposal" already found that REOS/ROS/Rural-Life-OS are three overlapping documents plus a 9-layer restatement in Volume_13, all written the same day, describing the same handful of ideas 3-4 times under different names ("economies", "platforms", "layers"). None of those documents specify a second ledger, a second chart of accounts, or a second transaction log — they are a **conceptual/domain taxonomy** for organizing and reporting on capabilities (Household Economy, Village Shared Economy, Pre-Season Economy, etc.), not an architectural instruction to fragment the financial system.

**Decision:** the "9 economies" (and every other REOS restatement of the same idea — "10 Strategic Platforms," "46 platforms/layers") are non-binding reporting/domain groupings. Where a REOS "economy" needs to show up as a distinct financial view, it is implemented as a **cost-center or dimension tag on the one real ledger** (the same pattern already used by AF-CO's cost centers/profit centers) — never as a separate ledger, separate journal, or separate chart of accounts. This directive's Part 0-3B language takes precedence over any REOS document where the two conflict, per the existing precedence rule established for the Financial Services Platform reconciliation (Part 3B).
12. **Every claim in a PR must name the file and line that proves it.**
