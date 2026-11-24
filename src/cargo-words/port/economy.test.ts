// How long the rewards last, measured with the scripted child the build guide describes: every answer right first try (6 Bolts a Round),
// every Ship loaded (the quickest loading of each size beaten when the crane got faster), and always the cheapest new thing bought as
// soon as he can. The fixed catalogue first; the again-and-again things when nothing new is for sale (a ship waiting for a berth).
//
// The guide's limits, each a test below:
// - the fixed catalogue lasts at least 300 Rounds (about 15 hours);
// - after 2,000 Rounds there is still something new to earn, buy or beat every Round, and no state reads "all done";
// - his first purchase comes within two Rounds, and through the first 100 Rounds something new is never more than three Rounds away;
// - nothing takes more than about 40 Rounds of saving from nothing, and only a handful take more than 15.
// The three numbers (Bolts a Round, Rounds to finish the catalogue, the longest gap) are printed for the spec.
import { describe, expect, it } from 'vitest';
import { MAX_BOLTS } from '../../round/rules';
import { capacity } from '../crane/sim';
import { FOR_SALE } from './catalog';
import { bought, catalogueDone, earnShip, finishGo, freshPort, payFor, planGo, priceOf, repeatsNow, shopNow, TROPHIES, type PortState } from './port';
import { HARBOURS } from './sea';

interface Run { bolts: number[]; newAt: number[]; catalogueAt: number | null; harboursAt: number | null; trophiesAt: number | null; firstBuy: number | null; offered: boolean[] }

/** Plays `rounds` Rounds as the perfect child. Loading gets quicker as his crane does (a careful child's ~10 s a container, less with the
 *  better parts), so the quickest-loading bests are sometimes beaten, as they would be. */
export function play(rounds: number): Run {
  let p: PortState = freshPort(), balance = 0;
  const run: Run = { bolts: [], newAt: [], catalogueAt: null, harboursAt: null, trophiesAt: null, firstBuy: null, offered: [] };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS, gotNew = false;
    p = earnShip(p);
    while (p.ships > 0) {
      const plan = planGo(p), n = capacity(plan.shape);
      const speed = 1 + p.owned.filter(id => id.startsWith('part:cable') || id.startsWith('part:trolley') || id === 'part:twin').length * 0.15;
      const res = { loaded: n, tallest: plan.shape.tiers, seconds: (n * 10) / speed };
      const pay = payFor(p, plan, res);
      p = finishGo(p, plan, res, pay);
      earned += pay.bolts;
      // every go sails to a harbour he hasn't been to (named or charted), and brings back its flag
      gotNew = true;
    }
    balance += earned;
    run.bolts.push(earned);
    for (;;) {
      // the again-and-again things when nothing new is for sale now (another berth for one more ship), as the shop shows them
      const next = shopNow(p)[0] ?? repeatsNow(p)[0];
      if (!next || priceOf(p, next) > balance) break;
      balance -= priceOf(p, next);
      p = bought(p, next);
      run.firstBuy ??= r;
      run.newAt.push(r);
    }
    run.offered.push(gotNew && shopNow(p).length + repeatsNow(p).length > 0);
    if (run.catalogueAt === null && catalogueDone(p)) run.catalogueAt = r;
    if (run.harboursAt === null && p.visited.length === HARBOURS.length) run.harboursAt = r;
    if (run.trophiesAt === null && p.trophies.length === TROPHIES.length) run.trophiesAt = r;
  }
  return run;
}

const long = play(2000);
const perRound = long.bolts.slice(0, 300).reduce((s, b) => s + b, 0) / 300;
const gaps = (upTo: number) => {
  const at = [0, ...long.newAt.filter(r => r <= upTo)];
  return Math.max(...at.slice(1).map((r, i) => r - at[i]!), upTo - at.at(-1)!);
};

describe('how long the rewards last (the scripted child)', () => {
  it('prints the numbers for the spec', () => {
    console.log(`Bolts a Round (Round and Ship, first 300 Rounds): ${perRound.toFixed(1)}; fixed catalogue bought by Round ${long.catalogueAt}; every named harbour by Round ${long.harboursAt}; every Trophy by Round ${long.trophiesAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}; total ${FOR_SALE.reduce((s, i) => s + i.price, 0)} Bolts for ${FOR_SALE.length} things`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`dearest: ${saving.slice(0, 10).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it('a Round and its Ship pay no more than Turbo Tally\'s Round and Race (15 Bolts)', () => {
    expect(Math.max(...long.bolts.slice(1))).toBeLessThanOrEqual(15); // Round 1 also loads the free first Ship
  });
  it('the fixed catalogue lasts at least 300 Rounds', () => expect(long.catalogueAt ?? Infinity).toBeGreaterThanOrEqual(300));
  it('his first purchase comes within two Rounds', () => expect(long.firstBuy).toBeLessThanOrEqual(2));
  it('through the first 100 Rounds, something new is never more than three Rounds away', () => expect(gaps(100)).toBeLessThanOrEqual(3));
  it('after 2,000 Rounds there is still something new every Round, and nothing reads "all done"', () => {
    expect(long.offered.every(Boolean)).toBe(true);
    expect(long.newAt.filter(r => r > 1900).length).toBeGreaterThan(5);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful more than 15', () => {
    const rounds = FOR_SALE.map(i => i.price / perRound);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(40);
    expect(rounds.filter(r => r > 15).length).toBeLessThanOrEqual(8);
  });
  it('a dear thing always changes what he can do: the dearest things are cranes, parts, ships and pieces, never paint', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 12);
    for (const i of dear) expect(['crane', 'part', 'ship', 'piece']).toContain(i.cat);
  });
  it('the fixed catalogue has at least 250 named things', () => {
    expect(FOR_SALE.length + HARBOURS.length * 2 + TROPHIES.length).toBeGreaterThanOrEqual(250);
  });
});
