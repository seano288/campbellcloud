import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { player } from './game';
import { nextCall, type Call } from './park/rescue';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'garage' | 'park' | 'rescue';
export const screen = signal<Screen>('start');
/** Who the Rescue is for, and which Rescue it is: a new one always starts from the call. */
export const rescueCall = signal<Call>({ kind: 'rescue', animal: 'sheep' });
export const rescueId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Rescue isn't a place: a reload during one lands at the Garage. */
export const PLACE_KEY = 'wild-rescue-place';
export const place = createPlace(PLACE_KEY, ['home', 'garage', 'park', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'rescue' ? 'garage' : s));

/** Answer the next call. */
export function goRescue() {
  rescueCall.value = nextCall(player.state.peek().rescue);
  rescueId.value++;
  screen.value = 'rescue';
}
