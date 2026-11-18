
const CACHE_NAME = "datuse-v2-4";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Memasang cache aplikasi
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Mengaktifkan versi baru
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

// Mengambil file dari cache atau jaringan
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
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

// Menerima notifikasi push dari server
self.addEventListener("push", event => {
  let data = {
    title: "DATUSE! — Pengingat Tugas",
    body: "Jangan lupa periksa daftar tugas sekolahmu!",
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
      tag: "datuse-push",
      data: { url: data.url },
      vibrate: [150, 80, 150]
    })
  );
});

// Membuka aplikasi ketika notifikasi ditekan
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
        if (client.url === destination) {
          return client.focus();
        }
      }

      return clients.openWindow(destination);
    })
  );
});
