---
agent: seo-auditor
status: warn
findings: 6
---

# SEO Audit — AFRERA Platform (Refresh)

## Summary

This is a client-rendered Vite + React SPA (`frontend/`) that is **predominantly an authenticated B2B/farmer platform**: of the ~190 routes defined in `frontend/src/config/routes.js`, only 15 sit in the unauthenticated `publicRoutes` array (home, marketplace, marketplace/premium, product detail, login, register, the 5 farmer-entrance doors, forward pricing, climate, corridor economics, land use). Everything else — dashboards, wallet, logistics, insurance, ~150 `/modules/mNNN` admin screens, and a large `farmerRoutes`/`adminRoutes`/`dashboardRoutes` set — sits behind `ProtectedRoute`/`RoleRoute` and is correctly out of scope for SEO. This audit scopes findings to the public surface only, per instruction.

**Since the prior audit, most of the previously-flagged gaps have been fixed**: `frontend/index.html` now carries `og:image`/`twitter:image`, a working favicon, a canonical tag, and two `application/ld+json` blocks (`Organization`, `WebSite`); `frontend/public/robots.txt` and `frontend/public/sitemap.xml` now exist; the broken favicon reference is gone; and a real per-route metadata system (`RouteAnalytics.jsx`'s `RouteMetadata` component, driven by `config/routes.js`) now pushes a distinct `<title>`/description/keywords/canonical/OG/Twitter set for each of the ~190 route entries (including `noIndex` support, correctly applied to `/login` and `/register`).

The remaining gaps are narrower but real: (1) `robots.txt` and `sitemap.xml` were written against a route-naming scheme that no longer matches `config/routes.js` — several "public" URLs in both files are either mistyped (missing hyphens) or actually gated behind farmer-role auth; (2) product pages still get a generic, static title/description rather than the real product name/price despite live data being available; (3) the `RouteMetadata` component's own OG/Twitter image fallback points at files that don't exist; and (4) the two PWA manifest files remain duplicated and inconsistent. Overall status remains **warn** — meaningfully improved from the prior audit, but not yet clean.

## Findings

### 1. `robots.txt`/`sitemap.xml` reference stale/mistyped paths, several of which are actually auth-gated
- **Severity:** High
- **Location:** `frontend/public/robots.txt` (lines 6–19), `frontend/public/sitemap.xml`, cross-referenced against `frontend/src/config/routes.js`
- **Description:** Both files list `/pricecheck`, `/pricebuild`, `/dynamicpricing`, `/selltiming` as crawlable public URLs. The actual routes in `config/routes.js` are `/price-check`, `/price-build`, `/dynamic-pricing`, `/sell-timing` (hyphenated) — so as written, these sitemap/robots entries point at paths that don't resolve to those pages at all (they'd hit the SPA's catch-all/`NotFoundPage`). Worse, even the correctly-spelled versions of these routes, plus `/discover`, `/compare`, and `/experience` (also listed as `Allow`/sitemap URLs), are defined inside `farmerRoutes` in `config/routes.js` and rendered via `<RoleRoute allowedRoles={['farmer','admin']}>` in `frontend/src/App.jsx` (lines 127–142) — i.e. they require an authenticated farmer/admin session and redirect anonymous visitors (including crawlers) away. Submitting these to Google Search Console will produce "submitted URL not found" or soft-404/redirect-loop reports and wastes crawl budget on pages that were never public. Conversely, genuinely public pages are missing from the sitemap entirely: `/marketplace/premium`, `/pricing/forward`, and all four `/farmer-entrance/*` sub-doors (`sell`, `household`, `field`, `shared`) are in `publicRoutes` but absent from `sitemap.xml`.
- **Remediation:** Regenerate `robots.txt`/`sitemap.xml` directly from `publicRoutes` in `config/routes.js` (ideally as a small build step so the two can't drift again) rather than hand-maintaining a separate list. Only the 15 entries in `publicRoutes` (minus the two `noIndex: true` ones, `/login` and `/register`, which should stay out of the sitemap though they can remain crawlable-but-not-indexed) belong in either file.

### 2. Product/marketplace pages get a static, generic title/description instead of dynamic per-item content
- **Severity:** Medium (downgraded from High — a real per-route metadata system now exists, this is the one place it doesn't reach)
- **Location:** `frontend/src/config/routes.js:240-248` (`/products/:id` entry), `frontend/src/pages/ProductDetailPage.jsx`, `frontend/src/components/RouteAnalytics.jsx` (`RouteMetadata`, lines 165-219)
- **Description:** `RouteMetadata` looks up metadata via `getRouteByPath(location.pathname)`, which matches on the **path pattern**, not the resolved entity. So every product detail page gets the same static `title: 'Product Details'` / `description: 'View detailed information about agricultural products'` regardless of which product is loaded — even though `ProductDetailPage.jsx` clearly has `product.name`, `product.base_price`, `product.category_name` etc. in scope (lines 54-111) and could trivially produce `"${product.name} — AFRERA Marketplace"` and a price-bearing description. Shared product links (WhatsApp/social, which is explicitly the stated use case for OG tags on this rural-market platform) all render identically regardless of which product was shared. The same applies to any query-parameterized marketplace/discovery views if those are ever made indexable.
- **Remediation:** In `ProductDetailPage.jsx`, once `product` loads, call the same `updateMetaDescription`/OG/Twitter update helpers already exported from `RouteAnalytics.jsx` (or lift them to a shared hook) with the actual product name, description, price, and image. Add `Product`/`Offer` JSON-LD (still zero JSON-LD blocks exist outside `index.html`) sourced from the same fetched data.

### 3. `RouteMetadata`'s own OG/Twitter image fallback points at files that don't exist
- **Severity:** Medium
- **Location:** `frontend/src/components/RouteAnalytics.jsx:192,202` (`route.image || '/og-image.png'`, `route.image || '/twitter-image.png'`); `frontend/public/` contains no `og-image.png` or `twitter-image.png`
- **Description:** None of the 190 entries in `config/routes.js` set an `image` field (confirmed — no `image:` key anywhere in the file), so every client-side route transition falls through to these two hardcoded fallback paths, both of which 404. This silently overwrites the perfectly good `og:image`/`twitter:image` values that ship in `index.html` (pointing at `icon-512.png`) the moment `RouteMetadata` fires on first client-side navigation, meaning any link shared *after* an in-app navigation (e.g. via a "share this page" feature, or a crawler that executes JS) gets a broken image reference instead of the working one from the static HTML.
- **Remediation:** Either add real `og-image.png`/`twitter-image.png` assets to `frontend/public/`, or change the fallback to reuse the existing `icon-512.png` (matching `index.html`) so client-side navigation never regresses below the SSR/static baseline.

### 4. `og:image`/`twitter:image` use a square 512×512 app icon, not a social-preview-shaped image
- **Severity:** Low (prior "no image at all" finding is fixed; this is a follow-on polish item)
- **Location:** `frontend/index.html:26,32,45`
- **Description:** `og:image` and `twitter:image` now resolve to `icons/icon-512.png`, a square PWA app icon. `twitter:card` is `summary_large_image`, which expects a ~1200×630 landscape image; most platforms (X/Twitter, LinkedIn, WhatsApp, Facebook) will letterbox or awkwardly crop a square icon in the large-image card layout rather than rendering a proper preview.
- **Remediation:** Add a purpose-built 1200×630 share image and point `og:image`/`twitter:image` at it; keep the app icon for `link rel="icon"`/manifest use only.

### 5. Duplicate, drifted PWA manifest files persist (`manifest.json` vs `manifest.webmanifest`)
- **Severity:** Low (unresolved from prior audit)
- **Location:** `frontend/public/manifest.json` vs `frontend/public/manifest.webmanifest`
- **Description:** Still two manifests with different `name` ("AFRERA Platform" vs "AFRERA — Agriculture & Rural Economy Platform"), different `theme_color` (`#10b981` vs `#16a34a`), different `description`, and different `shortcuts` (the orphaned `manifest.json` links a `/farmer-portal` shortcut that isn't in `manifest.webmanifest`'s shortcut set, and vice versa for `/dashboard`). Only `manifest.webmanifest` is linked from `index.html:13`; `manifest.json` remains dead weight and a landmine for the next person who edits the wrong file.
- **Remediation:** Delete `manifest.json` (confirm nothing references it — no matches found in `frontend/src` or `index.html`) or consolidate to one file.

### 6. Hardcoded placeholder production domain (`https://afrera.platform`) baked into OG/canonical/sitemap
- **Severity:** Low (informational — flag before launch, not a code defect today)
- **Location:** `frontend/index.html` (canonical, `og:url`, `og:image`, `twitter:image`, both JSON-LD blocks), `frontend/public/robots.txt` (Sitemap directive), `frontend/public/sitemap.xml` (every `<loc>`)
- **Description:** All SEO-relevant URLs are consistently hardcoded to `https://afrera.platform`, which does not appear to be a domain this project owns/serves from yet (no matching config in `frontend/.env*` or `vite.config`). Consistency is good (no cross-file drift on the domain itself, unlike Finding #1's path drift), but if the real production domain differs at launch, every canonical tag, OG URL, sitemap entry, and JSON-LD `url`/`logo` field needs a coordinated update in one pass.
- **Remediation:** Move the base URL to a single env-driven constant (e.g. `VITE_SITE_URL`) consumed by `index.html` (via a build-time replace) and by whatever generates `sitemap.xml`/`robots.txt`, so the real domain only needs to be set in one place before launch.

## Metrics

| Metric | Value |
|---|---|
| Total routes defined (`config/routes.js`) | ~190 across `publicRoutes`, `protectedRoutes`, `farmerRoutes`, `adminRoutes`, `dashboardRoutes`, `managementRoutes` |
| Public (unauthenticated, SEO-relevant) routes | 15 (`publicRoutes` array) |
| Public routes with unique static title/description/keywords | 15 of 15 (via `RouteMetadata`) |
| Public routes with dynamic (per-instance) title/OG/schema | 0 of 1 that need it (`/products/:id`) |
| JSON-LD structured data blocks | 2 (`Organization`, `WebSite` in `index.html`) — 0 `Product`/`Offer`/`BreadcrumbList` |
| `og:image` / `twitter:image` present | Yes (static HTML) — but image is a square app icon, and client-side nav fallback (`RouteAnalytics.jsx`) points at non-existent files |
| `robots.txt` present | Yes — but contains 4 mistyped and 6 auth-gated URLs |
| `sitemap.xml` present | Yes — 14 URLs, 6 invalid/gated, 6 legitimate public routes missing |
| Canonical tags present | Yes (static + dynamically updated per route via `RouteMetadata`) |
| Favicon resolves | Yes (`/icons/icon-192.png` exists) |
| `noIndex` correctly applied | Yes, on `/login` and `/register` |
| PWA manifest files present | 2, still mutually inconsistent (`manifest.json` orphaned, only `manifest.webmanifest` linked) |
