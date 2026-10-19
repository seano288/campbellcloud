// The family site's front page: one big tile per game, grouped into Learning Games and Just for Fun. It registers its own service worker so it opens offline too.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
