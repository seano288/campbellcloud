// The scripted child of the build guide's "Rewards that never run out": every answer right first try (the most a Round pays), every
// Job done, and always the cheapest new thing in the catalogue bought as soon as he can afford it. Nothing else is bought while there
// is something new he could save for, so this is the fastest anyone can empty the catalogue. Once it's empty he spends on the endless
// layer (land, floors, the fresh street), which never runs out. economy.test.ts holds the numbers to the guide's limits.
import { MAX_BOLTS } from '../../round/rules';
import { CATALOGUE_SIZE, FOR_SALE, NAMED_JOBS } from './catalog';
import {
  allPlots, canGrow, catalogueHad, earnJob, finishJob, floorPrice, forSaleNow, freshCity, freshStreet, landPrice, nextJob, priceOf, proposePurchase,
  type CityState, type Request,
} from './city';
import { genDesign } from './gen';

export interface RoundLog {
  round: number;
  /** Bricks this Round paid, the Job included. */
  earned: number;
  /** Catalogue things bought this Round. */
  bought: string[];
  /** Something new this Round: a catalogue thing, a District, a named Job, a trophy, or (once the catalogue is done) a new Job made from his city. */
  news: string[];
  /** Something he could still buy at the end of the Round (never "all done"). */
  onOffer: number;
}

export interface Run { state: CityState; balance: number; log: RoundLog[]; catalogueDoneAt: number | null; /** The City as it was after each of the Rounds asked for. */ at: Map<number, CityState> }

/** A Job's count: the scripted child collects every stop (the Job can't be failed, so this is what every Job collects). */
const collected = 5 * 4;

export function simulate(rounds: number, keep: readonly number[] = []): Run {
  let s = freshCity(), balance = 0, catalogueDoneAt: number | null = null;
  const at = new Map<number, CityState>();
  const log: RoundLog[] = [];
  for (let round = 1; round <= rounds; round++) {
    let earned = MAX_BOLTS;
    s = earnJob(s);
    const news: string[] = [], bought: string[] = [];
    while (s.jobs > 0) {
      const job = nextJob(s), done = finishJob(s, job, collected);
      earned += done.pay.bricks;
      if (done.pay.named) news.push(done.pay.named.key);
      else news.push(`job:${s.done + 1}`);
      if (done.pay.district !== null) news.push(`d:${done.pay.district}`);
      news.push(...done.pay.trophies.map(t => t.key));
      s = done.state;
    }
    balance += earned;
    // the cheapest new thing first, as many as he can afford
    for (;;) {
      const next = forSaleNow(s).sort((a, b) => a.price - b.price)[0];
      if (!next) break;
      const p = proposePurchase(s, { t: 'item', key: next.key }, balance);
      if (p.kind !== 'ready') break;
      s = p.state; balance -= p.cost; bought.push(next.key); news.push(next.key);
    }
    if (catalogueDoneAt === null && FOR_SALE.every(i => s.owned.includes(i.key)) && s.named.length === NAMED_JOBS.length) catalogueDoneAt = round;
    // nothing new to buy: the endless layer, cheapest first
    if (!forSaleNow(s).length) {
      for (;;) {
        const r = cheapestEndless(s);
        const p = proposePurchase(s, r, balance);
        if (p.kind !== 'ready') break;
        s = p.state; balance -= p.cost;
      }
    }
    log.push({ round, earned, bought, news, onOffer: endlessOffers(s) + forSaleNow(s).length });
    if (keep.includes(round)) at.set(round, s);
  }
  return { state: s, balance, log, catalogueDoneAt, at };
}

/** What the endless layer has on offer: always the next Block, the fresh street, and a floor on any tower below the top. */
export function endlessOffers(s: CityState): number {
  const requests: Request[] = [{ t: 'land' }, ...freshStreet(s).map(seed => ({ t: 'gen', seed }) as const), ...allPlots(s).filter(p => canGrow(s, p.id)).map(p => ({ t: 'floor', plot: p.id }) as const)];
  return requests.filter(r => priceOf(s, r) !== null).length;
}
function cheapestEndless(s: CityState): Request {
  const floors = allPlots(s).filter(p => canGrow(s, p.id)).map(p => ({ r: { t: 'floor', plot: p.id } as Request, price: floorPrice(s.plots[p.id]!.floors) }));
  const street = freshStreet(s).map(seed => ({ r: { t: 'gen', seed } as Request, price: genDesign(seed).price }));
  // a building needs somewhere to stand: buy land when every plot a street building fits (small and wide) is full
  const land = { r: { t: 'land' } as Request, price: allPlots(s).some(p => !s.plots[p.id] && p.size !== 'l') ? Infinity : landPrice(s.landBought) };
  return [...floors, ...street, land].sort((a, b) => a.price - b.price)[0]!.r;
}

export { CATALOGUE_SIZE, catalogueHad };
