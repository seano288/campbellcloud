import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import type { RivalId } from './league/rivals';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'reward' | 'league' | 'fight';
export const screen = signal<Screen>('start');
/** Who the fight screen is against. */
export const fightTarget = signal<RivalId>('rusty');
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). The fight isn't a place: a reload during one lands in the Workshop. */
export const PLACE_KEY = 'math-bots-place';
export const place = createPlace(PLACE_KEY, ['home', 'reward', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s));
