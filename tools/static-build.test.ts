import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build } from 'vite';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { staticBuild } from './static-build';
import { selectedVoice } from './fixtures/selectedVoice';
import { moneyBuild } from './money-build';
import { CLIPS } from '../src/voice/voice.gen';
import { fixtureEntry } from './fixtures/entry';
import { generatedEntry } from './fixtures/generatedVoice';
import { defineCollection } from '../src/voice/collection';

const fixture = {
  entry: fixtureEntry,
  branding: {
    title: 'Selected fixture', shortName: 'Selected', background: '#123456', theme: '#654321',
    icon: { svg: () => '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#123456"/></svg>', background: '#123456' },
  },
};

describe('static app selection', () => {
  it('rejects a same-phrase manifest whose filenames disagree with runtime playback', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'entry-mapping-'));
    try {
      writeFileSync(resolve(dir, 'alternate.mp3'), 'ALTERNATE_RECORDING');
      const other = defineCollection('other', ['Tick'], { Tick: 'alternate.mp3' });
      await expect(build({
        ...staticBuild({ ...fixture, outDir: resolve(dir, 'out'), voice: { root: dir, collection: other }, assets: [] }),
        logLevel: 'silent',
      }).then(() => {})).rejects.toThrow('Conflicting selected recording for "Tick": entry requires tick.mp3, supplied alternate.mp3');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);

  it('cannot omit the recordings required by the selected entry', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'entry-requirements-'));
    try {
      const clips = { ...selectedVoice.clips };
      Reflect.deleteProperty(clips, 'Tick');
      await expect(build({
        ...staticBuild({ ...fixture, outDir: resolve(dir, 'out'), voice: { root: dir, collection: { ...selectedVoice, phrases: [], clips } }, assets: [] }),
        logLevel: 'silent',
      }).then(() => {})).rejects.toThrow('selected-fixture: "Tick" missing mapping');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);

  it('copies and precaches only selected recordings, public files, artwork, branding, styles and fonts', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'selected-build-'));
    const modules: string[] = [];
    try {
      writeFileSync(resolve(dir, 'tick.mp3'), 'SELECTED_RECORDING');
      writeFileSync(resolve(dir, 'unselected.mp3'), 'UNSELECTED_RECORDING');
      writeFileSync(resolve(dir, 'selected.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><title>SELECTED_ART</title></svg>');
      writeFileSync(resolve(dir, 'unselected.svg'), 'UNSELECTED_ART');
      writeFileSync(resolve(dir, 'unselected.txt'), 'UNSELECTED_PUBLIC');
      const out = resolve(dir, 'fixture-output');
      const config = staticBuild({
        ...fixture, outDir: out,
        voice: { root: dir, collection: selectedVoice },
        assets: [{ root: dir, files: ['selected.svg'] }],
      });
      await build({
        ...config,
        logLevel: 'silent',
        plugins: [...config.plugins ?? [], { name: 'inspect-imports', generateBundle() { modules.push(...this.getModuleIds()); } }],
      });
      const files = readdirSync(out, { recursive: true }).map(String);
      const text = files.filter(file => /\.(js|css|html|json|svg|webmanifest)$/.test(file)).map(file => readFileSync(resolve(out, file), 'utf8')).join('\n');
      const sw = readFileSync(resolve(out, 'sw.js'), 'utf8');
      expect(files).toEqual(expect.arrayContaining(['index.html', 'voice/tick.mp3', 'selected.svg', 'icon-192.png', 'manifest.webmanifest']));
      expect(files.some(file => file.endsWith('.woff2'))).toBe(true);
      const icon = await sharp(resolve(out, 'icon-192.png')).raw().toBuffer();
      expect([...icon.subarray(0, 3)]).toEqual([18, 52, 86]);
      expect(JSON.parse(readFileSync(resolve(out, 'manifest.webmanifest'), 'utf8'))).toMatchObject({
        name: 'Selected fixture', short_name: 'Selected', start_url: './', scope: './',
        theme_color: '#654321', background_color: '#123456',
      });
      expect(readFileSync(resolve(out, 'voice/tick.mp3'), 'utf8')).toBe('SELECTED_RECORDING');
      expect(text).toContain('Selected fixture');
      expect(text).toContain('--selected-fixture');
      expect(text).toContain('SELECTED_ART');
      expect(sw).toContain('voice/tick.mp3');
      expect(sw).toContain('selected.svg');
      expect(sw).toContain('.woff2');
      expect(text).not.toMatch(/UNSELECTED|Monster Truck|Truck Money|Bungee|bungee|531a7fbb4a9b/);
      expect(files.join('\n')).not.toMatch(/unselected|bungee/);
      expect(modules.join('\n')).not.toMatch(/\/src\/(app|garage|modes|money|trophies)\//);
      expect(modules.join('\n')).not.toContain('fixtures/unselected');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);

  it.each([
    '25 cents', '42!', 'You need 30 more Bolts.', 'You earned 6 Bolts!',
  ] as const)('fails selected builds for a missing generated mapping and file, %s', async phrase => {
    const dir = mkdtempSync(resolve(tmpdir(), 'missing-build-'));
    const collection = generatedEntry.voice;
    try {
      const clips = { ...collection.clips };
      Reflect.deleteProperty(clips, phrase);
      await expect(build({
        ...staticBuild({
          ...fixture, entry: generatedEntry, outDir: resolve(dir, 'mapping'),
          voice: { root: resolve(import.meta.dirname, '../public/voice'), collection: { ...collection, clips } },
          assets: [],
        }),
        logLevel: 'silent',
      })).rejects.toThrow(`${collection.id}: "${phrase}" missing mapping`);
      const file = collection.clips[phrase];
      for (const other of collection.phrases.filter(other => other !== phrase)) {
        copyFileSync(resolve(import.meta.dirname, '../public/voice', collection.clips[other]), resolve(dir, collection.clips[other]));
      }
      const missingFile = {
        ...staticBuild({
          ...fixture, entry: generatedEntry, outDir: resolve(dir, 'file'),
          voice: { root: dir, collection },
          assets: [],
        }),
        logLevel: 'silent' as const,
      };
      await expect(build(missingFile)).rejects.toThrow(`${collection.id}: "${phrase}" missing file`);
      mkdirSync(resolve(dir, file));
      await expect(build(missingFile)).rejects.toThrow(`${collection.id}: "${phrase}" missing file`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('builds the real money selection with every existing recording and no fixture content', async () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'money-build-'));
    const modules: string[] = [];
    try {
      const config = staticBuild({ ...moneyBuild, outDir: resolve(dir, 'money') });
      await build({ ...config, logLevel: 'silent', plugins: [...config.plugins ?? [], { name: 'money-imports', generateBundle() { modules.push(...this.getModuleIds()); } }] });
      const out = resolve(dir, 'money'), files = readdirSync(out, { recursive: true }).map(String);
      expect(files.filter(file => file.startsWith('voice/')).sort()).toEqual([...new Set(Object.values(CLIPS).map(file => `voice/${file}`))].sort());
      const text = files.filter(file => /\.(js|css|html|webmanifest)$/.test(file)).map(file => readFileSync(resolve(out, file), 'utf8')).join('\n');
      expect(text).toContain('Monster Truck Money');
      expect(text).toContain('Truck Money');
      expect(text).not.toMatch(/Selected fixture|UNSELECTED|selected-fixture/);
      expect(readFileSync(resolve(out, 'sw.js'), 'utf8')).toContain('voice/531a7fbb4a9b.mp3');
      expect(modules.join('\n')).not.toMatch(/\/fixtures\/|\/src\/voice\/(phrases|voice\.gen)\.ts/);
      expect(files.join('\n')).not.toContain('.voice-collection');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);
});
