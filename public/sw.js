// Service Worker per funzionamento offline di Stima (versione Vite)
const CACHE_NAME = 'quickcraft-cache-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache-first solo per la shell (gli asset buildati hanno nomi hashati e verranno
      // cachati automaticamente al primo fetch grazie alla strategia qui sotto).
      return cache.addAll(['./', './index.html', './manifest.json']).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Gestisce solo richieste GET same-origin
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Stale-while-revalidate: restituisce la cache e aggiorna in background
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match('./index.html'));

      return cached || fetchPromise;
    })
  );
});
