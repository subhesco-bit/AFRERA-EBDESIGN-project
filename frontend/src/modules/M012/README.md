# M012 - Authentication (frontend)

Domain: Identity
Status: BUILT — implemented at `frontend/src/pages/LoginPage.jsx`

This module's UI is not built here. Login, token issuance and session
bootstrapping are implemented in `LoginPage.jsx` (mounted at `/login`),
backed by `frontend/src/store/authStore.js` on the client and
`backend/src/services/authService.js` on the server. This stub
(`M012Page.jsx`) redirects to it rather than duplicating the implementation.
