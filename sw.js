const CACHE = 'bfarma-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './auth.js',
  './firebase-init.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-512-maskable.png',
  './assets/icons/apple-touch-icon-180.png',
  './assets/icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).catch(() => caches.match('./index.html')))
  );
});
