import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { SolvedProblem } from '../learning/session';
import { MAX_BOLTS } from '../round/rules';
import { coasterSave, createPractice, SAVE_KEY, SAVE_VERSION, settleRide, type CoasterState } from './game';
import { PLACE_KEY } from './nav';
import { MOST_EARNED, needLine, PHRASES, PRICE_TOP, sayable } from './phrases';
import { CLIPS } from './voice.gen';
import { CUR } from './branding';
import { TOKEN } from '../currency/kind';
import { bought, finishRide, freshYard, MOST_RIDE_TOKENS, planRide } from './park/yard';
import { FOR_SALE, ITEM_NAMES } from './park/catalog';

function store(initial: CoasterState = coasterSave.fresh()) {
  let state = initial;
  return {
    get state() { return state; },
    commit(change: (s: CoasterState) => CoasterState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
  };
}
const solved = (i: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: false, replay: false });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('coaster-crew-save'); expect(PLACE_KEY).toBe('coaster-crew-place'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    let yard = bought(bought({ ...freshYard(), owned: [...freshYard().owned, 'pc:loop', 'pc:lift5', 'pc:drop5'] }, { kind: 'item', id: 'rk:ferris' }), { kind: 'more', id: 'coaster' });
    yard = { ...yard, coasters: [{ pieces: ['pc:lift5', 'pc:drop5', 'pc:loop'], best: 88 }, { pieces: [], best: 0 }], guest: 9, riders: 120, prizes: ['pc:gold-loop'], guestPaints: 0, trophies: ['first', 'loop'] };
    const s = { ...coasterSave.fresh(), currency: { balance: 42 }, yard };
    const back = coasterSave.decode(JSON.parse(JSON.stringify(coasterSave.encode(s))));
    expect(back).toEqual(s);
  });
  it('starts fresh from a version it does not know, or from nonsense', () => {
    expect(coasterSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0);
    expect(coasterSave.decode('nope')).toEqual(coasterSave.fresh());
  });
});

describe('a Round and a Ride', () => {
  it('pays a Token for each clean answer and one for finishing, and earns a Ride', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) practice.solve(started.roundId, solved(i, i === 3 ? 'missed' : 'clean'), { mode: 'push', push: true });
    practice.terminal({ roundId: started.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 3 ? 'missed' : 'clean')) });
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.yard.rides).toBe(2); // the free first one, and this Round's
  });
  it('settling a Ride pays Tokens and uses it; with no Ride left it does nothing', () => {
    const s = store(), plan = planRide(s.state.yard, 'guest')!;
    expect(settleRide(s, plan, { photo: true, stars: 2, starsOf: 2 })?.tokens).toBe(4);
    expect(s.state.currency.balance).toBe(4);
    expect(s.state.yard.rides).toBe(0);
    expect(settleRide(s, plan, { photo: true, stars: 2, starsOf: 2 })).toBeNull();
    void finishRide;
  });
  it('a Round and its Ride pay at most 10, and every "You earned" line it can say is recorded', () => {
    expect(MAX_BOLTS + MOST_RIDE_TOKENS).toBe(10);
    expect(MOST_EARNED).toBeGreaterThanOrEqual(MAX_BOLTS);
  });
});

describe('the currency is Tokens, never Bolts', () => {
  it('is the Token kind', () => { expect(CUR).toBe(TOKEN); expect(TOKEN).toMatchObject({ one: 'Token', many: 'Tokens' }); });
  it('nothing the game says or shows says Bolt', () => {
    for (const p of PHRASES) expect(p).not.toMatch(/\bbolts?\b/i);
    const files: string[] = [];
    const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx|css)$/.test(f)) files.push(p); } };
    walk(import.meta.dirname);
    for (const f of files) for (const line of readFileSync(f, 'utf8').split('\n')) if (!/^\s*(\/\/|\/\*|\*)/.test(line)) expect(line, f).not.toMatch(/\bBolts?\b/);
  });
  it('says prices to 100 in ones and in whole tens to 400, and the need line in Tokens', () => {
    expect(sayable(140)).toEqual({ said: '140', exact: true });
    expect(sayable(143)).toEqual({ said: '150', exact: false });
    expect(needLine(1)).toEqual(['You need', '1', 'more Token.']);
    expect(needLine(12)).toEqual(['You need', '12', 'more Tokens.']);
    expect(needLine(143)).toEqual(['You need about', '150', 'more Tokens.']);
    for (const i of FOR_SALE) expect(i.price).toBeLessThanOrEqual(PRICE_TOP);
  });
});

describe('the voice', () => {
  it('has a clip for every phrase, and every name is a phrase', () => {
    for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy();
    for (const n of ITEM_NAMES) expect(PHRASES).toContain(n);
    expect(PHRASES).toContain('You earned 1 Token!');
    expect(PHRASES).toContain('You earned 5 Tokens!');
  });
});
