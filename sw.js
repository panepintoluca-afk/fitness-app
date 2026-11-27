// Service worker di Fapp.
// Incrementare CACHE_VERSION ad ogni modifica degli asset (e allinearla a VERSIONE_APP in js/config.js).
const CACHE_VERSION = 'fapp-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/config.js',
  './js/router.js',
  './js/db.js',
  './js/ui/dom.js',
  './js/ui/icone.js',
  './js/ui/componenti.js',
  './js/views/allenamento.js',
  './js/views/esercizi.js',
  './js/views/profilo.js',
  './js/views/impostazioni.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' → scavalca la cache HTTP (GitHub Pages tiene i file ~10 minuti).
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first: l'app deve funzionare offline in palestra.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Navigazioni (apertura app, ricarica): sempre la shell index.html dalla cache.
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
