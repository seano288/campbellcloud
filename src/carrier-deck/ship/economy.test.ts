// How long the rewards last, measured with the scripted child the build guide describes: every answer right first try (6 Bolts a Round,
// what the Round really pays), every Mission flown with every star and the wire he aims for, and always the cheapest new thing bought as
// soon as he can. The fixed catalogue first; once it's all bought, the again-and-again things.
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
import { bought, catalogueDone, earnMission, finishMission, fixedFlown, freshShip, payFor, planMission, priceOf, repeatsNow, shopNow, TROPHIES, type ShipState } from './ship';
import { FIXED_COUNT } from './missions';

interface Run { rounds: number; bolts: number[]; newAt: number[]; catalogueAt: number | null; missionsAt: number | null; trophiesAt: number | null; firstBuy: number | null; offered: boolean[] }

export function play(rounds: number): Run {
  let a: ShipState = freshShip(), balance = 0;
  const run: Run = { rounds, bolts: [], newAt: [], catalogueAt: null, missionsAt: null, trophiesAt: null, firstBuy: null, offered: [] };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS, gotNew = false;
    a = earnMission(a);
    while (a.missions > 0) {
      const plan = planMission(a), res = { stars: 3 as const, wire: 1, grade: 3 as const };
      const pay = payFor(a, plan, res);
      a = finishMission(a, plan, res, pay);
      earned += pay.bolts;
      // something new to beat: every new Mission (a patch, a port, a prize), a rank, a medal
      if (pay.isNew || pay.prize || pay.rank || pay.trophies.length) gotNew = true;
    }
    balance += earned;
    run.bolts.push(earned);
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
    if (run.missionsAt === null && fixedFlown(a) === FIXED_COUNT) run.missionsAt = r;
    if (run.trophiesAt === null && a.trophies.length === TROPHIES.length) run.trophiesAt = r;
  }
  return run;
}

const long = play(2000);
export const perRound = long.bolts.slice(0, 300).reduce((s, b) => s + b, 0) / 300;
const gaps = (upTo: number) => {
  const at = [0, ...long.newAt.filter(r => r <= upTo)];
  return Math.max(...at.slice(1).map((r, i) => r - at[i]!), upTo - at.at(-1)!);
};

describe('how long the rewards last (the scripted child)', () => {
  it('prints the numbers for the spec', () => {
    console.log(`Bolts a Round (Round and Mission, first 300 Rounds): ${perRound.toFixed(1)}; fixed catalogue bought by Round ${long.catalogueAt}; every hand-made Mission by Round ${long.missionsAt}; every medal by Round ${long.trophiesAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}, in the first 1000: ${gaps(1000)}; for sale ${FOR_SALE.length} things, ${FOR_SALE.reduce((s, i) => s + i.price, 0)} Bolts`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`dearest: ${saving.slice(0, 12).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it('a Round and its Mission pay no more than Turbo Tally\'s Round and Race (15 Bolts)', () => {
    expect(Math.max(...long.bolts.slice(1))).toBeLessThanOrEqual(15); // Round 1 also flies the free first Mission
  });
  it('the fixed catalogue lasts at least 300 Rounds', () => expect(long.catalogueAt ?? Infinity).toBeGreaterThanOrEqual(300));
  it('his first purchase comes within two Rounds', () => expect(long.firstBuy).toBeLessThanOrEqual(2));
  it('through the first 100 Rounds, something new to buy is never more than three Rounds away', () => expect(gaps(100)).toBeLessThanOrEqual(3));
  it('after 2,000 Rounds there is still something new every Round, and nothing reads "all done"', () => {
    expect(long.offered.every(Boolean)).toBe(true);
    // the last 100 Rounds still buy things (the Yard's ships) and fly new Missions
    expect(long.newAt.filter(r => r > 1900).length).toBeGreaterThan(5);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful more than 15', () => {
    const rounds = FOR_SALE.map(i => i.price / perRound);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(40);
    expect(rounds.filter(r => r > 15).length).toBeLessThanOrEqual(8);
  });
  it('a dear thing always changes what he can do: the dearest things are aircraft, ship parts and Fleet ships, never a paint', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 15);
    for (const i of dear) expect(['aircraft', 'part', 'fleet']).toContain(i.cat);
  });
});
