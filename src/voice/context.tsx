import { createContext, type ComponentChildren } from 'preact';
import { useContext, useLayoutEffect, useMemo } from 'preact/hooks';
import { createVoiceScope, createVoiceTask, type VoiceScope } from './say';

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

export function useVoiceTask() {
  const parent = useVoiceScope();
  return useMemo(() => createVoiceTask(parent.signal), [parent]);
}

export function VoiceBoundary({ children, active = true, signal }: { children: ComponentChildren; active?: boolean; signal?: AbortSignal }) {
  const voice = useVoiceScope(signal);
  useLayoutEffect(() => { if (!active) voice.cancel(); }, [voice, active]);
  return <VoiceContext.Provider value={voice}>{children}</VoiceContext.Provider>;
}
