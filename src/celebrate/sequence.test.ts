import { afterEach, expect, it, vi } from 'vitest';
import { playMoments } from './sequence';

afterEach(() => vi.useRealTimers());

it('finishes every supplied moment in order without finishing early', async () => {
  vi.useFakeTimers();
  const effects: string[] = [];
  let result: string | undefined;
  const run = playMoments([
    async () => { effects.push('delivery'); await new Promise(resolve => setTimeout(resolve, 100)); },
    async () => { effects.push('milestone'); await new Promise(resolve => setTimeout(resolve, 200)); },
    async () => { effects.push('announcement'); },
  ], new AbortController().signal).then(value => { result = value; });
  expect(effects).toEqual(['delivery']);
  await vi.advanceTimersByTimeAsync(100);
  expect(effects).toEqual(['delivery', 'milestone']);
  expect(result).toBeUndefined();
  await vi.advanceTimersByTimeAsync(200);
  await run;
  expect(effects).toEqual(['delivery', 'milestone', 'announcement']);
  expect(result).toBe('finished');
});

it('cancels pending work promptly and prevents later moments and late effects', async () => {
  const lifetime = new AbortController(), effects: string[] = [];
  let release!: () => void;
  const run = playMoments([
    async signal => {
      signal.addEventListener('abort', () => effects.push('cleaned'), { once: true });
      await new Promise<void>(resolve => { release = resolve; });
      if (!signal.aborted) effects.push('late');
    },
    async () => { effects.push('next'); },
  ], lifetime.signal);
  lifetime.abort();
  expect(await run).toBe('cancelled');
  expect(effects).toEqual(['cleaned']);
  release();
  await Promise.resolve();
  expect(effects).toEqual(['cleaned']);
});

it.each(['throw', 'reject'] as const)('reports a %s as failure and aborts only that run', async failure => {
  const lifetime = new AbortController(), effects: string[] = [];
  const result = await playMoments([
    signal => {
      expect(signal).not.toBe(lifetime.signal);
      signal.addEventListener('abort', () => effects.push('cleaned'), { once: true });
      if (failure === 'throw') throw new Error('broken moment');
      return Promise.reject(new Error('broken moment'));
    },
    async () => { effects.push('unplayed'); },
  ], lifetime.signal);
  expect(result).toBe('failed');
  expect(effects).toEqual(['cleaned']);
  expect(lifetime.signal.aborted).toBe(false);
});

it('does not start a cancelled show or continue after cancellation between moments', async () => {
  const lifetime = new AbortController(), effects: string[] = [];
  const moments = [async () => { effects.push('first'); lifetime.abort(); }, async () => { effects.push('next'); }];
  expect(await playMoments(moments, lifetime.signal)).toBe('cancelled');
  expect(await playMoments(moments, lifetime.signal)).toBe('cancelled');
  expect(effects).toEqual(['first']);
});

it.each(['resolve', 'reject'] as const)('ignores a late %s without cleaning up a newer run', async outcome => {
  const old = new AbortController(), newer = new AbortController(), effects: string[] = [];
  let settle!: () => void;
  const previous = playMoments([async signal => {
    signal.addEventListener('abort', () => effects.push('old cleaned'), { once: true });
    await new Promise<void>((resolve, reject) => { settle = outcome === 'resolve' ? resolve : () => reject(new Error('late')); });
    if (!signal.aborted) effects.push('old effect');
  }], old.signal);
  old.abort();
  expect(await previous).toBe('cancelled');
  let release!: () => void;
  const replacement = playMoments([async signal => {
    signal.addEventListener('abort', () => effects.push('new cleaned'), { once: true });
    effects.push('new active');
    await new Promise<void>(resolve => { release = resolve; });
  }], newer.signal);
  settle();
  await Promise.resolve();
  expect(effects).toEqual(['old cleaned', 'new active']);
  release();
  expect(await replacement).toBe('finished');
});
