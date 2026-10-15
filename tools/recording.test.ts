import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { paymentVoice } from '../src/modes/pay/voice';

const root = resolve(import.meta.dirname, '..');
const run = (args: string[]) => spawnSync('python3', ['tools/make_voice.py', ...args], { cwd: root, encoding: 'utf8' });

describe('selected phrase recording', () => {
  it('exports checkout money-inspection recordings without selecting the money curriculum', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'inspection-recording-'));
    try {
      for (const file of ['7b6e7a1a8c7f.mp3', '2a8aebbda640.mp3', 'fa9aaca7ecc1.mp3', 'ee89b09f4825.mp3', '2b1085709dad.mp3', 'd39d60469925.mp3']) {
        writeFileSync(resolve(dir, file), 'EXISTING_SHARED_RECORDING');
      }
      const index = resolve(dir, 'inspection.ts');
      const result = run(['--collection', 'inspection', '--out', dir, '--index', index, '--index-only']);
      expect(result.status, result.stderr).toBe(0);
      const mapping = readFileSync(index, 'utf8');
      expect(mapping).toContain('"Penny is 1¢."');
      expect(mapping).toContain('"$5 Bill is $5."');
      expect(mapping).not.toMatch(/Garage|What is this called|Buy the|Trophies/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 10000);

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
