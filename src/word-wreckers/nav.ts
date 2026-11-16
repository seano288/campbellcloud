import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'yard' | 'town' | 'job';
export const screen = signal<Screen>('start');
/** Which Job is on screen: a new one always starts from the old building. */
export const jobId = signal(0);
/** The building just put up, so the Town can show it off when it opens. */
export const justBuilt = signal<string | null>(null);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Job isn't a place: a reload during one lands at the Yard. */
export const PLACE_KEY = 'word-wreckers-place';
export const place = createPlace(PLACE_KEY, ['home', 'yard', 'town', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'job' ? 'yard' : s));

export function goJob() {
  jobId.value++;
  screen.value = 'job';
}
