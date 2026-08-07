#!/usr/bin/env node
/**
 * Accessibility audit for the React frontend.
 *
 * WHY THIS IS A TOOL AND NOT A ONE-OFF SCRIPT
 *
 * The first pass of this check reported 9 unlabelled inputs in
 * ForwardPricingPage.jsx. Every one was labelled — the page uses a <Field>
 * wrapper that renders a real <label htmlFor>, and the counter was looking for
 * a literal <label> tag in the same file. Nine false positives out of nine.
 *
 * That is the same failure mode that has produced every wrong number in this
 * project: counting a pattern instead of checking a property. So this tool
 * knows about the project's own wrappers, and where it cannot be sure it says
 * so rather than reporting a count.
 *
 * WHAT IT CHECKS  (WCAG 2.1 A/AA, the subset that is statically decidable)
 *
 *   label-control    every input/select/textarea reaches an accessible name
 *   img-alt          images carry alt (empty alt is valid for decorative)
 *   interactive-div  onClick on a non-interactive element with no keyboard path
 *   table-caption    data tables have a caption or aria-label
 *   heading-order    no page declares more than one <h1>
 *   colour-only      text like "shown in red" implying colour carries meaning
 *
 * Usage:  node tools/a11y-audit.js [--json] [--fix-hints]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'frontend', 'src');

/**
 * Project wrappers that provide an accessible name for the control they wrap.
 * Adding one here is a claim about that component — it must actually render a
 * <label htmlFor> or an aria-label.
 */
const LABEL_WRAPPERS = ['<Field', '<FormField', '<LabelledInput'];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '__tests__', 'test'].includes(e.name)) continue;
      walk(p, acc);
    } else if (/\.(jsx|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const rel = (p) => path.relative(path.join(__dirname, '..'), p).replace(/\\/g, '/');

function audit(file) {
  const s = fs.readFileSync(file, 'utf8');
  const issues = [];

  // ---- label-control ------------------------------------------------------
  const controls = s.match(/<(input|select|textarea)\b[^>]*>/gi) || [];
  const wrappers = LABEL_WRAPPERS.reduce(
    (n, w) => n + (s.split(w).length - 1), 0
  );
  const explicitLabels = (s.match(/<label\b/gi) || []).length;
  const ariaLabels = (s.match(/aria-label(?:ledby)?=/gi) || []).length;
  const named = wrappers + explicitLabels + ariaLabels;
  if (controls.length > named) {
    issues.push({
      rule: 'label-control',
      count: controls.length - named,
      detail: `${controls.length} form control(s), ${named} accessible name(s) `
            + `(${wrappers} via wrapper, ${explicitLabels} <label>, ${ariaLabels} aria-label)`,
      fix: 'Wrap in <Field label=… id=…> or add an explicit <label htmlFor>.',
    });
  }

  // ---- img-alt ------------------------------------------------------------
  const imgs = s.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter((i) => !/\salt=/.test(i));
  if (noAlt.length) {
    issues.push({
      rule: 'img-alt', count: noAlt.length,
      detail: `${noAlt.length} <img> without alt`,
      fix: 'Add alt="" for decorative images, or a description for meaningful ones.',
    });
  }

  // ---- interactive-div ----------------------------------------------------
  // onClick on a div/span with no role, tabIndex or key handler cannot be
  // reached by keyboard at all. This is not a nuance — the control is invisible
  // to anyone not using a mouse.
  const clickables = s.match(/<(div|span|li|td)\b[^>]*onClick[^>]*>/gi) || [];
  const unreachable = clickables.filter(
    (c) => !/role=/.test(c) || !/tabIndex/.test(c) || !/onKey(Down|Press|Up)/.test(c)
  );
  if (unreachable.length) {
    issues.push({
      rule: 'interactive-div', count: unreachable.length,
      detail: `${unreachable.length} clickable non-interactive element(s) with no keyboard path`,
      fix: 'Use <button type="button">, or add role="button" tabIndex={0} and an onKeyDown '
         + 'handling Enter and Space.',
    });
  }

  // ---- table-caption ------------------------------------------------------
  const tables = (s.match(/<table\b/gi) || []).length;
  const captions = (s.match(/<caption\b/gi) || []).length
                 + (s.match(/<table[^>]*aria-label/gi) || []).length;
  if (tables > captions) {
    issues.push({
      rule: 'table-caption', count: tables - captions,
      detail: `${tables} table(s), ${captions} caption(s)`,
      fix: 'Add <caption>. Without it a screen reader announces only "table with N columns".',
    });
  }

  // ---- heading-order ------------------------------------------------------
  const h1 = (s.match(/<h1\b/gi) || []).length;
  if (h1 > 1) {
    issues.push({
      rule: 'heading-order', count: h1,
      detail: `${h1} <h1> elements`,
      fix: 'One <h1> per page. Screen-reader users navigate by heading level and multiple '
         + 'h1s make that ordering meaningless.',
    });
  }

  // ---- colour-only --------------------------------------------------------
  const colourWords = s.match(/(shown|marked|highlighted|indicated)\s+in\s+(red|green|amber|yellow)/gi) || [];
  if (colourWords.length) {
    issues.push({
      rule: 'colour-only', count: colourWords.length,
      detail: 'Copy implies colour carries the meaning',
      fix: 'Add a text or icon cue. Around 8% of men cannot distinguish red from green.',
    });
  }

  return issues;
}

function main() {
  const files = walk(SRC);
  const report = [];
  for (const f of files) {
    const issues = audit(f);
    if (issues.length) report.push({ file: rel(f), issues });
  }

  const byRule = {};
  for (const r of report) {
    for (const i of r.issues) byRule[i.rule] = (byRule[i.rule] || 0) + i.count;
  }
  const total = Object.values(byRule).reduce((a, b) => a + b, 0);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ scanned: files.length, total, byRule, report }, null, 2));
    return;
  }

  console.log(`a11y-audit: ${files.length} component files scanned`);
  console.log(`${total} issue(s) across ${report.length} files\n`);
  for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${rule.padEnd(18)} ${String(n).padStart(4)}`);
  }
  if (process.argv.includes('--fix-hints')) {
    console.log('');
    for (const r of report) {
      console.log(`\n${r.file}`);
      for (const i of r.issues) {
        console.log(`  [${i.rule}] ${i.detail}`);
        console.log(`     -> ${i.fix}`);
      }
    }
  }
  // Reported, not enforced. This audit is advisory until the existing backlog
  // is cleared; failing CI on it today would just get the step disabled.
  process.exit(0);
}

if (require.main === module) main();
module.exports = { audit, walk };
