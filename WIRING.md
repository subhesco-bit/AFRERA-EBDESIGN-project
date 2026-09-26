# API origin rewire

This is a routing change, not a claim that every module is live.

## Target circuit

Browser `/api/v1/*`
  -> Vite dev proxy or nginx
  -> backend `http://localhost:3001` (container name `backend` in Docker)

## What changed

- `frontend/src/config/apiOrigin.js` is the only origin resolver.
- `apiClient.js` is the session-aware Axios instance (reads both `token` and `access_token`).
- Vite proxy `/api` and `/health` go to **3001**, not 3000.
- nginx `/api/` goes to `backend:3001`.
- Default client base is same-origin `/api/v1` so the UI port no longer has to match the API port.

## Local run

```bash
# terminal 1
cd backend && PORT=3001 npm run dev

# terminal 2
cd frontend
# optional: echo 'VITE_API_URL=/api/v1' > .env
npm run dev
```

UI: Vite prints the port (5173 in vite.config). API calls stay on `/api/v1/...`.

## Still not wired

Pages whose API objects exist in `api.js` but have no matching mounted backend route. Those need route contracts, not another proxy.
