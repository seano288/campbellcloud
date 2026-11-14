import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { bestPath, decodeBlocks, encodeBlocks, expand, reaches, runProgram, runsOf, turnsOf, type Dir, type Grid } from './grid';
import { fixesAt, makeBug, makeDrive, makeLoop, makePattern, MAX_SLOTS, type Level } from './problems';

const LEVELS: Level[] = [1, 2, 3], STRETCHES: Stretch[] = [0, 1, 2], SEEDS = 60;
const each = (f: (level: Level, stretch: Stretch, seed: number) => void) => { for (const l of LEVELS) for (const s of STRETCHES) for (let seed = 1; seed <= SEEDS; seed++) f(l, s, seed); };

describe('running a program', () => {
  const g: Grid = { w: 4, h: 3, start: { x: 0, y: 1 }, goal: { x: 2, y: 1 }, rocks: [{ x: 1, y: 0 }] };
  it('ends on the flag', () => expect(runProgram(g, ['R', 'R']).end).toEqual({ kind: 'goal' }));
  it('stops at the edge, on the step that would leave the map', () => expect(runProgram(g, ['U', 'U']).end).toEqual({ kind: 'off', step: 1, at: { x: 0, y: -1 } }));
  it('says which step bumped', () => {
    const run = runProgram(g, ['D', 'R', 'U', 'U', 'R']);
    expect(run.end).toMatchObject({ kind: 'bump', step: 3 });
    expect(run.cells.at(-1)).toEqual({ x: 1, y: 1 });
  });
  it('tells driving past the flag from stopping short', () => {
    expect(runProgram(g, ['R', 'R', 'R']).end).toEqual({ kind: 'past', step: 2 });
    expect(runProgram(g, ['R']).end).toEqual({ kind: 'short' });
  });
  it('counts any way across as right', () => expect(reaches(g, ['D', 'R', 'R', 'U'])).toBe(true));
  it('finds the shortest way with the fewest turns', () => {
    const open: Grid = { w: 5, h: 5, start: { x: 0, y: 4 }, goal: { x: 3, y: 1 }, rocks: [] };
    const path = bestPath(open)!;
    expect(path).toHaveLength(6);
    expect(turnsOf(path)).toBe(1);
  });
  it('reads and writes loops', () => {
    expect(decodeBlocks('R3,U2')).toEqual([{ steps: ['R'], times: 3 }, { steps: ['U'], times: 2 }]);
    expect(expand(decodeBlocks('RU2')!)).toEqual(['R', 'U', 'R', 'U']);
    expect(decodeBlocks('X3')).toBeNull();
    expect(encodeBlocks(runsOf(['R', 'R', 'R', 'U', 'U'] as Dir[]))).toBe('R3,U2');
  });
});

describe('Drive It', () => {
  it('always has a way across, as long and as turning as its Level says, that fits the program bar', () => each((level, stretch, seed) => {
    const q = makeDrive(level, stretch, seeded(seed));
    expect(reaches(q.grid, q.path)).toBe(true);
    expect(bestPath(q.grid)!.length).toBe(q.path.length);
    expect(q.slots).toBeGreaterThan(q.path.length);
    expect(q.slots).toBeLessThanOrEqual(MAX_SLOTS);
    const turns = turnsOf(q.path);
    if (level === 1) expect(turns).toBe(0);
    if (level === 2) expect(turns).toBe(1);
    if (level === 3) expect(turns).toBeGreaterThanOrEqual(2);
  }));
  it('grows inside a Level as Stretch grows', () => {
    const mean = (l: Level, s: Stretch) => Array.from({ length: SEEDS }, (_, i) => makeDrive(l, s, seeded(i + 1)).path.length).reduce((a, b) => a + b) / SEEDS;
    for (const l of LEVELS) expect(mean(l, 2)).toBeGreaterThan(mean(l, 0));
  });
});

describe('Bug Hunt', () => {
  it('has exactly one wrong step, and fixing it reaches the flag', () => each((level, stretch, seed) => {
    const q = makeBug(level, stretch, seeded(seed));
    expect(reaches(q.grid, q.program)).toBe(false);
    const fixable = q.program.map((_, i) => fixesAt(q.grid, q.program, i).length > 0);
    expect(fixable.filter(Boolean)).toHaveLength(1);
    expect(fixable[q.bug]).toBe(true);
    expect(fixesAt(q.grid, q.program, q.bug)).toEqual([q.path[q.bug]]);
    expect(q.preview).toBe(level < 3);
    expect(q.choose).toBe(level > 1);
  }));
});

describe('Patterns', () => {
  it('repeats its unit, and the gap holds what the unit says, among three different choices', () => each((level, stretch, seed) => {
    const q = makePattern(level, stretch, seeded(seed));
    const gap = q.items.indexOf(null), unit = q.items.slice(0, q.unit);
    expect(q.items.filter(t => t === null)).toHaveLength(1);
    expect(gap).toBeGreaterThanOrEqual(q.unit); // a whole unit shows before the gap
    q.items.forEach((t, i) => { if (t !== null) expect(t).toBe(unit[i % q.unit]); });
    expect(q.answer).toBe(unit[gap % q.unit]);
    expect(new Set(q.choices).size).toBe(3);
    expect(q.choices).toContain(q.answer);
    if (level === 1) expect(q.unit).toBe(2);
    expect(q.form === 'missing').toBe(level > 1 && stretch === 2);
  }));
  it('uses arrows turning like a clock hand at Level 3', () => {
    const q = makePattern(3, 0, seeded(3));
    expect(q.items.slice(0, 4).every(t => t !== null && t.length === 1)).toBe(true);
  });
});

describe('Loops', () => {
  it('has a loop program that reaches the flag, with what he fills left blank', () => each((level, stretch, seed) => {
    const q = makeLoop(level, stretch, seeded(seed));
    expect(reaches(q.grid, expand(q.blocks))).toBe(true);
    if (q.form === 'pick') {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options.filter(o => reaches(q.grid, expand(o)))).toHaveLength(1);
    } else {
      expect(q.given.some(g => g.times === null)).toBe(true);
      q.given.forEach((g, i) => { if (g.dir) expect(g.dir).toBe(q.blocks[i]!.steps[0]); if (g.times) expect(g.times).toBe(q.blocks[i]!.times); });
      q.blocks.forEach(b => { expect(b.times).toBeGreaterThanOrEqual(2); expect(b.times).toBeLessThanOrEqual(6); });
    }
    expect(q.form).toBe(level === 1 ? 'count' : level === 2 ? 'build' : 'pick');
  }));
  it('repeats a pair of steps for a staircase, and only that order gets past the rock', () => {
    const q = makeLoop(3, 2, seeded(5));
    expect(q.blocks).toHaveLength(1);
    expect(q.blocks[0]!.steps).toHaveLength(2);
    const [a, b] = q.blocks[0]!.steps as [Dir, Dir];
    expect(reaches(q.grid, expand([{ steps: [b, a], times: q.blocks[0]!.times }]))).toBe(false);
  });
});
