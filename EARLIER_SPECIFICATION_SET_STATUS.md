# Status of the earlier 16-document specification set

**Written**: 2026-08-07, 13:45–14:53, earlier in this same working session, before a
context reset separated it from the work that followed.

## What this is

`AFRERA_ARCHITECTURE_COMPILATION_SUMMARY.md` is the index for an earlier, much more
expansive pass at the same request that later produced `AFRERA_CLAUDE_BUILD_DIRECTIVE.md`,
`PUBLIC_DATA_PLATFORM_AND_BIOMIMICRY_INDEX.md`, and `CLAUDE_ENHANCEMENT_PROMPT.md`. It
covers the same conceptual territory (Digital Organism Architecture, Bio-Inspired
Enterprise Intelligence, Business Cell anatomy, Public Data Intelligence Platform,
biomimicry patterns) across 16 separate documents, roughly 19,500 lines total.

## Precedence — read this before citing any of these 16 files

**`AFRERA_CLAUDE_BUILD_DIRECTIVE.md` is authoritative wherever the two overlap.** It is
the only one of the two verified against the actual repository — every module count,
file reference, and defect in it is checked against real code (§0 of that document
explains its own verification methodology and lists six times an earlier "confident
count" about this codebase turned out wrong). This 16-document set was written without
that grounding: it defines its own hierarchies (11-level, 14-level, 30-level — three
different numbering schemes across three of the sixteen files), none of which match
each other or the directive's Software Biology Hierarchy, and none of which are
cross-checked against what's actually built.

**Where this set has NOT been superseded — genuinely new content:**

- `AFRERA_FINANCIAL_SERVICES_PLATFORM_SPECIFICATION.md` — digital KYC, RBAC/ABAC/MFA,
  multi-method payment processing, escrow services, cross-border payments (FX, SWIFT,
  RTGS), connected/open banking. **Nothing in `AFRERA_CLAUDE_BUILD_DIRECTIVE.md` or the
  REOS documents covers this.** This is the one file in the set that should be
  reconciled into the directive rather than treated as superseded.
- `AFRERA_PRECISION_AGRICULTURE_INTELLIGENCE_PLATFORM_SPECIFICATION.md` and
  `AFRERA_VETERINARY_INTELLIGENCE_PLATFORM_SPECIFICATION.md` — both overlap with content
  already in the directive (Part 5 for veterinary) but go into more operational depth
  (IoT/satellite/drone data acquisition layers, decision-support layers, automation
  layers). Worth a diff pass, not a full rewrite.
- `TISMP_PLATFORM_INDEX.md` — an index over the already-known TISMP specs (yesterday's
  work, unrelated to today's REOS/biomimicry question). Low risk, likely just a
  convenience index; not reconciled yet but not urgent.

**Where this set IS superseded — do not use as a source of truth:**

- `AFRERA_MASTER_ENGINEERING_DIRECTIVE_DOA_BIEA.md`, `AFRERA_BIO_INSPIRED_ENTERPRISE_INTELLIGENCE_ARCHITECTURE_BIEA.md`,
  `AFRERA_SOFTWARE_ANATOMY_SPECIFICATION.md`, `AFRERA_ENTERPRISE_PLATFORM_HIERARCHY_SPECIFICATION.md`,
  `AFRERA_ENTERPRISE_MODULE_SPECIFICATION_30_LEVEL_FRAMEWORK.md`,
  `AFRERA_BUSINESS_CELL_ANATOMY_SPECIFICATION.md`, `AFRERA_ENTERPRISE_AI_INTELLIGENCE_FABRIC.md`,
  `AFRERA_DIGITAL_ORGANISM_REFERENCE_ARCHITECTURE_DORA.md` — all describe the same
  organism/hierarchy/AI-architecture concepts `AFRERA_CLAUDE_BUILD_DIRECTIVE.md` Parts
  1, 2, 3, 6, and 7 already cover, and already implemented in code at
  `backend/src/core/businessCell.js` and `backend/src/core/reflexEngine.js`. Also still
  targets "Devin" as executor throughout, which was corrected everywhere else.
- `AFRERA_PUBLIC_DATA_INTELLIGENCE_PLATFORM_SPECIFICATION.md`,
  `AFRERA_PUBLIC_DATA_INTELLIGENCE_PLATFORM_SPECIFICATION_ENHANCED.md`,
  `PUBLIC_DATA_INTELLIGENCE_PLATFORM_INDEX.md`,
  `PUBLIC_DATA_INTELLIGENCE_PLATFORM_ENHANCEMENT_PROMPT.md` — same content as
  `AFRERA_CLAUDE_BUILD_DIRECTIVE.md` Part 4, which additionally ties every claim to
  real repo precedent (`backend/src/jobs/loadMandiPrices.js`, the North-East data-gap
  finding) that these four files don't have.

## What's still open

Nothing in this set has been deleted — it's kept as historical record of the earlier
pass. The Financial Services Platform content specifically has not yet been folded into
`AFRERA_CLAUDE_BUILD_DIRECTIVE.md`; that's the one real follow-up action here.
