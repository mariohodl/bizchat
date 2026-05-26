const CACHE_NAME = "bizchat-mx-cache-v1"
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json"
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => { })
    })
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request)
    })
  )
})



self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()))

// Manejo de push notifications
self.addEventListener("push", e => {
  if (!e.data) return
  let data = {}
  try { data = e.data.json() } catch { data = { title: "BizChat", body: e.data.text() } }

  const { title, body, icon, badge, url, tag } = data

  e.waitUntil(
    self.registration.showNotification(title || "BizChat", {
      body: body || "",
      icon: icon || "/icons/icon-192.png",
      badge: badge || "/icons/badge-72.png",
      tag: tag || "bizchat",
      data: { url: url || "/dashboard/inbox" },
      vibrate: [100, 50, 100],
      actions: [
        { action: "open", title: "Ver ahora" },
        { action: "dismiss", title: "Descartar" },
      ],
    })
  )
})

// Al hacer clic en la notificación
self.addEventListener("notificationclick", e => {
  e.notification.close()
  if (e.action === "dismiss") return

  const url = e.notification.data?.url || "/dashboard/inbox"
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      // Si ya hay una ventana abierta, enfócarla
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Si no, abrir nueva ventana
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})