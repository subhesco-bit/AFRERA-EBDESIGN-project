# M060 - Review Management

**Status (2026-08-31): superseded, not deleted.** `services/legacy/productReviewService.js`
(writes to `product_reviews`, migration 009, wired at `/api/v1/product-reviews`, the one the
frontend actually calls per `frontend/src/services/api.js`'s `productReviewsAPI`) is the
canonical review system. This module writes to its own `reviews` table with weaker integrity
(VARCHAR `product_id`/`user_id`, no real FK to `products`/`users`, unlike `product_reviews`'
real UUID FKs) and fewer real features (no update/delete, no per-user helpful-vote dedup table,
no moderator-tracked moderation, no verified-purchase check).

Investigated whether its one distinguishing feature - an "AI-powered sentiment analysis" call
on `createReview` - was worth merging into the canonical system. It is not, and should NOT be
copied as-is: `aiAPI.generateRecommendation({task: 'sentiment_analysis', ...})` does not run
sentiment analysis. `generateRecommendation()` is a thin wrapper around
`generateRecommendations()`, the purchase-history-based product recommendation engine in the
same file - it ignores the `task` field except to echo it back on the response. Calling it with
`task: 'sentiment_analysis'` returns product recommendations relabeled as a sentiment result,
which is the same fabricated-label pattern already found and fixed elsewhere in this codebase
(see `schema-decisions.json`, `.ai/tasks/ACTIVE.md`) - porting it into `product_reviews` would
have added a fabrication, not merged real value. `product_reviews` does not have (and should
not gain, until a real sentiment-analysis capability exists) an `ai_analysis` field.

Reachable via `/api/v1/backend-modules/M060/:operation`; confirmed no frontend caller. Left in
place rather than deleted per this repo's "merge or document, don't delete outright" convention
- if a real sentiment-analysis provider is ever wired up, revisit whether it belongs here or on
`product_reviews` directly.

---
Original note (2026-08-29), kept for history: Fixed a real fabrication bug -
`getProductContext()` returned a hardcoded `{category:'grains', average_rating:4.2}` for every
product regardless of ID; now queries the real `products`/`categories` tables. README
previously said "Auto-generated module template. Domain: TBD," stale relative to the real
`service.js`.
