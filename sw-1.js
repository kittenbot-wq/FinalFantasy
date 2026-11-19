/* KITT3NBOT service worker
   Network first: whenever you're online the apps always show the newest
   version of the site (whatever you last uploaded). The saved copy is only
   used when there's no connection, so the apps still open offline.
   Bump VERSION if you ever want to wipe the saved copies. */
const VERSION = 'kitt3nbot-v1';
const CORE = ['/index.html', '/link.html', '/favicon.svg', '/icon-home-192.png', '/icon-links-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                         // YouTube, Spotify, Drive... go straight to the web
  if (req.headers.has('range') || req.destination === 'video' || req.destination === 'audio') return;  // let videos stream normally

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(hit =>
          hit || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error())
        )
      )
  );
});
