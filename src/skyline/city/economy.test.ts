// The build guide's "Rewards that never run out", measured. A scripted child answers everything right first try, does every Job and
// always buys the cheapest new thing (economy.ts). The numbers it prints are the ones in the spec.
import { describe, expect, it } from 'vitest';
import { canSay } from '../phrases';
import { CATALOGUE_SIZE, DISTRICTS, FOR_SALE, ITEMS } from './catalog';
import { endlessOffers, simulate } from './economy';
import { floorPrice, landPrice } from './city';

const run = simulate(2000);
const first300 = run.log.slice(0, 300);
const perRound = first300.reduce((a, l) => a + l.earned, 0) / first300.length;
const bought = run.log.filter(l => l.bought.length).map(l => l.round);
const gaps = bought.map((r, i) => r - (i ? bought[i - 1]! : 0));
const lastCatalogueBuy = bought[bought.length - 1]!;

describe('the economy', () => {
  it('reports its numbers', () => {
    const maxGap100 = Math.max(...gaps.filter((_, i) => bought[i]! <= 100));
    console.log(`Bricks a Round: ${perRound.toFixed(2)}; catalogue: ${CATALOGUE_SIZE} named things, ${FOR_SALE.length} for sale for ${FOR_SALE.reduce((a, i) => a + i.price, 0)} Bricks; `
      + `last catalogue purchase at Round ${lastCatalogueBuy}, everything (named Jobs too) at Round ${run.catalogueDoneAt}; longest gap between purchases: ${maxGap100} Rounds in the first 100, ${Math.max(...gaps)} overall`);
  });
  it('has at least 250 named things, and kinds that change how the reward plays', () => {
    expect(CATALOGUE_SIZE).toBeGreaterThanOrEqual(250);
    expect(ITEMS.filter(i => i.key.startsWith('v:')).length).toBeGreaterThanOrEqual(14);
    expect(DISTRICTS).toHaveLength(6);
  });
  it('the fixed catalogue lasts the fastest child at least 300 Rounds', () => {
    expect(lastCatalogueBuy).toBeGreaterThanOrEqual(300);
    expect(run.catalogueDoneAt ?? Infinity).toBeGreaterThanOrEqual(300);
  });
  it('his first purchase comes within two Rounds', () => {
    expect(bought[0]).toBeLessThanOrEqual(2);
  });
  it('through the first hundred Rounds, something new is never more than three Rounds away', () => {
    for (let i = 0; i < bought.length && bought[i]! <= 100; i++) expect(gaps[i], `before Round ${bought[i]}`).toBeLessThanOrEqual(3);
    expect(bought.filter(r => r <= 100).at(-1)! + 3).toBeGreaterThanOrEqual(100);
  });
  it('nothing takes more than about 40 Rounds of saving, and only a handful take more than 15', () => {
    const rounds = FOR_SALE.map(i => ({ i, r: i.price / perRound }));
    expect(Math.max(...rounds.map(x => x.r))).toBeLessThanOrEqual(40);
    expect(rounds.filter(x => x.r > 15).length).toBeLessThanOrEqual(8);
    expect(landPrice(9999) / perRound).toBeLessThanOrEqual(15);
    expect(floorPrice(9999) / perRound).toBeLessThanOrEqual(3);
  });
  it('a dear thing always sits beside cheap ones, and a paint is never the dearest thing', () => {
    for (const d of DISTRICTS) expect(FOR_SALE.filter(i => i.district === d.id && i.price <= 10).length, d.name).toBeGreaterThanOrEqual(5);
    const dearest = [...FOR_SALE].sort((a, b) => b.price - a.price)[0]!;
    expect(dearest.key.startsWith('p:')).toBe(false);
    expect(Math.max(...FOR_SALE.filter(i => i.key.startsWith('p:')).map(i => i.price))).toBeLessThan(20);
  });
  it('every price is one the voice can say: up to 100 in ones, whole tens above it, up to 400', () => {
    for (const i of FOR_SALE) {
      expect(i.price <= 100 || i.price % 10 === 0, i.name).toBe(true);
      expect(i.price).toBeLessThanOrEqual(400);
      expect(canSay(i.price)).toBe(true);
    }
    for (let k = 0; k < 40; k++) { expect(canSay(landPrice(k))).toBe(true); expect(canSay(floorPrice(k))).toBe(true); }
  });
  it('a Round and its Job pay a little: no more than a perfect Round and a small Job', () => {
    expect(Math.max(...run.log.map(l => l.earned))).toBeLessThanOrEqual(6 + 2 * 5);
    expect(perRound).toBeLessThan(10);
  });
  it('after 2,000 Rounds there is still something new every Round, and something to buy', () => {
    for (const l of run.log) {
      expect(l.news.length, `Round ${l.round}`).toBeGreaterThan(0);
      expect(l.onOffer, `Round ${l.round}`).toBeGreaterThan(0);
    }
    expect(endlessOffers(run.state)).toBeGreaterThan(0);
    // and he kept building: land past what the Districts gave him, towers floor by floor, the fresh street
    expect(run.state.landBought).toBeGreaterThan(3);
    expect(run.state.gens.length).toBeGreaterThan(10);
    expect(Math.max(...Object.values(run.state.plots).map(p => p.floors))).toBeGreaterThan(20);
    console.log(`after 2,000 Rounds: ${run.state.blocks.length} Blocks, ${run.state.gens.length} buildings off the fresh street, ${Object.keys(run.state.plots).length} plots built on`);
  });
});
