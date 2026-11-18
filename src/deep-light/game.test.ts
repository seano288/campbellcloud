// The save, the Round's pay, the Dock's prices and what there is to earn, the zones the parts open, and what a Dive pays.
import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { MAX_BOLTS } from '../round/rules';
import { createPractice, deepSave, SAVE_KEY, SAVE_VERSION, settleDive, type DeepGame } from './game';
import { freshLearning } from './learning';
import { PLACE_KEY } from './nav';
import { MOST_EARNED, NUMBERS_TO } from './phrases';
import { ANIMALS, animalsIn } from './sea/animals';
import { ZONES } from './sea/zones';
import {
  allOwned, diveAnimals, diveZone, finishDive, fit, freshDock, gearOf, goalOf, isFitted, lookOf, openZones, pickZone, proposePurchase, readDock, TREASURE_BOLTS, TREASURES, zoneOpen,
} from './dock/dock';
import { ALL_KEYS, ALL_NAMES, CATALOGUE, FITTED, infoOf, keyOf, RUNGED, STARTERS, TABS, type ItemKey } from './dock/parts';
import { seeded } from '../game/rng';

const store = (state: DeepGame = deepSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: DeepGame) => DeepGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});

describe('the save', () => {
  it('has its own keys and a version', () => {
    expect(SAVE_KEY).toBe('deep-light-save');
    expect(PLACE_KEY).toBe('deep-light-place');
    expect(SAVE_VERSION).toBe(1);
  });
  it('round-trips', () => {
    const dock = { ...freshDock(), owned: [...STARTERS, 'hull:r1', 'lights:r1', 'paint:orange', 'dock:buoy'] as ItemKey[], dives: 2, photos: ['clownfish', 'anglerfish'] as DeepGame['dock']['photos'], zone: 'twilight' as const, done: 3, goal: 'hull:r2' as ItemKey };
    const s: DeepGame = { learning: freshLearning(), currency: { balance: 17 }, dock: fit(fit(dock, 'hull:r1'), 'paint:orange') };
    expect(deepSave.decode(JSON.parse(JSON.stringify(deepSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know, or from nonsense', () => {
    const d = deepSave.decode({ version: 99, balance: 5, dock: { dives: 9 } });
    expect(d.currency.balance).toBe(0);
    expect(d.dock).toEqual(freshDock());
    expect(deepSave.decode('nonsense')).toEqual(deepSave.fresh());
  });
  it('never fits something he does not own, keeps only real animals, and forgets a zone he cannot reach', () => {
    const d = readDock({ fitted: { hull: 'r6', paint: 'galaxy', lights: 'r2' }, owned: ['lights:r2', 'nope:nope'], photos: ['clownfish', 'dragon', 'clownfish'], zone: 'trench' });
    expect(d.fitted.hull).toBe('r0');
    expect(d.fitted.paint).toBe('yellow');
    expect(d.fitted.lights).toBe('r2');
    expect(d.owned).not.toContain('nope:nope');
    expect(d.photos).toEqual(['clownfish']);
    expect(d.zone).toBeNull();
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Dive', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'see', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.dock.dives).toBe(freshDock().dives + 1);
  });
  it('the first Dive is free: a new player has one before any Round', () => expect(freshDock().dives).toBe(1));
  it('every "You earned" line the game can say is recorded', () => expect(MOST_EARNED).toBeGreaterThanOrEqual(Math.max(MAX_BOLTS, TREASURES * TREASURE_BOLTS)));
});

describe('the Dock', () => {
  it('has about 150 things to earn, every price under the 100 the voice can say, and every starter free', () => {
    const buyable = ALL_KEYS.filter(k => infoOf(k).price > 0);
    expect(buyable.length).toBeGreaterThanOrEqual(140);
    for (const k of ALL_KEYS) { expect(infoOf(k).price).toBeLessThanOrEqual(NUMBERS_TO); expect(Number.isInteger(infoOf(k).price)).toBe(true); }
    for (const t of FITTED) expect(STARTERS.filter(k => k.startsWith(`${t}:`)).length).toBe(1);
  });
  it('names every item once (each is said aloud on its own)', () => {
    expect(new Set(ALL_NAMES).size).toBe(ALL_NAMES.length);
  });
  it('each better part costs more than the one before it, and does more', () => {
    for (const t of RUNGED) {
      const items = CATALOGUE[t];
      for (let i = 1; i < items.length; i++) expect(items[i]!.price).toBeGreaterThan(items[i - 1]!.price);
    }
    const best = (t: (typeof RUNGED)[number]) => fit({ ...freshDock(), owned: [...STARTERS, keyOf(t, `r${CATALOGUE[t].length - 1}`)] }, keyOf(t, `r${CATALOGUE[t].length - 1}`));
    const g0 = gearOf(freshDock());
    expect(gearOf(best('lights')).reach).toBeGreaterThan(g0.reach);
    expect(gearOf(best('lights')).half).toBeGreaterThan(g0.half);
    expect(gearOf(best('sonar')).sonarRange).toBeGreaterThan(g0.sonarRange);
    expect(gearOf(best('motor')).speed).toBeGreaterThan(g0.speed);
    expect(gearOf(best('claw')).claw).toBeGreaterThan(g0.claw);
    expect(gearOf(best('flash')).flashes).toBeGreaterThan(g0.flashes);
  });
  it('buys only what he can afford and does not own, and fits it straight away', () => {
    const d = freshDock();
    expect(proposePurchase(d, 'hull:r1', 5).kind).toBe('rejected');
    expect(proposePurchase(d, 'hull:r0', 50).kind).toBe('rejected');
    const bought = proposePurchase(d, 'hull:r1', 50);
    if (bought.kind !== 'ready') throw new Error('not bought');
    expect(bought.cost).toBe(10);
    expect(isFitted(bought.state, 'hull:r1')).toBe(true);
    expect(lookOf(bought.state).hull).toBe(1);
  });
  it('aims him at the cheapest part that changes the Dive first', () => {
    const g = goalOf(freshDock())!;
    expect(['hull', 'lights', 'sonar', 'motor', 'claw', 'flash']).toContain(g.split(':')[0]);
    const everything = { ...freshDock(), owned: [...ALL_KEYS] };
    expect(allOwned(everything)).toBe(true);
    expect(goalOf(everything)).toBeNull();
  });
  it('every tab has things in it', () => { for (const t of TABS) expect(CATALOGUE[t].length).toBeGreaterThanOrEqual(5); });
});

describe('zones and Dives', () => {
  it('opens only the reef at first, and every zone with the parts it needs', () => {
    expect(openZones(freshDock())).toEqual(['reef']);
    const all = { ...freshDock(), owned: [...ALL_KEYS] };
    expect(openZones(all)).toEqual(ZONES.map(z => z.id));
    // the wreck needs a Claw as well as a Hull; the cave needs Sonar; under the ice needs Headlights
    const hull = (n: number) => ({ ...freshDock(), owned: [...STARTERS, ...Array.from({ length: n }, (_, i) => `hull:r${i + 1}` as ItemKey)] });
    expect(zoneOpen(hull(1), 'twilight')).toBe(true);
    expect(zoneOpen(hull(1), 'wreck')).toBe(false);
    expect(zoneOpen({ ...hull(1), owned: [...hull(1).owned, 'claw:r1'] }, 'wreck')).toBe(true);
    expect(zoneOpen(hull(3), 'cave')).toBe(false);
    expect(zoneOpen(hull(5), 'ice')).toBe(false);
    expect(zoneOpen(hull(6), 'trench')).toBe(true);
  });
  it('dives where he picked, else the deepest open zone with animals he has not met', () => {
    const d = { ...freshDock(), owned: [...STARTERS, 'hull:r1', 'hull:r2'] as ItemKey[] };
    expect(diveZone(d)).toBe('midnight');
    expect(diveZone(pickZone(d, 'reef')!)).toBe('reef');
    expect(pickZone(d, 'trench')).toBeNull();
    const met = { ...d, photos: animalsIn('midnight').map(a => a.id) as DeepGame['dock']['photos'] };
    expect(diveZone(met)).toBe('twilight');
  });
  it('puts at least one animal he has not met on a Dive while there are any left in that zone', () => {
    for (const z of ZONES) {
      const all = animalsIn(z.id).map(a => a.id);
      for (let k = 0; k < all.length; k++) {
        const photos = all.slice(0, k), on = diveAnimals(z.id, photos, seeded(k + 1));
        expect(on.some(a => !photos.includes(a.id))).toBe(true);
      }
    }
  });
  it('a finished Dive is used up, pays its treasure and puts new animals in the Logbook once', () => {
    const d = { ...freshDock(), photos: ['clownfish'] as DeepGame['dock']['photos'] };
    const done = finishDive(d, ['clownfish', 'turtle', 'turtle'], 2);
    expect(done.state.dives).toBe(0);
    expect(done.state.photos).toEqual(['clownfish', 'turtle']);
    expect(done.pay).toEqual({ bolts: 2 * TREASURE_BOLTS, fresh: ['turtle'] });
    expect(finishDive(d, [], 99).pay.bolts).toBe(TREASURES * TREASURE_BOLTS);
  });
  it('settling a Dive pays Bolts, and does nothing without a Dive to use', () => {
    const s = store();
    const pay = settleDive(s, ['clownfish'], 1);
    expect(pay).toEqual({ bolts: 1, fresh: ['clownfish'] });
    expect(s.state.currency.balance).toBe(1);
    expect(s.state.dock.dives).toBe(0);
    expect(settleDive(s, ['turtle'], 3)).toBeNull();
    expect(s.state.dock.photos).toEqual(['clownfish']);
  });
  it('has about sixty animals to find, in every zone', () => {
    expect(ANIMALS.length).toBeGreaterThanOrEqual(58);
    for (const z of ZONES) expect(animalsIn(z.id).length).toBeGreaterThanOrEqual(6);
  });
});
