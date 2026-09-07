<!-- Claude AI Ready Module -->
<!-- File: DEVIN_WORK_PROTOCOL.md -->
<!-- Purpose: mandatory self-verification gate before any task is reported done -->

# Devin Work Protocol — read this before every task, no exceptions

This exists because the 30 Aug Tier-1 batch was reported "COMPLETE / 85% production
readiness" while 0 of 6 new services could survive a single real request. Every failure
was mechanically catchable in under a minute. This protocol closes that gap. Follow it in
order, every time, on every task — do not skip steps because the task "feels simple."

## Before writing any code that touches the database

1. `grep -ri "CREATE TABLE.*<table_name>"` across `backend/src/database/migrations/*.sql`
   for every table you plan to query. If it doesn't exist, **stop and say so** in your
   output instead of writing the query anyway — do not invent a schema and hope a
   migration gets written later.
2. If the table exists, `grep` the same file for its actual column list and use those
   exact names. Do not guess column names from what "should" exist.
3. Check `backend/src/database/schema-decisions.json` — if the table appears there, that
   collision/shape question is already answered; follow the recorded decision.

## Before writing any import

4. Before `require()`/`import` of any internal module, confirm the file exists at that
   exact path (`ls` or Glob it). Case matters even though your local Windows checkout is
   case-insensitive — CI is not.

## Before declaring a task done

5. Run `node --check <file>` on every JS/TS file you created or edited.
6. Run `node -e "require('./path/to/each/new/file.js')"` for every new backend file
   (route, service, middleware). It must print no error. If it needs env vars/DB to boot,
   mock or skip gracefully, but the *require* itself must succeed.
7. If you touched anything under `frontend/`, run `npx vite build` in `frontend/` and
   confirm it exits 0. A single malformed object literal anywhere in the bundle fails the
   *entire* build, not just your page — always run the full build, not a lint pass.
8. If you added a DB-touching method, actually attempt one call against it (even against
   a local/dev DB, or by tracing the exact query text against the exact migration file
   column-by-column by hand) before calling it done.

## What "done" means in your report

9. Do not write words like "production-level," "complete," "enterprise-grade," or a
   readiness percentage. Instead, for every endpoint/method you touched, state one of:
   - `VERIFIED: ran <command>, got <result>`
   - `NOT VERIFIED: <specific reason you couldn't check, e.g. "no local Postgres">`
   - `BLOCKED: <specific missing table/column/file, plus what decision is needed>`
   A report with even one "NOT VERIFIED"/"BLOCKED" line is more useful than one that
   claims everything works and is wrong.

## What NOT to do

10. Do not invent a table/column that doesn't exist and write a migration for it without
    flagging it — if two of your own services disagree on what a table should look like,
    or if a table's real purpose doesn't match what you need, **stop and write the
    conflict down** (in `.ai/tasks/ACTIVE.md`, one paragraph, plain language) instead of
    picking one guess silently. Schema decisions are expensive to unwind later.
11. Do not modify shared/reused files (e.g. `frontend/src/components/ui/common.jsx`,
    `apiResponseHandler.js`) in a way that changes an existing prop/function name unless
    you also update every caller in the same commit — a "rename" that leaves old callers
    broken is not a rename, it's a regression. `grep -rl` for the old name across the repo
    before renaming anything shared.

## Output format for every completed task

Write your summary as a table, not prose:

| File | Change | Verified how | Result |
|---|---|---|---|
| `backend/src/routes/fooRoutes.js` | new route file | `node -e "require(...)"` | passes |
| `backend/src/services/fooService.js` | new query | grepped `042_foo.sql` for columns | matches |
| `frontend/src/pages/FooPage.jsx` | new page | `npx vite build` | passes |

Anything you could not verify goes in a second table titled "Not verified / blocked" with
the specific reason — not folded into the same table as if it were done.

This is the only report format that will be trusted without a full independent audit
going forward. A narrative "production completion report" will trigger a full re-audit
before anything from it is merged, which costs more time than following this the first
time.
