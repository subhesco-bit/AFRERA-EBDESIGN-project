# M030 - Farmer Performance (frontend)

Domain: Farmer
Status: BUILT — implemented as the "FDI Score" section on `frontend/src/pages/FarmerPortalPage.jsx`

This module's UI is not built here. Farmer performance (FDI score, FDI
grade, pre-season advance eligibility) is implemented in the FDI section of
`FarmerPortalPage.jsx`, mounted at `/farmer-portal`, backed by
`farmersAPI.calculateFDI()`. This stub (`M030Page.jsx`) redirects to it
rather than duplicating the implementation.
