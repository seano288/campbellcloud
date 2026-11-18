import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'dock' | 'logbook' | 'dive';
export const screen = signal<Screen>('start');
/** Which Dive it is: a new one always starts at the surface. */
export const diveId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Dive isn't a place: a reload during one lands at the Dock,
 *  with the Dive still his. */
export const PLACE_KEY = 'deep-light-place';
export const place = createPlace(PLACE_KEY, ['home', 'dock', 'logbook', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'dive' ? 'dock' : s));

/** Off on the next Dive. */
export function goDive() {
  diveId.value++;
  screen.value = 'dive';
}
