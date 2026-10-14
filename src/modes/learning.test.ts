import { describe, expect, it, vi } from 'vitest';
import { recordSolved } from './learning';
import { acknowledgeIntro, freshLearning, readLearning, selectPractice } from './state';
import { countSession, learnSession, paySession } from './session';
import { SHOP_ITEMS } from './pay/pay';

const clean = { index: 1, outcome: 'clean', misses: 0, helped: false, replay: false } as const;

it('captures generation Level while checking and early help use current learning without recording or explaining', async () => {
  let state = freshLearning();
  const explain = vi.fn(async () => {});
  const session = learnSession(1, () => state.modes.learn, explain);
  const problem = { kind: 'find', target: 'd', options: ['d', 'p'] } as const;
  const wrong = session.check({ ...problem, options: [...problem.options] }, 'p');
  expect(wrong.kind).toBe('incorrect');
  expect(explain).not.toHaveBeenCalled();
  expect(session.check({ ...problem, options: [...problem.options] }, 'd')).toEqual({ kind: 'correct' });
  expect(state).toEqual(freshLearning());
  expect(session.needsEarlyHelp()).toBe(false);
  state = { ...state, modes: { ...state.modes, learn: { ...state.modes.learn, level: 3, window: ['missed', 'missed', 'missed', 'missed', 'missed'] } } };
  expect(session.needsEarlyHelp()).toBe(true);
  for (let i = 0; i < 30; i++) {
    const generated = session.makeProblem(() => 0.4);
    expect(['p', 'n', 'd']).toContain(generated.target);
  }
  if (wrong.kind !== 'incorrect') throw new Error('Expected incorrect verdict');
  const signal = new AbortController().signal;
  await wrong.explain(true, signal);
  expect(explain).toHaveBeenCalledWith({ ...problem, options: [...problem.options] }, 'p', true, signal);
});

it('treats an empty Pay tray as a prompt, not a miss, and defers wrong-payment teaching', async () => {
  const state = freshLearning();
  const explain = vi.fn(async () => {}), prompt = vi.fn(async () => {});
  const session = paySession(1, () => state.modes.pay, explain, prompt);
  const problem = { item: SHOP_ITEMS[0], price: 15, bank: ['d', 'n', 'p'] } as const;
  const empty = session.check(problem, []);
  expect(empty.kind).toBe('not-an-answer');
  expect(prompt).not.toHaveBeenCalled();
  expect(explain).not.toHaveBeenCalled();
  expect(session.check(problem, ['d', 'n'])).toEqual({ kind: 'correct' });
  const short = session.check(problem, ['d']);
  expect(short.kind).toBe('incorrect');
  if (short.kind !== 'incorrect') throw new Error('Expected incorrect verdict');
  const signal = new AbortController().signal;
  await short.explain(false, signal);
  expect(explain).toHaveBeenCalledWith({ kind: 'short', by: 5 }, false, signal);
  expect(state).toEqual(freshLearning());
  expect(session.replay(problem, () => 0.5)).toEqual(problem);
});

it('checks Count totals and replays the same pile with fresh choices', () => {
  const state = freshLearning(), explain = vi.fn(async () => {});
  const session = countSession(1, () => state.modes.count, explain);
  const problem = { pile: ['d', 'n'], total: 15, choices: [10, 15, 20, 25] } as const;
  const p = { ...problem, pile: [...problem.pile], choices: [...problem.choices] };
  expect(session.check(p, 15)).toEqual({ kind: 'correct' });
  expect(session.check(p, 10).kind).toBe('incorrect');
  expect(explain).not.toHaveBeenCalled();
  const replay = session.replay(p, () => 0);
  expect(replay.pile).toEqual(['d', 'n']);
  expect(replay.total).toBe(15);
  expect(replay.choices).not.toEqual(p.choices);
  expect(p.choices).toEqual([10, 15, 20, 25]);
});

it('recovers learning fields independently and retains pending introductions until acknowledged', () => {
  const raw = { modes: { learn: { level: 9, window: ['bad', ...Array(12).fill('missed')], opened: false }, count: { level: 2, introPending: true, fresh: true, opened: true } }, lastMode: 'count' };
  const state = readLearning(raw);
  expect(state.modes.learn).toEqual({ level: 1, window: Array(10).fill('missed'), opened: false, starred: false, introPending: false, fresh: false });
  expect(state.modes.count).toEqual({ level: 2, window: [], opened: true, starred: false, introPending: true, fresh: true });
  expect(state.modes.pay).toEqual(freshLearning().modes.pay);
  const selected = selectPractice(state, 'count');
  expect(selected.lastMode).toBe('count');
  expect(selected.modes.count.fresh).toBe(false);
  expect(selected.modes.count.introPending).toBe(true);
  expect(acknowledgeIntro(selected, 'count').modes.count.introPending).toBe(false);
  expect(state.modes.count.introPending).toBe(true);
  expect(readLearning(null)).toEqual(freshLearning());
});

describe('money progression', () => {
  it.each(['learn', 'count', 'pay'] as const)('keeps %s Levels monotonic, grants its star once and keeps helped results out of Mastery', id => {
    let state = freshLearning();
    const changes = [];
    for (let i = 0; i < 24; i++) {
      const next = recordSolved(state, id, { ...clean, index: i + 1 });
      state = next.state;
      changes.push(...next.changes);
    }
    expect(changes.filter(c => c.kind === 'levelUp')).toEqual([{ kind: 'levelUp', mode: id, level: 2 }, { kind: 'levelUp', mode: id, level: 3 }]);
    expect(changes.filter(c => c.kind === 'star')).toEqual([{ kind: 'star', mode: id }]);
    for (let i = 0; i < 12; i++) state = recordSolved(state, id, { ...clean, outcome: 'missed', misses: 1 }).state;
    expect(state.modes[id]).toMatchObject({ level: 3, starred: true, window: Array(10).fill('missed') });
    const helped = recordSolved(state, id, { ...clean, outcome: 'helped', helped: true });
    expect(helped.changes).toEqual([]);
    expect(helped.state.modes[id].window).toEqual([...Array(9).fill('missed'), 'helped']);
  });
  it('advances after eight clean results, clears the window and opens the next practice', () => {
    const initial = freshLearning();
    let state = initial;
    const changes = [];
    for (let i = 0; i < 8; i++) {
      const next = recordSolved(state, 'learn', clean);
      state = next.state;
      changes.push(...next.changes);
    }
    expect(state.modes.learn).toEqual({ level: 2, window: [], opened: true, starred: false, introPending: true, fresh: false });
    expect(state.modes.count).toEqual({ level: 1, window: [], opened: true, starred: false, introPending: false, fresh: true });
    expect(state.modes.pay.opened).toBe(false);
    expect(changes).toEqual([{ kind: 'levelUp', mode: 'learn', level: 2 }, { kind: 'open', mode: 'count' }]);
    expect(initial.modes.learn.level).toBe(1);
    expect(initial.modes.count.opened).toBe(false);
  });
});
