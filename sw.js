const CACHE_NAME = 'lexicon-v1';

// Initial assets to cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
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
  self.clients.claim(); // Take control of all clients immediately
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Navigation (HTML): Network First -> Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. External Assets (CDNs, Fonts, Scripts): Stale-While-Revalidate
  if (
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('esm.sh') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdn.lucide.dev')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Cache valid responses.
            if (networkResponse.ok || (networkResponse.type === 'opaque' && url.hostname.includes('cdn.lucide.dev'))) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch((err) => {
             console.log('Fetch failed for external asset', err);
          });
          
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. Local Assets (JS, CSS, Images): Stale-While-Revalidate
  // This ensures that App.tsx, components, etc., are cached after being fetched.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Only cache valid 200 responses
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
             console.log('Fetch failed for local asset', err);
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});