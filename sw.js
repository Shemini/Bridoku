// Service worker: permite jugar sin conexión.
// Código (html/js/css): red primero y, si no hay red, lo guardado.
// Sprites e iconos: se sirven al instante desde la caché y se actualizan en segundo plano.
const CACHE = 'bridoku-v8';
const CORE = ['./', 'index.html', 'style.css', 'theme-bridoku.css', 'fonts/pixelify-sans-latin-400-normal.woff2', 'fonts/pixelify-sans-latin-700-normal.woff2', 'app.js', 'engine.js', 'content.js', 'texts.js', 'worker.js', 'novia-walker.js', 'sprites/walker/sheet.png',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isCode = /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; });
    if (isCode) return net.catch(() => cached || Response.error());
    if (cached) { net.catch(() => {}); return cached; }
    return net.catch(() => Response.error());
  }));
});
