const CACHE_NAME = 'jeyrey-v35';

// Core app shell (NEVER changes often → stable offline fallback)
const STATIC_CACHE = [
  '/',
  '/icon.png',
  '/index.html',
  '/manifest.json',
    '/admin-panel.html',
  '/adminlogin.html',

  '/offline.html', // 👈 add fallback page
];

// Dynamic cache for API/products/images
const DYNAMIC_CACHE = 'jayrey-dynamic-v22';

// ===============================
// 📦 INSTALL EVENT
// ===============================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pre-cache core app shell
      await cache.addAll(STATIC_CACHE);
    })
  );

  // Force activate new SW immediately
  self.skipWaiting();
});

// ===============================
// 🧠 FETCH STRATEGY (SMART CACHE)
// ===============================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  event.respondWith(
    fetch(request)
      .then((networkRes) => {
        // Clone and cache dynamic content
        const cloned = networkRes.clone();

        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, cloned);
        });

        return networkRes;
      })
      .catch(async () => {
        // Try cache first
        const cached = await caches.match(request);
        if (cached) return cached;

        // fallback page (important UX layer)
        return caches.match('/offline.html');
      })
  );
});

// ===============================
// 🧹 CLEAN OLD CACHE (VERSION SAFE)
// ===============================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, DYNAMIC_CACHE].includes(key)) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ===============================
// 🔔 PUSH NOTIFICATIONS (ADMIN → USERS)
// ===============================
self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.log("Invalid push data format");
  }

  const title = data.title || 'Jeyrey Update';

  const options = {
    body: data.message || 'New update available',
    icon: '/icon.png',
    badge: '/icon.png',
      data: {
    url: data.url || '/',
    timestamp: Date.now()
  },
    vibrate: [100, 50, 100], // 🔥 improves engagement
    actions: [
    {
      action: 'open',
      title: 'Shop Now'
    },
    {
      action: 'dismiss',
      title: ' Shop Later'
    }
  ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Open app when notification clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
clients.openWindow(
  event.notification.data?.url || '/'
)  );
});