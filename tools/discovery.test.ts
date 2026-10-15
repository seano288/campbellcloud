import { globSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import config from '../vite.config';

const root = resolve(import.meta.dirname, '..');
const outside = (name: string) => ['node_modules', '.git', '.scratch'].includes(name) || name.startsWith('dist');
const tests = globSync('**/*.test.{ts,tsx}', { cwd: root, exclude: outside }).sort();

// A test file outside the root include would pass CI by never running. Scratch prototypes are design evidence,
// not production checks, so they are deliberately outside.
it('runs every repository test from the root suite', () => {
  const include = config.test?.include ?? [];
  const discovered = new Set(include.flatMap(pattern => globSync(pattern, { cwd: root, exclude: outside })));
  expect(tests.length).toBeGreaterThan(0);
  expect(tests.filter(test => !discovered.has(test))).toEqual([]);
});

it('names only existing pairing tests in the explicit pairing script', () => {
  const scripts = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).scripts;
  const named = scripts['test:pairings'].split(' ').filter((part: string) => part.endsWith('.test.ts'));
  expect(named.sort()).toEqual(tests.filter(test => test.startsWith('tools/pairings/')));
});
