import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { freshBase, planGo } from './base/base';
import { FOR_SALE, REPEATS, repeatPrice } from './base/catalog';
import { createPractice, moonSave, SAVE_KEY, SAVE_VERSION, settleGo, type MoonState } from './game';
import { PLACE_KEY } from './nav';
import { needLine, PRICE_TOP, sayable } from './phrases';

function store(initial: MoonState = moonSave.fresh()) {
  let state = initial;
  return {
    get state() { return state; },
    commit(change: (s: MoonState) => MoonState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
  };
}
const solved = (i: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: outcome === 'helped', replay: false });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('moon-base-mail-save'); expect(PLACE_KEY).toBe('moon-base-mail-place'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const s: MoonState = { ...moonSave.fresh(), currency: { balance: 42 }, base: { ...freshBase(), owned: [...freshBase().owned, 'module:greenhouse'], placed: { '1,1': 'home', '0,0': 'module:greenhouse' }, goes: 7 } };
    const back = moonSave.decode(JSON.parse(JSON.stringify(moonSave.encode(s))));
    expect(back.currency.balance).toBe(42);
    expect(back.base.goes).toBe(7);
    expect(back.base.placed['0,0']).toBe('module:greenhouse');
  });
  it('starts fresh from a version it does not know, and drops what it can\'t read', () => {
    expect(moonSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0);
    const odd = moonSave.decode({ version: 1, base: { owned: ['module:nope', 'module:solar'], placed: { '0,0': 'module:nope', '9,9': 'module:solar' }, lander: 'star', landings: -2 } });
    expect(odd.base.owned).not.toContain('module:nope');
    expect(odd.base.lander).toBe('little');
    expect(odd.base.landings).toBe(0);
    // a module he owns that is on no plot (here, one off the edge) goes back on the ship: nothing is lost
    expect(odd.base.pending).toContain('module:solar');
  });
});

describe('a Round', () => {
  it('pays a Bolt for each first-try answer and one for finishing, and earns a Landing; a helped answer pays none', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    const roundId = started.kind === 'accepted' ? started.roundId : '';
    for (let i = 1; i <= 5; i++) practice.solve(roundId, solved(i, i === 2 ? 'helped' : 'clean'), { mode: 'ask', push: true });
    const done = practice.terminal({ roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 2 ? 'helped' : 'clean')) });
    expect(done.kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.base.landings).toBe(2); // the free first one, and this Round's
    expect(s.state.base.rounds).toBe(1);
  });
  it('a Landing is paid once, and only when he has one', () => {
    const s = store(), plan = planGo(s.state.base);
    expect(settleGo(s, plan, { soft: 6, close: 4 })!.bolts).toBe(3);
    expect(settleGo(s, planGo(s.state.base), { soft: 6, close: 4 })).toBeNull();
    expect(s.state.base.goes).toBe(1);
  });
});

describe('prices', () => {
  it('are whole numbers up to 100, then whole tens up to 400, and the voice can say every one', () => {
    for (const i of FOR_SALE) { expect(Number.isInteger(i.price)).toBe(true); expect(i.price <= 100 || i.price % 10 === 0).toBe(true); expect(i.price).toBeLessThanOrEqual(PRICE_TOP); expect(sayable(i.price).exact).toBe(true); }
    for (const r of REPEATS) for (let k = 0; k < 50; k++) { const p = repeatPrice(r.id, k); expect(p <= 100 || p % 10 === 0).toBe(true); }
  });
  it('says a gap that is not a whole ten as "about"', () => {
    expect(needLine(140)).toEqual(['You need', '140', 'more Bolts.']);
    expect(needLine(143)).toEqual(['You need about', '150', 'more Bolts.']);
    expect(needLine(12)).toEqual(['You need', '12', 'more Bolts.']);
  });
});
