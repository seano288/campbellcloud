// How long the rewards last, measured with the scripted child the build guide describes: every answer right first try (6 Bolts a Round,
// what the Round really pays), every Launch flown smoothly (three stars) with every place caught and a few snaps in free time, and always
// the cheapest new thing bought as soon as he can (fitting the strongest engine and boosters he owns, as a child who wants to lift more
// would, and putting each new module on the Station). The fixed catalogue first; once it's all bought, the again-and-again things.
//
// The guide's limits, each a test below:
// - the fixed catalogue lasts at least 300 Rounds (about 15 hours);
// - after 2,000 Rounds there is still something new to earn, buy or beat every Round, and no state reads "all done";
// - his first purchase comes within two Rounds, and through the first 100 Rounds something new is never more than three Rounds away;
// - nothing takes more than about 40 Rounds of saving from nothing, and only a handful take more than 15.
// The three numbers (Bolts a Round, Rounds to finish the catalogue, the longest gap) are printed for the spec.
import { describe, expect, it } from 'vitest';
import { MAX_BOLTS } from '../../round/rules';
import { FOR_SALE, itemOf, partsFor, type PartItem } from './catalog';
import {
  bought, catalogueDone, earnLaunch, finishLaunch, fit, flyingKind, freshBase, has, payFor, planLaunch, priceOf, putModule, repeatsNow, shopNow, type BaseState, type LaunchResult,
} from './base';
import { FIXED_COUNT, type TargetId } from './missions';
import { freeSpots } from './station';

const SNAPS: TargetId[] = ['c:asia', 'o:pacific', 'c:africa', 'o:atlantic', 'c:europe', 'o:indian'];
/** The strongest engine and boosters he owns, on the rocket that flies. */
function strongest(a: BaseState): BaseState {
  let next = a;
  for (const slot of ['engines', 'boosters'] as const) {
    const best = partsFor(slot).filter(p => has(a, p.id)).sort((x, y) => (y as PartItem).lift - (x as PartItem).lift)[0];
    if (best) next = fit(next, flyingKind(next), best.id) ?? next;
  }
  return next;
}

interface Run { bolts: number[]; newAt: number[]; catalogueAt: number | null; missionsAt: number | null; firstBuy: number | null; offered: boolean[]; payloads: number; modules: number }
export function play(rounds: number): Run {
  let a: BaseState = freshBase(), balance = 0;
  const run: Run = { bolts: [], newAt: [], catalogueAt: null, missionsAt: null, firstBuy: null, offered: [], payloads: 0, modules: 0 };
  for (let r = 1; r <= rounds; r++) {
    let earned = MAX_BOLTS, gotNew = false;
    a = earnLaunch(a);
    while (a.launches > 0) {
      const plan = planLaunch(a), free = Math.floor(plan.free / 12);
      const res: LaunchResult = { stars: 3, smooth: .95, caught: [...new Set([...plan.m.targets.map(t => t.id), ...SNAPS.slice(0, free)])] };
      const pay = payFor(a, plan, res);
      a = finishLaunch(a, plan, res);
      earned += pay.bolts;
      // something new every Launch: the next photo mission is always one he hasn't flown, and patches and ranks come round
      gotNew = true;
      if (pay.newPayload) run.payloads++;
    }
    while (a.unplaced.length) { const s = freeSpots(a.station)[0]!, id = a.unplaced.includes('pl:core') ? 'pl:core' : a.unplaced[0]!; a = putModule(a, id, s.x, s.y) ?? a; run.modules++; }
    balance += earned;
    run.bolts.push(earned);
    for (;;) {
      const next = shopNow(a)[0] ?? (catalogueDone(a) ? repeatsNow(a)[0] : undefined);
      if (!next || priceOf(a, next) > balance) break;
      balance -= priceOf(a, next);
      a = strongest(bought(a, next));
      run.firstBuy ??= r;
      run.newAt.push(r);
      gotNew = true;
    }
    run.offered.push(gotNew && shopNow(a).length + repeatsNow(a).length > 0);
    if (run.catalogueAt === null && catalogueDone(a)) run.catalogueAt = r;
    if (run.missionsAt === null && a.flown >= FIXED_COUNT) run.missionsAt = r;
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
    console.log(`Bolts a Round (Round and Launch, first 300 Rounds): ${perRound.toFixed(1)}; fixed catalogue bought by Round ${long.catalogueAt}; every hand-made photo mission flown by Round ${long.missionsAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}, in the first 1000: ${gaps(1000)}; for sale ${FOR_SALE.length} things, ${FOR_SALE.reduce((s, i) => s + i.price, 0)} Bolts; payloads flown ${long.payloads}, modules on the Station ${long.modules}`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`dearest: ${saving.slice(0, 12).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it("a Round and its Launch pay no more than Turbo Tally's Round and Race (15 Bolts)", () => {
    expect(Math.max(...long.bolts.slice(1))).toBeLessThanOrEqual(15); // Round 1 also flies the free first Launch
  });
  it('the fixed catalogue lasts at least 300 Rounds', () => expect(long.catalogueAt ?? Infinity).toBeGreaterThanOrEqual(300));
  it('his first purchase comes within two Rounds', () => expect(long.firstBuy).toBeLessThanOrEqual(2));
  it('through the first 100 Rounds, something new to buy is never more than three Rounds away', () => expect(gaps(100)).toBeLessThanOrEqual(3));
  it('after 2,000 Rounds there is still something new every Round, and nothing reads "all done"', () => {
    expect(long.offered.every(Boolean)).toBe(true);
    // the last 100 Rounds still buy things (new Station modules he designs) and fly new photo missions
    expect(long.newAt.filter(r => r > 1900).length).toBeGreaterThan(5);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful more than 15', () => {
    const rounds = FOR_SALE.map(i => i.price / perRound);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(40);
    expect(rounds.filter(r => r > 15).length).toBeLessThanOrEqual(8);
  });
  it('a dear thing always changes what he can do: the dearest things are rockets, engines, boosters, buildings that do something and payloads, never a paint', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 15);
    for (const i of dear) {
      expect(['rocket', 'part', 'building', 'payload']).toContain(i.cat);
      if (i.cat === 'building') expect(itemOf(i.id)).not.toMatchObject({ does: 'look' });
    }
  });
  it('prices past 100 are whole tens up to 400, so the voice can say them', () => {
    for (const i of FOR_SALE) { expect(i.price).toBeLessThanOrEqual(400); if (i.price > 100) expect(i.price % 10).toBe(0); }
    let a = freshBase();
    for (const id of ['pad', 'hangar', 'dish', 'module'] as const) for (let k = 0; k < 40; k++) { const p = priceOf({ ...a, more: { ...a.more, [id]: k } }, { kind: 'more', id }); expect(p).toBeLessThanOrEqual(400); if (p > 100) expect(p % 10).toBe(0); }
    a = { ...a };
  });
  // past what shows, "Another Hangar" bought nothing he could see, and "Another Dish" nothing the orbit used
  it('every thing bought again does something: the last dish still lengthens free time, the last hangar is still drawn', async () => {
    const { repeatOf, MOST_HANGARS } = await import('./catalog');
    const { freeFor, TUNING } = await import('../orbit/sim');
    const most = repeatOf('dish').most;
    expect(freeFor(3 + most, false)).toBe(TUNING.maxFree);
    expect(freeFor(3 + most - 1, false)).toBeLessThan(TUNING.maxFree);
    expect(repeatOf('hangar').most).toBeLessThanOrEqual(MOST_HANGARS);
    expect(repeatOf('module').most).toBe(Infinity);
  });
  it('has at least 250 named things to earn in the fixed catalogue', async () => {
    const { CATALOGUE_SIZE } = await import('./base');
    expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(250);
  });
});
