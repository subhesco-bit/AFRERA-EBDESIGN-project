# Harvest & Post-Harvest Planning - SPEC

## Why
Crop planning exists as a module, but the chain from "ready to harvest" to
"dispatched to buyer/cold store" - labour, packing, cold slot booking - is
the missing link the recommendation doc calls the harvest spine.

## Stakeholders
- Farmer/FPO: needs labour and packing coordinated to the harvest window
- Cold storage operator: needs advance slot booking, not walk-in overflow
- Logistics: needs a real dispatch schedule, not ad hoc pickup requests

## Closed loop this module owns
harvest window set (from crop planning) -> labour requested for that
window -> packhouse checklist run (sort/wash/pack, yield-loss recorded) ->
cold storage slot booked in advance (M903100) -> dispatch scheduled to
logistics.

## Real services already in the repo to build on
- Existing crop-planning service (verify its real schema first - this
  session's earlier work already wired a real cropPlanningRoutes.js this
  quarter; reuse its harvest-date fields rather than duplicating them).

## Not yet decided (flag before building)
- Labour/workforce tracking (wages, attendance) is flagged as its own P2
  item in the parent recommendation doc - this module only requests labour,
  it does not own wage/attendance tracking.
