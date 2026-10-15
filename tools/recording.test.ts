import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { paymentVoice } from '../src/modes/pay/voice';

const root = resolve(import.meta.dirname, '..');
const run = (args: string[]) => spawnSync('python3', ['tools/make_voice.py', ...args], { cwd: root, encoding: 'utf8' });

describe('selected phrase recording', () => {
  it('exports only selected phrases and confines stale cleanup to its owned output', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'recording-'));
    try {
      const selected = resolve(dir, 'payment'), other = resolve(dir, 'other');
      mkdirSync(selected);
      mkdirSync(other);
      writeFileSync(resolve(selected, '.voice-collection'), 'payment\n');
      writeFileSync(resolve(selected, 'stale.mp3'), 'STALE');
      writeFileSync(resolve(other, '.voice-collection'), 'other\n');
      writeFileSync(resolve(other, 'keep.mp3'), 'KEEP');
      for (const file of Object.values(paymentVoice.clips)) writeFileSync(resolve(selected, file), 'EXISTING');
      const index = resolve(dir, 'payment.ts');
      const result = run(['--collection', 'payment', '--out', selected, '--index', index]);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain('recorded 0, removed 1 stale');
      expect(readdirSync(selected)).not.toContain('stale.mp3');
      expect(readFileSync(resolve(other, 'keep.mp3'), 'utf8')).toBe('KEEP');
      const mapping = readFileSync(index, 'utf8');
      expect(mapping).toContain('"It costs"');
      expect(mapping).not.toMatch(/Garage|What is this called|Trophies/);
      expect(mapping).toContain('as const');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 10000);

  it('refuses a recording directory owned by another collection without changing its files', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'recording-owner-'));
    try {
      writeFileSync(resolve(dir, '.voice-collection'), 'another-collection\n');
      writeFileSync(resolve(dir, 'keep.mp3'), 'KEEP');
      const result = run(['--collection', 'payment', '--out', dir, '--index', resolve(dir, 'index.ts')]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('belongs to another voice collection');
      expect(readdirSync(dir).sort()).toEqual(['.voice-collection', 'keep.mp3']);
      expect(readFileSync(resolve(dir, 'keep.mp3'), 'utf8')).toBe('KEEP');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 10000);
});
