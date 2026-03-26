// Manifest TMS Service Worker
// Handles push notifications, offline caching, and background sync

const SHELL_CACHE = 'manifest-shell-v1'
const DATA_CACHE = 'manifest-data-v1'

// App shell resources to pre-cache
const SHELL_URLS = [
  '/',
  '/driver',
  '/driver/fleet',
  '/driver/loads',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
]

// --- Install: pre-cache app shell ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_URLS).catch(() => {
        // Some URLs may not exist yet; continue anyway
      })
    })
  )
  self.skipWaiting()
})

// --- Activate: clean old caches, claim clients ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== DATA_CACHE)
          .map((key) => caches.delete(key))
      )
    }).then(() => clients.claim())
  )
})

// --- Fetch: strategy-based caching ---
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // API requests: network-only (avoid stale data)
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Static assets (_next/static): cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Supabase data requests: network-first, cache for offline
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(DATA_CACHE).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || new Response('{}', { status: 503 }))
        })
    )
    return
  }

  // Navigation and other requests: network-first with shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Fall back to app shell for SPA navigation
          return caches.match('/')
        })
      })
    )
    return
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// --- Background sync: replay offline queue ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'manifest-offline-sync') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: 'SYNC_OFFLINE_QUEUE' })
        }
      })
    )
  }
})

// --- Push notifications ---
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Manifest', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'manifest-notification',
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Manifest', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      return clients.openWindow(url)
    })
  )
})
