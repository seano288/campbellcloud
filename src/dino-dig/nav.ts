import { signal } from '@preact/signals';
import { createPlace } from '../save/place';
import type { DinoId } from './museum/dinos';
import { createVoiceScope } from './voice';

export type Screen = 'start' | 'home' | 'round' | 'museum' | 'shop' | 'dig' | 'run';
export const screen = signal<Screen>('start');
/** Which Dig is on screen: a new one always starts from fresh dirt. */
export const digId = signal(0);
/** The dinosaur the run plays as, and whether it has just come alive (the run starts with it growing its skin). */
export const running = signal<{ dino: DinoId; waking: boolean } | null>(null);
/** The bones a Dig just found, so the Museum can snap them onto the skeleton when it opens: which dinosaur, and how many it had. */
export const justFound = signal<{ dino: DinoId; had: number } | null>(null);
/** Everything a screen says stops when he leaves it. */
export const screenVoice = signal(createVoiceScope());
screen.subscribe(() => {
  screenVoice.peek().cancel();
  screenVoice.value = createVoiceScope();
});
/** Where he was, so a reload brings him back to it (src/save/place.ts). A Dig or a run isn't a place: a reload lands in the Museum. */
export const PLACE_KEY = 'dino-dig-place';
export const place = createPlace(PLACE_KEY, ['home', 'museum', 'shop', 'round'], ['mix']); // every Round is a mix
screen.subscribe(s => place.screen(s === 'dig' || s === 'run' ? 'museum' : s));

export function goDig() {
  digId.value++;
  screen.value = 'dig';
}
export function goRun(dino: DinoId, waking = false) {
  running.value = { dino, waking };
  screen.value = 'run';
}

/** For a control that acts on pointerdown and takes him to another screen: when his finger lifts, the browser still sends a click to
 *  whatever is under it on the new screen, so that one click is swallowed. */
export function eatNextClick(ms = 800) {
  const eat = (e: Event) => { e.preventDefault(); e.stopPropagation(); done(); };
  const done = () => { clearTimeout(timer); removeEventListener('click', eat, true); };
  const timer = setTimeout(done, ms);
  addEventListener('click', eat, true);
}
