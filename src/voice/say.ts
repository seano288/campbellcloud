// Plays phrases from their recorded clips, one after another. say() cuts off whatever is being said;
// sayMore() adds to it. Money amounts are joined from pieces: say('It costs', { cents: 225 }).
import { recordedAudio } from '../audio/recorded';
import { amountPieces } from './amount';
import { PHRASES, type Phrase } from './phrases';
import { createPlayback, type PlaybackControls, type PlaybackItem, type PlaybackScope } from './playback';
import { CLIPS } from './voice.gen';

export type Part = Phrase | { cents: number };
/** A part, or several parts read while an element is lit (the element checks `speaking.value === light`). */
export type Item = Part | { parts: readonly Part[]; light: string };

const toPhrases = (parts: readonly Part[]): Phrase[] => parts.flatMap(p => (typeof p === 'string' ? [p] : amountPieces(p.cents)));
const expand = (items: readonly Item[]): PlaybackItem<Phrase>[] => items.flatMap<PlaybackItem<Phrase>>(it =>
  typeof it === 'object' && 'parts' in it ? [{ parts: toPhrases(it.parts), light: it.light }] : toPhrases([it]));

export type VoiceScope = Omit<PlaybackScope<Phrase>, 'say' | 'sayMore' | 'hush'> & {
  /** Stop talking. Anyone waiting on what was being said is released. */
  hush(): void;
  /** Say these, cutting off whatever is being said. Resolves when all of it has been said (or cut off). */
  say(...items: Item[]): Promise<void>;
  /** Say these after whatever is already being said. */
  sayMore(...items: Item[]): Promise<void>;
};

export function createMoneyVoice<B>(controls: PlaybackControls<B>) {
  const playback = createPlayback({ phrases: PHRASES, clips: CLIPS, ...controls });
  return {
    speaking: playback.speaking,
    preload: playback.preload,
    scope(parent?: AbortSignal): VoiceScope {
      const scope = playback.scope(parent);
      return {
        ...scope,
        get active() { return scope.active; },
        say: async (...items) => { if (scope.active) await scope.say(...expand(items)); },
        sayMore: async (...items) => { if (scope.active) await scope.sayMore(...expand(items)); },
      };
    },
  };
}

const voice = createMoneyVoice(recordedAudio);
export const createVoiceScope = voice.scope;

export function createVoiceTask(parent: AbortSignal) {
  let current: VoiceScope | null = null;
  const cancel = () => current?.cancel();
  return {
    cancel,
    start() { cancel(); return current = createVoiceScope(parent); },
  };
}

/** The `light` key of the item being read, so its button can light up. */
export const speaking = voice.speaking;

/** Fetch and decode these phrases ahead of time so they start without a gap. */
export function preload(phrases: readonly Phrase[]) {
  void voice.preload(phrases);
}
