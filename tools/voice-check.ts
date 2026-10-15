// Vite plugin: the build fails when a phrase in phrases.ts has no recorded clip.
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import type { VoiceCollection } from '../src/voice/collection';

type Requirements = Pick<VoiceCollection<string>, 'id' | 'phrases'> & { clips: Readonly<Partial<Record<string, string>>> };
type MissingClip = { collection: string; phrase: string; kind: 'mapping' } | { collection: string; phrase: string; kind: 'file'; file: string };

export function missingClips(root: string, collection: Requirements): MissingClip[] {
  return collection.phrases.flatMap<MissingClip>(phrase => {
    const mapped = collection.clips[phrase];
    if (!mapped) return [{ collection: collection.id, phrase, kind: 'mapping' }];
    const file = resolve(root, mapped);
    return statSync(file, { throwIfNoEntry: false })?.isFile() ? [] : [{ collection: collection.id, phrase, kind: 'file', file }];
  });
}

export function voiceCheck(selections: readonly { root: string; collection: Requirements }[]): Plugin {
  return {
    name: 'voice-check',
    apply: 'build',
    configResolved() {
      const missing = selections.flatMap(({ root, collection }) => missingClips(root, collection));
      if (missing.length) {
        throw new Error(`Missing voice clips (run tools/make_voice.py with the selected collection):\n${missing.map(p => `  ${p.collection}: "${p.phrase}" missing ${p.kind}${p.kind === 'file' ? ` ${p.file}` : ''}`).join('\n')}`);
      }
    },
  };
}
