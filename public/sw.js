const CACHE_NAME = 'daily-chinese-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/rooster.png',
  '/book.svg',
  '/google-logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cache first for static assets
        if (urlsToCache.includes(new URL(event.request.url).pathname)) {
          return response || fetch(event.request);
        }

        // For other requests, try network first, then fall back to cache
        return fetch(event.request)
          .then(networkResponse => {
            // Cache successful GET responses only
            if (networkResponse.ok && event.request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => response || Promise.reject('no-match'));
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});