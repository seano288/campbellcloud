import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import { nextTrack } from './garage/garage';
import { player } from './game';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'garage' | 'cups' | 'race';
export const screen = signal<Screen>('start');
/** The track the Race is on, whether it's a real Race or "Watch it go" (his car alone, driving itself, for show), and which one it
 *  is: a new one always starts from the grid. */
export const raceTrack = signal<string>('t1');
export const raceShow = signal(false);
export const raceId = signal(0);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Race isn't a place: a reload during one lands in the Garage. */
export const PLACE_KEY = 'turbo-tally-place';
export const place = createPlace(PLACE_KEY, ['home', 'garage', 'cups', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s));

/** Off to the track the Garage would race on. */
export function race() {
  raceTrack.value = nextTrack(player.state.peek().garage).id;
  raceShow.value = false;
  raceId.value++;
  screen.value = 'race';
}
/** "Watch it go": his car alone on a track he has raced, driving itself, one lap. */
export function watch(track?: string) {
  const g = player.state.peek().garage;
  raceTrack.value = track ?? g.last ?? nextTrack(g).id;
  raceShow.value = true;
  raceId.value++;
  screen.value = 'race';
}
