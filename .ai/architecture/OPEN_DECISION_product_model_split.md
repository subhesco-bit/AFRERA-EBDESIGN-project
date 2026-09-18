# Open decision — two unlinked product models

**Raised:** 13 September 2026, from the route audit
**Status:** blocked on a domain decision; not fixable by inspection
**Symptom:** 15 API 500s — `operator does not exist: uuid = character varying`

---

## What the database actually contains

Two parallel product entities exist, with no column joining them.

| | `products` | `product_listings` |
|---|---|---|
| `id` type | **uuid** | **character varying** |
| rows today | — | **0** |
| identity | catalogue item | marketplace offer |
| has | `name`, `base_price`, `category_id`, `organic`, `gi_status`, `hsn_code`, `gst_rate`, `farmer_id` | `product_name`, `base_price`, `category_id`, `organic`, `seller_id`, `listing_status`, `quantity`, `visibility_score`, `quality_score`, `nutrition_*`, `harvest_date` |
| link to the other | none | **none** |

`product_listings` carries no `product_id`, and `products` carries no
`listing_id`. Nothing in the schema relates one to the other.

## Why it fails

`order_items.product_id` is `uuid` and has a real foreign key to
**`products.id`**. But seven queries join it to the *other* table:

```sql
JOIN order_items oi ON o.id = oi.order_id
JOIN product_listings pl ON oi.product_id = pl.id   -- uuid = varchar
```

Postgres rejects the comparison, so the endpoint 500s.

Affected files:

- `services/legacy/ecommerceAIService.js`
- `services/legacy/ecommerceBusinessSalesService.js`
- `services/legacy/ecommerceERPService.js`
- `services/legacy/ecommerceService.js`
- `services/legacy/nutrientValueSalesService.js`

## Why it was not simply fixed

The obvious repair — join `products` instead — does not work. Those queries
select `pl.seller_id`, `pl.listing_status`, `pl.nutrition_score`,
`pl.nutrition_grade`, `pl.visibility_score`, `pl.product_name` and
`pl.quantity`. **None of those columns exist on `products`.** Swapping the
table would trade a clear 500 for a different one, or silently drop the
attributes the analytics is about.

Nor is this a stray type error to cast away. `product_listings.id` is varchar
*consistently*: 16 foreign keys across 16 tables reference it, and every one of
those `product_id` columns is varchar too. The cluster is internally coherent.
It is coherent with the wrong thing.

Casting in the join (`oi.product_id::text = pl.id`) would make the error
disappear while joining orders to listings that have no relationship to them —
producing analytics that are wrong rather than absent. That is worse than a
500.

## The decision needed

One of three, and it is a product decision:

1. **Orders sell listings.** `order_items.product_id` should reference
   `product_listings`, and the FK to `products` is the mistake. Requires
   converting the listing id cluster to uuid (safe today: 0 rows) and
   repointing the FK.
2. **Orders sell catalogue products, and analytics should use them.** The
   seven queries should join `products`, and the listing-only attributes they
   select must come from somewhere else or be dropped.
3. **The two models should be reconciled** — one product entity, with listing
   attributes as a related table keyed to it. Largest change, and the only one
   that removes the ambiguity permanently.

## What was done instead

Nothing to these queries. The 15 errors remain, and they are recorded here so
the count is not mistaken for an unknown defect. Option 1 is the cheapest while
`product_listings` is empty; that window closes as soon as it has data.
