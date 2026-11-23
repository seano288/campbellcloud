import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { nextJob, type JobRef } from './city/city';
import { player } from './game';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'city' | 'job';
export const screen = signal<Screen>('start');
/** The Job being driven, and which go it is: a new one always starts from the depot. */
export const jobRef = signal<JobRef | null>(null);
export const jobId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Job isn't a place: a reload during one lands in the City. */
export const PLACE_KEY = 'skyline-place';
export const place = createPlace(PLACE_KEY, ['home', 'city', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s));

/** Off to the next Job. */
export function job() {
  jobRef.value = nextJob(player.state.peek().city);
  jobId.value++;
  screen.value = 'job';
}
