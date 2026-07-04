/* GobbieLife service worker — offline shell cache.
 *
 * Strategy: network-first for same-origin GETs (so the live game and the
 * dc-runtime hot-reload always win when online), falling back to the cache
 * when offline. Cross-origin requests (React / Babel / Google Fonts CDNs)
 * are left untouched so the browser handles them normally and the SW never
 * caches opaque third-party responses. Game state lives in localStorage and
 * is unaffected by this cache.
 */
const CACHE = 'gobbielife-v1';
const SHELL = [
  './',
  './index.html',
  './support.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/panorama/tier0.png',
  './assets/panorama/tier1.png',
  './assets/panorama/tier2.png',
  './assets/panorama/tier3.png',
  './assets/panorama/tier4.png',
  './assets/panorama/tier5.png',
  './assets/panorama/tier6.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let CDN requests pass through

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
