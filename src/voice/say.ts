// Plays phrases from their recorded clips, one after another. say() cuts off whatever is being said;
// sayMore() adds to it. Money amounts are joined from pieces: say('It costs', { cents: 225 }).
import { recordedAudio } from '../audio/recorded';
import { computed, signal } from '@preact/signals';
import { amountPieces, type AmountPiece } from './amount';
import type { Phrase } from './phrases';
import type { VoiceCollection } from './collection';
import { createPlayback, type PlaybackControls, type PlaybackItem, type PlaybackScope } from './playback';

export type Part<P extends Phrase = Phrase> = P | (AmountPiece extends P ? { cents: number } : never);
/** A part, or several parts read while an element is lit (the element checks `speaking.value === light`). */
export type Item<P extends Phrase = Phrase> = Part<P> | { parts: readonly Part<P>[]; light: string };

const toPhrases = (parts: readonly Part[]): Phrase[] => parts.flatMap(p => (typeof p === 'string' ? [p] : amountPieces(p.cents)));
const expand = (items: readonly Item[]): PlaybackItem<Phrase>[] => items.flatMap<PlaybackItem<Phrase>>(it =>
  typeof it === 'object' && 'parts' in it ? [{ parts: toPhrases(it.parts), light: it.light }] : toPhrases([it]));

export type VoiceScope<P extends Phrase = Phrase> = Omit<PlaybackScope<P>, 'say' | 'sayMore' | 'hush'> & {
  /** Stop talking. Anyone waiting on what was being said is released. */
  hush(): void;
  /** Say these, cutting off whatever is being said. Resolves when all of it has been said (or cut off). */
  say(...items: Item<P>[]): Promise<void>;
  /** Say these after whatever is already being said. */
  sayMore(...items: Item<P>[]): Promise<void>;
};

export function createMoneyVoice<B, P extends Phrase>(controls: PlaybackControls<B>, collection: VoiceCollection<P>) {
  return moneyVoice<P, B>(controls, collection);
}

function moneyVoice<P extends Phrase, B>(controls: PlaybackControls<B>, collection: { phrases: readonly Phrase[]; clips: Readonly<Partial<Record<Phrase, string>>> }) {
  const playback = createPlayback<Phrase, B>({ ...collection, ...controls });
  return {
    speaking: playback.speaking,
    preload: (phrases: readonly P[]) => playback.preload(phrases),
    scope(parent?: AbortSignal): VoiceScope<P> {
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

const voice = signal(moneyVoice<Phrase, AudioBuffer>(recordedAudio, { phrases: [], clips: {} }));
export function selectMoneyVoice<P extends Phrase>(collection: VoiceCollection<P>) {
  voice.value = moneyVoice<Phrase, AudioBuffer>(recordedAudio, collection);
}
export const createVoiceScope = (parent?: AbortSignal) => voice.peek().scope(parent);

export function createVoiceTask(parent: AbortSignal) {
  let current: VoiceScope | null = null;
  const cancel = () => current?.cancel();
  return {
    cancel,
    start() { cancel(); return current = createVoiceScope(parent); },
  };
}

/** The `light` key of the item being read, so its button can light up. */
export const speaking = computed(() => voice.value.speaking.value);

/** Fetch and decode these phrases ahead of time so they start without a gap. */
export function preload(phrases: readonly Phrase[]) {
  void voice.peek().preload(phrases);
}
