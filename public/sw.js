// A basic service worker for PWA functionality

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // No caching in this simple version, but you could precache assets here
  // event.waitUntil(
  //   caches.open('v1').then((cache) => {
  //     return cache.addAll([
  //       '/',
  //       '/index.html',
  //       // etc.
  //     ]);
  //   })
  // );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
});

self.addEventListener('fetch', (event) => {
  // This simple service worker doesn't intercept fetch requests.
  // It just lets the browser handle them as it normally would.
  // This is the simplest strategy, known as "network only".
  event.respondWith(fetch(event.request));
});
