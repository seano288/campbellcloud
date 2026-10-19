import { describe, expect, it } from 'vitest';
const LEVELS = [1, 2, 3] as const; // the Pay the Shop Levels with their own prices
type Level = (typeof LEVELS)[number];
import { helpPayCoins } from '../money/payment';
import { LEVEL_MONEY, MONEY, total } from '../money/money';
import { amountPieces } from '../voice/amount';
import { ALL_MODS, BODY_IDS, bodyItem, BOUGHT_BODIES, BOUGHT_COLOURS, colourItem, COLOURS, isLegendary, LEGENDARY, modId, SLOTS } from './catalog';
import { affordable, forBolts, boltsNeeded, builtEverything, goalOf, nextLegendary, priceOf, waitingOn, type Wallet } from '../app/garageEconomy';
import { proposeLegendary, proposePurchase } from './purchases';
import { freshGarage, type GarageState } from './state';

const wallet = (over: Partial<Wallet> = {}): Wallet => ({ bolts: 0, unlocked: [], ownedBodies: ['pickup', 'bigfoot', 'dragster'], colours: [], goal: null, ...over });

describe('prices', () => {
  it('costs 5, 15 and 30 Bolts by Rung', () => {
    expect([priceOf('paint:1'), priceOf('paint:2'), priceOf('paint:3')]).toEqual([{ bolts: 5 }, { bolts: 15 }, { bolts: 30 }]);
  });

  it('adds up to 500 Bolts for the 30 Bolt Mods', () => {
    const boltMods = ALL_MODS.filter(forBolts);
    expect(boltMods).toHaveLength(30);
    expect(boltMods.reduce((n, m) => n + priceOf(m).bolts, 0)).toBe(500);
  });

  it('prices every Legendary in money at each Level, cheapest to dearest in the same order', () => {
    const order = ['tires', 'number', 'paint', 'grille', 'decals', 'exhaust', 'lights', 'engine', 'topper', 'horn'] as const;
    for (const level of LEVELS) {
      const cents = order.map(s => priceOf(modId(s, LEGENDARY), level).cents!);
      expect(cents).toEqual([...cents].sort((a, b) => a - b));
      expect(new Set(cents).size).toBe(order.length);
    }
  });

  it('keeps Level 1 under $1, Level 2 up to $3 and Level 3 up to $9', () => {
    const cents = (level: Level) => SLOTS.map(s => priceOf(modId(s.id, LEGENDARY), level).cents!);
    expect(Math.max(...cents(1))).toBeLessThan(100);
    expect(Math.min(...cents(2))).toBeGreaterThanOrEqual(100);
    expect(Math.max(...cents(2))).toBeLessThanOrEqual(300);
    expect(Math.min(...cents(3))).toBeGreaterThan(300);
    expect(Math.max(...cents(3))).toBeLessThanOrEqual(900);
  });

  it('prices Level 2 Legendaries at a quarter or more and Level 3 at a dollar or more', () => {
    for (const s of SLOTS) {
      expect(priceOf(modId(s.id, LEGENDARY), 2).cents!).toBeGreaterThanOrEqual(MONEY.q.cents);
      expect(priceOf(modId(s.id, LEGENDARY), 3).cents!).toBeGreaterThanOrEqual(MONEY.b1.cents);
    }
  });

  it('prices every Legendary so it can be paid exactly with its Level\'s money', () => {
    for (const level of LEVELS) for (const s of SLOTS) {
      const cents = priceOf(modId(s.id, LEGENDARY), level).cents!;
      expect(total(helpPayCoins(cents, LEVEL_MONEY[level]))).toBe(cents);
    }
  });

  it('has a voice clip for every Legendary price', () => {
    for (const level of LEVELS) for (const s of SLOTS) expect(() => amountPieces(priceOf(modId(s.id, LEGENDARY), level).cents!)).not.toThrow();
  });

  it('prices the Tires Legendary at 35¢, $1.10 and $3.35 by Level', () => {
    expect(LEVELS.map(l => priceOf('tires:4', l))).toEqual([{ cents: 35 }, { cents: 110 }, { cents: 335 }]);
  });

  it('prices the Horn Legendary at 95¢, $2.90 and $8.80 by Level', () => {
    expect(LEVELS.map(l => priceOf('horn:4', l))).toEqual([{ cents: 95 }, { cents: 290 }, { cents: 880 }]);
  });

  it('gives Bolt items the same price at every Level', () => {
    for (const x of ['paint:1', 'engine:3', 'body:jeep', 'colour:teal'] as const) expect(priceOf(x, 1)).toEqual(priceOf(x, 3));
  });

  it('prices the Engine, Grille, Exhaust, Roof Topper and Door Number Mods in Bolts by Rung', () => {
    for (const s of ['engine', 'grille', 'exhaust', 'topper', 'number'] as const) {
      expect([priceOf(modId(s, 1)), priceOf(modId(s, 2)), priceOf(modId(s, 3))]).toEqual([{ bolts: 5 }, { bolts: 15 }, { bolts: 30 }]);
    }
  });

  it('costs 30 Bolts for every Body he buys', () => {
    expect(BOUGHT_BODIES.map(b => priceOf(bodyItem(b)))).toEqual(BOUGHT_BODIES.map(() => ({ bolts: 30 })));
  });
});

describe('unlock', () => {
  const garage = (patch: Partial<GarageState> = {}): GarageState => ({ ...freshGarage(), ...patch });

  it('proposes the Bolt cost and unlocks the Mod', () => {
    const proposal = proposePurchase(garage(), 'tires:2', 16);
    expect(proposal).toMatchObject({ kind: 'ready', cost: 15, state: { unlocked: ['tires:2'] } });
  });

  it('refuses a Mod he cannot afford', () => {
    expect(proposePurchase(garage(), 'tires:2', 8)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  });

  it('refuses a Mod that is already unlocked', () => {
    expect(proposePurchase(garage({ unlocked: ['tires:2'] }), 'tires:2', 20)).toEqual({ kind: 'rejected', reason: 'already-owned' });
  });

  it('clears the Goal once it is unlocked', () => {
    expect(proposePurchase(garage({ goal: 'horn:3' }), 'horn:3', 30)).toMatchObject({ kind: 'ready', state: { goal: null } });
    expect(proposePurchase(garage({ goal: 'horn:3' }), 'horn:1', 30)).toMatchObject({ kind: 'ready', state: { goal: 'horn:3' } });
  });

  it('buys a Body with Bolts', () => {
    const result = proposePurchase(garage({ goal: 'body:schoolbus' }), 'body:schoolbus', 35);
    if (result.kind !== 'ready') throw new Error('Expected Body proposal');
    expect(result.cost).toBe(30);
    expect(result.state.ownedBodies).toEqual(['pickup', 'bigfoot', 'dragster', 'schoolbus']);
    expect(result.state.unlocked).toEqual([]);
    expect(result.state.goal).toBeNull();
    expect(proposePurchase(result.state, 'body:schoolbus', 35)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(proposePurchase(garage(), 'body:schoolbus', 29)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  });

  it('unlocks a Legendary only for the exact money, once the top Rung is unlocked', () => {
    const ready = garage({ unlocked: ['tires:3'] });
    const proposal = proposeLegendary(ready, 'tires:4', 2, 110);
    expect(proposal).toMatchObject({ kind: 'ready', state: { unlocked: ['tires:3', 'tires:4'] } });
    expect(proposal).not.toHaveProperty('cost'); // money, not Bolts
    expect(proposeLegendary(ready, 'tires:4', 2, 105)).toEqual({ kind: 'rejected', reason: 'invalid-payment' });
    expect(proposeLegendary(ready, 'tires:4', 2, 115)).toEqual({ kind: 'rejected', reason: 'invalid-payment' });
    expect(proposePurchase(ready, 'tires:4', 99)).toEqual({ kind: 'rejected', reason: 'cash-required' });
    expect(proposeLegendary(garage({ unlocked: ['tires:1', 'tires:2'] }), 'tires:4', 2, 110)).toEqual({ kind: 'rejected', reason: 'waiting' });
  });

  it('unlocks a Legendary for exactly its price at his Level, at every Level', () => {
    const ready = garage({ unlocked: ['horn:3'] });
    for (const level of LEVELS) {
      const cents = priceOf('horn:4', level).cents!;
      expect(proposeLegendary(ready, 'horn:4', level, cents)).toMatchObject({ kind: 'ready', state: { unlocked: ['horn:3', 'horn:4'] } });
      for (const other of LEVELS.filter(l => l !== level)) expect(proposeLegendary(ready, 'horn:4', level, priceOf('horn:4', other).cents!)).toEqual({ kind: 'rejected', reason: 'invalid-payment' });
    }
  });

  it('never needs Level 3 to buy a Legendary', () => {
    expect(proposeLegendary(garage({ unlocked: ['lights:3'] }), 'lights:4', 1, 75)).toMatchObject({ kind: 'ready', state: { unlocked: ['lights:3', 'lights:4'] } });
  });

  it('never takes money for a Bolt Mod', () => {
    expect(Reflect.apply(proposeLegendary, undefined, [garage(), 'tires:1', 1, 3])).toEqual({ kind: 'rejected', reason: 'invalid-item' });
  });
});

describe('a Legendary', () => {
  it('waits on the top Rung in its Slot', () => {
    expect(waitingOn(wallet({ unlocked: ['paint:1'] }), 'paint:4')).toBe('paint:3');
    expect(waitingOn(wallet({ unlocked: ['paint:3'] }), 'paint:4')).toBeNull();
    expect(waitingOn(wallet(), 'paint:2')).toBeNull();
  });
});

describe('the Goal', () => {
  const allBoltMods = ALL_MODS.filter(m => !isLegendary(m));

  it('defaults to the cheapest locked Mod', () => {
    expect(goalOf(wallet())).toBe('tires:1');
    expect(goalOf(wallet({ unlocked: ['tires:1', 'paint:1', 'decals:1', 'lights:1', 'horn:1'] }))).toBe('engine:1');
    expect(goalOf(wallet({ unlocked: ['tires:1', 'paint:1', 'decals:1', 'lights:1', 'horn:1', 'engine:1'] }))).toBe('grille:1');
    expect(goalOf(wallet({ unlocked: ['tires:1', 'paint:1', 'decals:1', 'lights:1', 'horn:1', 'engine:1', 'grille:1'] }))).toBe('exhaust:1');
    expect(goalOf(wallet({ unlocked: ['tires:1', 'paint:1', 'decals:1', 'lights:1', 'horn:1', 'engine:1', 'grille:1', 'exhaust:1'] }))).toBe('topper:1');
    expect(goalOf(wallet({ unlocked: ['tires:1', 'paint:1', 'decals:1', 'lights:1', 'horn:1', 'engine:1', 'grille:1', 'exhaust:1', 'topper:1'] }))).toBe('number:1');
    expect(goalOf(wallet({ unlocked: ['tires:1', 'paint:1', 'decals:1', 'lights:1', 'horn:1', 'engine:1', 'grille:1', 'exhaust:1', 'topper:1', 'number:1'] }))).toBe('tires:2');
  });

  it('is the Mod or Body he chose while it is still locked', () => {
    expect(goalOf(wallet({ goal: 'lights:3' }))).toBe('lights:3');
    expect(goalOf(wallet({ goal: 'lights:3', unlocked: ['lights:3'] }))).toBe('tires:1');
    expect(goalOf(wallet({ goal: 'body:jeep' }))).toBe('body:jeep');
  });

  it('is never a Legendary, which is bought with money', () => {
    expect(goalOf(wallet({ goal: 'horn:4', unlocked: ['horn:3'] }))).toBe('tires:1');
    expect(goalOf(wallet({ unlocked: allBoltMods }))).toBe('body:firetruck');
  });

  it('moves on to the next Body once the Mods are bought', () => {
    expect(goalOf(wallet({ unlocked: allBoltMods, ownedBodies: ['pickup', 'bigfoot', 'dragster', 'firetruck'] }))).toBe('body:schoolbus');
  });

  it('moves on to the second batch, in order, once the first Bodies are his', () => {
    const first = ['pickup', 'bigfoot', 'dragster', 'firetruck', 'schoolbus', 'jeep'] as const;
    expect(goalOf(wallet({ unlocked: allBoltMods, ownedBodies: first }))).toBe('body:towtruck');
    expect(goalOf(wallet({ unlocked: allBoltMods, ownedBodies: [...first, 'towtruck', 'dumptruck', 'police', 'icecream', 'tractor'] }))).toBe('body:racecar');
  });

  it('is gone once he has built everything, Legendaries and Bodies too', () => {
    const bodies = ['pickup', 'bigfoot', 'dragster', 'firetruck', 'schoolbus', 'jeep', 'towtruck', 'dumptruck', 'police', 'icecream', 'tractor', 'racecar'] as const;
    expect(goalOf(wallet({ unlocked: allBoltMods, ownedBodies: bodies, colours: BOUGHT_COLOURS }))).toBeNull();
    expect(builtEverything(wallet({ unlocked: allBoltMods, ownedBodies: bodies }))).toBe(false);
    expect(builtEverything(wallet({ unlocked: [...ALL_MODS] }))).toBe(false);
    expect(builtEverything(wallet({ unlocked: [...ALL_MODS], ownedBodies: bodies, colours: BOUGHT_COLOURS }))).toBe(true);
    expect(builtEverything(wallet({ unlocked: ALL_MODS.filter(m => !m.startsWith('engine:')), ownedBodies: bodies }))).toBe(false);
    expect(builtEverything(wallet({ unlocked: ALL_MODS.filter(m => m !== 'grille:4'), ownedBodies: bodies }))).toBe(false);
    expect(builtEverything(wallet({ unlocked: ALL_MODS.filter(m => m !== 'exhaust:4'), ownedBodies: bodies }))).toBe(false);
    expect(builtEverything(wallet({ unlocked: ALL_MODS.filter(m => m !== 'topper:4'), ownedBodies: bodies }))).toBe(false);
    expect(builtEverything(wallet({ unlocked: ALL_MODS.filter(m => m !== 'number:4'), ownedBodies: bodies }))).toBe(false);
    expect(builtEverything(wallet({ unlocked: [...ALL_MODS], ownedBodies: bodies.filter(b => b !== 'racecar') }))).toBe(false);
    expect(builtEverything(wallet())).toBe(false);
  });

  it('says how many more Bolts he needs', () => {
    expect(boltsNeeded(wallet({ bolts: 5 }), 'paint:2')).toBe(10);
    expect(boltsNeeded(wallet({ bolts: 15 }), 'paint:2')).toBe(0);
    expect(boltsNeeded(wallet({ bolts: 12 }), 'body:firetruck')).toBe(18);
  });
});

describe('affordable', () => {
  it('lists the locked Mods and Bodies he has enough Bolts for, never a Legendary', () => {
    expect(affordable(wallet({ bolts: 15, unlocked: ['tires:1'] }))).toEqual(['tires:2', 'paint:1', 'paint:2', 'decals:1', 'decals:2', 'lights:1', 'lights:2', 'horn:1', 'horn:2', 'engine:1', 'engine:2', 'grille:1', 'grille:2', 'exhaust:1', 'exhaust:2', 'topper:1', 'topper:2', 'number:1', 'number:2', ...BOUGHT_COLOURS.map(colourItem)]);
    expect(affordable(wallet({ bolts: 2 }))).toEqual([]);
    const allButBodies = { unlocked: ALL_MODS.filter(m => !isLegendary(m)), colours: BOUGHT_COLOURS };
    expect(affordable(wallet({ bolts: 29, ...allButBodies }))).toEqual([]);
    expect(affordable(wallet({ bolts: 30, ...allButBodies }))).toEqual(BOUGHT_BODIES.map(bodyItem));
  });
});

describe('the next Legendary', () => {
  it('is the cheapest one still to buy at his Level, whether or not it is waiting', () => {
    for (const level of LEVELS) {
      expect(nextLegendary(wallet(), level)).toBe('tires');
      expect(nextLegendary(wallet({ unlocked: ['tires:4'] }), level)).toBe('number');
      expect(nextLegendary(wallet({ unlocked: ['tires:4', 'number:4', 'paint:4'] }), level)).toBe('grille');
      expect(nextLegendary(wallet({ unlocked: ['tires:4', 'number:4', 'grille:4', 'paint:4'] }), level)).toBe('decals');
      expect(nextLegendary(wallet({ unlocked: ['tires:4', 'number:4', 'grille:4', 'paint:4', 'decals:4'] }), level)).toBe('exhaust');
      expect(nextLegendary(wallet({ unlocked: ALL_MODS.filter(isLegendary).filter(m => m !== 'topper:4' && m !== 'horn:4') }), level)).toBe('topper');
      expect(nextLegendary(wallet({ unlocked: ALL_MODS.filter(isLegendary) }), level)).toBeNull();
    }
  });
});

describe('Colours', () => {
  const everything = { unlocked: [...ALL_MODS], ownedBodies: BODY_IDS };

  it('has 12, and Red is free', () => {
    expect(COLOURS.map(c => c.name)).toEqual(['Red', 'Orange', 'Yellow', 'Lime', 'Green', 'Teal', 'Sky Blue', 'Navy', 'Purple', 'Pink', 'Black', 'White']);
    expect(BOUGHT_COLOURS).not.toContain('red');
    expect(BOUGHT_COLOURS).toHaveLength(11);
  });

  it('costs 3 Bolts each, 33 in all', () => {
    expect(priceOf(colourItem('lime'))).toEqual({ bolts: 3 });
    expect(BOUGHT_COLOURS.reduce((n, c) => n + priceOf(colourItem(c)).bolts!, 0)).toBe(33);
  });

  it('is proposed for Bolts once, never for practice money', () => {
    const result = proposePurchase({ ...freshGarage(), goal: 'colour:teal' }, 'colour:teal', 5);
    if (result.kind !== 'ready') throw new Error('Expected Colour proposal');
    expect(result.cost).toBe(3);
    expect(result.state.colours).toEqual(['teal']);
    expect(result.state.unlocked).toEqual([]);
    expect(result.state.goal).toBeNull();
    expect(proposePurchase(result.state, 'colour:teal', 5)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(proposePurchase(freshGarage(), 'colour:pink', 2)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(Reflect.apply(proposeLegendary, undefined, [freshGarage(), 'colour:pink', 1, 3])).toEqual({ kind: 'rejected', reason: 'invalid-item' });
  });

  it('is skipped by the Goal unless he chose one', () => {
    expect(goalOf(wallet())).toBe('tires:1');
    expect(goalOf(wallet({ goal: 'colour:navy' }))).toBe('colour:navy');
    expect(goalOf(wallet({ goal: 'colour:navy', colours: ['navy'] }))).toBe('tires:1');
  });

  it('is the Goal once nothing else bought with Bolts is left', () => {
    expect(goalOf(wallet({ ...everything, colours: BOUGHT_COLOURS.filter(c => c !== 'pink' && c !== 'black') }))).toBe('colour:pink');
    expect(goalOf(wallet({ ...everything, colours: BOUGHT_COLOURS }))).toBeNull();
  });

  it('counts as something he can afford', () => {
    expect(affordable(wallet({ bolts: 3 }))).toEqual(BOUGHT_COLOURS.map(colourItem));
  });

  it('counts toward building everything', () => {
    expect(builtEverything(wallet({ ...everything }))).toBe(false);
    expect(builtEverything(wallet({ ...everything, colours: BOUGHT_COLOURS.filter(c => c !== 'white') }))).toBe(false);
    expect(builtEverything(wallet({ ...everything, colours: BOUGHT_COLOURS }))).toBe(true);
  });
});
