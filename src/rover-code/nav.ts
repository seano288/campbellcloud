import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { destinationOf } from './base/base';
import type { PlanetId } from './base/planets';
import { player } from './game';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'base' | 'trip';
export const screen = signal<Screen>('start');
/** Where the trip is going, and which trip it is: a new one always starts from the launch pad. */
export const tripTo = signal<PlanetId>('moon');
export const tripId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A trip isn't a place: a reload during one lands at the Base. */
export const PLACE_KEY = 'rover-code-place';
export const place = createPlace(PLACE_KEY, ['home', 'base', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s));

/** Off to the planet the Base would launch to. */
export function launch() {
  tripTo.value = destinationOf(player.state.peek().base).id;
  tripId.value++;
  screen.value = 'trip';
}
