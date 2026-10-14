// The saved game, held in a signal. Every change goes through update(), which saves it.
import { computed } from '@preact/signals';
import { MONEY_SAVE_KEY, moneyFromSave, moneySave } from '../app/save';
import type { Save } from '../save/migrate';
import { browserStorage } from '../save/browser';
import { createStore } from '../save/store';

export const player = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing: browserStorage });
export const game = computed(() => moneySave.encode(player.state.value));

export const loadGame = () => player.load();

export function update(change: (s: Save) => Save) {
  return player.commit(state => {
    const before = moneySave.encode(state), next = change(before);
    return next === before ? null : moneyFromSave(next);
  });
}
