import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const imports = `
import { defineCollection } from '${root}/src/voice/collection';
import { createPlayback } from '${root}/src/voice/playback';
import { createMoneyVoice } from '${root}/src/voice/say';
import { staticBuild } from '${root}/tools/static-build';
import { fixtureEntry } from '${root}/tools/fixtures/entry';
const controls = { load: async (file: string) => file, play: (_: string) => ({ done: Promise.resolve(), stop() {} }) };
const selected = defineCollection('clock', ['Tick'], { Tick: 'tick.mp3' });
`;

describe('selected voice typechecking', () => {
  it.each([
    ['selected phrase', `createPlayback({ ...selected, ...controls }).scope().say('Tick');`, null],
    ['real selected money views', `createMoneyVoice(controls).scope().say('Garage!', '42!', 'You earned 6 Bolts!', { cents: 225 });`, null],
    ['selected build manifest', `staticBuild({ entry: fixtureEntry, outDir: 'unused', voice: { root: 'unused', collection: fixtureEntry.voice }, assets: [], branding: { title: '', shortName: '', background: '', theme: '', icon: { svg: () => '', background: '' } } });`, null],
    ['unselected phrase', `createPlayback({ ...selected, ...controls }).scope().say('Garage!');`, 'Garage!'],
    ['missing mapping', `defineCollection('clock', ['Tick', 'Tock'], { Tick: 'tick.mp3' });`, 'Tock'],
    ['unrelated string-indexed mapping', `const clips: Record<string, string> = { Tock: 'tock.mp3' }; defineCollection('clock', ['Tick'], clips);`, 'Tick'],
    ['arbitrary strings', `const phrases: string[] = ['Tick']; defineCollection('wide', phrases, {});`, 'never'],
    ['unrelated manifest', `createMoneyVoice(controls, selected);`, 'VoiceCollection'],
    ['unrelated build manifest', `staticBuild({ entry: fixtureEntry, outDir: 'unused', voice: { root: 'unused', collection: defineCollection('other', ['Tock'], { Tock: 'tock.mp3' }) }, assets: [], branding: { title: '', shortName: '', background: '', theme: '', icon: { svg: () => '', background: '' } } });`, 'Tick'],
    ['omitted build manifest', `staticBuild({ entry: fixtureEntry, outDir: 'unused', assets: [], branding: { title: '', shortName: '', background: '', theme: '', icon: { svg: () => '', background: '' } } });`, 'voice'],
  ])('typechecks %s through the selected interface', (_name, body, diagnostic) => {
    const dir = mkdtempSync(resolve(tmpdir(), 'voice-types-'));
    try {
      writeFileSync(resolve(dir, 'fixture.ts'), imports + body);
      writeFileSync(resolve(dir, 'tsconfig.json'), JSON.stringify({
        extends: resolve(root, 'tsconfig.json'),
        compilerOptions: {
          noUnusedLocals: false, noUnusedParameters: false,
          types: [resolve(root, 'node_modules/@types/node'), resolve(root, 'node_modules/vite/client')],
        },
        include: ['./fixture.ts'],
      }));
      const result = spawnSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', resolve(dir, 'tsconfig.json')], { encoding: 'utf8' });
      if (diagnostic) {
        expect(result.status, result.stdout + result.stderr).not.toBe(0);
        expect(result.stdout).toContain(diagnostic);
      } else expect(result.status, result.stdout + result.stderr).toBe(0);
      expect(result.stdout).not.toContain('Cannot find');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
