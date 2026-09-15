# M060 - Input Supply Chain

**Corrected 2026-09-15** - this README previously described M060 as a
"Product review/rating service with AI sentiment-analysis hook" with a
`getProductContext()` fabrication fix dated 2026-08-29. Verified against
both the current code and its full git history: neither `getProductContext`
nor any review/rating/sentiment-analysis logic has ever existed in this
module. That description didn't match any version of this file - it
appears to have been written for, or copied from, a different module and
never corrected.

**What this module actually is**, confirmed by direct reading:
`MODULES_REGISTRY.js` labels M060 `"Input Supply Chain"`, `status: "❌
SKELETON"`, `progress: 0`. `service.js` matches that: a generic
auto-generated CRUD template (`getAll`/`getById`/`create`/`update`/
`delete`/`createBulk`/`search`) against a plain `this.table =
'input_supply'`, with no domain-specific logic at all -
`git log -- service.js` shows its last real change was the batch "Upgrade
to 100% COMPLETE production-ready implementations for all 314 modules"
commit (`eb1a42ff`), which replaced an even simpler prior version of the
same generic template - never a review system at any point in history.

`routes.js` defines standard REST routes (`GET/POST /api/m060`,
`GET/POST/PUT/DELETE /api/m060/:id`, etc.) but **is not mounted anywhere**:
no `require` of `modules/M060/routes` exists in `index.js` or any routes
file, and no generic module-bridge loader (`/api/v1/backend-modules/...`,
as the old README claimed) exists in this codebase either - that path
string only appears in README files like this one, never in mounting
code. This module is currently unreachable at runtime.

**Real duplication, still open**: `services/legacy/productReviewService.js`
used to `require('../../modules/M060/service')` and merge its exports in,
under a comment claiming M060 had colliding `createReview`/
`getProductReviews` logic - that comment was equally wrong (see this
module's `service.js` above), and the merge only added 21 unrelated,
uncalled generic method names to the review service's exports. Removed
2026-09-15 (see `productReviewService.js` history). The real, working,
mounted review system remains `services/legacy/productReviewService.js`
at `/api/v1/product-reviews` - there is no actual duplication between it
and M060 to resolve; they were never the same domain.
