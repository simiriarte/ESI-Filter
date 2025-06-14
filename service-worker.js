const CACHE_NAME = "esi-filter-pain-cave-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./Pain Cave/index.html",
  "./Pain Cave/styles.css",
  "./Pain Cave/script.js",
  "./Pain Cave/images/PAIN CAVE.png",
  "./Pain Cave/images/sticker_bg_transparent.png",
  "./Pain Cave/sounds/magical twinkle.mp3",
  "./Pain Cave/fonts/Figtree-VariableFont_wght.ttf"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the new service worker takes control immediately
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version or fetch from network
      return response || fetch(event.request).then(fetchResponse => {
        // Cache new requests for offline use
        if (fetchResponse.status === 200) {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback for offline mode
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
}); 