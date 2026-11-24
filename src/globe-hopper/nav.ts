import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'base' | 'launch' | 'watch';
export const screen = signal<Screen>('start');
/** A new Launch always starts with the countdown; a new replay starts afresh. */
export const goId = signal(0);
/** The Base's open tab, kept while he goes off to launch and comes back. */
export const baseTab = signal<string>('base');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Launch isn't a place: a reload during one lands at the Base. */
export const PLACE_KEY = 'globe-hopper-place';
export const place = createPlace(PLACE_KEY, ['home', 'base', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'launch' || s === 'watch' ? 'base' : s));

export function launch() {
  goId.value++;
  screen.value = 'launch';
}
export function watch() {
  goId.value++;
  screen.value = 'watch';
}
