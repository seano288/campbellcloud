import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CLIPS } from '../../voice/voice.gen';
import { explainPay, helpPay, promptPay } from './feedback';
import { createPaymentChallenge } from './payment';
import '../../app/selectedVoice';

const recorded = vi.hoisted(() => {
  const played: string[] = [];
  return { played };
});
vi.mock('../../audio/recorded', () => ({
  recordedAudio: {
    load: async (file: string) => file,
    play(file: string) {
      recorded.played.push(file);
      return { done: Promise.resolve(), stop() {} };
    },
  },
}));

const problem = { price: 110, bank: ['q', 'd', 'n', 'p'] as const };
let lifetime: AbortController;

beforeEach(() => {
  vi.useFakeTimers();
  recorded.played.length = 0;
  lifetime = new AbortController();
});

afterEach(() => {
  lifetime.abort();
  vi.useRealTimers();
});

it('prompts for empty payment, explains short and over amounts, then helps without buying until Pay', async () => {
  const accept = vi.fn(() => true);
  const checkout = createPaymentChallenge(problem, lifetime.signal, accept);
  expect(checkout.actions.submit([])).toBe('not-an-answer');
  await vi.advanceTimersByTimeAsync(0);
  expect(recorded.played).toEqual([CLIPS['Tap some money first!']]);
  recorded.played.length = 0;
  expect(checkout.actions.submit(['q', 'q', 'q', 'q'])).toBe('incorrect');
  expect(checkout.actions.busy).toBe(false);
  await vi.advanceTimersByTimeAsync(3000);
  expect(recorded.played).toEqual([CLIPS['Almost!'], CLIPS['You need'], CLIPS['10 cents'], CLIPS.more]);
  expect(checkout.tray.value).toEqual([]);
  recorded.played.length = 0;
  expect(checkout.actions.submit(['q', 'q', 'q', 'q', 'd', 'd'])).toBe('incorrect');
  await vi.advanceTimersByTimeAsync(3000);
  expect(recorded.played).toEqual([
    CLIPS['Too much!'], CLIPS['Take back'], CLIPS['10 cents'],
    CLIPS['25 cents'], CLIPS['50 cents'], CLIPS['75 cents'], CLIPS['1 dollar'], CLIPS['1 dollar'], CLIPS['10 cents'],
  ]);
  expect(checkout.tray.value).toEqual(['q', 'q', 'q', 'q', 'd']);
  expect(accept).not.toHaveBeenCalled();
  expect(checkout.actions.submit(checkout.tray.value)).toBe('correct');
  expect(accept).toHaveBeenCalledExactlyOnceWith(110);
  expect(checkout.actions.submit(checkout.tray.value)).toBe('ignored');
});

it('manually fills the Level-3 Horn payment largest-first at the existing pace, including the $5 bill', async () => {
  const p = { price: 880, bank: ['b5', 'b1', 'q', 'd', 'n', 'p'] as const };
  const accept = vi.fn(() => true);
  const checkout = createPaymentChallenge(p, lifetime.signal, accept);
  checkout.tray.value = ['p'];
  checkout.actions.help(signal => helpPay(p, signal));
  expect(checkout.tray.value).toEqual(['b5']);
  expect(checkout.actions.busy).toBe(false);
  await vi.advanceTimersByTimeAsync(249);
  expect(checkout.tray.value).toEqual(['b5']);
  await vi.advanceTimersByTimeAsync(1);
  expect(checkout.tray.value).toEqual(['b5', 'b1']);
  await vi.advanceTimersByTimeAsync(3000);
  expect(checkout.tray.value).toEqual(['b5', 'b1', 'b1', 'b1', 'q', 'q', 'q', 'n']);
  expect(recorded.played).toEqual([
    CLIPS['5 dollars'], CLIPS['6 dollars'], CLIPS['7 dollars'], CLIPS['8 dollars'],
    CLIPS['8 dollars'], CLIPS['25 cents'], CLIPS['8 dollars'], CLIPS['50 cents'],
    CLIPS['8 dollars'], CLIPS['75 cents'], CLIPS['8 dollars'], CLIPS['80 cents'],
  ]);
  expect(accept).not.toHaveBeenCalled();
  expect(checkout.actions.submit(checkout.tray.value)).toBe('correct');
  expect(accept).toHaveBeenCalledExactlyOnceWith(880);
});

it('restarts newer help without allowing the old fill to add money', async () => {
  const accept = vi.fn(() => true);
  const checkout = createPaymentChallenge(problem, lifetime.signal, accept);
  checkout.actions.help(signal => helpPay(problem, signal));
  await vi.advanceTimersByTimeAsync(250);
  expect(checkout.tray.value).toEqual(['q', 'q']);
  checkout.actions.help(signal => helpPay(problem, signal));
  expect(checkout.tray.value).toEqual(['q']);
  await vi.advanceTimersByTimeAsync(3000);
  expect(checkout.tray.value).toEqual(['q', 'q', 'q', 'q', 'd']);
  expect(accept).not.toHaveBeenCalled();
});

it('cancels teaching and ignores old controls without changing a fresh challenge', async () => {
  const accept = vi.fn(() => true);
  const old = createPaymentChallenge(problem, lifetime.signal, accept);
  old.actions.help(signal => helpPay(problem, signal));
  await vi.advanceTimersByTimeAsync(250);
  lifetime.abort();
  const interrupted = [...old.tray.value], speech = [...recorded.played];
  lifetime = new AbortController();
  const fresh = createPaymentChallenge(problem, lifetime.signal, accept);
  expect(old.actions.submit(['q', 'q', 'q', 'q', 'd'])).toBe('ignored');
  old.actions.help(signal => helpPay(problem, signal));
  await vi.advanceTimersByTimeAsync(3000);
  expect(old.tray.value).toEqual(interrupted);
  expect(fresh.tray.value).toEqual([]);
  expect(recorded.played).toEqual(speech);
  expect(fresh.actions.submit(['p'])).toBe('incorrect');
  await vi.advanceTimersByTimeAsync(3000);
  expect(fresh.tray.value).toEqual([]);
  expect(accept).not.toHaveBeenCalled();
});

it.each(['throw', 'reject'] as const)('keeps controls usable after explanation and help %s without accepting payment', async failure => {
  const fail = (): Promise<void> => {
    if (failure === 'throw') throw new Error('Teaching failed');
    return Promise.reject(new Error('Teaching failed'));
  };
  const accept = vi.fn(() => true);
  const checkout = createPaymentChallenge(problem, lifetime.signal, accept, { explain: fail, prompt: promptPay });
  expect(checkout.actions.submit(['p'])).toBe('incorrect');
  checkout.actions.help(fail);
  await vi.advanceTimersByTimeAsync(3000);
  expect(checkout.actions.busy).toBe(false);
  expect(checkout.tray.value).toEqual([]);
  expect(accept).not.toHaveBeenCalled();
  checkout.actions.help(signal => helpPay(problem, signal));
  await vi.advanceTimersByTimeAsync(3000);
  expect(checkout.tray.value).toEqual(['q', 'q', 'q', 'q', 'd']);
  expect(checkout.actions.submit(checkout.tray.value)).toBe('correct');
  expect(accept).toHaveBeenCalledExactlyOnceWith(110);
});

it.each(['resolve', 'reject'] as const)('does not resume automatic help after late explanation %s in a cancelled challenge', async outcome => {
  let resolve!: () => void, reject!: (error: Error) => void;
  const pending = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  const accept = vi.fn(() => true);
  const old = createPaymentChallenge(problem, lifetime.signal, accept, {
    prompt: promptPay,
    async explain(p, result, teach, signal) {
      await pending;
      await explainPay(p, result, teach, signal);
    },
  });
  old.actions.submit(['p']);
  old.actions.submit(['p']);
  expect(old.actions.busy).toBe(false);
  lifetime.abort();
  lifetime = new AbortController();
  const fresh = createPaymentChallenge(problem, lifetime.signal, accept);
  if (outcome === 'resolve') resolve();
  else reject(new Error('Late teaching failure'));
  await vi.advanceTimersByTimeAsync(5000);
  expect(old.tray.value).toEqual([]);
  expect(fresh.tray.value).toEqual([]);
  expect(recorded.played).toEqual([]);
  expect(accept).not.toHaveBeenCalled();
  expect(fresh.actions.submit(['q', 'q', 'q', 'q', 'd'])).toBe('correct');
});
