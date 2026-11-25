import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'roost' | 'flight' | 'visit';
export const screen = signal<Screen>('start');
/** A new Flight always starts from its card. */
export const flightId = signal(0);
/** Which Flight: the next new one (null), or one he has flown before. */
export const flightNumber = signal<number | null>(null);
/** The Roost's open tab, kept while he goes off to fly and comes back. */
export const roostTab = signal<string>('roost');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Flight isn't a place: a reload during one lands at the Roost. */
export const PLACE_KEY = 'dragon-roost-place';
export const place = createPlace(PLACE_KEY, ['home', 'roost', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'flight' || s === 'visit' ? 'roost' : s));

export function fly(n: number | null = null) {
  flightNumber.value = n;
  flightId.value++;
  screen.value = 'flight';
}
