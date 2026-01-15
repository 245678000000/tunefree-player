// XingPeng Music Player - Service Worker
const CACHE_NAME = 'xingpeng-v1'
const STATIC_CACHE = 'xingpeng-static-v1'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => self.clients.claim())
  )
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求
  if (request.method !== 'GET') return

  // 跳过 chrome-extension 和其他非 http(s) 请求
  if (!url.protocol.startsWith('http')) return

  // API 请求不缓存（音乐流需要实时获取）
  if (url.hostname.includes('music-dl.sayqz.com') || 
      url.hostname.includes('api.tunefree.fun')) {
    return
  }

  // 静态资源使用 Cache First 策略
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response
          }
          return fetch(request).then((fetchResponse) => {
            // 不缓存非成功响应
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse
            }
            // 克隆响应并缓存
            const responseToCache = fetchResponse.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache)
            })
            return fetchResponse
          })
        })
    )
    return
  }

  // 其他请求使用 Network First 策略
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 仅缓存成功的同源响应
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // 网络失败时从缓存获取
        return caches.match(request)
      })
  )
})

// 后台同步（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    console.log('[SW] Syncing favorites...')
  }
})

// 推送通知（可选）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png'
    })
  }
})
