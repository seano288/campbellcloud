import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build } from 'vite';
import { expect, it } from 'vitest';
import { staticBuild } from '../static-build';
import { moneyBuild } from '../money-build';
import { clockGarageBuild, clockRepeatBuild, moneyRepeatBuild } from './builds';
import { exerciseBuiltPairing } from './browser';

it.each([
  ['money-garage', moneyBuild, true, true],
  ['money-repeat', moneyRepeatBuild, true, false],
  ['clock-garage', clockGarageBuild, false, true],
  ['clock-repeat', clockRepeatBuild, false, false],
] as const)('builds %s with only its selected production dependencies and precached assets', async (name, selection, money, garage) => {
  const dir = mkdtempSync(resolve(tmpdir(), `pairing-${name}-`));
  const modules: string[] = [];
  try {
    const config = staticBuild<string>({ ...selection, outDir: resolve(dir, 'out') });
    await build({ ...config, logLevel: 'silent', plugins: [...config.plugins ?? [], {
      name: 'pairing-dependencies', generateBundle() { modules.push(...this.getModuleIds()); },
    }] });
    const out = resolve(dir, 'out'), files = readdirSync(out, { recursive: true }).map(String);
    const sw = readFileSync(resolve(out, 'sw.js'), 'utf8');
    const text = files.filter(file => /\.(js|css|html|svg|webmanifest)$/.test(file)).map(file => readFileSync(resolve(out, file), 'utf8')).join('\n');
    const graph = modules.join('\n');
    expect(files.filter(file => file.startsWith('voice/')).sort()).toEqual([...new Set(Object.values(selection.voice.collection.clips).map(file => `voice/${file}`))].sort());
    for (const file of files.filter(file => /\.(mp3|woff2|svg|png|css|html)$/.test(file))) expect(sw).toContain(file);
    expect(JSON.parse(readFileSync(resolve(out, 'manifest.webmanifest'), 'utf8'))).toMatchObject({
      name: selection.branding.title, short_name: selection.branding.shortName, start_url: './', scope: './',
    });
    expect(text).toContain(selection.branding.title);
    expect(text).not.toMatch(/UNSELECTED|Selected fixture/);
    expect(graph).toContain('/src/learning/round.ts');
    expect(graph).toContain('/src/app/coordination.ts');
    expect(graph).toContain('/src/app/purchaseCoordination.ts');
    expect(graph).toContain('/src/currency/currency.ts');
    expect(graph).not.toMatch(/\/prototype\/|\/src\/voice\/(phrases|voice\.gen)\.ts/);
    if (garage) expect(graph).toMatch(/\/src\/garage\/(catalog|GarageScreen)\./);
    if (garage) expect(files.join('\n')).toContain('bungee');
    if (!garage) {
      expect(graph).not.toMatch(/\/src\/(garage|icon)\//);
      expect(text).not.toMatch(/Monster Truck|Truck Money|Truck-tastic|VROOM|Show time!/);
      expect(files.join('\n')).not.toContain('bungee');
    }
    if (!money) {
      expect(graph).not.toMatch(/\/src\/modes\/(learn|count)\//);
      expect(graph).not.toMatch(/\/src\/modes\/(session|state|modes|phrases|voice)\.ts/);
      expect(text).not.toMatch(/Learn the Coins|Count the Cash|Pay the Shop|Buy the Fuel/);
    }
    if (money) expect(graph).not.toMatch(/\/src\/learning\/nonMoney\.fixture\.ts|\/tools\/pairings\/clock\.ts/);
    if (name === 'clock-garage') expect(graph).not.toMatch(/\/src\/rewards\/repeatPurchase\.fixture\.ts|\/tools\/pairings\/repeat\.ts/);
    if (!money && !garage) expect(graph).not.toMatch(/\/src\/(money|modes)\//);
    if (name !== 'money-garage') {
      expect(graph).not.toMatch(/\/src\/(game\/store|save\/migrate|app\/(money|save|App|nav))\./);
      expect(files).toContain(`${name}.svg`);
      for (const other of ['clock-repeat', 'clock-garage', 'money-repeat'].filter(other => other !== name)) expect(files).not.toContain(`${other}.svg`);
      await exerciseBuiltPairing(out, name);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 60000);
