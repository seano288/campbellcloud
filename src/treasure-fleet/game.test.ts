import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { BARRELS, canReach, CHEST_GOLD, destinationOf, freshFleet, goalOf, nextIsland, pickColour, pickDestination, proposePurchase, readFleet } from './fleet/fleet';
import { island, ISLANDS } from './fleet/islands';
import { ALL_KEYS, fit, infoOf, PARTS, rangeOf, SLOTS, STARTERS } from './fleet/parts';
import { createPractice, fleetSave, SAVE_KEY, SAVE_VERSION, settleVoyage, type FleetGame } from './game';
import { freshLearning } from './learning';

const store = (state: FleetGame = fleetSave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: FleetGame) => FleetGame | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('treasure-fleet-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const fleet = { ...freshFleet(), owned: [...freshFleet().owned, 'sails:patched' as const, 'flag:shark' as const], ship: { ...fit(fit(freshFleet().ship, 'sails:patched'), 'flag:shark'), colour: 'red' as const }, voyages: 3, trips: 2, visits: { turtle: 2 }, hoard: ['turtle' as const], destination: 'turtle' as const, goal: 'hull:sloop' as const };
    const s: FleetGame = { learning: freshLearning(), currency: { balance: 17 }, fleet };
    expect(fleetSave.decode(JSON.parse(JSON.stringify(fleetSave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know', () => {
    const d = fleetSave.decode({ version: 99, balance: 5, fleet: { voyages: 9 } });
    expect(d.currency.balance).toBe(0);
    expect(d.fleet).toEqual(freshFleet());
  });
  it('never fits a part he does not own, whatever the save says', () => {
    const f = readFleet({ owned: ['hull:rowboat'], ship: { hull: 'galleon', flag: 'dragon', colour: 'rainbow' }, visits: { turtle: 1, atlantis: 3 }, hoard: ['turtle', 'atlantis', 'turtle'] });
    expect(f.ship).toEqual(freshFleet().ship);
    expect(f.visits).toEqual({ turtle: 1 });
    expect(f.hoard).toEqual(['turtle']);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Voyage', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'where', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.fleet.voyages).toBe(freshFleet().voyages + 1);
  });
});

describe('the Shipyard', () => {
  it('starts as a rowing boat with a bedsheet sail, a free Voyage, and Turtle Island in reach', () => {
    const f = freshFleet();
    expect(f.ship.hull).toBe('rowboat');
    expect(f.ship.sails).toBe('sheet');
    expect(f.voyages).toBe(1);
    expect(destinationOf(f).id).toBe('turtle');
    expect(canReach(f, island('turtle'))).toBe(true);
    expect(canReach(f, island('palm'))).toBe(false);
  });
  it('has four slots, each a free starter and three upgrades costing about 8, 25 and 55', () => {
    for (const slot of SLOTS) {
      const prices = PARTS.filter(p => p.slot === slot).map(p => p.price);
      expect(prices[0]).toBe(0);
      expect(prices[1]).toBeGreaterThanOrEqual(8); expect(prices[1]).toBeLessThanOrEqual(12);
      expect(prices[2]).toBeGreaterThanOrEqual(20); expect(prices[2]).toBeLessThanOrEqual(30);
      expect(prices[3]).toBeGreaterThanOrEqual(50); expect(prices[3]).toBeLessThanOrEqual(60);
    }
    expect(STARTERS).toHaveLength(SLOTS.length + 1); // and the skull flag
  });
  it('buys a part, fits it, and takes the Range that reaches the second island: one upgrade', () => {
    const buy = proposePurchase(freshFleet(), 'sails:patched', 20);
    if (buy.kind !== 'ready') throw new Error(buy.reason);
    expect(buy.cost).toBe(8);
    expect(buy.state.ship.sails).toBe('patched');
    expect(rangeOf(buy.state.ship)).toBe(5);
    expect(canReach(buy.state, ISLANDS[1]!)).toBe(true);
    expect(proposePurchase(freshFleet(), 'sails:patched', 7)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(buy.state, 'sails:patched', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
  });
  it('saves toward the cheapest part that adds Range, and the flag colours are free', () => {
    expect(infoOf(goalOf(freshFleet())!).range).toBeGreaterThan(0);
    expect(pickColour(freshFleet(), 'gold').ship.colour).toBe('gold');
  });
  it('has an island for every few upgrades, and the top parts reach the last', () => {
    const top = { ...freshFleet().ship, hull: 'galleon', sails: 'royal', cannons: 'golden', figurehead: 'serpent' };
    expect(rangeOf(top)).toBe(ISLANDS.at(-1)!.range);
    expect(ISLANDS).toHaveLength(8);
    ISLANDS.forEach((i, k) => { if (k) expect(i.range).toBeGreaterThan(ISLANDS[k - 1]!.range); });
    expect(new Set(ISLANDS.map(i => i.treasure)).size).toBe(8);
    expect(ALL_KEYS.filter(k => infoOf(k).price > 0).reduce((s, k) => s + infoOf(k).price, 0)).toBeLessThan(400);
  });
  it('goes somewhere new when it can, and lets him pick only islands in reach', () => {
    const f = { ...freshFleet(), visits: { turtle: 1 }, hoard: ['turtle' as const], ship: fit(freshFleet().ship, 'hull:sloop') };
    expect(nextIsland(f)!.id).toBe('palm');
    expect(destinationOf(f).id).toBe('palm');
    expect(pickDestination(f, 'skull')).toBeNull();
    expect(destinationOf(pickDestination(f, 'turtle')!).id).toBe('turtle');
    expect(destinationOf({ ...f, ship: freshFleet().ship }).id).toBe('turtle');
  });
});

describe('a Voyage', () => {
  it('pays the barrels and the chest, at most 6, uses the Voyage, and gives the treasure on the first dig only', () => {
    const s = store();
    expect(BARRELS + CHEST_GOLD).toBe(6);
    const first = settleVoyage(s, 'turtle', 2)!;
    expect(first).toEqual({ bolts: 5, firstVisit: true, treasure: 'turtle' });
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.fleet.voyages).toBe(0);
    expect(s.state.fleet.hoard).toEqual(['turtle']);
    expect(settleVoyage(s, 'turtle', 3)).toBeNull(); // no Voyage left: nothing happens
    s.commit(st => ({ ...st, fleet: { ...st.fleet, voyages: 1 } }));
    expect(settleVoyage(s, 'turtle', 99)).toEqual({ bolts: 6, firstVisit: false, treasure: null }); // revisiting pays Bolts, no new treasure
    expect(s.state.fleet.visits.turtle).toBe(2);
    expect(s.state.fleet.hoard).toEqual(['turtle']);
  });
});
