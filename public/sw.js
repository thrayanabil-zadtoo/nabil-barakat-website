// Service Worker for Official Website of Author Nabil Barakat (nb.zadtoo.com)
const CACHE_NAME = 'nabil-barakat-cache-v11';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Always keep API calls, Firebase realtime traffic, and video streams live
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase')
  ) {
    return;
  }

  // Network-first for HTML navigations so latest content updates immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    const isCodeOrManifest =
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.mjs') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.webmanifest');

    // Network-first for scripts, styles, manifests & JSON so PWA never serves stale app bundles
    if (isCodeOrManifest) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }

    // Stale-while-revalidate for static images & icons
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
  }
});

// Handle incoming Web Push Notifications (delivered in background even when app/browser is closed)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'جديد الكاتب أ. نبيل بركات',
    body: 'تم نشر قصيدة أو خاطرة جديدة في مجتمع الكاتب.',
    url: '/',
    tag: 'nabil-barakat-update',
    image: undefined,
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    const text = event.data ? event.data.text() : '';
    if (text) payload.body = text;
  }

  const notificationOptions = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: payload.tag || 'nabil-barakat-update',
    renotify: true,
    vibrate: [180, 80, 180],
    data: { url: payload.url || '/' },
  };

  if (
    payload.image &&
    typeof payload.image === 'string' &&
    (payload.image.startsWith('https://') || payload.image.startsWith('/'))
  ) {
    notificationOptions.image = payload.image;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// Focus or open app window at the target item URL when user taps any notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  let resolvedUrl = '/';
  try {
    resolvedUrl = new URL(targetUrl, self.location.origin).href;
  } catch {
    resolvedUrl = self.location.origin + '/';
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client && targetUrl && targetUrl !== '/') {
              return client
                .navigate(resolvedUrl)
                .then((navigated) => (navigated ? navigated.focus() : client.focus()))
                .catch(() => client.focus());
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(resolvedUrl);
        }
        return undefined;
      })
  );
});
