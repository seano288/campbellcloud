// Purrdoku's narrator: a cheeky line after every cat laid down. Each pool is dealt like a shuffled deck, so no line
// comes round again until the rest of its pool has been said. The mute switch is remembered on the device.
import { effect, signal } from '@preact/signals';
import { resumeAudio, wakeAudio } from '../audio/context';
import { recordedAudio } from '../audio/recorded';
import { createPlayback } from '../voice/playback';
import type { Placed } from './game';
import { purrdokuVoice } from './entrySelection';
import { CHEERS, OOPS, PHRASES, STREAKS, WINS, type Phrase } from './phrases';

/** Every this many right cats in a row on a board, a streak line takes the place of a cheer. */
export const STREAK = 3;

/** Deals a pool's lines in a fresh shuffled order each time round, never the same line twice running. */
export function deck<P>(lines: readonly P[], random = Math.random) {
  let left: P[] = [], last: P | undefined;
  return () => {
    if (!left.length) {
      left = [...lines];
      for (let i = left.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [left[i], left[j]] = [left[j]!, left[i]!];
      }
      if (left.length > 1 && left[left.length - 1] === last) [left[0], left[left.length - 1]] = [left[left.length - 1]!, left[0]!];
    }
    return (last = left.pop()!);
  };
}

/** Picks what to say for each cat laid down, counting right cats in a row. */
export function narrator(random = Math.random) {
  const decks = { cat: deck(CHEERS, random), streak: deck(STREAKS, random), won: deck(WINS, random), oops: deck(OOPS, random) };
  let run = 0;
  return {
    line(placed: Placed): Phrase {
      if (placed === 'won') { run = 0; return decks.won(); }
      if (placed === 'wrong' || placed === 'lost') { run = 0; return decks.oops(); }
      return ++run % STREAK === 0 ? decks.streak() : decks.cat();
    },
    /** A new or restarted board starts the count again. */
    reset() { run = 0; },
  };
}

const MUTE_KEY = 'purrdoku-mute';
export const muted = signal(readMute());
function readMute() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}
effect(() => {
  try { localStorage.setItem(MUTE_KEY, muted.value ? '1' : '0'); } catch { /* private browsing */ }
});

const playback = createPlayback<Phrase, AudioBuffer>({ ...purrdokuVoice, ...recordedAudio });
const voice = playback.scope();
const narrate = narrator();

/** Says the line for a cat just laid down, cutting off whatever was still being said. */
export function react(placed: Placed) {
  const line = narrate.line(placed);
  if (!muted.peek()) void voice.say(line);
}
export const newBoard = () => narrate.reset();

/** iPad Safari only lets sound play once a tap has ended, so the first one unlocks it and fetches every line. It also
 * pauses the sound whenever the screen locks or the app goes away, so every tap after that wakes it again. */
export function listen() {
  let loaded = false;
  const unlock = () => {
    wakeAudio();
    if (!loaded) { loaded = true; void playback.preload(PHRASES); }
  };
  addEventListener('pointerup', unlock, true);
  addEventListener('touchend', unlock, true);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resumeAudio(); });
}

export function toggleMute() {
  muted.value = !muted.value;
  if (muted.value) voice.hush();
}
