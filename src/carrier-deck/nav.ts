import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'ship' | 'chart' | 'mission' | 'watch';
export const screen = signal<Screen>('start');
/** A new Mission always starts on the deck; a new show always starts afresh. */
export const missionId = signal(0);
/** The Carrier's open tab and view, kept while he goes off to fly and comes back. */
export const shipTab = signal<string>('ship');
export const shipView = signal<'side' | 'top' | 'inside'>('side');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Mission isn't a place: a reload during one lands on the Carrier. */
export const PLACE_KEY = 'carrier-deck-place';
export const place = createPlace(PLACE_KEY, ['home', 'ship', 'chart', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'mission' || s === 'watch' ? 'ship' : s));

export function fly() {
  missionId.value++;
  screen.value = 'mission';
}
export function watch() {
  missionId.value++;
  screen.value = 'watch';
}
