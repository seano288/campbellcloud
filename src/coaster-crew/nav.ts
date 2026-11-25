import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'yard' | 'ride' | 'watch';
export const screen = signal<Screen>('start');
/** A new Ride always starts at the station; a new "Watch it run" starts afresh. */
export const goId = signal(0);
/** The Yard's open tab, kept while he goes off to ride and comes back. */
export const yardTab = signal<string>('build');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Ride isn't a place: a reload during one lands at the Yard. */
export const PLACE_KEY = 'coaster-crew-place';
export const place = createPlace(PLACE_KEY, ['home', 'yard', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'ride' || s === 'watch' ? 'yard' : s));

export function ride() {
  goId.value++;
  screen.value = 'ride';
}
export function watch() {
  goId.value++;
  screen.value = 'watch';
}
