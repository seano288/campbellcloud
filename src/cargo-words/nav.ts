import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'port' | 'chart' | 'crane' | 'watch';
export const screen = signal<Screen>('start');
/** A new go at the Crane always starts with the ship arriving; a new show always starts afresh. */
export const goId = signal(0);
/** The Port's open tab, kept while he goes off to load a ship and comes back. */
export const portTab = signal<string>('build');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A go at the Crane isn't a place: a reload during one lands in the Port. */
export const PLACE_KEY = 'cargo-words-place';
export const place = createPlace(PLACE_KEY, ['home', 'port', 'chart', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'crane' || s === 'watch' ? 'port' : s));

export function load() {
  goId.value++;
  screen.value = 'crane';
}
export function watch() {
  goId.value++;
  screen.value = 'watch';
}
