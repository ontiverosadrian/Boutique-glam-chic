self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('glam-chic-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.js',
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