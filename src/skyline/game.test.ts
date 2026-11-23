// The save, prices, payouts and purchases: what the City keeps, what things cost, what a Round and a Job pay, and that nothing he
// owns is ever taken away.
import { describe, expect, it } from 'vitest';
import { boltsFor } from '../round/rules';
import { createStore, type BackingStore } from '../save/storage';
import { BUILDINGS, DISTRICTS, NAMED_JOBS } from './city/catalog';
import {
  allPlots, canGrow, designsFor, districtsOpen, finishJob, floorPrice, freshCity, JOB_BOLTS, landPrice, MAX_FLOORS, NAMED_BONUS, nextBlock, nextJob, place,
  population, proposePurchase, rankOf, readCity, swap, type CityState,
} from './city/city';
import { skylineSave, SAVE_VERSION, settleJob, createPractice } from './game';
import { MOST_EARNED } from './phrases';

const memoryStorage = (): BackingStore => { const m = new Map<string, string>(); return { read: k => m.get(k) ?? null, write: (k, v) => { m.set(k, v); } }; };
const rich = (s: CityState = freshCity(), done = 200): CityState => ({ ...readCity({ ...s, done }), done });
const buyAll = (s: CityState, keys: string[], balance = 9999) => keys.reduce((c, k) => { const p = proposePurchase(c, { t: 'item', key: k as never }, balance); return p.kind === 'ready' ? p.state : c; }, s);

describe('the save', () => {
  it('a fresh City: one Block with the Bus Depot and a house, and one free Job to see the reward first', () => {
    const s = freshCity();
    expect(s.blocks).toEqual([0]);
    expect(Object.values(s.plots).map(p => p.d).sort()).toEqual(['b:depot', 'b:house']);
    expect(s.jobs).toBe(1);
  });
  it('round-trips, and an unknown version reads as a blank save', () => {
    const s = { learning: skylineSave.fresh().learning, currency: { balance: 42 }, city: buyAll(rich(), ['b:cottage', 'b:glasstower']) };
    const back = skylineSave.decode(JSON.parse(JSON.stringify(skylineSave.encode(s))));
    expect(back.currency.balance).toBe(42);
    expect(back.city).toEqual(s.city);
    expect(skylineSave.decode({ ...(skylineSave.encode(s) as object), version: SAVE_VERSION + 1 }).currency.balance).toBe(0);
  });
  it('reads a broken City as whole: what doesn\'t read is dropped, never more than he had', () => {
    const c = readCity({ owned: ['b:nope', 'b:cottage', 5], blocks: [0, -1, 'x', 3], plots: { '0:0': { d: 'b:stadium', floors: 9 }, '0:1': { d: 'b:cottage' }, '99:0': { d: 'b:cottage' }, 'zz': 1 }, jobs: 9999, done: 'lots', goal: 'b:none', best: { most: -4 } });
    expect(c.owned).toContain('b:cottage');
    expect(c.owned).not.toContain('b:nope');
    expect(c.blocks).toEqual([0, 3]);
    expect(Object.keys(c.plots).every(id => c.blocks.includes(Number(id.split(':')[0])))).toBe(true);
    expect(c.plots['0:0']).toBeUndefined(); // he doesn't own a Stadium, and it doesn't fit a wide plot
    expect(c.jobs).toBe(99);
    expect(c.goal).toBeNull();
    expect(c.best.most).toBe(0);
  });
  it('gives each open District\'s first Block when it reads a save', () => {
    const c = readCity({ done: 30 });
    expect(c.blocks).toEqual([0, 4, 8, 12]);
  });
});

describe('prices', () => {
  it('land gets dearer a little at a time, then stays flat', () => {
    const p = Array.from({ length: 30 }, (_, k) => landPrice(k));
    for (let k = 1; k < 30; k++) expect(p[k]!).toBeGreaterThanOrEqual(p[k - 1]!);
    expect(p[0]).toBeLessThanOrEqual(25);
    expect(p[29]).toBe(p[20]);
  });
  it('a floor gets dearer a little as a tower climbs, then stays flat, up to the top floor', () => {
    for (let f = 1; f < MAX_FLOORS; f++) expect(floorPrice(f + 1)).toBeGreaterThanOrEqual(floorPrice(f));
    expect(floorPrice(MAX_FLOORS - 1)).toBe(floorPrice(20));
    let s = buyAll(rich(), ['b:bricktower']);
    const tower = Object.entries(s.plots).find(([, p]) => p.d === 'b:bricktower')![0];
    while (canGrow(s, tower)) { const p = proposePurchase(s, { t: 'floor', plot: tower }, 9999); expect(p.kind).toBe('ready'); if (p.kind === 'ready') s = p.state; }
    expect(s.plots[tower]!.floors).toBe(MAX_FLOORS);
    expect(proposePurchase(s, { t: 'floor', plot: tower }, 9999)).toEqual({ kind: 'rejected', reason: 'too-tall' });
  });
  it('the next Block is in an open District first, then the city grows east for ever', () => {
    let s = rich(freshCity(), 0);
    expect(nextBlock(s)).toBe(1);
    for (let i = 0; i < 6; i++) { const p = proposePurchase(s, { t: 'land' }, 9999); if (p.kind === 'ready') s = p.state; }
    expect(s.blocks.some(b => b >= 24)).toBe(true);
  });
});

describe('payouts', () => {
  it('a Round pays a Bolt for each answer right first try and one for finishing', () => {
    expect(boltsFor(['clean', 'clean', 'missed', 'clean', 'helped'])).toBe(4);
    expect(boltsFor(['clean', 'clean', 'clean', 'clean', 'clean'])).toBe(6);
  });
  it('a Job pays a few Bolts, a little more the first time he does a named Job; never more than the voice can say', () => {
    const s = freshCity(), job = nextJob(s);
    const first = finishJob(s, job, 12);
    expect(first.pay.bolts).toBe(JOB_BOLTS + NAMED_BONUS);
    expect(finishJob(first.state, { n: 9, kind: 'bus' }, 12).pay.bolts).toBe(JOB_BOLTS);
    expect(JOB_BOLTS + NAMED_BONUS).toBeLessThanOrEqual(MOST_EARNED);
  });
  it('a Job is used only when it is finished, and needs one to use', async () => {
    const store = createStore({ key: 'test', adapter: skylineSave, backing: memoryStorage() });
    await store.load();
    const job = nextJob(store.state.peek().city);
    expect(settleJob(store, job, 10)).not.toBeNull();
    expect(store.state.peek().city.jobs).toBe(0);
    expect(store.state.peek().currency.balance).toBe(JOB_BOLTS + NAMED_BONUS);
    expect(settleJob(store, job, 10)).toBeNull();
  });
  it('a finished Round earns one Job', async () => {
    const store = createStore({ key: 'test2', adapter: skylineSave, backing: memoryStorage() });
    await store.load();
    const practice = createPractice(store), started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) practice.solve(started.roundId, { index: i, outcome: 'clean', misses: 0, helped: false, replay: false }, { mode: 'groups', push: true });
    practice.terminal({ roundId: started.roundId, status: 'completed', results: Array.from({ length: 5 }, (_, i) => ({ index: i + 1, outcome: 'clean' as const, misses: 0, helped: false, replay: false })) });
    expect(store.state.peek().city.jobs).toBe(2);
    expect(store.state.peek().currency.balance).toBe(6);
  });
});

describe('Jobs open Districts', () => {
  it('each District opens after enough Jobs, and its first Block is his at once', () => {
    let s = freshCity();
    for (let i = 0; i < DISTRICTS[5].jobs; i++) s = finishJob({ ...s, jobs: 1 }, nextJob(s), 10).state;
    expect(districtsOpen(s.done)).toBe(6);
    for (const d of DISTRICTS) expect(s.blocks).toContain(d.id * 4);
  });
  it('named Jobs come first, each once, then Jobs made from his city, numbered', () => {
    let s = buyAll(rich(freshCity(), 200), BUILDINGS.map(b => b.key));
    const named = new Set<string>();
    for (let i = 0; i < NAMED_JOBS.length; i++) { const j = nextJob(s); expect('named' in j).toBe(true); if ('named' in j) named.add(j.named.key); s = finishJob({ ...s, jobs: 1 }, j, 10).state; }
    expect(named.size).toBe(NAMED_JOBS.length);
    expect('n' in nextJob(s)).toBe(true);
  });
});

describe('nothing he owns is taken away', () => {
  it('moving, swapping, clearing and placing never change what he owns', () => {
    let s = buyAll(rich(), ['b:cottage', 'b:redhouse', 'b:bricktower', 'b:park', 'b:school']);
    const owned = [...s.owned].sort();
    const small = allPlots(s).filter(p => p.size === 's');
    s = swap(s, small[0]!.id, small[1]!.id) ?? s;
    s = place(s, small[0]!.id, null) ?? s;
    s = place(s, small[2]!.id, designsFor(s, 's')[0]!) ?? s;
    expect([...s.owned].sort()).toEqual(owned);
    // a building he cleared away can stand somewhere else
    expect(designsFor(s, 's')).toContain('b:cottage');
  });
  it('buying a building stands it on a free plot that fits; a design that doesn\'t fit a plot can\'t go there', () => {
    const s = buyAll(rich(), ['b:cottage']);
    expect(Object.values(s.plots).some(p => p.d === 'b:cottage')).toBe(true);
    const wide = allPlots(s).find(p => p.size === 'w')!;
    expect(place(s, wide.id, 'b:cottage')).toBeNull();
  });
  it('can\'t buy what he can\'t afford or already has, or a vehicle before its Job', () => {
    const s = rich();
    expect(proposePurchase(s, { t: 'item', key: 'b:cottage' }, 2)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(s, { t: 'item', key: 'b:house' }, 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(proposePurchase(s, { t: 'item', key: 'v:limo' }, 999)).toEqual({ kind: 'rejected', reason: 'not-for-sale' });
    expect(proposePurchase(buyAll(s, ['b:taxirank']), { t: 'item', key: 'v:limo' }, 999).kind).toBe('ready');
    expect(proposePurchase(rich(freshCity(), 0), { t: 'item', key: 'b:glasstower' }, 999)).toEqual({ kind: 'rejected', reason: 'not-for-sale' });
  });
});

describe('the population and its ranks', () => {
  it('houses and every floor add people; the ranks go on without end', () => {
    const s = freshCity();
    expect(population(s)).toBe(4);
    expect(rankOf(0).name).toBe('Village');
    expect(rankOf(60).name).toBe('Town');
    expect(rankOf(2000).name).toBe('Mega City');
    expect(rankOf(3500)).toMatchObject({ name: 'Super City', n: 1 });
    expect(rankOf(2000 + 1500 * 40)).toMatchObject({ name: 'Super City', n: 40 });
  });
});
