# M027 - Farmer Certification (frontend)

Domain: Farmer
Status: HIDDEN — built but unrouted at `frontend/src/components/OrganicTraceability/OrganicFarmRegistration.jsx`

This module's UI is not built here. `OrganicFarmRegistration.jsx` is a
complete, working component (organic farm registration against
`organicTraceabilityAPI`), but — unlike the other HIDDEN modules — it is not
currently mounted by any page or route in this app. Wiring it into a host
page is new-build/integration work outside the scope of this fix; this stub
(`M027Page.jsx`) states that honestly instead of linking to a route that
doesn't exist.
