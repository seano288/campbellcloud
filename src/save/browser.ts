import type { BackingStore } from './store';

let persisted = false;
function persistOnce() {
  if (persisted) return;
  persisted = true;
  try {
    globalThis.navigator?.storage?.persist?.().catch(() => {});
  } catch {}
}

export const browserStorage: BackingStore = {
  read(key) { persistOnce(); return localStorage.getItem(key); },
  write(key, value) { localStorage.setItem(key, value); },
};
