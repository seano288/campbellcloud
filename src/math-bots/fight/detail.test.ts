import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fightClosed, fightForgotten, fightOpened, FIRST_GL, isGL, LADDER, newWatch, openingRung, startingRung, watchFrame, type Verdict } from './detail';

const feed = (ms: number, frames: number, last = false) => {
  const w = newWatch(); let v: Verdict = 'wait';
  for (let i = 0; i < frames && v === 'wait'; i++) v = watchFrame(w, ms, last);
  return v;
};

describe('where a fight starts', () => {
  it('uses the top on a big screen with WebGPU', () => expect(startingRung({ webgpu: true, memoryGB: undefined, shortSide: 820 })).toBe(0));
  it('starts a phone lower', () => expect(LADDER[startingRung({ webgpu: true, memoryGB: undefined, shortSide: 390 })]!.tier).toBe('lite'));
  it('goes straight to WebGL2 without WebGPU', () => expect(isGL(LADDER[startingRung({ webgpu: false, memoryGB: 8, shortSide: 820 })]!)).toBe(true));
  it('takes the WebGL2 path on very little memory', () => expect(startingRung({ webgpu: true, memoryGB: 2, shortSide: 820 })).toBe(FIRST_GL));
});

describe('watching frames', () => {
  it('skips the first frames, where shaders compile', () => expect(feed(500, 12)).toBe('wait'));
  it('keeps a good frame rate', () => expect(feed(16, 200)).toBe('keep'));
  it('steps down when slow', () => expect(feed(50, 200)).toBe('step'));
  it('jumps when crawling, and does not take long to say so', () => expect(feed(400, 20)).toBe('jump'));
  it('gives up only at the bottom, and only when crawling', () => {
    expect(feed(60, 200, true)).toBe('keep');
    expect(feed(400, 200, true)).toBe('give-up');
  });
  it('a single long frame does not count', () => {
    const w = newWatch(); let v: Verdict = 'wait';
    for (let i = 0; i < 200 && v === 'wait'; i++) v = watchFrame(w, i === 20 ? 2000 : 16, false);
    expect(v).toBe('keep');
  });
});

describe('remembering', () => {
  const big = { webgpu: true, memoryGB: undefined, shortSide: 820 };
  beforeEach(() => {
    const kept = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => kept.get(k) ?? null, setItem: (k: string, v: string) => kept.set(k, v), removeItem: (k: string) => kept.delete(k) });
  });
  it('starts from where the last fight settled', () => { fightClosed(3); expect(openingRung(big)).toBe(3); });
  it('earns a rung back after a clean fight, but no higher than the device starts', () => {
    fightClosed(3, true);
    expect(openingRung(big)).toBe(2);
    fightClosed(0, true);
    expect(openingRung(big)).toBe(0);
    fightClosed(2, true);
    expect(openingRung({ ...big, shortSide: 390 })).toBe(2);
  });
  it('goes one lower after a fight the page never came back from', () => { fightOpened(3); expect(openingRung(big)).toBe(4); });
  it('forgets after the plain outcome, so a bad moment does not pin the device', () => {
    fightClosed(LADDER.length - 1);
    fightForgotten();
    expect(openingRung(big)).toBe(0);
  });
});
