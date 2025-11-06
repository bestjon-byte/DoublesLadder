// 1.0.143 will be replaced at build time with package.json version
const APP_VERSION = '1.0.143';
const CACHE_NAME = `tennis-ladder-v${APP_VERSION}`;

// Static assets that can be cached long-term
const STATIC_CACHE_URLS = [
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// External resources
const EXTERNAL_CACHE_URLS = [
  'https://cdn.tailwindcss.com'
];

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing service worker, version: ${APP_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW] Opened cache: ${CACHE_NAME}`);
        // Cache static assets and external resources
        const allCacheUrls = [...STATIC_CACHE_URLS, ...EXTERNAL_CACHE_URLS];
        return cache.addAll(allCacheUrls.map(url =>
          url.startsWith('http') ? url : new Request(url, {cache: 'reload'})
        ));
      })
      .catch((error) => {
        console.error('[SW] Failed to cache resources:', error);
      })
  );
  self.skipWaiting(); // Force immediate activation
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating service worker, version: ${APP_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log(`[SW] Taking control of all clients`);
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first for app files, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (except whitelisted external resources)
  if (url.origin !== self.location.origin &&
      !EXTERNAL_CACHE_URLS.includes(request.url)) {
    return;
  }

  // Determine if this is an app file (HTML, JS, CSS) or static asset
  const isAppFile =
    request.mode === 'navigate' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname === '/';

  if (isAppFile) {
    // NETWORK-FIRST strategy for app files (HTML, JS, CSS)
    // Always try to get fresh version from network
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the fresh response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, fall back to cache
          console.log(`[SW] Network failed for ${url.pathname}, using cache`);
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If navigation request and no cache, return index
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            // Otherwise return error
            return new Response('Offline - resource not cached', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
  } else {
    // CACHE-FIRST strategy for static assets (images, icons, fonts)
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Not in cache, fetch from network
          return fetch(request).then((response) => {
            // Cache valid responses
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          });
        })
    );
  }
});

// Background sync for when connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Here you could sync any pending data when online
  }
});

// Message handler for version checks and cache clearing
self.addEventListener('message', (event) => {
  console.log(`[SW] Received message:`, event.data);
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: APP_VERSION,
      cacheName: CACHE_NAME
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`[SW] Clearing cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED',
          version: APP_VERSION
        });
      })
    );
  }
});

// Notify clients when a new version is available
self.addEventListener('controllerchange', () => {
  console.log(`[SW] Controller changed, new version active: ${APP_VERSION}`);
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'NEW_VERSION_ACTIVE',
        version: APP_VERSION
      });
    });
  });
});

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});