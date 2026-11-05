// Math Bots' recorded voice: its phrase collection, voice scopes tied to a screen's lifetime, and the context that hands
// them to components. Built on the shared playback in src/voice/playback.ts, like Monster Truck Money's.
import { createContext, type ComponentChildren } from 'preact';
import { useContext, useLayoutEffect, useMemo } from 'preact/hooks';
import { signal } from '@preact/signals';
import { audio } from '../audio/context';
import { recordedAudio } from '../audio/recorded';
import { createPlayback, type PlaybackControls, type PlaybackItem, type PlaybackScope } from '../voice/playback';
import { keepRange } from './numbers/trim';
import type { Phrase } from './phrases';
import { mathVoice } from './voiceCollection';

export { mathVoice };

/** A phrase, or several read while an element lights up (it checks `speaking.value === light`). */
export type Item = PlaybackItem<Phrase>;
export type VoiceScope = PlaybackScope<Phrase>;

const STALLED_S = 0.5;

// Every recording carries about a second of silence, which nobody minds after a whole sentence, but a line chained from four
// pieces would crawl. So each clip is trimmed as it's decoded: a short gap between pieces, a longer one after a full stop.
const SENTENCE_ENDS = new Set(mathVoice.phrases.filter(p => /[.?!]$/.test(p)).map(p => mathVoice.clips[p]));
const trimmedAudio: PlaybackControls<AudioBuffer> = {
  // A clip never tells us it ended while iPad Safari has the sound paused, and taps wait for the voice, so a clip has to end
  // on the clock too: the game carries on quietly, and his next tap brings the sound back.
  play(buffer) {
    const playing = recordedAudio.play(buffer), timer = setTimeout(playing.stop, (buffer.duration + STALLED_S) * 1000);
    void playing.done.then(() => clearTimeout(timer));
    return playing;
  },
  async load(file) {
    const whole = await recordedAudio.load(file);
    if (!whole) return null;
    const samples = whole.getChannelData(0), [start, end] = keepRange(samples, whole.sampleRate, SENTENCE_ENDS.has(file) ? 'sentence' : 'piece');
    const out = audio().createBuffer(1, Math.max(1, end - start), whole.sampleRate);
    out.copyToChannel(samples.subarray(start, end), 0);
    return out;
  },
};
const playback = createPlayback<Phrase, AudioBuffer>({ ...mathVoice, ...trimmedAudio });
export const createVoiceScope = (parent?: AbortSignal): VoiceScope => playback.scope(parent);
export const speaking = playback.speaking;
export const preload = (phrases: readonly Phrase[]) => void playback.preload(phrases);

export function createVoiceTask(parent: AbortSignal) {
  let current: VoiceScope | null = null;
  const cancel = () => current?.cancel();
  return { cancel, start() { cancel(); return (current = createVoiceScope(parent)); } };
}

export const VoiceContext = createContext<VoiceScope | null>(null);
export function useVoice() {
  const voice = useContext(VoiceContext);
  if (!voice) throw new Error('Recorded voice needs an active lifetime');
  return voice;
}
export function useVoiceScope(lifetime?: AbortSignal) {
  const parent = useVoice();
  const voice = useMemo(() => createVoiceScope(lifetime ?? parent.signal), [parent, lifetime]);
  useLayoutEffect(() => voice.cancel, [voice]);
  return voice;
}
export function VoiceBoundary({ children, active = true, signal: lifetime }: { children: ComponentChildren; active?: boolean; signal?: AbortSignal }) {
  const voice = useVoiceScope(lifetime);
  useLayoutEffect(() => { if (!active) voice.cancel(); }, [voice, active]);
  return <VoiceContext.Provider value={voice}>{children}</VoiceContext.Provider>;
}

// ---------- the toast: a short line on screen while it's said ----------
const shown = signal<{ text: string } | null>(null);
let dismiss = () => {};
export function toast(voice: VoiceScope, text: string, ...speech: Item[]): Promise<void> {
  if (!voice.active) return Promise.resolve();
  dismiss();
  const message = { text };
  const clear = () => {
    clearTimeout(timer);
    voice.signal.removeEventListener('abort', clear);
    if (shown.peek() === message) shown.value = null;
  };
  const timer = setTimeout(clear, 1800);
  dismiss = clear;
  voice.signal.addEventListener('abort', clear, { once: true });
  shown.value = message;
  return voice.say(...speech);
}
export function Toast() {
  const t = shown.value;
  return <div class={`toast${t ? ' show' : ''}`} aria-live="polite">{t?.text}</div>;
}
