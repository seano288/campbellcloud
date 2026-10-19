// Replaces the service worker each game installed while the site lived on GitHub Pages. It clears that game's
// offline copy, removes itself and reloads open pages, so they fetch the redirect instead of the cached app.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.includes(self.registration.scope)) await caches.delete(key);
  }
  await self.registration.unregister();
  for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
})()));
