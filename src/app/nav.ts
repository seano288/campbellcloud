import { signal } from '@preact/signals';
import { MODE_IDS } from '../modes/ids';
import { createPlace } from '../save/place';
import { createVoiceScope } from '../voice/say';

export type Screen = 'start' | 'body' | 'home' | 'round' | 'garage';
export const screen = signal<Screen>('start');
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). */
export const PLACE_KEY = 'mtm2-place';
export const place = createPlace(PLACE_KEY, ['home', 'garage', 'round'], MODE_IDS);
screen.subscribe(s => place.screen(s));
