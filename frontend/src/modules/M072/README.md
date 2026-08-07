# M072 - Soil Test Management (frontend)

Domain: Soil
Status: HIDDEN — built but unrouted at `frontend/src/components/LaboratoryERP/SampleRegistration.jsx`

This module's UI is not built here. `SampleRegistration.jsx` is a complete,
working component (soil sample registration/lab intake), but — unlike the
other HIDDEN modules — it is not currently mounted by any page or route in
this app. Wiring it into a host page is new-build/integration work outside
the scope of this fix; this stub (`M072Page.jsx`) states that honestly
instead of linking to a route that doesn't exist.
