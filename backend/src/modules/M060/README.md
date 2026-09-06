# M060 - Review Management

Product review/rating service with AI sentiment-analysis hook. Writes to
its own `reviews` table - **note: this duplicates
`services/legacy/productReviewService.js`**, a separate, more complete
review system (450 lines, writes to `product_reviews`, migration 009)
wired this same session at `/api/v1/product-reviews`. Two real,
independent review systems exist; not merged yet - see
.ai/tasks/ACTIVE.md. Fixed a real fabrication bug 2026-08-29:
`getProductContext()` returned a hardcoded `{category:'grains',
average_rating:4.2}` for every product regardless of ID; now queries the
real `products`/`categories` tables. Reachable via
`/api/v1/backend-modules/M060/:operation`. README previously said
"Auto-generated module template. Domain: TBD," stale relative to the
real service.js.
