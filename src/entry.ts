import type { VoiceCollection } from './voice/collection';

export interface AppEntry<P extends string> {
  readonly file: string;
  readonly voice: VoiceCollection<P>;
}

export function selectEntry<P extends string>(file: string, voice: VoiceCollection<P>): AppEntry<P> {
  return { file, voice };
}
