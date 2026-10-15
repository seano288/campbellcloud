import { createContext, type ComponentChildren } from 'preact';
import { useContext, useLayoutEffect, useMemo } from 'preact/hooks';
import { createVoiceScope, type VoiceScope } from './say';

export const VoiceContext = createContext<VoiceScope | null>(null);

export function useVoice() {
  const voice = useContext(VoiceContext);
  if (!voice) throw new Error('Recorded voice needs an active lifetime');
  return voice;
}

export function useVoiceScope() {
  const parent = useVoice();
  const voice = useMemo(() => createVoiceScope(parent.signal), [parent]);
  useLayoutEffect(() => voice.cancel, [voice]);
  return voice;
}

export function useVoiceTask() {
  const parent = useVoiceScope();
  return useMemo(() => {
    let current: VoiceScope | null = null;
    const cancel = () => current?.cancel();
    return {
      cancel,
      start() { cancel(); return current = createVoiceScope(parent.signal); },
    };
  }, [parent]);
}

export function VoiceBoundary({ children, active = true }: { children: ComponentChildren; active?: boolean }) {
  const voice = useVoiceScope();
  useLayoutEffect(() => { if (!active) voice.cancel(); }, [voice, active]);
  return <VoiceContext.Provider value={voice}>{children}</VoiceContext.Provider>;
}
