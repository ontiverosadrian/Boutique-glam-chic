const CACHE_NAME = 'glam-chic-v2';
const assetsToCache = [
  '/',
  '/index.html',
  '/app.js'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(assetsToCache);
        })
    );
    self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clientsClaim();
});

// Intercepción de solicitudes (Estrategia segura: solo cachear recursos locales)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignorar solicitudes externas (como CDNs de Tailwind o fuentes) para evitar errores de CORS
    if (url.origin !== location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).catch(() => {
                // Si falla la red y es una página, puedes retornar index.html opcionalmente
            });
        })
    );
});