import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { createPractice, SAVE_KEY, SAVE_VERSION, settleService, truckSave, type TruckGame } from './game';
import { freshLearning } from './learning';
import { MOST_EARNED, NUMBERS_TO, PHRASES } from './phrases';
import { ALL_PARTS, HELPERS, keyOf, keysIn, partOf, SLOTS, TRUCKS, type PartKey } from './truck/parts';
import { allBought, drive, EARNABLE, finishService, FIRST_SERVICES, fitOwned, FOR_SALE, freshTruck, goalOf, isOpen, newRegular, openSpots, pickSpot, priceOf, proposePurchase, readTruck, setGoal, setupOf, truckKey, type TruckState } from './truck/state';
import { REGULARS, SPOTS } from './truck/world';
import { CLIPS } from './voice.gen';

const store = (state: TruckGame = truckSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: TruckGame) => TruckGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});
const buyAll = (s: TruckState, keys: readonly string[]) => keys.reduce((t, k) => { const p = proposePurchase(t, k as never, 1000); return p.kind === 'ready' ? p.state : t; }, s);

describe('the save', () => {
  it('has its own key and a version', () => { expect(SAVE_KEY).toBe('food-truck-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const truck: TruckState = { ...buyAll(freshTruck(), ['truck:pizza', 'paint:mint', 'helper:robot', 'lights:bulbs']), services: 3, served: 4, stars: 60, best: 9, regulars: ['rosa', 'leo'], spot: 'market', goal: 'mascot:dragon', off: ['helper:robot'] };
    const s: TruckGame = { learning: freshLearning(), currency: { balance: 17 }, truck };
    expect(truckSave.decode(JSON.parse(JSON.stringify(truckSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know', () => expect(truckSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0));
  it('never fits, drives or parks at what he does not own or has not opened, whatever the save says', () => {
    const t = readTruck({ owned: ['paint:red'], trucks: ['taco', 'rocket'], truck: 'popcorn', fit: { paint: 'paint:gold', grill: 'grill:mega' }, regulars: ['rosa', 'nobody'], spot: 'moon', stars: 10, services: 500, off: ['helper:robot'] });
    expect(t.fit).toEqual(freshTruck().fit);
    expect(t.trucks).toEqual(['taco']);
    expect(t.truck).toBe('taco');
    expect(t.regulars).toEqual(['rosa']);
    expect(t.spot).toBe('park');
    expect(t.services).toBe(99);
    expect(t.off).toEqual([]);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Service', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'need', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.truck.services).toBe(FIRST_SERVICES + 1);
  });
  it('a perfect Round pays at most what the voice can say', () => expect(MOST_EARNED).toBe(6));
});

describe('the Truck shop', () => {
  it('has about 150 things to earn: trucks, parts in every slot, helpers, Regulars and Spots', () => {
    expect(TRUCKS).toHaveLength(10);
    expect(SLOTS.map(s => keysIn(s).length)).toEqual([3, 6, 6, 6, 20, 14, 22, 9]);
    expect(HELPERS).toHaveLength(5);
    expect(REGULARS).toHaveLength(40);
    expect(SPOTS).toHaveLength(16);
    const total = EARNABLE.bought + EARNABLE.regulars + EARNABLE.spots;
    expect(total).toBeGreaterThanOrEqual(145);
    expect(total).toBeLessThanOrEqual(160);
    expect(new Set(ALL_PARTS.map(keyOf)).size).toBe(ALL_PARTS.length);
    expect(new Set([...ALL_PARTS.map(p => p.name), ...TRUCKS.map(k => k.name)]).size).toBe(ALL_PARTS.length + TRUCKS.length); // every name is its own clip
  });
  it('prices everything in Bolts the voice can say: at most 100, a free one in every slot, the Taco Truck free', () => {
    for (const k of FOR_SALE) { expect(priceOf(k)).toBeGreaterThan(0); expect(priceOf(k)).toBeLessThanOrEqual(NUMBERS_TO); }
    for (const s of SLOTS) expect(keysIn(s).filter(k => partOf(k).price === 0)).toHaveLength(1);
    expect(TRUCKS.find(k => k.price === 0)!.id).toBe('taco');
    expect(FOR_SALE.reduce((a, k) => a + priceOf(k), 0)).toBeGreaterThan(2000);
  });
  it('a purchase costs its price, fits it (or drives the truck), and can\'t be bought twice or without the Bolts', () => {
    const t = freshTruck();
    expect(proposePurchase(t, 'paint:mint', 2)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    const p = proposePurchase(t, 'paint:mint', 3);
    if (p.kind !== 'ready') throw new Error(p.reason);
    expect(p.cost).toBe(3);
    expect(p.state.fit.paint).toBe('paint:mint');
    expect(proposePurchase(p.state, 'paint:mint', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(proposePurchase(t, 'paint:red', 99)).toEqual({ kind: 'rejected', reason: 'invalid-item' });
    const truck = proposePurchase(t, truckKey('pizza'), 15);
    if (truck.kind !== 'ready') throw new Error(truck.reason);
    expect(truck.state.truck).toBe('pizza');
    expect(drive(truck.state, 'taco')!.truck).toBe('taco');
    expect(drive(t, 'pizza')).toBeNull();
  });
  it('a Helper switches off and on again; a Goal is the cheapest thing left until he picks one', () => {
    const t = buyAll(freshTruck(), ['helper:robot']);
    expect(setupOf(t).helpers.robot).toBe(true);
    const off = fitOwned(t, 'helper:robot' as PartKey)!;
    expect(setupOf(off).helpers.robot).toBe(false);
    expect(setupOf(fitOwned(off, 'helper:robot' as PartKey)!).helpers.robot).toBe(true);
    expect(goalOf(freshTruck())).toBe('paint:yellow');
    expect(goalOf(setGoal(freshTruck(), 'truck:popcorn')!)).toBe('truck:popcorn');
    expect(allBought(buyAll(freshTruck(), FOR_SALE))).toBe(true);
  });
  it('parts change the Service: the Grill cooks more at once, the Awning lets more wait, the Speaker brings them faster', () => {
    const base = setupOf(freshTruck());
    expect(base).toMatchObject({ grills: 1, line: 2, gap: 7 });
    const all = setupOf(buyAll(freshTruck(), ['grill:big', 'grill:mega', 'awning:rainbow', 'speaker:mega']));
    expect(all.grills).toBe(3);
    expect(all.line).toBe(4);
    expect(all.gap).toBeLessThan(base.gap);
    // dearer speakers are never slower
    const gaps = keysIn('speaker').map(k => partOf(k).power!);
    gaps.forEach((g, i) => { if (i) expect(g).toBeLessThanOrEqual(gaps[i - 1]!); });
  });
});

describe('Services, Spots and Regulars', () => {
  it('a Service pays a star for everyone fed, never Bolts, and meets a Regular', () => {
    const s = store();
    const pay = settleService(s, 6, 'rosa');
    expect(pay).toMatchObject({ fed: 6, regular: 'rosa', opened: ['beach'] });
    expect(s.state.truck).toMatchObject({ stars: 6, services: 0, served: 1, regulars: ['rosa'] });
    expect(s.state.currency.balance).toBe(0);
    expect(settleService(s, 3, null)).toBeNull(); // no Service left to use
  });
  it('the first Service is free, and the new Regular is the next one for the truck he drives', () => {
    expect(freshTruck().services).toBe(1);
    expect(newRegular(freshTruck(), 'taco')!.id).toBe('rosa');
    expect(newRegular({ regulars: REGULARS.filter(r => r.truck === 'taco').map(r => r.id) }, 'taco')).toBeNull();
    expect(setupOf(freshTruck()).regular!.truck).toBe('taco');
  });
  it('Spots open with stars, and the night ones need Lights too', () => {
    const t = { ...freshTruck(), stars: 60 };
    expect(openSpots(t).map(p => p.id)).not.toContain('market');
    const lit = buyAll(t, ['lights:bulbs']);
    expect(openSpots(lit).map(p => p.id)).toContain('market');
    expect(pickSpot(t, 'moon')).toBeNull();
    expect(isOpen(freshTruck(), SPOTS[0]!)).toBe(true);
    // the stars needed only ever go up
    SPOTS.forEach((p, i) => { if (i) expect(p.stars).toBeGreaterThan(SPOTS[i - 1]!.stars); });
    expect(finishService({ ...freshTruck(), stars: 2 }, 3, null)!.pay.opened).toEqual(['beach']);
  });
  it('every Regular has a name of their own and a favourite order from their own truck\'s toppings', () => {
    expect(new Set(REGULARS.map(r => r.name)).size).toBe(REGULARS.length);
    expect(new Set(REGULARS.map(r => r.id)).size).toBe(REGULARS.length);
    for (const r of REGULARS) {
      const k = TRUCKS.find(x => x.id === r.truck)!;
      expect(r.fav.length).toBeGreaterThanOrEqual(1);
      expect(new Set(r.fav).size).toBe(r.fav.length);
      for (const f of r.fav) expect(k.toppings.map(x => x.id), `${r.name}: ${f}`).toContain(f);
    }
    for (const k of TRUCKS) expect(REGULARS.filter(r => r.truck === k.id)).toHaveLength(4);
  });
});

describe('the voice', () => {
  it('has a clip for every phrase, and numbers up to 100 for prices', () => {
    for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy();
    for (const k of FOR_SALE) expect(PHRASES).toContain(String(priceOf(k)));
    for (let n = 0; n <= 20; n++) expect(PHRASES).toContain(String(n));
  });
});
