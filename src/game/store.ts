// The saved game, held in a signal. Every change goes through player.commit(), which saves it.
import { computed } from '@preact/signals';
import { MONEY_SAVE_KEY, moneySave } from '../app/save';
import { browserStorage, createStore } from '../save/storage';

export const player = createStore({ key: MONEY_SAVE_KEY, adapter: moneySave, backing: browserStorage }); // new key: the old Monster Cup saves (mtm-trophies, mtm-wins) are ignored
export const game = computed(() => moneySave.encode(player.state.value));

export const loadGame = () => player.load();
