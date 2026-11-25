// How long the rewards last, measured with the scripted child the build guide describes (arena/play.ts): every answer right first try
// (6 Bolts a Round, what the Round really pays), every Jump taken by the skilled child (the Jump's real pay: 2, +1 clean landing, +1 new
// record, +1 for a Row or Show cleared), and always the cheapest new thing bought as soon as he can, with his strongest parts fitted. The
// fixed catalogue first; once it's all bought, the again-and-again things.
//
// The guide's limits, each a test below:
// - the fixed catalogue lasts at least 300 Rounds (about 15 hours);
// - after 2,000 Rounds there is still something new to earn, buy or beat every Round, and no state reads "all done";
// - his first purchase comes within two Rounds, and through the first 100 Rounds something new is never more than three Rounds away;
// - nothing takes more than about 40 Rounds of saving from nothing, and only a handful take more than 15.
// The three numbers (Bolts a Round, Rounds to finish the catalogue, the longest gap) are printed for the spec.
import { describe, expect, it } from 'vitest';
import { FOR_SALE, itemOf, REPEATS, repeatPrice, ROWS } from './catalog';
import { CATALOGUE_SIZE, MOST_JUMP_BOLTS } from './arena';
import { play } from './play';

const long = play(2100);
export const perRound = long.bolts.slice(0, 300).reduce((s, b) => s + b, 0) / 300;
const gaps = (upTo: number) => {
  const at = [0, ...long.newAt.filter(r => r <= upTo)];
  return Math.max(...at.slice(1).map((r, i) => r - at[i]!), upTo - at.at(-1)!);
};

describe('how long the rewards last (the scripted child)', () => {
  it('prints the numbers for the spec', () => {
    const jumpPer = long.jumpBolts.slice(0, 300).reduce((s, b) => s + b, 0) / 300;
    console.log(`Bolts a Round (Round and Jump, first 300 Rounds): ${perRound.toFixed(2)} (the Jump ${jumpPer.toFixed(2)}); fixed catalogue bought by Round ${long.catalogueAt}; longest gap between purchases in the first 100 Rounds: ${gaps(100)}, in the first 300: ${gaps(300)}, in the first 1000: ${gaps(1000)}; for sale ${FOR_SALE.length} things, ${FOR_SALE.reduce((s, i) => s + i.price, 0)} Bolts; named things ${CATALOGUE_SIZE}; Rows cleared ${long.final.rowsCleared}, Shows cleared ${long.final.shows}, record ${long.final.records[0]?.feet} ft`);
    const saving = FOR_SALE.map(i => ({ name: i.name, rounds: i.price / perRound })).sort((x, y) => y.rounds - x.rounds);
    console.log(`dearest: ${saving.slice(0, 12).map(s => `${s.name} ${s.rounds.toFixed(1)}`).join(', ')}`);
  });
  it("a Round and its Jump pay no more than Turbo Tally's Round and Race (15 Bolts)", () => {
    expect(6 + MOST_JUMP_BOLTS).toBeLessThanOrEqual(15);
    expect(Math.max(...long.bolts.slice(1))).toBeLessThanOrEqual(6 + MOST_JUMP_BOLTS); // Round 1 also takes the free first Jump
  });
  it('the fixed catalogue lasts at least 300 Rounds', () => expect(long.catalogueAt ?? Infinity).toBeGreaterThanOrEqual(300));
  it('his first purchase comes within two Rounds', () => expect(long.firstBuy).toBeLessThanOrEqual(2));
  it('through the first 100 Rounds, something new to buy is never more than three Rounds away', () => expect(gaps(100)).toBeLessThanOrEqual(3));
  it('after 2,000 Rounds there is still something new every Round, and nothing reads "all done"', () => {
    expect(long.offered.every(Boolean)).toBe(true);
    // the last 100 Rounds still buy things (seats and tunes) and every Jump goes at a Show he hasn't cleared
    expect(long.newAt.filter(r => r > 2000).length).toBeGreaterThan(5);
    expect(long.jumps.filter(j => j.round > 2000).every(j => j.target.kind === 'show')).toBe(true);
    expect(long.final.rowsCleared).toBe(ROWS.length);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful more than 15', () => {
    const rounds = FOR_SALE.map(i => i.price / perRound);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(40);
    expect(rounds.filter(r => r > 15).length).toBeLessThanOrEqual(8);
  });
  it('a dear thing always changes how the Jump plays: the dearest things are bodies, engines, tires, springs, boosters, ramp pieces and arena pieces that do something, never a paint', () => {
    const dear = [...FOR_SALE].sort((x, y) => y.price - x.price).slice(0, 20);
    for (const i of dear) {
      expect(['body', 'part', 'ramp', 'arena']).toContain(i.cat);
      if (i.cat === 'part') expect(['engine', 'tires', 'springs', 'booster']).toContain(i.slot);
    }
    const looks = FOR_SALE.filter(i => ['colour', 'pattern', 'decal', 'trim'].includes(i.cat));
    expect(Math.max(...looks.map(i => i.price))).toBeLessThanOrEqual(30);
    expect(itemOf('arena:screen').cat).toBe('arena');
  });
  it('prices past 100 are whole tens up to 400, so the voice can say them', () => {
    for (const i of FOR_SALE) { expect(i.price).toBeLessThanOrEqual(400); if (i.price > 100) expect(i.price % 10).toBe(0); }
    for (const r of REPEATS) for (let k = 0; k < 200; k++) { const p = repeatPrice(r.id, k); expect(p).toBeLessThanOrEqual(400); if (p > 100) expect(p % 10).toBe(0); }
  });
  it('again-and-again prices rise gently, then stay flat', () => {
    for (const r of REPEATS) {
      const ps = Array.from({ length: 100 }, (_, k) => repeatPrice(r.id, k));
      for (let k = 1; k < ps.length; k++) expect(ps[k]).toBeGreaterThanOrEqual(ps[k - 1]!);
      expect(ps.at(-1)).toBe(ps[60]);
    }
  });
  it('has at least 250 named things to earn in the fixed catalogue', () => expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(250));
});
