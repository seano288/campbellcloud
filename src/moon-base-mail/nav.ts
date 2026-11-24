import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'base' | 'landing' | 'walk';
export const screen = signal<Screen>('start');
/** A new Landing always starts with the ship coming in; a new walk always starts afresh. */
export const goId = signal(0);
/** The Base's open tab, kept while he goes off to fly a Landing and comes back. */
export const baseTab = signal<string>('modules');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Landing isn't a place: a reload during one lands at the Base. */
export const PLACE_KEY = 'moon-base-mail-place';
export const place = createPlace(PLACE_KEY, ['home', 'base', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'landing' || s === 'walk' ? 'base' : s));

export function land() {
  goId.value++;
  screen.value = 'landing';
}
export function walk() {
  goId.value++;
  screen.value = 'walk';
}
