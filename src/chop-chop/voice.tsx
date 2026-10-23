// Chop Chop's recorded voice: its phrase collection, voice scopes tied to a screen's lifetime, and the context that hands
// them to components. Built on the shared playback in src/voice/playback.ts, like Monster Truck Money's.
import { createContext, type ComponentChildren } from 'preact';
import { useContext, useLayoutEffect, useMemo } from 'preact/hooks';
import { signal } from '@preact/signals';
import { recordedAudio } from '../audio/recorded';
import { createPlayback, type PlaybackItem, type PlaybackScope } from '../voice/playback';
import type { Phrase } from './phrases';
import { chopVoice } from './voiceCollection';

export { chopVoice };

/** A phrase, or several read while an element lights up (it checks `speaking.value === light`). */
export type Item = PlaybackItem<Phrase>;
export type VoiceScope = PlaybackScope<Phrase>;

const playback = createPlayback<Phrase, AudioBuffer>({ ...chopVoice, ...recordedAudio });
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
