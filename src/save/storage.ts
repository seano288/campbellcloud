// The save seam. Everything the game keeps goes through createStore(), so the backing store can be
// swapped (for Capacitor Preferences in a native wrapper) without touching the game.
export { browserStorage } from './browser';
export { createStore, type BackingStore, type SaveAdapter } from './store';
