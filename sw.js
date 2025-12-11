const CACHE_NAME = 'coffee-v4';
const DYNAMIC_CACHE = 'coffee-dynamic-v1';

const FILES_TO_CACHE = [
  './index.html',
  './style.css',
  './app.js',
  './coffee.jpg',
  './manifest.json',
  './offline.html'
];

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// INSTALL
self.addEventListener('install', event => {
  console.log('SW: install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Кешуємо файли');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('SW: activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener('fetch', event => {

  // Якщо це навігаційний запит (перезавантаження сторінки)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // Усі інші запити – cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// BACKGROUND SYNC
self.addEventListener('sync', event => {
  if (event.tag === 'send-order') {
    event.waitUntil(
      fetch('/api/send-order', { 
        method: 'POST',
        body: JSON.stringify({ item: 'Лате' })
      })
      .then(() => 
        self.clients.matchAll().then(clients =>
          clients.forEach(client => client.postMessage('Замовлення відправлено!'))
        )
      )
      .catch(err => console.log('Помилка sync:', err))
    );
  }
});
