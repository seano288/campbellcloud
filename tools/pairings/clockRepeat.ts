import { createStore, type BackingStore, type SaveAdapter } from '../../src/save/store';
import { clockPractice, freshClock, readClock } from './clock';
import { freshRepeat, readRepeat, repeatBuyer } from './repeat';
import { readWallet, record } from './data';

const fresh = () => ({ ...freshClock(), reward: freshRepeat() });
export const clockRepeatSave: SaveAdapter<ReturnType<typeof fresh>> = {
  fresh, encode: state => state,
  decode: raw => ({ ...readClock(raw), currency: readWallet(raw), reward: readRepeat(record(raw).reward) }),
};
export const clockRepeatKey = 'test-clock-repeat';
export function createClockRepeat(backing: BackingStore) {
  const store = createStore({ key: clockRepeatKey, adapter: clockRepeatSave, backing });
  return { store, ...clockPractice(store), buy: repeatBuyer(store) };
}
