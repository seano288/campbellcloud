// How long the rewards last, measured with the scripted child the build guide describes: every answer right first try (6 Bolts a Round),
// every Flight flown with every star and a smooth landing (and every fire out in the water bomber), and always the cheapest new thing
// bought as soon as he can. The fixed catalogue first; once it's all bought, the again-and-again things.
//
// The guide's limits, each a test below:
// - the fixed catalogue lasts at least 300 Rounds (about 15 hours);
// - after 2,000 Rounds there is still something new on offer every Round, and no state reads "all done";
// - his first purchase comes within two Rounds, and through the first 100 Rounds something new is never more than three Rounds away;
// - nothing takes more than about 40 Rounds of saving from nothing, and only a handful take more than 15.
// The three numbers (Bolts a Round, Rounds to finish the catalogue, the longest gap) are printed for the spec.
import { describe, expect, it } from 'vitest';
import { MAX_BOLTS } from '../../round/rules';
import { FOR_SALE, PLANE_SPECS } from './catalog';
import {
  bought, catalogueDone, earnFlight, finishFlight, freshAirport, payFor, planFlight, priceOf, repeatsNow, routesFlown, shopNow, type AirportState,
} from './airport';
import { ROUTES } from './routes';

interface Run { rounds: number; bolts: number[]; newAt: number[]; catalogueAt: number | null; routesAt: number | null; firstBuy: number | null; offered: boolean[]; trophiesAt: number | null }

/** Plays `rounds` Rounds as the perfect child. `repeats`: buy the again-and-again things once the fixed catalogue is done. */
export function play(rounds: number): Run {
  let a: AirportState = freshAirport(), balance = 0;
  const run: Run = { rounds, bolts: [], newAt: [], catalogueAt: null, routesAt: null, firstBuy: null, offered: [], trophiesAt: null };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS, gotNew = false;
    a = earnFlight(a);
    // fly every Flight he has (the first is free)
    while (a.flights > 0) {
      const plan = planFlight(a), res = { stars: plan.dest.stars.length, grade: 3 as const, fires: PLANE_SPECS[plan.plane].ability === 'water' ? plan.dest.fires.length : 0 };
      const pay = payFor(a, plan, res);
      a = finishFlight(a, plan, res, pay);
      earned += pay.bolts;
      // something new to beat: a new Route, a Charter (each is new), a prize, a rank, a Trophy
      if (pay.newRoute || plan.mode === 'charter' || pay.prize || pay.rank || pay.trophies.length) gotNew = true;
    }
    balance += earned;
    run.bolts.push(earned);
    // buy the cheapest new thing, as often as he can
    for (;;) {
      const next = shopNow(a)[0] ?? (catalogueDone(a) ? repeatsNow(a)[0] : undefined);
      if (!next || priceOf(a, next) > balance) break;
      balance -= priceOf(a, next);
      a = bought(a, next);
      run.firstBuy ??= r;
      run.newAt.push(r);
      gotNew = true;
    }
    run.offered.push(gotNew || shopNow(a).length + repeatsNow(a).length > 0);
    if (run.catalogueAt === null && catalogueDone(a)) run.catalogueAt = r;
    if (run.routesAt === null && routesFlown(a) === ROUTES.length) run.routesAt = r;
    if (run.trophiesAt === null && a.trophies.length === 29) run.trophiesAt = r;
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
    console.log(`Bolts a Round (Round and Flight, first 300 Rounds): ${perRound.toFixed(1)}; fixed catalogue bought by Round ${long.catalogueAt}; every Route flown by Round ${long.routesAt}; every Trophy by Round ${long.trophiesAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`dearest: ${saving.slice(0, 10).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it('a Round and its Flight pay no more than Turbo Tally\'s Round and Race (15 Bolts)', () => {
    expect(Math.max(...long.bolts.slice(1))).toBeLessThanOrEqual(15); // Round 1 also flies the free first Flight
  });
  it('the fixed catalogue lasts at least 300 Rounds', () => {
    expect(long.catalogueAt ?? Infinity).toBeGreaterThanOrEqual(300);
  });
  it('his first purchase comes within two Rounds', () => expect(long.firstBuy).toBeLessThanOrEqual(2));
  it('through the first 100 Rounds, something new is never more than three Rounds away', () => expect(gaps(100)).toBeLessThanOrEqual(3));
  it('after 2,000 Rounds there is still something new every Round, and nothing reads "all done"', () => {
    expect(long.offered.every(Boolean)).toBe(true);
    // the last 100 Rounds still buy things (the again-and-again things) and fly new Charters
    expect(long.newAt.filter(r => r > 1900).length).toBeGreaterThan(5);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful more than 15', () => {
    const rounds = FOR_SALE.map(i => i.price / perRound);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(40);
    expect(rounds.filter(r => r > 15).length).toBeLessThanOrEqual(8);
  });
  it('a dear thing always changes what he can do: the dearest things are planes and pieces, never paint', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 12);
    for (const i of dear) expect(['plane', 'piece']).toContain(i.cat);
  });
});
