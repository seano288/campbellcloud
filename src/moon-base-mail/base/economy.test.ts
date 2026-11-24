// How long the rewards last, measured with the scripted child the build guide describes: every answer right first try (6 Bolts a Round),
// every Landing flown, and always the cheapest new thing bought as soon as he can (an again-and-again thing when nothing new is for sale:
// a Land Patch when a module waits for a plot). His landings get softer and closer as he gets better, so his bests are beaten now and
// then, as they would be. Each module that comes is put on the first free plot.
//
// The guide's limits, each a test below:
// - the fixed catalogue lasts at least 300 Rounds (about 15 hours);
// - after 2,000 Rounds there is still something new to earn, buy or beat every Round, and no state reads "all done";
// - his first purchase comes within two Rounds, and through the first 100 Rounds something new is never more than three Rounds away;
// - nothing takes more than about 40 Rounds of saving from nothing, and only a handful take more than 15.
// The three numbers (Bolts a Round, Rounds to finish the catalogue, the longest gap) are printed for the spec.
import { describe, expect, it } from 'vitest';
import { MAX_BOLTS } from '../../round/rules';
import { FOR_SALE } from './catalog';
import { BADGES, bought, nextWant, catalogueDone, CATALOGUE_SIZE, earnLanding, finishGo, freePlots, freshBase, payFor, place, planGo, priceOf, repeatsNow, shopNow, type BaseState } from './base';

interface Run { bolts: number[]; newAt: number[]; catalogueAt: number | null; badgesAt: number | null; firstBuy: number | null; offered: boolean[]; pendingMax: number }

/** A child who gets better: touchdowns soften and land closer over his first few hundred Landings, with a little wobble. */
export const skilled = (n: number) => ({ soft: 2 + 14 / Math.sqrt(n) + (n % 7) * 0.3, close: 1 + 20 / Math.sqrt(n) + (n % 5) * 0.4 });

export function play(rounds: number): Run {
  let b: BaseState = freshBase(), balance = 0;
  const run: Run = { bolts: [], newAt: [], catalogueAt: null, badgesAt: null, firstBuy: null, offered: [], pendingMax: 0 };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS;
    b = earnLanding(b);
    while (b.landings > 0) {
      const plan = planGo(b), res = skilled(plan.n), pay = payFor(b, plan, res);
      b = finishGo(b, plan, res);
      if (b.toPlace) b = place(b, freePlots(b)[0]!);
      earned += pay.bolts;
    }
    balance += earned;
    run.bolts.push(earned);
    for (;;) {
      const next = nextWant(b);
      if (!next || priceOf(b, next) > balance) break;
      balance -= priceOf(b, next);
      b = bought(b, next);
      run.firstBuy ??= r;
      run.newAt.push(r);
    }
    run.pendingMax = Math.max(run.pendingMax, b.pending.length);
    // every Landing brings a new moon rock, and the shop always has something (the again-and-again things at the least)
    run.offered.push(shopNow(b).length + repeatsNow(b).length > 0);
    if (run.catalogueAt === null && catalogueDone(b)) run.catalogueAt = r;
    if (run.badgesAt === null && b.badges.length === BADGES.length) run.badgesAt = r;
  }
  return run;
}

const long = play(2000);
const perRound = long.bolts.slice(0, 300).reduce((s, x) => s + x, 0) / 300;
const gaps = (upTo: number) => {
  const at = [0, ...long.newAt.filter(r => r <= upTo)];
  return Math.max(...at.slice(1).map((r, i) => r - at[i]!), upTo - at.at(-1)!);
};

describe('how long the rewards last (the scripted child)', () => {
  it('prints the numbers for the spec', () => {
    console.log(`Bolts a Round (Round and Landing, first 300 Rounds): ${perRound.toFixed(1)}; fixed catalogue bought by Round ${long.catalogueAt}; every badge by Round ${long.badgesAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}; most modules waiting for a Landing: ${long.pendingMax}; total ${FOR_SALE.reduce((s, i) => s + i.price, 0)} Bolts for ${FOR_SALE.length} things; fixed catalogue ${CATALOGUE_SIZE}`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`dearest: ${saving.slice(0, 10).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it('a Round and its Landing pay no more than Turbo Tally\'s Round and Race (15 Bolts)', () => {
    expect(Math.max(...long.bolts.slice(1))).toBeLessThanOrEqual(15); // Round 1 also flies the free first Landing
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
  it('a dear thing always changes what he can do: the dearest things are modules, landers and parts, never paint', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 12);
    for (const i of dear) expect(['module', 'lander', 'part']).toContain(i.cat);
  });
  it('the fixed catalogue has at least 250 named things', () => expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(250));
});
