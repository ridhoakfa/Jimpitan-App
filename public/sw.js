// Service Worker for Jimpitan App PWA
// ==========================================================
// VERSI: Bump ini setiap deploy untuk paksa client update!
// ==========================================================
const CACHE_VERSION = 'v1.1.1';
const CACHE_NAME = `jimpitan-${CACHE_VERSION}`;
const RUNTIME_CACHE = `jimpitan-runtime-${CACHE_VERSION}`;

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - precache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Install event - version', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // Aktifkan SW baru segera
  );
});

// Activate event - cleanup ALL old caches & notify clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event - version', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Hapus SEMUA cache yang bukan versi ini
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
    .then(() => {
      // ==========================================================
      // AUTO-RELOAD: Beritahu semua client untuk reload
      // agar langsung dapat versi terbaru
      // ==========================================================
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Google Apps Script API calls (always need network)
  if (request.url.includes('script.google.com')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // ==========================================================
  // FIX: Handle accept header yang mungkin null
  // ==========================================================
  const acceptHeader = request.headers.get('accept') || '';
  const isHTML = acceptHeader.includes('text/html');

  // Network first strategy for HTML
  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // ==========================================================
  // STALE-WHILE-REVALIDATE untuk JS/CSS/asset
  // Serve dari cache (cepat), tapi update di background
  // ==========================================================
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Fetch fresh version di background
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
            return networkResponse;
          }
          // Update cache dengan versi terbaru
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Network gagal - pakai cache lama (offline mode)
          return cachedResponse;
        });

      // Serve cache langsung (kalau ada), sambil update di background
      return cachedResponse || fetchPromise;
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
      })
    );
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Background sync for offline transactions (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  console.log('[SW] Syncing offline transactions');
}

// Push notification support
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      try {
        const raw = (typeof event.data.text === 'function') ? event.data.text() : String(event.data);
        data = JSON.parse(raw);
      } catch (e) {
        const raw = (typeof event.data.text === 'function') ? event.data.text() : String(event.data);
        data = { title: 'Jimpitan App', body: raw, url: '/' };
      }
    }
  }

  const title = data.title || 'Jimpitan App';
  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: (typeof data.url === 'string') ? data.url : (data.url || '/')
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const payload = event.notification.data;
      let url = '/';
      if (typeof payload === 'string') {
        url = payload;
      } else if (payload && typeof payload.url === 'string') {
        url = payload.url;
      }
      try {
        await clients.openWindow(url);
      } catch (err) {
        // ignore
      }
    })()
  );
});