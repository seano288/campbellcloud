// How long the rewards last, measured with the scripted child the build guide describes: every answer right first try (6 Flames a
// Round, what a Round really pays), every Flight flown by the skilled child of the Flight tests (paid what the game pays: the Flames it
// catches and the bonus for lighting every beacon), every warm egg hatched and named at once, and always the cheapest new thing bought as
// soon as he can (putting each trick on a button if there is room). The fixed catalogue first; once it's all bought, the
// again-and-again things.
//
// The guide's limits, each a test below:
// - the fixed catalogue lasts at least 300 Rounds (about 15 hours);
// - after 2,000 Rounds there is still something new to earn, buy or beat every Round, and no state reads "all done";
// - his first purchase comes within two Rounds, and through the first 100 Rounds something new is never more than three Rounds away;
// - nothing takes more than about 40 Rounds of saving from nothing, and only a handful take more than 15.
// The three numbers (Flames a Round, Rounds to finish the catalogue, the longest gap) are printed for the spec.
import { describe, expect, it } from 'vitest';
import { MAX_BOLTS } from '../../round/rules';
import { PRICE_TOP } from '../phrases';
import { flyWith, resultOf } from '../flight/sim';
import { FOR_SALE, itemOf, repeatPrice, REPEAT_IDS } from './catalog';
import { NAME_ADJECTIVES, NAME_NOUNS } from './dragons';
import {
  bought, CATALOGUE_SIZE, catalogueDone, earnFlight, finishFlight, freshRoost, hatch, isReady, name, payFor, planFlight, priceOf, repeatsNow, shopNow, unnamed,
  type RoostState,
} from './roost';

interface Run { flames: number[]; newAt: number[]; catalogueAt: number | null; firstBuy: number | null; offered: boolean[]; cheapest: number[]; hatched: number; dragons: number }
/** `wild`: he also takes a Wild Egg whenever it is the cheapest new thing (the first child saves for the whole catalogue first). */
export function play(rounds: number, wild = false): Run {
  let a: RoostState = freshRoost(), balance = 0;
  const run: Run = { flames: [], newAt: [], catalogueAt: null, firstBuy: null, offered: [], cheapest: [], hatched: 0, dragons: 0 };
  const nameAll = () => { for (let d = unnamed(a); d; d = unnamed(a)) a = name(a, d.id, [NAME_ADJECTIVES[d.id % NAME_ADJECTIVES.length]!, NAME_NOUNS[d.id % NAME_NOUNS.length]!])!; };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS, gotNew = false;
    a = earnFlight(a);
    nameAll();
    while (a.flights > 0) {
      const plan = planFlight(a), res = resultOf(flyWith(plan.c, 'skilled', plan.fly, r));
      const pay = payFor(a, plan, res);
      a = finishFlight(a, plan, res);
      earned += pay.flames;
      gotNew ||= plan.fresh; // every Round's Flight is a place he hasn't flown
    }
    for (let i = a.eggs.findIndex(e => isReady(a, e)); i >= 0; i = a.eggs.findIndex(e => isReady(a, e))) { a = hatch(a, i)!.state; run.hatched++; gotNew = true; }
    nameAll();
    balance += earned;
    run.flames.push(earned);
    for (;;) {
      const wilds = wild ? repeatsNow(a).filter(w => w.kind === 'more' && w.id === 'wild') : [];
      const next = [...shopNow(a), ...wilds].sort((x, y) => priceOf(a, x) - priceOf(a, y))[0] ?? (catalogueDone(a) ? repeatsNow(a)[0] : undefined);
      if (!next || priceOf(a, next) > balance) break;
      balance -= priceOf(a, next);
      a = bought(a, next);
      run.firstBuy ??= r;
      run.newAt.push(r);
      gotNew = true;
    }
    run.offered.push(gotNew && shopNow(a).length + repeatsNow(a).length > 0);
    // the cheapest new thing he could save for now (not a New Ledge: an empty nest is nothing to see until an egg is in it); an egg
    // already warming is something new coming
    run.cheapest.push(a.eggs.length ? 0 : Math.min(...[...shopNow(a), ...repeatsNow(a).filter(w => w.kind === 'more' && w.id !== 'ledge')].map(w => priceOf(a, w))));
    if (run.catalogueAt === null && catalogueDone(a)) run.catalogueAt = r;
  }
  run.dragons = a.dragons.length;
  return run;
}

const long = play(2000), wilder = play(2000, true);
export const perRound = long.flames.slice(0, 300).reduce((s, b) => s + b, 0) / 300;
const gaps = (upTo: number, run = long) => {
  const at = [0, ...run.newAt.filter(r => r <= upTo)];
  return Math.max(...at.slice(1).map((r, i) => r - at[i]!), upTo - at.at(-1)!);
};

describe('how long the rewards last (the scripted child)', () => {
  it('prints the numbers for the spec', () => {
    console.log(`Flames a Round (Round and Flight, first 300 Rounds): ${perRound.toFixed(2)}; fixed catalogue bought by Round ${long.catalogueAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}, in the first 1000: ${gaps(1000)}, in 2000: ${gaps(2000)}; for sale ${FOR_SALE.length} things, ${FOR_SALE.reduce((s, i) => s + i.price, 0)} Flames; catalogue ${CATALOGUE_SIZE} named things; dragons after 2000 Rounds ${long.dragons}`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`a child who also takes Wild Eggs: longest gap between purchases in the first 1000 Rounds ${gaps(1000, wilder)}, in 2000 ${gaps(2000, wilder)}; catalogue bought by Round ${wilder.catalogueAt ?? 'not in 2000'}; dragons after 2000 Rounds ${wilder.dragons}`);
    console.log(`dearest: ${saving.slice(0, 12).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it('a Round and its Flight pay at most 10 Flames, under Turbo Tally\'s ceiling of 15', () => {
    expect(Math.max(...long.flames.slice(1))).toBeLessThanOrEqual(10); // Round 1 also flies the free first Flight
  });
  it('the fixed catalogue lasts at least 300 Rounds', () => expect(long.catalogueAt ?? Infinity).toBeGreaterThanOrEqual(300));
  it('his first purchase comes within two Rounds', () => expect(long.firstBuy).toBeLessThanOrEqual(2));
  it('through the first 100 Rounds, something new to buy is never more than three Rounds away', () => expect(gaps(100)).toBeLessThanOrEqual(3));
  it('after 2,000 Rounds there is still something new every Round, and nothing reads "all done"', () => {
    expect(long.offered.every(Boolean)).toBe(true);
    expect(long.newAt.filter(r => r > 1900).length).toBeGreaterThan(5);
    expect(long.dragons).toBeGreaterThan(100);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful more than 15', () => {
    const rounds = FOR_SALE.map(i => i.price / perRound);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(40);
    expect(rounds.filter(r => r > 15).length).toBeLessThanOrEqual(8);
    for (const id of REPEAT_IDS) for (let k = 0; k < 500; k++) expect(repeatPrice(id, k) / perRound).toBeLessThanOrEqual(15);
  });
  it('a cheap new thing always sits beside the dear ones: never more than eight Rounds of saving away, or an egg is warming', () => {
    // pass 2: with Wild Eggs waiting for all forty named eggs, Rounds 550 to 884 offered only things at 120 to 180
    expect(Math.max(...long.cheapest) / perRound).toBeLessThanOrEqual(8);
  });
  it('a child who takes Wild Eggs as they open is never more than eight Rounds from something new to buy', () => {
    expect(gaps(2000, wilder)).toBeLessThanOrEqual(8);
    expect(wilder.offered.every(Boolean)).toBe(true);
  });
  it('a dear thing always changes what he can do: the dearest are eggs, saddles, breath gear, magnets, belts and roost pieces that do something', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 20);
    for (const i of dear) {
      expect(['egg', 'gear', 'roost', 'trick']).toContain(i.cat);
      const it = itemOf(i.id);
      if (it.cat === 'roost') expect(it.does).not.toBe('look');
      if (it.cat === 'gear') expect(['saddle', 'magnet', 'breath', 'belt']).toContain(it.slot);
    }
  });
  it(`prices past 100 are whole tens up to ${PRICE_TOP}, so the voice can say them`, () => {
    for (const i of FOR_SALE) { expect(i.price).toBeLessThanOrEqual(PRICE_TOP); if (i.price > 100) expect(i.price % 10).toBe(0); }
    for (const id of REPEAT_IDS) for (let k = 0; k < 60; k++) { const p = repeatPrice(id, k); expect(p).toBeLessThanOrEqual(PRICE_TOP); if (p > 100) expect(p % 10).toBe(0); }
    const a = freshRoost();
    expect(priceOf(a, { kind: 'more', id: 'ledge' })).toBe(40);
  });
  it('has at least 250 named things to earn in the fixed catalogue', () => expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(250));
});
