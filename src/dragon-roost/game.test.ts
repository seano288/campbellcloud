// The save, the payouts and the currency: a save reads back what was saved and any junk reads as fresh, a Round pays its Flames and a
// Flight, warms the eggs, hatches only when warm, a Flight pays at most 4 and is used only at its end, buying works through the shared
// purchases, and nothing in the game says or shows "Bolt".
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FLAME } from '../currency/kind';
import { createStore, type BackingStore } from '../save/storage';
import { CUR } from './branding';
import { flyWith, resultOf } from './flight/sim';
import { createPractice, earnings, roostSave, SAVE_VERSION, settleFlight, type RoostGame } from './game';
import { freshLearning, MODE_IDS, readLearning, recordSolved } from './learning';
import { PHRASES } from './phrases';
import { EGGS, itemOf } from './roost/catalog';
import {
  bought, earnFlight, freshRoost, hatch, isReady, MOST_FLIGHT_FLAMES, name, nestCount, planFlight, proposePurchase, readRoost, toggleTrick, trickSlots, wear,
} from './roost/roost';

const memory = (): BackingStore => { const m = new Map<string, string>(); return { read: k => m.get(k) ?? null, write: (k, v) => { m.set(k, v); } }; };
const solved = (i: number, outcome: 'clean' | 'missed' = 'clean') => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: false, replay: false });

describe('the save', () => {
  it('reads back what it saved', () => {
    let r = freshRoost();
    r = name(r, 1, ['happy', 'storm'])!;
    r = bought(r, { kind: 'item', id: 'egg:ember' });
    r = earnFlight(r);
    const state: RoostGame = { learning: freshLearning(), currency: { balance: 17 }, roost: r };
    expect(roostSave.decode(JSON.parse(JSON.stringify(roostSave.encode(state))))).toEqual(state);
  });
  it('a version it does not know, or junk, reads as a blank save', () => {
    expect(roostSave.decode({ version: SAVE_VERSION + 1, balance: 50 })).toEqual(roostSave.fresh());
    expect(roostSave.decode(null)).toEqual(roostSave.fresh());
    const junk = readRoost({ owned: ['nope', 'egg:ember', 3], eggs: [{ egg: 'bad' }, { egg: 'egg:ember', warmth: -4 }], dragons: [{ id: 'x' }], worn: { saddle: 'gear:gold' }, flights: 1e9 });
    expect(junk.owned).toContain('egg:ember');
    expect(junk.owned).not.toContain('nope');
    expect(junk.eggs).toEqual([{ egg: 'egg:ember', warmth: 0 }]);
    expect(junk.dragons).toEqual(freshRoost().dragons);
    expect(junk.worn).toEqual({}); // can't wear what he doesn't own
    expect(junk.flights).toBeLessThanOrEqual(99);
    expect(readLearning({ modes: { noun: { level: 9 } }, recent: [1, 'x'] }).recent).toEqual(['x']);
  });
  it('a kind he has earned opens when the save is read', () => {
    const l = freshLearning();
    l.modes.noun = { ...l.modes.noun, level: 2 };
    const read = readLearning(JSON.parse(JSON.stringify(l)));
    expect(read.modes.adj.opened).toBe(true);
    expect(read.modes.plural.opened).toBe(true);
    expect(read.modes.past.opened).toBe(false);
  });
});

describe('a Round', () => {
  it('pays a Flame for each answer right first try and one for finishing, and earns a Flight that warms every egg', async () => {
    const store = createStore({ key: 'dr-test', adapter: roostSave, backing: memory() });
    await store.load();
    store.commit(s => ({ ...s, roost: bought(s.roost, { kind: 'item', id: 'egg:ember' }) }));
    const p = createPractice(store), started = p.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) p.solve(started.roundId, solved(i, i === 2 ? 'missed' : 'clean'), { mode: 'noun', push: true, topic: `t${i}` });
    const done = p.terminal({ roundId: started.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 2 ? 'missed' : 'clean')) });
    expect(done.kind).toBe('accepted');
    const s = store.state.peek();
    expect(s.currency.balance).toBe(5);
    expect(s.roost.flights).toBe(2); // the free first one, and this Round's
    expect(s.roost.eggs[0]!.warmth).toBe(1);
    expect(earnings({ roundId: 'x', status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i)) })).toBe(6);
    expect(s.learning.recent).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });
  it('a Meeting is remembered and counts toward nothing', () => {
    const l = recordSolved(freshLearning(), { meet: 'noun' }, solved(1)).state;
    expect(l.met).toEqual(['noun']);
    expect(l.pushed.noun).toBe(0);
  });
  it('Levels rise by Mastery and never fall, and new kinds open at Level 2', () => {
    let l = freshLearning();
    for (let i = 0; i < 6; i++) l = recordSolved(l, { mode: 'noun', push: true, topic: `n${i}` }, solved(i + 1)).state;
    expect(l.modes.noun.level).toBe(2);
    expect(l.modes.adj.opened && l.modes.plural.opened).toBe(true);
    for (let i = 0; i < 20; i++) l = recordSolved(l, { mode: 'noun', push: true, topic: `m${i}` }, solved(1, 'missed')).state;
    expect(l.modes.noun.level).toBe(2);
    expect(MODE_IDS.filter(m => l.modes[m].opened)).toEqual(['noun', 'verb', 'adj', 'plural']);
  });
});

describe('eggs and dragons', () => {
  it('an egg hatches only when it has been warmed by enough Rounds, and needs a free nest', () => {
    let r = bought(freshRoost(), { kind: 'item', id: 'egg:ember' });
    expect(hatch(r, 0)).toBeNull();
    expect(proposePurchase(r, { kind: 'item', id: 'egg:puddle' }, 100).kind).toBe('rejected'); // one nest, and it's full
    for (let i = 0; i < EGGS[0]!.rounds; i++) r = earnFlight(r);
    expect(isReady(r, r.eggs[0]!)).toBe(true);
    const h = hatch(r, 0)!;
    expect(h.state.dragons).toHaveLength(2);
    expect(h.state.eggs).toHaveLength(0);
    expect(name(h.state, h.dragon.id, ['tiny', 'comet'])!.riding).toBe(h.dragon.id);
    expect(name(h.state, h.dragon.id, ['nope', 'comet'])).toBeNull();
  });
  it('a nest or a ledge makes room for another egg, and the Hot Spring hatches a Round sooner', () => {
    let r = bought(freshRoost(), { kind: 'item', id: 'roost:twig' });
    expect(nestCount(r)).toBe(2);
    r = bought(r, { kind: 'more', id: 'ledge' });
    expect(nestCount(r)).toBe(3);
    r = bought(r, { kind: 'item', id: 'egg:frosty' });
    r = bought(r, { kind: 'item', id: 'roost:spring' });
    for (let i = 0; i < 3; i++) r = earnFlight(r);
    expect(isReady(r, r.eggs[0]!)).toBe(true); // Frosty takes 4, the spring makes it 3
  });
  it('tricks go on buttons up to the belt, gear is worn in its slot', () => {
    let r = freshRoost();
    r = bought(r, { kind: 'item', id: 'trick:hop' });
    expect(r.tricksOn).toEqual(['trick:flap', 'trick:hop']);
    r = bought(r, { kind: 'item', id: 'trick:spin' });
    expect(r.tricksOn).toHaveLength(trickSlots(r));
    r = bought(r, { kind: 'item', id: 'gear:belt' });
    expect(trickSlots(r)).toBe(3);
    r = toggleTrick(r, 'trick:spin')!;
    expect(r.tricksOn).toContain('trick:spin');
    r = bought(r, { kind: 'item', id: 'gear:rope' });
    expect(r.worn.saddle).toBe('gear:rope');
    expect(planFlight(r).fly.climb).toBe((itemOf('gear:rope') as { climb: number }).climb);
    expect(wear(r, 'gear:gold')).toBeNull();
  });
});

describe('a Flight', () => {
  it('pays at most 4 Flames, is used only at its end, and grows the dragon it flew', async () => {
    const store = createStore({ key: 'dr-test2', adapter: roostSave, backing: memory() });
    await store.load();
    const plan = planFlight(store.state.peek().roost), res = resultOf(flyWith(plan.c, 'skilled', plan.fly));
    expect(store.state.peek().roost.flights).toBe(1);
    const pay = settleFlight(store, plan, res)!;
    expect(pay.flames).toBeLessThanOrEqual(MOST_FLIGHT_FLAMES);
    expect(MOST_FLIGHT_FLAMES).toBe(4);
    expect(pay.flames).toBe(res.flames + (res.lit === res.beacons ? 1 : 0));
    const s = store.state.peek();
    expect(s.roost.flights).toBe(0);
    expect(s.roost.flown).toBe(1);
    expect(s.roost.reached).toBe(1);
    expect(s.roost.dragons[0]!.flights).toBe(1);
    expect(settleFlight(store, plan, res)).toBeNull(); // no Flight left to use
  });
  it('a dragon grows to young and great, then earns a mark every few Flights without end', async () => {
    const { stageOf, marksOf } = await import('./roost/dragons');
    expect([0, 2, 3, 7, 8].map(stageOf)).toEqual([0, 0, 1, 1, 2]);
    expect(marksOf(11)).toBe(0);
    expect(marksOf(12)).toBe(1);
    expect(marksOf(4008)).toBe(1000);
  });
});

describe('Flames, never Bolts', () => {
  it('the game pays in Flames', () => {
    expect(CUR).toBe(FLAME);
    expect(FLAME).toEqual({ id: 'flame', one: 'Flame', many: 'Flames' });
  });
  it('nothing the game says, or any of its files, says Bolt', () => {
    expect(PHRASES.filter(p => /\bbolts?\b/i.test(p))).toEqual([]);
    const files: string[] = [];
    const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|css)$/.test(f) && !f.endsWith('.test.ts')) files.push(p); } };
    walk(resolve(import.meta.dirname));
    // the shared rule is still called boltsFor; the word never reaches the screen or the voice
    const said = files.filter(f => readFileSync(f, 'utf8').split('\n').some(l => /\bBolts?\b/.test(l) && !/boltsFor|MAX_BOLTS|\/\/|\*/.test(l)));
    expect(said).toEqual([]);
  });
});
