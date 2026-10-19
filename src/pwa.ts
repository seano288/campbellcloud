// Offline support. The app never depends on the service worker: it registers only on the web (not inside a
// native wrapper or from a file), and nothing reads the Cache API.
//
// A Home Screen app on iPad is usually resumed rather than relaunched, so it also looks for a new version each
// time it comes back to the front. A new version takes over in the background (skipWaiting, clientsClaim); the
// page then reloads into it only when that can't interrupt him: while it's out of sight, or on the title screen.
export function registerServiceWorker(safeToReload: () => boolean = () => false) {
  const native = 'Capacitor' in window;
  if (native || !('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  const workers = navigator.serviceWorker;
  let installed = workers.controller !== null; // the first install also takes over the page, but changes nothing
  let waiting = false, watching = false;
  const reloadIfSafe = () => {
    if (waiting && (document.hidden || safeToReload())) {
      waiting = false;
      location.reload();
    }
  };
  workers.addEventListener('controllerchange', () => {
    if (!installed) { installed = true; return; }
    waiting = true;
    reloadIfSafe();
    if (waiting && !watching) {
      watching = true;
      setInterval(reloadIfSafe, 1000); // until he's back on the title screen or puts the app away
    }
  });
  workers.register('./sw.js').then(registration => {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) reloadIfSafe();
      else registration.update().catch(() => { /* offline: keep the version he has */ });
    });
  }).catch(() => { /* offline support is a bonus, never a blocker */ });
}
