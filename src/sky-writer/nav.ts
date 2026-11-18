import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import type { ShowId } from './show/places';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'airfield' | 'show' | 'wall';
export const screen = signal<Screen>('start');
/** Which Show is on screen, and where: a new one always starts on the runway. */
export const flying = signal<{ id: number; at: ShowId } | null>(null);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Show isn't a place: a reload lands at the Airfield. */
export const PLACE_KEY = 'sky-writer-place';
export const place = createPlace(PLACE_KEY, ['home', 'airfield', 'wall', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'show' ? 'airfield' : s));

let shows = 0;
export function goShow(at: ShowId) {
  flying.value = { id: ++shows, at };
  screen.value = 'show';
}
