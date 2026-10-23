import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'heli' | 'home' | 'round' | 'helipad';
export const screen = signal<Screen>('start');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). */
export const PLACE_KEY = 'chop-chop-place';
export const place = createPlace(PLACE_KEY, ['home', 'helipad', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s));
