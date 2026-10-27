// Startrol-monitor: bewaart de app op het toestel zodat ze zonder internet werkt.
// Met internet wordt altijd eerst de nieuwste versie geladen, zonder internet de bewaarde versie.
const CACHE = 'startrol-v3';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' slaat het tussengeheugen van de browser over, zodat altijd de echte nieuwe bestanden bewaard worden
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      FILES.map(f => fetch(new Request(f, { cache: 'reload' })).then(r => { if (r.ok) return c.put(f, r); }))
    ))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Eerst het netwerk proberen (nieuwste versie), bij geen internet de bewaarde versie gebruiken
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(r => {
        if (r.ok && new URL(e.request.url).origin === self.location.origin) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then(r => r || caches.match('./index.html')))
  );
});
