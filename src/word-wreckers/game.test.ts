import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { createPractice, SAVE_KEY, SAVE_VERSION, settleJob, wreckersSave, type WreckersGame } from './game';
import { freshLearning } from './learning';
import { NUMBERS_TO, PHRASES } from './phrases';
import { BUILDINGS, DECOS, DRIVERS, item, ITEMS, LOTS_PER_STREET, MACHINES, PAINTS, STREETS, UPGRADES, ALL_KEYS, type ItemKey } from './yard/shop';
import {
  buildTier, finishJob, freeLots, freshYard, goalOf, JOB_BOLTS, lotsOf, maxPower, nextJob, powerOf, proposePurchase, readYard, TOWN_TOTAL, type YardState,
} from './yard/yard';

const store = (state: WreckersGame = wreckersSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: WreckersGame) => WreckersGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});
const owning = (keys: readonly ItemKey[], s: YardState = freshYard()): YardState => ({ ...s, owned: [...new Set([...s.owned, ...keys])] });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('word-wreckers-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const yard: YardState = { ...owning(['machine:dozer', 'paint:red', 'up:crane:bigball', 'driver:puppy', 'street:park']), machine: 'dozer', paints: { dozer: 'red' }, driver: 'puppy', goal: 'machine:digger', jobs: 2, done: 3, town: [{ b: 'house', gold: false }, { b: 'barn', gold: true }] };
    const s: WreckersGame = { learning: { ...freshLearning(), patterns: ['cvc'], strength: { cvc: 2 }, sinceMeet: 4 }, currency: { balance: 17 }, yard };
    expect(wreckersSave.decode(JSON.parse(JSON.stringify(wreckersSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know, with one free Job', () => {
    const d = wreckersSave.decode({ version: 99, balance: 5, yard: { jobs: 9 } });
    expect(d.currency.balance).toBe(0);
    expect(d.yard).toEqual(freshYard());
    expect(freshYard().jobs).toBe(1);
  });
  it('never fits what he does not own, and never has more buildings than lots', () => {
    const y = readYard({ owned: [], machine: 'giant', paints: { crane: 'gold' }, driver: 'unicorn', town: Array.from({ length: 9 }, (_, i) => ({ b: BUILDINGS[i]!.id })) });
    expect(y.machine).toBe('crane');
    expect(y.paints).toEqual({});
    expect(y.driver).toBe('worker');
    expect(y.town).toHaveLength(LOTS_PER_STREET);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Job', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'build', push: true, pattern: 'cvc' });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.yard.jobs).toBe(freshYard().jobs + 1);
  });
});

describe('what Bolts buy', () => {
  it('keeps every price at or under 100, the most the voice says, and says every name and number', () => {
    for (const k of ALL_KEYS) expect(item(k).price, k).toBeLessThanOrEqual(NUMBERS_TO);
    for (const k of ALL_KEYS) expect(PHRASES as readonly string[]).toContain(item(k).name);
    for (const b of BUILDINGS) expect(PHRASES as readonly string[]).toContain(b.name);
    for (let n = 0; n <= NUMBERS_TO; n++) expect(PHRASES as readonly string[]).toContain(`${n}`);
  });
  it('is a long ladder: 10 machines, 26 upgrades, 24 paints, 13 drivers, 6 streets, 30 decorations and 36 buildings', () => {
    // he bought everything in Rover Code within a day, so this starts big (and every table is a plain list, to grow later)
    expect(MACHINES).toHaveLength(10);
    expect(UPGRADES).toHaveLength(26);
    for (const m of MACHINES) expect(UPGRADES.filter(u => u.machine === m.id).length, m.id).toBeGreaterThanOrEqual(2);
    expect(PAINTS).toHaveLength(24);
    expect(DRIVERS).toHaveLength(13);
    expect(STREETS).toHaveLength(6);
    expect(DECOS).toHaveLength(30);
    expect(BUILDINGS).toHaveLength(36);
    expect(TOWN_TOTAL).toBe(BUILDINGS.length);
    const total = ITEMS.reduce((s, i) => s + i.price, 0);
    expect(total).toBeGreaterThan(3000);
    expect(new Set(ITEMS.map(i => i.name)).size).toBeLessThan(ITEMS.length + 1);
  });
  it('buys a machine and drives it, an upgrade only once the machine is his, and says no without enough Bolts or twice', () => {
    const b = proposePurchase(freshYard(), 'machine:dozer', 20);
    if (b.kind !== 'ready') throw new Error(b.reason);
    expect(b.cost).toBe(15);
    expect(b.state.machine).toBe('dozer');
    expect(proposePurchase(freshYard(), 'up:dozer:wide', 99)).toEqual({ kind: 'rejected', reason: 'needs-machine' });
    expect(proposePurchase(freshYard(), 'machine:dozer', 14)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(b.state, 'machine:dozer', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    const p = proposePurchase(b.state, 'paint:red', 9);
    if (p.kind !== 'ready') throw new Error(p.reason);
    expect(p.state.paints.dozer).toBe('red');
  });
  it('raises a machine\'s power with its power upgrades, up to steel', () => {
    expect(powerOf(freshYard(), 'crane')).toBe(1);
    expect(powerOf(owning(['up:crane:bigball', 'up:crane:steelball', 'up:crane:spiky']), 'crane')).toBe(4);
    expect(maxPower(owning(['machine:dozer']))).toBe(2);
    expect(buildTier(owning(['machine:giant']))).toBe(3); // the tallest need the Tower Crane
    expect(buildTier(owning(['machine:giant', 'machine:tower']))).toBe(4);
  });
  it('saves first for what opens a stronger Job, and for the next street when his Town is full', () => {
    const tier1Done = { ...freshYard(), town: BUILDINGS.filter(b => b.tier === 1).slice(0, 6).map(b => ({ b: b.id, gold: false })) };
    expect(goalOf(tier1Done)).toBe('street:park');
    expect(goalOf(owning(['street:park'], tier1Done))).toBe('up:crane:bigball');
  });
});

describe('Jobs and the Town', () => {
  it('only ever offers a Job his machines can do, and buildings he can put up', () => {
    let s = freshYard();
    const order: ItemKey[] = ['machine:dozer', 'up:crane:bigball', 'street:park', 'machine:giant', 'street:river', 'machine:tower', 'street:hill', 'street:harbor', 'street:rocket'];
    for (let step = 0; step < 80; step++) {
      if (step % 8 === 4 && order.length) s = owning([order.shift()!], s);
      const job = nextJob(s);
      expect(job.tier).toBeLessThanOrEqual(maxPower(s));
      expect(job.choices.length).toBeGreaterThanOrEqual(1);
      expect(job.choices.length).toBeLessThanOrEqual(3);
      for (const c of job.choices) {
        if (c.kind === 'new') { expect(BUILDINGS.find(b => b.id === c.b)!.tier).toBeLessThanOrEqual(buildTier(s)); expect(s.town.some(l => l.b === c.b)).toBe(false); expect(freeLots(s)).toBeGreaterThan(0); }
        if (c.kind === 'gold') { expect(freeLots(s)).toBe(0); expect(s.town.find(l => l.b === c.b)?.gold).toBe(false); }
      }
      const done = finishJob({ ...s, jobs: 1 }, job.choices[0]!);
      expect(done).not.toBeNull();
      s = { ...done!, jobs: 0 };
      expect(s.town.length).toBeLessThanOrEqual(lotsOf(s));
    }
    expect(s.town).toHaveLength(TOWN_TOTAL);
    expect(new Set(s.town.map(l => l.b)).size).toBe(TOWN_TOTAL);
  });
  it('makes one of his buildings gold when there is no empty lot, so a Job always adds something', () => {
    const full = { ...freshYard(), town: BUILDINGS.slice(0, 6).map(b => ({ b: b.id, gold: false })) };
    const job = nextJob(full);
    expect(job.choices.every(c => c.kind === 'gold')).toBe(true);
    expect(finishJob(full, job.choices[0]!)!.town.filter(l => l.gold)).toHaveLength(1);
  });
  it('is used, and pays its Bolts, only when the building is up', () => {
    const s = store();
    expect(settleJob(s, { kind: 'new', b: 'house' })).toBe(true);
    expect(s.state.yard.jobs).toBe(0);
    expect(s.state.yard.town).toEqual([{ b: 'house', gold: false }]);
    expect(s.state.currency.balance).toBe(JOB_BOLTS);
    expect(settleJob(s, { kind: 'new', b: 'barn' })).toBe(false); // no Job left: nothing happens
  });
  it('starts with a wooden shed for the free crane, and tier 1 buildings to put up', () => {
    const job = nextJob(freshYard());
    expect(job.tier).toBe(1);
    expect(job.choices.map(c => BUILDINGS.find(b => b.id === c.b)!.tier)).toEqual([1, 1, 1]);
  });
});
