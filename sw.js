/* Drive to Empire 3D — offline service worker */
const CACHE = 'dte3d-cache-v19';
const ASSETS = [
  './',
  './index.html',
  './three.min.js',
  './GLTFLoader.js',
  './update.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './brand/car_trim.png',
  './brand/logo_trimmed.png',
  './models/nissan_gtr.glb',
  './models/mazda_rx-7.glb',
  './models/jeep.glb',
  './models/chevrolet_camaro.glb',
  './models/range_rover.glb',
  './models/dodge_charger.glb',
  './models/motorcycle.glb',
  './models/rolls_royce.glb',
  './models/camaro_zl1_2017.glb',
  './models/toyota_hilux_97.glb',
  './models/royal_enfield.glb'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        // cache same-origin successful responses
        try {
          const url = new URL(req.url);
          if (url.origin === location.origin && res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
        } catch (_) {}
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
