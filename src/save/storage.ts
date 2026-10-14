// The save seam. Everything the game keeps goes through load() and save(), so the backing store can be
// swapped (for Capacitor Preferences in a native wrapper) without touching the game.
import { MONEY_SAVE_KEY } from '../app/save';
import { migrate, type Save } from './migrate';
import { browserStorage } from './browser';

const KEY = MONEY_SAVE_KEY; // new key: the old Monster Cup saves (mtm-trophies, mtm-wins) are ignored

export async function load(): Promise<Save> {
  try {
    const text = await browserStorage.read(KEY);
    return migrate(text ? JSON.parse(text) : null);
  } catch {
    return migrate(null);
  }
}

export async function save(data: Save): Promise<void> {
  try {
    await browserStorage.write(KEY, JSON.stringify(data));
  } catch {
    // storage full or blocked: the game keeps playing from memory
  }
}
