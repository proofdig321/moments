const CACHE_NAME = 'moments-admin-v1';
const ASSETS = [
  '/',
  '/admin.html',
  '/manifest.json',
  '/logo.svg',
  '/css/admin.css',
  '/js/admin.js',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch handler: navigation -> cache-first with network fallback; others -> network with fallback to cache
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Don't cache API requests with Authorization
  if (req.method !== 'GET' || req.headers.get('authorization')) {
    return event.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
  }

  // Serve navigation requests from cache first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match('/offline.html')))
    );
    return;
  }

  // For static assets: stale-while-revalidate
  if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(resp => {
          caches.open(CACHE_NAME).then(c => c.put(req, resp.clone()));
          return resp;
        }).catch(() => null);
        return cached || network;
      })
    );
    return;
  }

  // Default: try network then cache
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});