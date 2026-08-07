# AFRERA Design System

**Date:** 2026-08-04
**Files:** `frontend/src/index.css`, `frontend/tailwind.config.js`,
`frontend/src/components/Accessibility/AccessibilityProvider.jsx`

---

## A correction before anything else

I earlier told you the frontend had "45 components, one CSS file and zero
design tokens." **That was wrong.** The frontend already had a competent token
layer: shadcn-style HSL custom properties with a full dark-mode set, Tailwind
wired to consume them, and Radix UI primitives underneath. I had counted CSS
*files* and concluded there was no system, which was a lazy inference.

What follows is therefore an extension of a working system, not a rescue.

---

## The real defect: two greens both called "the brand green"

```css
:root { --primary: 142 76% 36%; }   /* resolves to #16A249 */
.afrera-green { @apply text-[#1e8e3e]; }   /* hardcoded #1E8E3E */
```

These are different colours — 24.2 apart in RGB (Δ = -8, +20, +11), visibly
different placed side by side. Any screen mixing `bg-primary` with
`.afrera-green-bg` showed two brand greens at once, and dark mode only moved
one of them.

**Fixed** by deriving the utilities from the token:

```css
.afrera-green    { @apply text-primary; }
.afrera-green-bg { @apply bg-primary text-primary-foreground; }
```

The orange had the same problem (`#f97316` inline) and is now
`--brand-accent`. One source of truth; dark mode follows automatically.

---

## Domain tokens

The shadcn primitives describe a generic application — primary, muted,
destructive. They cannot express what this platform actually puts on screen:
whether a lot is perishable, whether a cold chain held, whether a product
carries GI protection, how urgent an incident is.

Without domain tokens, 45 components each pick their own orange for "warning".

| Group | Tokens | Mirrors |
|---|---|---|
| Handling engine | `perishable`, `ambient` | `handling_engines` (992) |
| Cold chain | `coldchain-ok / warn / breach` | temperature signals |
| Provenance | `provenance-gi / organic / unverified` | GI + organic certification |
| Severity | `sev-info / notice / warning / critical / emergency` | `SEVERITY` enum + incident ladder |
| Data quality | `data-real / estimated / assumed` | MCDA data-quality weighting |

Two deliberate choices inside these:

**Severity survives desaturation.** Lightness descends monotonically across the
five levels, so severity is still readable in greyscale and under red-green
colour blindness. Severity encoded by hue alone fails for roughly 8% of men.

**`unverified` is neutral grey, never green.** An unverified claim must not
borrow the visual language of a verified one. That is a trust decision
expressed as a token.

**Data-quality tokens exist because the backend already grades confidence.**
The MCDA layer distinguishes `real` / `estimated` / `assumed` inputs. A figure
derived from assumed data should not look as solid on screen as a measured
one — the UI can now say so.

---

## Accessibility modes

Recovered from the v42 `A11Y` constant `{simple, kiosk, voice, sms}` and made
real as `AccessibilityProvider`, mirroring the backend `accessibility_modes`
table (migration 992).

These are **not theme preferences.** They describe different access situations:

| Mode | Situation | Behaviour |
|---|---|---|
| `simple` | Full interface is overwhelming | 118% type, 3rem targets, decorative motion removed |
| `kiosk` | Shared village / CSC terminal | 132% type, 3.5rem targets, **nothing persisted** |
| `voice` | Content read aloud | 3px focus ring — the caret is the user's position when they can't see |
| `sms` | Feature phone, no data | Low-bandwidth flag; **on by default** |

Three things worth calling out:

1. **Kiosk deliberately does not persist.** On a shared device, saving a
   preference leaks one person's setting onto the next person who walks up.
   The provider clears storage rather than writing it.
2. **SMS defaults to on.** It is a channel the platform always offers, not
   something a farmer must discover in a settings menu. For some users it is
   the only channel that exists.
3. **The provider exposes request headers and a `pageSize` hint**, so the
   *API* can send less — not just the client render less. A user on SMS should
   not be shipped a 200-item catalogue and told to ignore it.

`prefers-reduced-motion` is honoured globally regardless of mode.

---

## How to use it

```jsx
<Badge className="bg-perishable text-perishable-foreground">Perishable</Badge>
<span className="text-coldchain-breach">Temperature excursion</span>
<Dot className="bg-sev-critical" />
<small className="text-data-assumed">Estimated — no meter reading</small>

const { modes, isLowBandwidth, pageSize, requestHeaders } = useAccessibility();
```

**Rule going forward:** no new hex literal in a component. If a colour is
missing, add a token — that is how the two-greens problem started.

---

## Verification status

| Check | Result |
|---|---|
| Brand colour conflict | identified numerically and resolved |
| Token layer wired into Tailwind | yes — 6 domain groups |
| `AccessibilityProvider` mounted outermost in `App.jsx` | yes, JSX balanced (verified by reading the file) |
| Dark-mode variants for every domain token | yes |
| **Lint / build** | **NOT RUN — the workspace shell became unresponsive** |

The last row matters. `npm run lint` and `npm run build` in `frontend/` should
be run before trusting this. The changes are CSS custom properties, a Tailwind
config extension, and one new provider component — low-risk shapes — but
"low-risk" is not "verified", and I have introduced bugs this session that only
verification caught.
