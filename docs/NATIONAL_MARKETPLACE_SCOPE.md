# National marketplace scope and current evidence

The launch market includes every Indian state and union territory. North East farmers and village producers can sell to buyers anywhere in India; producers elsewhere can supply the same marketplace. North East field validation has early priority, while candidate local services require verified district, language, institutional, scheme and carrier evidence before activation. Marketplace reach and local service certification are separate states.

The jurisdiction list is seeded from the [National Portal of India](https://www.india.gov.in/calendar/lakshadweep-ut), reviewed on 2026-09-15. The state dimension formerly held only North East seeds. Migrations 10008 and 10009 extend planning coverage and product origin selection to 28 states and 8 union territories. Migration 10010 gives listings an ID default and national origin/cold-chain/shelf-life fields.

The e-commerce marketplace page now calls the mounted `/api/v1/ecommerce-marketplace` routes. National browse is public. Seller writes require a token and the origin address must belong to that seller and match the chosen state. The listing's existing price, quality and demand calculations are deterministic heuristics and report no invented model confidence.

Fulfillment ranking can reject a route that fails its origin, destination, cold-chain, capacity, delivery time or remaining shelf life. Actual carrier option sourcing, booking, checkout, GST place-of-supply, payment, producer earnings, returns and claims remain integration work. No candidate jurisdiction is presented as having locally certified operations.

The reverse marketplace is part of the same national account: farmers and verified household members need discounted household goods and farm inputs, including machinery, seeds, fertilizers, piping, drip irrigation and pumps. Benefit eligibility, funded discount, subsidy and product price must be separately auditable; a generic coupon or unverified scheme claim is insufficient.
