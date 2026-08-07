# Claude Enhancement Prompt — AFRERA Directive Deepening Pass

Reusable prompt for folding new raw discussion (brainstorm text, meeting notes, another platform concept) into `AFRERA_CLAUDE_BUILD_DIRECTIVE.md` without diluting it. Use this any time new material shows up — instead of re-summarizing everything from scratch, it forces the same discipline the directive already holds itself to.

Paste the block below into a fresh Claude session with the repo open, substituting the new material in step 0.

---

```
You are extending AFRERA_CLAUDE_BUILD_DIRECTIVE.md, the authoritative build
directive for the AFRERA platform at C:\Users\DIYA GOEL\Downloads\EBDESIGN. Claude
implements this directly — there is no separate build agent.

Step 0 — new source material to fold in:
[PASTE THE RAW TEXT HERE]

Read the full directive before doing anything else. It already supersedes older
reports in this folder and encodes hard-won corrections — §8.7 lists six times a
"confident count" about this codebase turned out wrong. Do not repeat that
mistake with the new material.

Rules for this pass:

1. Read the full directive first. Do not restate what it already says — find
   only what is missing, contradicted, or genuinely new.

2. Apply §1.2's test to every new biological or computational analogy: state
   the measurable engineering benefit (a latency number, a recovery time, a
   defect class prevented, or a concrete existing repo constraint it addresses)
   or explicitly reject it as redundant/decorative, naming which existing row
   it duplicates. "This doesn't help" is a valid, expected output — say so
   plainly rather than forcing a row into the table.

3. Before adding any new module, capability, or platform claim, run the §0.4
   gate mentally: grep backend/src and frontend/src for the core noun. If it
   already exists under another name, say so — extend it, don't duplicate
   (§0.5, the non-negotiable naming constraint).

4. Tie every addition to something concrete already in this repo — a file
   path, an existing service, a migration, a known defect from Part 8 —
   wherever one exists. Ungrounded additions are lower value than grounded
   ones, and this directive's credibility comes from being checkable.

5. Preserve the document's voice: terse, evidence-first, skeptical of its own
   past claims, numbered standing rules, no marketing language.

6. Output only the diff — the exact section(s) to add or change, ready to
   paste in via a targeted edit. Do not regenerate the whole document.

7. If nothing in the new material survives rule 2, say so plainly and stop.
   A one-line "nothing here clears the bar" is a correct and complete answer.
```

---

## Why this exists

`AFRERA_CLAUDE_BUILD_DIRECTIVE.md` is only trustworthy because every claim in it can be checked against a file, a migration, or a measured number (§8.7). A prompt that just says "summarize this and add it" would slowly turn the directive back into the kind of confidently-wrong document §0 warns against. This prompt exists to keep that from happening as new material accumulates across sessions.
