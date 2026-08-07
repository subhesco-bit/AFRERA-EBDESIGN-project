/* eslint-env serviceworker */
/**
 * AFRERA service worker.
 *
 * WHY THIS EXISTS
 * The backend already ships offlineSyncService and offlinePaymentService —
 * someone correctly recognised that rural connectivity is intermittent. But the
 * frontend had no manifest and no service worker, so none of that was reachable:
 * losing signal meant losing the page.
 *
 * STRATEGY (deliberately conservative — this platform moves money and goods)
 *
 *   App shell        cache-first    — instant load on a poor connection.
 *   GET /api reads   network-first  — fresh data preferred; fall back to the
 *                                     last good response, clearly marked stale.
 *   Non-GET /api     NEVER cached   — writes (orders, payments, claims) must
 *                                     reach the server. A queued-and-replayed
 *                                     payment could double-charge a farmer, so
 *                                     failed writes surface as errors for the
 *                                     app's own offline-sync layer to handle,
 *                                     rather than being silently retried here.
 *
 * Auth responses are never cached: a cached /auth/me could leak one user's
 * identity to the next user of a shared device — common in village kiosks.
 */

const VERSION = 'afrera-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const DATA_CACHE = `${VERSION}-data`;

const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

// Never cache these, even for GET.
const NEVER_CACHE = [/\/api\/v1\/auth\//, /\/api\/v1\/sms-auth\//, /\/api\/v1\/admin\//];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll rejects entirely if any single asset 404s; tolerate that so a
      // missing icon cannot block installation.
      .then((cache) => Promise.allSettled(SHELL_ASSETS.map((a) => cache.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin traffic.
  if (url.origin !== self.location.origin) return;

  const isApi = url.pathname.startsWith('/api/');
  const isSensitive = NEVER_CACHE.some((re) => re.test(url.pathname));

  // Writes and sensitive endpoints: straight to network, never cached.
  if (request.method !== 'GET' || isSensitive) {
    return; // default browser handling
  }

  if (isApi) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

/** Fresh data preferred; stale cache is a labelled fallback. */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) {
      // Mark it so the UI can tell the user what they are looking at.
      const headers = new Headers(cached.headers);
      headers.set('X-AFRERA-Stale', 'true');
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers
      });
    }
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        error: 'You are offline and this data has not been loaded before.'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/** App shell: cache first, refresh in background. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request)
      .then((res) => {
        if (res.ok) caches.open(SHELL_CACHE).then((c) => c.put(request, res));
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok && request.destination !== 'document') {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // SPA navigation while offline: serve the shell so the app can boot and
    // show its own offline state rather than the browser error page.
    if (request.mode === 'navigate') {
      const shell = await caches.match('/index.html');
      if (shell) return shell;
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// Let the app trigger an immediate update after deploy.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  // Notify clients that sync is happening
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_STARTED',
      timestamp: new Date().toISOString()
    });
  });

  // The actual queue processing happens in the client-side offlineQueue service
  // This event is mainly to trigger the client to process its queue
  try {
    // Wait a bit to ensure client is ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clients.forEach(client => {
      client.postMessage({
        type: 'PROCESS_QUEUE',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }
}
