/**
 * Project Kuma — Lightweight Offline Resource Caching Service Worker (sw.js)
 * 
 * Simple, non-intrusive service worker for static asset caching.
 * Designed to coexist safely with firebase-messaging-sw.js without breaking
 * background push notifications or Firebase Cloud Messaging payload handlers.
 */

const CACHE_NAME = 'kuma-static-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass non-GET and API/Firebase requests directly to network
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
          return response;
        })
        .catch(() => {
          // If offline and requesting navigation, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
