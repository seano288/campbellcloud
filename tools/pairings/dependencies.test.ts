import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

function dependencies(entry: string, visited = new Set<string>()): string[] {
  const file = resolve(root, entry);
  if (visited.has(file)) return [];
  visited.add(file);
  const imports = [...readFileSync(file, 'utf8').matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[^;'"]+?\s+from\s+)?['"](\.[^'"]+)['"]/g)]
    .map(imported => {
      const base = resolve(file, '..', imported[1]!);
      return ['.ts', '.tsx'].map(extension => base + extension).find(path => existsSync(path));
    }).filter((file): file is string => !!file);
  return [file, ...imports.flatMap(imported => dependencies(imported, visited))];
}

it.each([
  'src/learning/session.ts', 'src/learning/round.ts', 'src/round/rules.ts', 'src/round/RoundScreen.tsx',
  'src/currency/currency.ts', 'src/rewards/purchase.ts', 'src/rewards/presentation.ts',
  'src/trophies/rules.ts', 'src/save/store.ts', 'src/save/storage.ts',
  'src/app/coordination.ts', 'src/app/purchaseCoordination.ts', 'src/voice/playback.ts', 'src/voice/collection.ts',
])('%s has no concrete subject, reward, branding or aggregate-save dependency, including type imports', entry => {
  const forbidden = dependencies(entry).filter(file =>
    /\/src\/(modes|money|garage|icon)\//.test(file)
    || /\/src\/(save\/migrate|app\/save|voice\/phrases|app\/voice)\.ts$/.test(file));
  expect(forbidden).toEqual([]);
});

it.each(['src/modes/state.ts', 'src/garage/state.ts', 'src/trophies/rules.ts', 'src/currency/currency.ts', 'src/app/checkout.ts'])(
  '%s owns state without the legacy aggregate save',
  entry => expect(dependencies(entry).filter(file => /\/src\/(save\/migrate|app\/save)\.ts$/.test(file))).toEqual([]),
);
