// The saved game, the Airfield, and the economy: what a Round and a Show pay, what there is to earn, how the Shows open, and the voice.
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { boltsFor } from '../round/rules';
import { createStore, type BackingStore } from '../save/storage';
import { earnings, keepCard, SAVE_KEY, SAVE_VERSION, settleShow, skySave } from './game';
import { ALL_KEYS, ALL_NAMES, ENGINES, FOR_SALE, item, keyOf, PLANES, PLAY_TABS, STARTERS, TABLES, TABS, TOTAL_PRICE, type Item } from './airfield/parts';
import {
  earnShow, finishShow, fit, flight, freshAirfield, goalOf, isOwned, keepPostcard, MAX_POSTCARDS, nextShow, proposePurchase, readAirfield, SHOW_BOLTS, specialTrick, takeDown, toggle,
  type AirfieldState,
} from './airfield/state';
import { SHOW_IDS, SHOWS } from './show/places';
import { PHRASES } from './phrases';
import { CLIPS } from './voice.gen';
import { STROKE_WORDS } from './letters/strokes';

const memory = (): BackingStore & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, read: k => data.get(k) ?? null, write: (k, v) => { data.set(k, v); } };
};
const card = { show: 'beach' as const, smoke: 'red' as const, shape: 'plain' as const, pts: [10, 20, 30, 40, -1, 50, 60, 70, 80] };

describe('the save', () => {
  it('round-trips, under its own key, and reads an unknown version or junk as a blank save', () => {
    const fresh = skySave.fresh();
    expect(skySave.decode(JSON.parse(JSON.stringify(skySave.encode(fresh))))).toEqual(fresh);
    expect(SAVE_KEY).toBe('sky-writer-save');
    expect(skySave.decode({ version: SAVE_VERSION + 1, balance: 50 })).toEqual(fresh);
    expect(skySave.decode('junk')).toEqual(fresh);
  });
  it('keeps a well-played save whole', () => {
    let a: AirfieldState = { ...freshAirfield(), owned: [...STARTERS, 'plane:jet', 'engine:e1', 'gear:magnet', 'trick:heart'], fitted: { ...freshAirfield().fitted, plane: 'jet', engine: 'e1', trick: 'heart' }, off: ['magnet'], shows: 2, opened: 3, flown: ['beach', 'city'], done: 4, postcards: [card], pick: 'city' };
    a = readAirfield(JSON.parse(JSON.stringify(a)));
    const back = skySave.decode(JSON.parse(JSON.stringify(skySave.encode({ ...skySave.fresh(), currency: { balance: 33 }, airfield: a }))));
    expect(back.airfield).toEqual(a);
    expect(back.currency.balance).toBe(33);
  });
  it('never trusts a save: nothing fitted that isn\'t owned, no place open he hasn\'t flown his way to, no broken postcards', () => {
    const a = readAirfield({ owned: ['nope', 'plane:jet'], fitted: { plane: 'dragon', engine: 'e5', paint: 'gold' }, opened: 16, flown: ['beach', 'nope'], shows: -2, postcards: [card, { show: 'mars', pts: [1, 2] }, { show: 'city', pts: [1, 2, 3, 4, 999] }], pick: 'space' });
    expect(a.fitted.plane).toBe('biplane');
    expect(a.fitted.engine).toBe('e0');
    expect(a.opened).toBe(2);
    expect(a.flown).toEqual(['beach']);
    expect(a.shows).toBe(0);
    expect(a.postcards).toHaveLength(2);
    expect(a.postcards[1]!.pts).toEqual([1, 2, 3, 4]);
    expect(a.pick).toBeNull();
    expect(a.owned).toEqual([...STARTERS, 'plane:jet']);
  });
  it('is written to storage through the shared store', async () => {
    const backing = memory(), store = createStore({ key: SAVE_KEY, adapter: skySave, backing });
    await store.load();
    const c = store.commit(s => ({ ...s, currency: { balance: 7 } }));
    if (c.kind === 'accepted') await c.saved;
    expect(JSON.parse(backing.data.get(SAVE_KEY)!)).toMatchObject({ version: SAVE_VERSION, balance: 7 });
  });
});

describe('the Airfield', () => {
  it('has about 150 things to earn, many that change how a Show plays, and no price over 100', () => {
    for (const k of ALL_KEYS) { expect(item(k).price).toBeLessThanOrEqual(100); expect(item(k).price).toBeGreaterThanOrEqual(0); }
    const bought = FOR_SALE.length, earned = (SHOWS.length - 1) + SHOWS.length; // places opened, and their patches
    expect(PLANES).toHaveLength(12);
    expect(bought).toBeGreaterThanOrEqual(110);
    expect(bought + earned).toBeGreaterThanOrEqual(148);
    const playing = FOR_SALE.filter(k => PLAY_TABS.includes(k.split(':')[0] as never));
    expect(playing.length).toBeGreaterThanOrEqual(40);
    expect(TOTAL_PRICE).toBeGreaterThan(2500);
    expect(SHOWS).toHaveLength(16);
  });
  it('names every thing in a recorded phrase, once', () => {
    for (const n of ALL_NAMES) expect(PHRASES as readonly string[]).toContain(n);
    for (const t of TABS) { const ids = (TABLES[t] as readonly Item[]).map(i => i.id); expect(new Set(ids).size).toBe(ids.length); }
    for (const s of SHOWS) expect(PHRASES as readonly string[]).toContain(s.name);
  });
  it('sells a thing once, for its price, only when he has the Bolts, and fits a part as it\'s bought', () => {
    const a = freshAirfield();
    expect(proposePurchase(a, 'engine:e1', 7)).toMatchObject({ kind: 'rejected', reason: 'short' });
    const p = proposePurchase(a, 'engine:e1', 8);
    expect(p).toMatchObject({ kind: 'ready', cost: 8 });
    if (p.kind !== 'ready') return;
    expect(p.state.fitted.engine).toBe('e1');
    expect(proposePurchase(p.state, 'engine:e1', 99)).toMatchObject({ kind: 'rejected', reason: 'owned' });
  });
  it('makes the plane faster with an Engine, turn tighter with Wings, smoke longer with a Tank, speed up quicker with a Propeller', () => {
    const a = freshAirfield(), base = flight(a);
    const up = (k: Parameters<typeof keyOf>[0], id: string) => { const p = proposePurchase(a, keyOf(k, id as never), 100); if (p.kind !== 'ready') throw new Error('not sold'); return flight(p.state); };
    expect(up('engine', 'e5').speed).toBeGreaterThan(base.speed * 1.5);
    expect(up('wings', 'w5').turn).toBeGreaterThan(base.turn * 1.5);
    expect(up('tank', 't5').trail).toBeGreaterThan(base.trail * 2);
    expect(up('prop', 'p5').accel).toBeGreaterThan(base.accel * 1.5);
    expect(up('plane', 'dragon').speed).toBeGreaterThan(base.speed);
    expect(ENGINES.map(e => e.price)).toEqual([...ENGINES.map(e => e.price)].sort((x, y) => x - y));
  });
  it('fits what he owns, switches Gear on and off, and keeps Loop and Roll on their own buttons', () => {
    let a = { ...freshAirfield(), owned: [...STARTERS, 'plane:jet', 'gear:shield', 'trick:star'] as AirfieldState['owned'] };
    a = fit(a, 'plane:jet')!;
    expect(a.fitted.plane).toBe('jet');
    expect(fit(a, 'plane:dragon')).toBeNull();
    expect(toggle(a, 'shield')!.off).toEqual(['shield']);
    expect(toggle(a, 'magnet')).toBeNull();
    expect(specialTrick(a)).toBeNull();
    a = fit(a, 'trick:star')!;
    expect(specialTrick(a)).toBe('star');
    expect(fit(a, 'trick:loop')).toBeNull();
  });
  it('makes the next Rung the Goal, then the cheapest thing left', () => {
    expect(goalOf(freshAirfield())).toMatch(/^(engine|wings|tank|prop):/);
    const all = { ...freshAirfield(), owned: [...ALL_KEYS.filter(k => /^(engine|wings|tank|prop):/.test(k))] };
    expect(item(goalOf(all)!).price).toBe(Math.min(...FOR_SALE.filter(k => !all.owned.includes(k)).map(k => item(k).price)));
    expect(goalOf({ ...all, goal: 'plane:dragon' })).toBe('plane:dragon');
    expect(isOwned(all, 'plane:dragon')).toBe(false);
  });
});

describe('the Shows', () => {
  it('starts with one free Show at the beach; each Round earns one more', () => {
    const a = freshAirfield();
    expect(a.shows).toBe(1);
    expect(nextShow(a)).toBe('beach');
    expect(earnShow(a).shows).toBe(2);
  });
  it('opens the next place when he flies a place he hasn\'t flown, and gives its patch once', () => {
    let a = { ...freshAirfield(), shows: 3 };
    const one = finishShow(a, 'beach')!;
    expect(one).toMatchObject({ patch: true, opens: 'city' });
    a = one.state;
    expect(a.opened).toBe(2);
    expect(nextShow(a)).toBe('city');
    const again = finishShow(a, 'beach')!;
    expect(again).toMatchObject({ patch: false, opens: null });
    expect(again.state.opened).toBe(2);
    expect(finishShow({ ...a, shows: 0 }, 'beach')).toBeNull();
    expect(finishShow(a, 'space')).toBeNull();
  });
  it('opens all sixteen places, one new Show at a time', () => {
    let a = { ...freshAirfield(), shows: 100 };
    for (let i = 0; i < 16; i++) a = finishShow(a, nextShow(a))!.state;
    expect(a.opened).toBe(16);
    expect(a.flown).toEqual([...SHOW_IDS]);
  });
  it('uses a Show and pays its Bolts only when its rings are done, once', async () => {
    const backing = memory(), store = createStore({ key: SAVE_KEY, adapter: skySave, backing });
    await store.load();
    expect(settleShow(store, 'beach')).toEqual({ patch: true, opens: 'city' });
    expect(store.state.peek().currency.balance).toBe(SHOW_BOLTS);
    expect(store.state.peek().airfield.shows).toBe(0);
    expect(settleShow(store, 'beach')).toBeNull();
  });
  it('keeps postcards until the Wall is full, and takes one down only when he does', async () => {
    let a = freshAirfield();
    for (let i = 0; i < MAX_POSTCARDS; i++) a = keepPostcard(a, card)!;
    expect(keepPostcard(a, card)).toBeNull();
    expect(takeDown(a, 3)!.postcards).toHaveLength(MAX_POSTCARDS - 1);
    expect(takeDown(a, 99)).toBeNull();
    const backing = memory(), store = createStore({ key: SAVE_KEY, adapter: skySave, backing });
    await store.load();
    expect(keepCard(store, card)).toBe(true);
    expect(store.state.peek().airfield.postcards).toHaveLength(1);
  });
});

describe('the economy', () => {
  it('pays a Bolt for each first-try answer and one for finishing, and two for a Show', () => {
    expect(earnings({ results: [{ outcome: 'clean' }, { outcome: 'clean' }, { outcome: 'missed' }, { outcome: 'helped' }, { outcome: 'clean' }] } as never)).toBe(boltsFor(['clean', 'clean', 'missed', 'helped', 'clean']));
    expect(boltsFor(['clean', 'clean', 'clean', 'clean', 'clean'])).toBe(6);
    expect(SHOW_BOLTS).toBe(2);
  });
  it('buys a first Rung within about two Rounds, and everything in a few hundred', () => {
    const cheapestRung = Math.min(...FOR_SALE.filter(k => /^(engine|wings|tank|prop):/.test(k)).map(k => item(k).price));
    expect(cheapestRung).toBeLessThanOrEqual(2 * (6 + SHOW_BOLTS));
    const rounds = TOTAL_PRICE / (6 + SHOW_BOLTS);
    expect(rounds).toBeGreaterThan(300);
    expect(rounds).toBeLessThan(600);
  });
});

describe('the voice', () => {
  it('has a recorded clip for every phrase, each real audio', () => {
    for (const p of PHRASES) {
      const file = (CLIPS as Record<string, string>)[p];
      expect(file, p).toBeTruthy();
      const path = resolve(import.meta.dirname, '../../public/sky-writer-voice', file!);
      expect(existsSync(path), `${p} → ${file}`).toBe(true);
      expect(statSync(path).size, p).toBeGreaterThan(1500);
    }
  });
  it('says every stroke with the small shared set of stroke words', () => {
    for (const w of STROKE_WORDS) expect(PHRASES).toContain(w);
  });
});
