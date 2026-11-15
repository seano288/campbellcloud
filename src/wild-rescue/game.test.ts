import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { animal, RESCUABLE, type RescueId } from './facts/animals';
import { HABITAT_IDS } from './facts/habitats';
import { createPractice, rescueSave, SAVE_KEY, SAVE_VERSION, settleRescue, setDown, type RescueGame } from './game';
import { freshLearning } from './learning';
import {
  blockers, canRescue, DRIVE_BOLTS, freshRescue, goalOf, nextCall, placeAnimal, proposePurchase, readRescue, truckFor, type RescueState,
} from './park/rescue';
import { ALL_KEYS, DECOS, EXTRAS, item, PAINTS, PARK_HABITATS, PARTS, SLOTS, STARTERS, type ItemKey } from './park/shop';
import { NUMBERS_TO, PHRASES } from './phrases';

const store = (state: RescueGame = rescueSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: RescueGame) => RescueGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});
const owning = (keys: readonly ItemKey[], s: RescueState = freshRescue()): RescueState => ({ ...s, owned: [...new Set([...s.owned, ...keys])] });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('wild-rescue-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const rescue: RescueState = { ...owning(['tires:mud', 'paint:green', 'habitat:forest']), truck: { ...freshRescue().truck, tires: 'mud', paint: 'green' }, calls: 3, trips: 4, park: ['sheep', 'bear'], holding: 'deer', released: 1, goal: 'carrier:big' };
    const s: RescueGame = { learning: freshLearning(), currency: { balance: 17 }, rescue };
    expect(rescueSave.decode(JSON.parse(JSON.stringify(rescueSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know', () => {
    const d = rescueSave.decode({ version: 99, balance: 5, rescue: { calls: 9 } });
    expect(d.currency.balance).toBe(0);
    expect(d.rescue).toEqual(freshRescue());
  });
  it('never fits a part he does not own, and never has an animal both in the Park and in his hands', () => {
    const r = readRescue({ owned: ['tires:street'], truck: { tires: 'gold', paint: 'zebra' }, park: ['sheep', 'unicorn', 'sheep'], holding: 'sheep' });
    expect(r.truck).toEqual(freshRescue().truck);
    expect(r.park).toEqual(['sheep']);
    expect(r.holding).toBeNull();
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Rescue call', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'home', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.rescue.calls).toBe(freshRescue().calls + 1);
  });
});

describe('what Bolts buy', () => {
  it('has four truck slots, each a free starter and six upgrades getting dearer, all at or under 100', () => {
    for (const slot of SLOTS) {
      const prices = PARTS.filter(p => p.slot === slot).map(p => p.price);
      expect(prices).toHaveLength(7);
      expect(prices[0]).toBe(0);
      prices.forEach((p, i) => { if (i) expect(p).toBeGreaterThan(prices[i - 1]!); });
    }
    for (const k of ALL_KEYS) expect(item(k).price, k).toBeLessThanOrEqual(NUMBERS_TO);
    expect(STARTERS).toHaveLength(SLOTS.length + 2); // and Rescue Orange and the Barn
  });
  it('is about twice the brief\'s reward: 24 upgrades, 12 paints, 6 habitats, 14 extras, 11 decorations, 45 animals', () => {
    expect(PARTS.filter(p => p.price > 0)).toHaveLength(24);
    expect(PAINTS.filter(p => p.price > 0)).toHaveLength(12);
    expect(PARK_HABITATS.filter(h => h.price > 0).map(h => h.price)).toEqual([15, 30, 45, 60, 80, 100]);
    expect(EXTRAS).toHaveLength(14);
    expect(DECOS).toHaveLength(11);
    expect(RESCUABLE).toHaveLength(45);
    const total = ALL_KEYS.reduce((s, k) => s + item(k).price, 0);
    expect(total).toBeGreaterThan(1800);
    expect(total).toBeLessThan(2400);
  });
  it('buys a part and fits it, and says no without enough Bolts or twice', () => {
    const buy = proposePurchase(freshRescue(), 'tires:mud', 20);
    if (buy.kind !== 'ready') throw new Error(buy.reason);
    expect(buy.cost).toBe(8);
    expect(buy.state.truck.tires).toBe('mud');
    expect(proposePurchase(freshRescue(), 'tires:mud', 7)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(buy.state, 'tires:mud', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    const habitat = proposePurchase(freshRescue(), 'habitat:grassland', 15);
    if (habitat.kind !== 'ready') throw new Error(habitat.reason);
    expect(habitat.state.truck).toEqual(freshRescue().truck);
  });
  it('saves first toward the Big Crate (the farm\'s big animals), then the Grassland', () => {
    expect(goalOf(freshRescue())).toBe('carrier:big');
    expect(goalOf(owning(['carrier:big']))).toBe('habitat:grassland');
  });
  it('says every price and every thing he can buy', () => {
    for (const k of ALL_KEYS) expect(PHRASES as readonly string[]).toContain(item(k).name);
    for (let n = 0; n <= NUMBERS_TO; n++) expect(PHRASES as readonly string[]).toContain(`${n}`);
  });
});

describe('Rescue calls', () => {
  it('starts with one free call, for a farm animal the starter truck can carry, so it has a home', () => {
    const f = freshRescue();
    expect(f.calls).toBe(1);
    const call = nextCall(f);
    expect(call).toEqual({ kind: 'rescue', animal: 'sheep' });
    expect(animal(call.animal).home).toBe('farm');
  });
  it('only ever calls for an animal whose habitat he owns and his truck can reach', () => {
    // buy things in a muddled order; after each, the call is always one he can do and can bring home
    let s = freshRescue();
    const order: ItemKey[] = ['habitat:desert', 'tires:snow', 'carrier:big', 'habitat:polar', 'habitat:grassland', 'carrier:tank', 'habitat:ocean', 'tires:mud', 'habitat:forest', 'carrier:boat', 'habitat:pond', 'carrier:giant', 'tires:sand'];
    for (const k of order) {
      s = owning([k], s);
      for (let i = 0; i < 60; i++) {
        const call = nextCall(s);
        if (call.kind === 'release') { expect(s.park).toContain(call.animal); break; }
        expect(canRescue(s, call.animal)).toBe(true);
        expect(s.owned).toContain(`habitat:${animal(call.animal).home}`);
        s = { ...s, park: [...s.park, call.animal] };
      }
    }
    expect(s.park).toHaveLength(RESCUABLE.length);
    expect(new Set(s.park).size).toBe(RESCUABLE.length);
  });
  it('fills a newly bought habitat first', () => {
    const s = { ...owning(['habitat:grassland', 'carrier:big']), park: ['sheep', 'chicken', 'pig'] as RescueId[] };
    expect(animal(nextCall(s).animal).home).toBe('grassland');
  });
  it('needs the right gear: sand tires for the desert, snow tracks for polar, the boat for the pond, the tank for the ocean, crates by size', () => {
    expect(blockers(owning(['habitat:desert']), 'camel')).toEqual(['tires:sand', 'carrier:big']);
    expect(blockers(owning(['habitat:desert']), 'fennec')).toEqual(['tires:sand']);
    expect(blockers(owning(['habitat:polar', 'tires:snow']), 'penguin')).toEqual([]);
    expect(blockers(owning(['habitat:pond']), 'frog')).toEqual(['carrier:boat']);
    expect(blockers(owning(['habitat:pond', 'carrier:boat']), 'hippo')).toEqual(['carrier:giant']);
    expect(blockers(owning(['habitat:ocean']), 'dolphin')).toEqual(['carrier:tank']);
    expect(blockers(owning(['habitat:grassland', 'carrier:big']), 'elephant')).toEqual(['carrier:giant']);
    // a better tire does the job of the one before
    expect(blockers(owning(['habitat:forest', 'tires:monster']), 'chipmunk')).toEqual([]);
  });
  it('puts the gear a call needs on the truck for the trip', () => {
    const s = { ...owning(['habitat:pond', 'carrier:boat', 'carrier:big']), truck: { ...freshRescue().truck, carrier: 'big' } };
    expect(truckFor(s, 'frog').carrier).toBe('boat');
    expect(truckFor(owning(['habitat:forest', 'tires:mud']), 'chipmunk').tires).toBe('mud');
  });
  it('calls a release once every animal he can reach is home, and it pays the same', () => {
    const s = { ...freshRescue(), park: ['sheep', 'chicken', 'pig', 'goat'] as RescueId[] };
    const call = nextCall(s);
    expect(call.kind).toBe('release');
    expect(s.park).toContain(call.animal);
    const st = store({ ...rescueSave.fresh(), rescue: s });
    expect(settleRescue(st, call, 3)).toEqual({ bolts: 3, animal: call.animal, release: true });
    expect(st.state.rescue.holding).toBeNull();
    expect(st.state.rescue.released).toBe(1);
  });
});

describe('a Rescue and the Park', () => {
  it('pays at most 4 Bolts, uses the call, and the animal comes home in his hands', () => {
    const s = store();
    expect(DRIVE_BOLTS).toBe(4);
    expect(settleRescue(s, { kind: 'rescue', animal: 'sheep' }, 99)).toEqual({ bolts: 4, animal: 'sheep', release: false });
    expect(s.state.currency.balance).toBe(4);
    expect(s.state.rescue.calls).toBe(0);
    expect(s.state.rescue.holding).toBe('sheep');
    expect(settleRescue(s, { kind: 'rescue', animal: 'sheep' }, 1)).toBeNull(); // no call left: nothing happens
  });
  it('never drops an animal already in his hands when another is rescued: it goes to its home', () => {
    const s = store({ ...rescueSave.fresh(), rescue: { ...rescueSave.fresh().rescue, calls: 1, holding: 'sheep' } });
    settleRescue(s, { kind: 'rescue', animal: 'chicken' }, 1);
    expect(s.state.rescue.park).toEqual(['sheep']);
    expect(s.state.rescue.holding).toBe('chicken');
  });
  it('takes the animal only into its own habitat; a wrong one leaves it in his hands', () => {
    const st = store({ ...rescueSave.fresh(), rescue: { ...owning(['habitat:grassland']), holding: 'sheep' } });
    for (const h of HABITAT_IDS) if (h !== 'farm') { expect(setDown(st, h)).toBe(false); expect(st.state.rescue.holding).toBe('sheep'); }
    expect(setDown(st, 'farm')).toBe(true);
    expect(st.state.rescue.park).toEqual(['sheep']);
    expect(st.state.rescue.holding).toBeNull();
    expect(placeAnimal(st.state.rescue, 'farm')).toBeNull(); // nothing in his hands now
  });
});
