import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AppEntry } from '../../src/entry';
import type { StaticSelection } from '../static-build';
import { clockRepeatEntry } from './clockRepeatSelection';
import { clockGarageEntry } from './clockGarageSelection';
import { moneyRepeatEntry } from './moneyRepeatSelection';

function fixtureBuild<P extends string>(name: string, title: string, entry: AppEntry<P>): StaticSelection<P> {
  const root = resolve(import.meta.dirname, 'assets', name);
  return {
    entry, outDir: `dist-pairings/${name}`,
    branding: { title, shortName: title, background: '#e8f1ee', theme: '#172d35', icon: { background: '#e8f1ee', svg: () => readFileSync(resolve(root, `${name}.svg`), 'utf8') } },
    voice: { root: resolve(import.meta.dirname, '../../public/voice'), collection: entry.voice },
    assets: [{ root, files: [`${name}.svg`] }],
  };
}
export const clockRepeatBuild = fixtureBuild('clock-repeat', 'Clock repeat fixture', clockRepeatEntry);
export const clockGarageBuild = fixtureBuild('clock-garage', 'Clock Garage fixture', clockGarageEntry);
export const moneyRepeatBuild = fixtureBuild('money-repeat', 'Money repeat fixture', moneyRepeatEntry);
