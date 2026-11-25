import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'arena' | 'jump' | 'watch';
export const screen = signal<Screen>('start');
/** A new Jump always starts at the lights; a new replay starts afresh. */
export const goId = signal(0);
/** The Arena's open tab, kept while he goes off to jump and comes back. */
export const arenaTab = signal<string>('truck');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Jump isn't a place: a reload during one lands at the Arena. */
export const PLACE_KEY = 'big-air-place';
export const place = createPlace(PLACE_KEY, ['home', 'arena', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'jump' || s === 'watch' ? 'arena' : s));

export function jump() {
  goId.value++;
  screen.value = 'jump';
}
/** "Watch it": his best jump again, from its recorded inputs. */
export function watch() {
  goId.value++;
  screen.value = 'watch';
}
