import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { destinationOf } from './fleet/fleet';
import type { IslandId } from './fleet/islands';
import { player } from './game';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'shipyard' | 'voyage' | 'hoard';
export const screen = signal<Screen>('start');
/** Where the Voyage is going, and which Voyage it is: a new one always starts from the harbour. */
export const voyageTo = signal<IslandId>('turtle');
export const voyageId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Voyage isn't a place: a reload during one lands at the Shipyard. */
export const PLACE_KEY = 'treasure-fleet-place';
export const place = createPlace(PLACE_KEY, ['home', 'shipyard', 'hoard', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s));

/** Off to the island Set Sail goes to. */
export function setSail() {
  voyageTo.value = destinationOf(player.state.peek().fleet).id;
  voyageId.value++;
  screen.value = 'voyage';
}
