import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'airport' | 'routes' | 'flight' | 'watch';
export const screen = signal<Screen>('start');
/** A new Flight always starts from the gate; a new show always starts afresh. */
export const flightId = signal(0);
/** The Airport's open tab, kept while he goes off to fly and comes back. */
export const airportTab = signal<string>('build');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Flight isn't a place: a reload during one lands in the Airport. */
export const PLACE_KEY = 'jetway-place';
export const place = createPlace(PLACE_KEY, ['home', 'airport', 'routes', 'round'], ['mix']); // every Round is a mix
// A Flight or a show comes back to the Airport after a reload (from the end of a Round it would have come back to Home)
screen.subscribe(s => place.screen(s === 'flight' || s === 'watch' ? 'airport' : s));

export function fly() {
  flightId.value++;
  screen.value = 'flight';
}
export function watch() {
  flightId.value++;
  screen.value = 'watch';
}
