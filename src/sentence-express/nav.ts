import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'shed' | 'layout' | 'delivery' | 'show';
export const screen = signal<Screen>('start');
/** Which Delivery it is: a new one always starts from its card. */
export const deliveryId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Delivery (or Watch it go) isn't a place: a reload during
 *  one lands at his Layout. */
export const PLACE_KEY = 'sentence-express-place';
export const place = createPlace(PLACE_KEY, ['home', 'shed', 'layout', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'delivery' || s === 'show' ? 'layout' : s));

/** Start the next Delivery. */
export function goDeliver() {
  deliveryId.value++;
  screen.value = 'delivery';
}
