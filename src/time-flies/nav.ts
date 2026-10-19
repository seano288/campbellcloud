import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { MODE_IDS } from './learning';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'jet' | 'home' | 'round' | 'hangar';
export const screen = signal<Screen>('start');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). */
export const PLACE_KEY = 'time-flies-place';
export const place = createPlace(PLACE_KEY, ['home', 'hangar', 'round'], MODE_IDS);
screen.subscribe(s => place.screen(s));
