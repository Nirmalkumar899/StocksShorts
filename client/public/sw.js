const CACHE_VERSION = 'v1.0.57';
const CACHE_NAME = `stocksshorts-${CACHE_VERSION}`;
const API_CACHE_NAME = 'stocksshorts-api-cache';

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Unregister this SW so the app runs without caching interference
      return self.registration.unregister();
    }).then(() => {
      // Tell all clients to reload so they get fresh files
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Never serve from cache — always go to network
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(fetch(event.request));
});
