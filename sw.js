self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('glam-chic-v3').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.js',
        '/manifest.json',
        '/images/icon-152.png',
        '/images/icon-192.png',
        'https://cdn.tailwindcss.com',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});