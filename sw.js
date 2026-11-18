
const CACHE_NAME = "datuse-v2-3";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (
          response &&
          response.status === 200 &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }

        return response;
      });
    })
  );
});

self.addEventListener("push", event => {
  let data = {
    title: "DATUSE! - Pengingat Tugas",
    body: "Jangan lupa periksa daftar tugas sekolahmu.",
    url: "./"
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./icons/icon.svg",
      badge: "./icons/icon.svg",
      data: { url: data.url }
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const destination = new URL(
    event.notification.data?.url || "./",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === destination && "focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow(destination);
    })
  );
});
