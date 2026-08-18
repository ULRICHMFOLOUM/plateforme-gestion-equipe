// Service Worker TeamFlows - Offline Cache & Push Notifications
const CACHE_NAME = "teamflows-v2";

// Install event - Skip waiting
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event - Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Bypass Service Worker in development mode (_next / hot-reload / dev scripts)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // NEVER cache Next.js internal dev chunks, hot-reload, or socket.io in dev mode
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("webpack") ||
    url.pathname.includes("hot-reload")
  ) {
    return; // Let browser handle network request natively
  }

  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response("Offline - Network error", {
          status: 503,
          statusText: "Service Unavailable"
        });
      })
  );
});

// Push notification event listener
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "TeamFlows", body: "Nouvelle alerte !" };
  const options = {
    body: data.body || "Vous avez une nouvelle notification.",
    icon: "/teamflow-logo.png",
    badge: "/teamflow-logo.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/notifications"
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "TeamFlows", options)
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/")
  );
});
