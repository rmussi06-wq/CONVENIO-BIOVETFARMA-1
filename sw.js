const CACHE_NAME = 'bfarma-v10';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css?v=10',
  './firebase-init.js?v=10',
  './app.js?v=10',
  './auth.js?v=10',
  './manifest.webmanifest',
  './assets/brand/logo-header.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch((err) => {
      console.warn('Falha ao pré-carregar assets do PWA:', err);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, responseToCache))
            .catch(() => {});

          return response;
        })
        .catch(() => cached);
    }),
  );
});
