# Removed 2026-08-04 — dead Sequelize scaffold

`database/models/` (index.js, User.js, Product.js, Order.js) was removed after
verifying it was entirely unreachable:

  - imported by 0 files outside itself
  - `require('sequelize')` appears ONLY in these 4 files
  - Sequelize is never initialised or connected in index.js
  - the platform uses raw `pg` SQL through database/pool.js everywhere else

It was not "completed" because completing it would have created a second,
competing persistence layer. Two ORMs in one codebase is how a schema ends up
with two sources of truth — the exact problem the 17 duplicate table
definitions already caused.

Kept here rather than deleted outright so the intent is recoverable if a
Sequelize layer is ever deliberately chosen.
