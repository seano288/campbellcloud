// How long the rewards last, measured with the scripted child the build guide describes: every answer right first try (6 Tokens a Round,
// what the Round really pays), every Ride taken (on the next Guest Coaster, which pays the most: the photo taken and a new coaster each
// time), and always the cheapest new thing bought as soon as he can. The fixed catalogue first; once it's all bought, the again-and-again
// things (more track, cars, land, coasters).
//
// The guide's limits, each a test below:
// - the fixed catalogue lasts at least 300 Rounds (about 15 hours);
// - after 2,000 Rounds there is still something new to earn, buy or beat every Round, and no state reads "all done";
// - his first purchase comes within two Rounds, and through the first 100 Rounds something new is never more than three Rounds away;
// - nothing takes more than about 40 Rounds of saving from nothing, and only a handful take more than 15.
// The three numbers (Tokens a Round, Rounds to finish the catalogue, the longest gap) are printed for the spec.
import { describe, expect, it } from 'vitest';
import { MAX_BOLTS } from '../../round/rules';
import { FOR_SALE, itemOf, REPEAT_IDS, repeatPrice } from './catalog';
import { bought, catalogueDone, CATALOGUE_SIZE, earnRide, finishRide, freshYard, payFor, planRide, priceOf, repeatsNow, shopNow, type YardState } from './yard';

interface Run { tokens: number[]; newAt: number[]; catalogueAt: number | null; firstBuy: number | null; offered: boolean[]; prizes: number }
export function play(rounds: number): Run {
  let y: YardState = freshYard(), balance = 0;
  const run: Run = { tokens: [], newAt: [], catalogueAt: null, firstBuy: null, offered: [], prizes: 0 };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS, gotNew = false;
    y = earnRide(y);
    while (y.rides > 0) {
      const plan = planRide(y, 'guest')!, res = { photo: true, stars: 5, starsOf: 5 };
      const pay = payFor(y, plan, res);
      y = finishRide(y, plan, res);
      earned += pay.tokens;
      gotNew = true; // every Guest Coaster is one he hasn't ridden
      if (pay.prize) run.prizes++;
    }
    balance += earned;
    run.tokens.push(earned);
    for (;;) {
      const next = shopNow(y)[0] ?? (catalogueDone(y) ? repeatsNow(y)[0] : undefined);
      if (!next || priceOf(y, next) > balance) break;
      balance -= priceOf(y, next);
      y = bought(y, next);
      run.firstBuy ??= r;
      run.newAt.push(r);
      gotNew = true;
    }
    run.offered.push(gotNew && shopNow(y).length + repeatsNow(y).length > 0);
    if (run.catalogueAt === null && catalogueDone(y)) run.catalogueAt = r;
  }
  return run;
}

const long = play(2000);
export const perRound = long.tokens.slice(0, 300).reduce((s, b) => s + b, 0) / 300;
const gaps = (upTo: number) => {
  const at = [0, ...long.newAt.filter(r => r <= upTo)];
  return Math.max(...at.slice(1).map((r, i) => r - at[i]!), upTo - at.at(-1)!);
};

describe('how long the rewards last (the scripted child)', () => {
  it('prints the numbers for the spec', () => {
    console.log(`Tokens a Round (Round and Ride, first 300 Rounds): ${perRound.toFixed(1)}; fixed catalogue bought by Round ${long.catalogueAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}, in the first 1000: ${gaps(1000)}; for sale ${FOR_SALE.length} things, ${FOR_SALE.reduce((s, i) => s + i.price, 0)} Tokens; prizes won in 2000 Rounds ${long.prizes}; named things ${CATALOGUE_SIZE}`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`dearest: ${saving.slice(0, 12).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it("a Round and its Ride pay no more than Turbo Tally's Round and Race (15 Tokens)", () => {
    expect(Math.max(...long.tokens)).toBeLessThanOrEqual(15);
  });
  it('the fixed catalogue lasts at least 300 Rounds', () => expect(long.catalogueAt ?? Infinity).toBeGreaterThanOrEqual(300));
  it('his first purchase comes within two Rounds', () => expect(long.firstBuy).toBeLessThanOrEqual(2));
  it('through the first 100 Rounds, something new to buy is never more than three Rounds away', () => expect(gaps(100)).toBeLessThanOrEqual(3));
  it('after 2,000 Rounds there is still something new every Round, and nothing reads "all done"', () => {
    expect(long.offered.every(Boolean)).toBe(true);
    // the last 100 Rounds still buy things (more land and new coasters) and ride new Guest Coasters
    expect(long.newAt.filter(r => r > 1900).length).toBeGreaterThan(5);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful more than 15', () => {
    const rounds = FOR_SALE.map(i => i.price / perRound);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(40);
    expect(rounds.filter(r => r > 15).length).toBeLessThanOrEqual(8);
  });
  it('a dear thing always changes what he can do: the dearest are pieces, cars that carry more riders and rides, never a paint', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 15);
    for (const i of dear) expect(['piece', 'body', 'ride']).toContain(i.cat);
    const paints = FOR_SALE.filter(i => i.cat === 'paint' || i.cat === 'stripe' || i.cat === 'hat' || i.cat === 'balloon');
    expect(Math.max(...paints.map(i => i.price))).toBeLessThan(40);
  });
  it('a cheap thing always sits beside a dear one: every tab has things under 15 Tokens', () => {
    for (const cats of [['piece', 'style'], ['body', 'front', 'paint', 'stripe', 'riders'], ['ride', 'stand'], ['theme', 'hat', 'balloon']]) {
      expect(FOR_SALE.filter(i => cats.includes(i.cat) && i.price < 15).length).toBeGreaterThan(2);
    }
  });
  it('prices past 100 are whole tens up to 400, so the voice can say them', () => {
    for (const i of FOR_SALE) { expect(i.price).toBeLessThanOrEqual(400); if (i.price > 100) expect(i.price % 10).toBe(0); }
    for (const id of REPEAT_IDS) for (let k = 0; k < 60; k++) { const p = repeatPrice(id, k); expect(p).toBeLessThanOrEqual(400); if (p > 100) expect(p % 10).toBe(0); }
  });
  it('has at least 250 named things to earn in the fixed catalogue', () => {
    expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(250);
    expect(new Set(FOR_SALE.map(i => i.name)).size).toBe(FOR_SALE.length);
    void itemOf;
  });
});
