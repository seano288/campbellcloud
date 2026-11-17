import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'station' | 'town' | 'call';
export const screen = signal<Screen>('start');
/** Which Call it is: a new one always starts from the drive. */
export const callId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Call isn't a place: a reload during one lands at the
 *  Station, with the Call still his. */
export const PLACE_KEY = 'hook-and-ladder-place';
export const place = createPlace(PLACE_KEY, ['home', 'station', 'town', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'call' ? 'station' : s));

/** Off to the next Call. */
export function goCall() {
  callId.value++;
  screen.value = 'call';
}
