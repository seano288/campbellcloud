// Rover Code's recorded voice: its phrase collection, voice scopes tied to a screen's lifetime, and the context that hands them to
// components. Built on the shared playback in src/voice/playback.ts. As in Math Bots, lines are chained from pieces ("It costs", "12",
// "Bolts."), so each clip is trimmed of its recorded silence as it's decoded, and a clip also ends on the clock, because iPad Safari
// can pause the sound without saying so and taps wait for the voice.
import { createContext, type ComponentChildren } from 'preact';
import { useContext, useLayoutEffect, useMemo } from 'preact/hooks';
import { signal } from '@preact/signals';
import { audio } from '../audio/context';
import { recordedAudio } from '../audio/recorded';
import { createPlayback, type PlaybackControls, type PlaybackItem, type PlaybackScope } from '../voice/playback';
import type { Phrase } from './phrases';
import { roverVoice } from './voiceCollection';

export { roverVoice };

export type Item = PlaybackItem<Phrase>;
export type VoiceScope = PlaybackScope<Phrase>;

const STALLED_S = 0.5;

// Which part of a recording to keep: the speech, with a little air after it (Math Bots' numbers/trim.ts, the same numbers).
const QUIET = 0.002, LEAD_S = 0.02, GAP_S = { piece: 0.03, sentence: 0.24 } as const;
export function keepRange(samples: ArrayLike<number>, rate: number, end: keyof typeof GAP_S): [number, number] {
  const n = samples.length, loud = (i: number) => Math.abs(samples[i]!) > QUIET;
  let first = 0, last = n - 1;
  while (first < n && !loud(first)) first++;
  while (last > first && !loud(last)) last--;
  if (first >= n) return [0, n];
  return [Math.max(0, first - Math.round(LEAD_S * rate)), Math.min(n, last + Math.round(GAP_S[end] * rate))];
}

const SENTENCE_ENDS = new Set(roverVoice.phrases.filter(p => /[.?!]$/.test(p)).map(p => roverVoice.clips[p]));
const trimmedAudio: PlaybackControls<AudioBuffer> = {
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
const playback = createPlayback<Phrase, AudioBuffer>({ ...roverVoice, ...trimmedAudio });
export const createVoiceScope = (parent?: AbortSignal): VoiceScope => playback.scope(parent);
export const speaking = playback.speaking;

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
