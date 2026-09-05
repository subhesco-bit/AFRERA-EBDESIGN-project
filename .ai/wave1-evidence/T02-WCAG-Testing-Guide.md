# T02: WCAG 2.2 AA Accessibility & Responsive Validation
**Wave 1 Execution Guide**

**Timeline:** Day 2 (Sep 6)  
**Effort:** 8 hours  
**Target:** WCAG compliance >85 accessibility score  
**Frontend URL:** http://localhost:3001 (Vite auto-redirected from 3000)

---

## STEP 1: Keyboard Navigation Test (2 hours)

### Purpose
Verify that all interactive elements can be accessed using keyboard only (Tab/Shift+Tab), with no keyboard traps.

### Procedure

#### Test Pages (10 pages × 10 minutes each)

1. **Dashboard Page**
   - Open: http://localhost:3001/dashboard
   - Unplug mouse (or use Ctrl+Alt+M in DevTools to disable mouse)
   - Starting position: Top of page
   - Press Tab repeatedly (forward navigation)
   - Verify visible focus ring on each interactive element
   - Order should be logical: left-to-right, top-to-bottom
   - No focus should disappear unexpectedly
   - **Evidence:** Screenshot showing focus on key button

2. **User Management Page**
   - Open: http://localhost:3001/users
   - Tab through: Search box → Add User button → Edit/Delete on each row
   - Verify: Tab order in table rows is logical
   - **Evidence:** Screenshot of table navigation

3. **Product Listing**
   - Open: http://localhost:3001/products
   - Tab through: Filter controls → Product cards → Action buttons
   - Verify: No focus lost on card interactions
   - **Evidence:** Screenshot

4. **Farmer Profile**
   - Open: http://localhost:3001/farmers
   - Tab through: All form inputs and buttons
   - **Evidence:** Screenshot

5. **AI Chat Interface**
   - Open: http://localhost:3001/ai-chat
   - Tab to: Message input → Send button
   - Tab through: Previous message history (if interactive)
   - **Evidence:** Screenshot

6. **MFA Setup Page**
   - Open: http://localhost:3001/mfa
   - Tab through: Stepper (should NOT be keyboard navigable to previous—only forward)
   - Tab to each input field
   - Tab to verify/cancel buttons
   - **Evidence:** Screenshot

7. **Settings Page**
   - Open: http://localhost:3001/settings
   - Tab through: All toggle switches and input fields
   - Verify toggles respond to Space key
   - **Evidence:** Screenshot

8. **Notification Center**
   - Open: http://localhost:3001/notifications
   - Tab through: Mark as read buttons, delete buttons
   - **Evidence:** Screenshot

9. **Search/Knowledge**
   - Open: http://localhost:3001/search
   - Tab to: Search input → Search button → Result items
   - **Evidence:** Screenshot

10. **Support/Help**
    - Open: http://localhost:3001/support
    - Tab through: Contact form fields
    - **Evidence:** Screenshot

### Verification Checklist

- [ ] All buttons are reachable via Tab
- [ ] All form inputs are reachable via Tab
- [ ] All links are reachable via Tab
- [ ] Focus ring is ALWAYS visible (not hidden)
- [ ] Focus order is logical (left→right, top→bottom)
- [ ] No "keyboard traps" (impossible to Tab away)
- [ ] Modals can be closed via Escape key
- [ ] Tab wraps from last element to first (or closes modal)

### Expected Findings

✅ **PASS:** All elements reachable, no traps, logical order  
❌ **FAIL:** Missing focus indicator, skipped elements, reachability issues

---

## STEP 2: Chrome DevTools Lighthouse Accessibility Audit (1 hour)

### Procedure

1. Open Chrome DevTools (F12 or Ctrl+Shift+I)
2. Go to **Lighthouse** tab
3. Select **Accessibility** category only
4. Set "Desktop" or "Mobile"
5. Click **Analyze page load**
6. Wait for report (2-3 minutes)
7. Screenshot the score and full report

### Run on These Pages (Pick 3 Representative)

**Desktop Version:**
- http://localhost:3001/dashboard
- http://localhost:3001/ai-chat
- http://localhost:3001/users

**Mobile Version (DevTools → Toggle device toolbar → iPhone SE):**
- http://localhost:3001/dashboard
- http://localhost:3001/products
- http://localhost:3001/mfa

### Target Scores

- **Dashboard:** >85
- **AI Chat:** >85
- **User Management:** >85

### What Lighthouse Checks

✅ Contrast ratios (text vs background)  
✅ Form label associations  
✅ Button/link purpose clarity  
✅ Heading hierarchy  
✅ ARIA attributes  
✅ Color-only status indicators  
✅ Focus visible  
✅ Name/role/value semantics

### Evidence Required

- [ ] Screenshot: Lighthouse score (Desktop, Dashboard)
- [ ] Screenshot: Lighthouse score (Desktop, AI Chat)
- [ ] Screenshot: Lighthouse score (Mobile, Dashboard)
- [ ] Full report export (if available)

---

## STEP 3: Semantic Structure & Heading Hierarchy (1 hour)

### Procedure

#### Using Chrome DevTools Inspector

1. Press F12 → **Inspector** tab
2. Click element picker (top-left icon)
3. Click on main content area
4. Verify HTML structure:

```
<main>                    ← Main landmark
  <h1>Page Title</h1>     ← Only ONE per page
  <section>               ← Semantic section
    <h2>Subsection</h2>   ← Hierarchy: no skips (h2 after h1)
    <button>...</button>
  </section>
  <nav>                   ← Navigation landmark
    <a href="...">Link</a>
  </nav>
</main>
```

#### Landmark Verification

Pages should have:
- ✅ One `<main>` element (primary content)
- ✅ One `<nav>` element (site navigation)
- ✅ One `<header>` or `<nav>` for page header
- ✅ One `<footer>` (site footer)

#### Heading Hierarchy Check

Run this in browser console:

```javascript
// Get all headings
const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
headings.forEach(h => {
  console.log(`${h.tagName}: "${h.textContent.substring(0, 50)}"`);
});
```

**Rules:**
- ✅ Page starts with `<h1>` (only one per page)
- ✅ No skips: If you have h2, next shouldn't jump to h4
- ✅ Proper nesting: h2 → h3 → h4 (sequential)

**Evidence:** Screenshot or console output

---

## STEP 4: Form Labels & Input Associations (30 min)

### Procedure

For each form on the page:

```html
<!-- ✅ CORRECT: Label associated via htmlFor -->
<label htmlFor="email">Email Address:</label>
<input id="email" type="email" />

<!-- ❌ WRONG: No label -->
<input type="email" placeholder="Email" />

<!-- ❌ WRONG: Label not associated -->
<label>Email Address:</label>
<input type="email" />
```

### Check Using Inspector

1. Click on input field
2. Right-click → **Inspect**
3. Look for `<label>` with matching `htmlFor={id}`
4. **If missing:** This is an accessibility defect

### Pages to Check

- [ ] Dashboard: All form fields labeled?
- [ ] User form: All inputs have labels?
- [ ] AI Chat: Message input labeled?
- [ ] Settings: All toggles/inputs labeled?

**Evidence:** Screenshot of inspector showing label associations

---

## STEP 5: Color Contrast Verification (30 min)

### Procedure

#### Using WAVE Browser Extension (Recommended)

1. Install: https://wave.webaim.org/extension/
2. Open page
3. Click WAVE icon
4. Check: **Contrast Errors** section
5. Verify: No red error markers

#### Using Chrome DevTools

1. Press F12 → **Inspector**
2. Click on text element
3. Scroll down to **Accessibility** section
4. Check contrast ratio (should be ≥4.5:1 for normal text)

#### Manual Check in DevTools Lighthouse

1. Run Accessibility audit (Step 2)
2. Look for "Low contrast" findings
3. Should see 0 issues

### Requirements

- ✅ Regular text: Contrast ratio ≥ **4.5:1**
- ✅ Large text (18pt+): Contrast ratio ≥ **3:1**
- ✅ UI components: Contrast ratio ≥ **3:1**
- ✅ **NOT only color-coded** (use icons, text, patterns too)

**Evidence:** Screenshot of DevTools showing contrast ratios

---

## STEP 6: Responsive Design Validation (4 hours)

### Procedure

Test three viewports:

#### Viewport 1: Desktop (1920 × 1080)

```
Chrome DevTools → Toggle device toolbar OFF (normal desktop view)
```

**Checklist:**
- [ ] Full layout visible (no horizontal scroll)
- [ ] Readable text (not tiny)
- [ ] Buttons/links at least 48px tall (touch target size)
- [ ] No weird spacing or overlaps
- [ ] Multi-column layout works

**Pages to test:**
- http://localhost:3001/dashboard (2-3 column layout)
- http://localhost:3001/products (grid layout)
- http://localhost:3001/users (table layout)

**Evidence:** Screenshot (1920px viewport)

---

#### Viewport 2: Tablet (768 × 1024 - iPad size)

```
Chrome DevTools → Toggle device toolbar ON → Select iPad (768×1024)
```

**Checklist:**
- [ ] Single or 2-column layout (no 3-column)
- [ ] Text still readable
- [ ] No horizontal scroll
- [ ] Buttons remain 48px+ (touch-friendly)
- [ ] Navigation still accessible

**Pages to test:**
- http://localhost:3001/dashboard
- http://localhost:3001/products
- http://localhost:3001/ai-chat

**Evidence:** Screenshot (768px viewport)

---

#### Viewport 3: Mobile (375 × 667 - iPhone SE size)

```
Chrome DevTools → Toggle device toolbar ON → Select iPhone SE (375×667)
```

**Checklist:**
- [ ] Single column layout (stack vertically)
- [ ] Full-width buttons (or stacked)
- [ ] No horizontal scroll
- [ ] Text readable without zooming
- [ ] Touch targets 48px+ minimum
- [ ] Navigation accessible (hamburger menu, drawer, etc.)

**Pages to test:**
- http://localhost:3001/dashboard
- http://localhost:3001/products
- http://localhost:3001/ai-chat
- http://localhost:3001/mfa

**Evidence:** Screenshot (375px viewport)

---

### Zoom & Reflow Test

**Procedure:**
1. Open page (any viewport)
2. Zoom to 200% (Ctrl + Scroll or Cmd + Scroll)
3. Verify: No horizontal scroll appears
4. All elements still reachable via keyboard

**Evidence:** Screenshot at 200% zoom

---

## STEP 7: Touch Target Size Validation (30 min)

**Rule:** Interactive elements should be at least 48×48 pixels

### Check Using DevTools

1. Inspector → Select button/link
2. Look at **Box Model** dimensions
3. Measure: `width × height`
4. Should be ≥ 48 × 48 px

### Pages to Check

- [ ] All buttons in Dashboard
- [ ] All buttons in MFA form
- [ ] All links in navigation
- [ ] All icons in toolbar

**Acceptable:** 44×44 if padding makes total target ≥48×48

**Evidence:** Screenshot of DevTools showing dimensions

---

## STEP 8: Screen Reader Testing (1 hour - Optional)

If time allows, test with screen reader:

### Windows
- Use **Narrator** (built-in): Win + Ctrl + Enter
- Read-aloud: Key combinations available

### Mac
- Use **VoiceOver** (built-in): Cmd + F5

### What to verify
- Headings are announced correctly
- Form labels are read
- Button purposes are clear
- Links have descriptive text (not "click here")

---

## EVIDENCE CHECKLIST

Create `.ai/wave1-evidence/T02-screenshots/`:

- [ ] **Keyboard-navigation/** (10 screenshots from Step 1)
  - dashboard.png
  - users.png
  - products.png
  - farmers.png
  - ai-chat.png
  - mfa.png
  - settings.png
  - notifications.png
  - search.png
  - support.png

- [ ] **lighthouse/** (3-6 reports from Step 2)
  - desktop-dashboard.png
  - desktop-ai-chat.png
  - desktop-users.png
  - mobile-dashboard.png
  - mobile-products.png
  - mobile-ai-chat.png

- [ ] **semantic-structure/** (from Step 3)
  - heading-hierarchy.png
  - landmark-structure.png

- [ ] **forms-labels/** (from Step 4)
  - forms-inspection.png

- [ ] **contrast/** (from Step 5)
  - contrast-check.png
  - lighthouse-contrast-report.png

- [ ] **responsive/** (from Step 6)
  - desktop-1920px.png
  - tablet-768px.png
  - mobile-375px.png
  - zoom-200-percent.png

- [ ] **touch-targets/** (from Step 7)
  - touch-target-measurements.png

---

## SUMMARY DOCUMENT

After completing all steps, create `T02-WCAG-Validation-Report.md`:

```markdown
# T02 WCAG 2.2 AA Validation Report

## Executive Summary
- Keyboard Navigation: ✅ PASS / ❌ FAIL
- Lighthouse Accessibility Score: [score] (target >85)
- Semantic Structure: ✅ PASS / ❌ FAIL
- Form Labels: ✅ PASS / ❌ FAIL
- Color Contrast: ✅ PASS / ❌ FAIL
- Responsive (Desktop): ✅ PASS / ❌ FAIL
- Responsive (Tablet): ✅ PASS / ❌ FAIL
- Responsive (Mobile): ✅ PASS / ❌ FAIL
- Touch Targets: ✅ PASS / ❌ FAIL

## Overall WCAG Compliance
✅ **WCAG 2.2 Level AA COMPLIANT** OR ❌ **Issues Found**

## Issues & Remediation
[List any failures found, with fix recommendations]

## Screenshots
[Reference all screenshot evidence]
```

---

## COMPLETION CRITERIA

✅ **T02 COMPLETE when:**
- All 10 keyboard navigation tests passed (no traps)
- Lighthouse score >85 on at least 3 pages
- Semantic structure verified (landmarks + heading hierarchy)
- All form labels properly associated
- No contrast violations
- Responsive design validated on 3 viewports
- All evidence screenshots collected
- Summary report generated

---

## EXECUTION TIME ESTIMATE

- Keyboard navigation: 2 hours
- Lighthouse audits: 1 hour
- Semantic structure: 1 hour
- Forms & labels: 0.5 hour
- Color contrast: 0.5 hour
- Responsive design: 2 hours
- Touch targets: 0.5 hour
- **Total: 8 hours** (aligned with Wave 1 timeline)

---

**Status:** READY FOR MANUAL EXECUTION  
**Estimated Completion:** Day 2 (Sep 6) EOD  
**Next:** T04 (API/Page/Module Audit)
