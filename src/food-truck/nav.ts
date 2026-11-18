import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'truck' | 'service' | 'book';
export const screen = signal<Screen>('start');
/** Which Service is on screen: a new one always starts from the Spot card. */
export const serviceId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Service isn't a place: a reload during one lands at the Truck,
 *  with the Service still there to use. */
export const PLACE_KEY = 'food-truck-place';
export const place = createPlace(PLACE_KEY, ['home', 'truck', 'book', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'service' ? 'truck' : s));

export function goService() {
  serviceId.value++;
  screen.value = 'service';
}
