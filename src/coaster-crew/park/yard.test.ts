import { describe, expect, it } from 'vitest';
import { fitsAfter, pieceOf } from '../coaster/pieces';
import { check } from '../coaster/track';
import { MAX_CARS, MAX_SLOTS, SPOTS_PER_PLOT, START_SLOTS } from './catalog';
import {
  addPiece, applyFix, bought, canRideMine, coasterOf, finishRide, fixesFor, freshYard, LEGEND_EVERY, MOST_RIDE_TOKENS, payFor, planRide, proposePurchase, putOnSpot,
  rankOf, RANKS, readYard, ridersPerRide, slotsOf, STARTER_COASTER, takeLast, trayFor, unplaced, wear, type YardState,
} from './yard';

const owning = (...ids: string[]): YardState => ({ ...freshYard(), owned: [...freshYard().owned, ...ids] });
const withPieces = (y: YardState, pieces: string[]): YardState => ({ ...y, coasters: [{ pieces, best: 0 }] });

describe('the builder', () => {
  it('starts with a coaster that gets all the way round, and one free Ride', () => {
    const y = freshYard();
    expect(canRideMine(y)).toBe(true);
    expect(coasterOf(y).pieces).toEqual([...STARTER_COASTER]);
    expect(y.rides).toBe(1);
  });
  it('the tray shows only pieces he has that fit at the end', () => {
    const y = owning('pc:drop3', 'pc:splash', 'pc:loop', 'pc:lift5');
    for (const id of trayFor(y)) expect(fitsAfter(coasterOf(y).pieces, id)).toBe(true);
    expect(trayFor(y)).not.toContain('pc:splash'); // the track ends a step up: no pool there
    expect(trayFor(y)).toContain('pc:loop');
    expect(trayFor(withPieces(y, ['pc:lift5', 'pc:drop5']))).toContain('pc:splash');
    for (let k = 0; k < 6; k++) for (const id of trayFor(withPieces(owning('pc:drop3', 'pc:hump2', 'pc:lift5'), ['pc:lift5', 'pc:drop3']))) expect(pieceOf(id)).toBeTruthy();
  });
  it('a piece snaps on the end; one tap takes the last piece off; nothing beyond his track slots', () => {
    let y = owning('pc:hop1');
    y = addPiece(y, 'pc:hop1')!;
    expect(coasterOf(y).pieces.at(-1)).toBe('pc:hop1');
    y = takeLast(y)!;
    expect(coasterOf(y).pieces).toEqual([...STARTER_COASTER]);
    expect(addPiece(y, 'pc:loop')).toBeNull(); // not his
    let full = withPieces(owning(), Array.from({ length: START_SLOTS }, () => 'pc:straight'));
    expect(trayFor(full)).toEqual([]);
    full = { ...full, more: { ...full.more, track: 1 } };
    expect(slotsOf(full)).toBe(START_SLOTS + 1);
    expect(trayFor(full).length).toBeGreaterThan(0);
  });
  it('a hill too tall is let on, and rolls back: the two honest fixes are a taller first lift and a booster, and each works', () => {
    const y = withPieces(owning('pc:hump2', 'pc:lift5', 'pc:lift7', 'pc:boost'), ['pc:lift3', 'pc:drop2', 'pc:hump2']);
    expect(canRideMine(y)).toBe(false);
    const fixes = fixesFor(y);
    expect(fixes.map(f => f.kind).sort()).toEqual(['booster', 'lift']);
    for (const f of fixes) { expect(f.owned).toBe(true); const fixed = applyFix(y, f)!; expect(check(coasterOf(fixed).pieces).backAt).toBeNull(); expect(canRideMine(fixed)).toBe(true); }
  });
  it('offers a fix he could buy when he has none, and never one that does not work', () => {
    const y = withPieces(owning('pc:hump2'), ['pc:lift3', 'pc:drop2', 'pc:hump2']), fixes = fixesFor(y);
    expect(fixes.length).toBeGreaterThan(0);
    for (const f of fixes) { expect(f.owned).toBe(false); expect(check(f.pieces).backAt).toBeNull(); expect(applyFix(y, f)).toBeNull(); }
  });
  it('a full track that rolls back still has a fix: a booster in place of a flat piece before the hill', () => {
    const pieces = ['pc:lift3', 'pc:drop2', 'pc:straight', 'pc:straight', 'pc:straight', 'pc:hump2'];
    const y = withPieces(owning('pc:hump2', 'pc:boost'), pieces);
    expect(pieces.length).toBe(slotsOf(y));
    expect(check(pieces).backAt).not.toBeNull();
    const boost = fixesFor(y).find(f => f.kind === 'booster')!;
    expect(boost.pieces.length).toBe(slotsOf(y));
    expect(boost.pieces.filter(p => p === 'pc:boost').length).toBe(1);
    expect(check(boost.pieces).backAt).toBeNull();
    expect(canRideMine(applyFix(y, boost)!)).toBe(true);
  });
});

describe('buying', () => {
  it('a part, style or theme goes on; a park thing goes on the first empty spot, or waits for land; nothing is ever lost', () => {
    let y = freshYard();
    const pay = (id: string) => { const p = proposePurchase(y, { kind: 'item', id }, 9999); expect(p.kind).toBe('ready'); if (p.kind === 'ready') y = p.state; };
    pay('pt:blue'); expect(y.train.paint).toBe('pt:blue');
    pay('st:wood'); expect(y.style).toBe('st:wood');
    pay('rk:carousel'); expect(y.spots[0]).toBe('rk:carousel');
    for (const id of ['sd:bench', 'sd:tree', 'sd:lamp', 'sd:palm', 'sd:pine', 'sd:flowers', 'sd:rock', 'sd:bins', 'sd:flags', 'sd:drinks', 'sd:popcorn']) pay(id);
    expect(y.spots.every(s => s)).toBe(true);
    pay('sd:icecream');
    expect(unplaced(y)).toEqual(['sd:icecream']);
    y = bought(y, { kind: 'more', id: 'plot' });
    expect(y.spots.length).toBe(3 * SPOTS_PER_PLOT);
    expect(y.spots).toContain('sd:icecream');
    expect(proposePurchase(y, { kind: 'item', id: 'pt:blue' }, 9999)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(proposePurchase(y, { kind: 'item', id: 'rk:ferris' }, 3)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    y = putOnSpot(y, 0, '')!;
    expect(unplaced(y)).toContain('rk:carousel'); // took it off its spot: still his
  });
  it('another coaster starts empty and is the one he builds; more track and cars stop where the Ride does', () => {
    const y = bought(freshYard(), { kind: 'more', id: 'coaster' });
    expect(y.coasters.length).toBe(2);
    expect(y.current).toBe(1);
    expect(coasterOf(y).pieces).toEqual([]);
    let z = freshYard();
    for (let k = 0; k < 40; k++) { const p = proposePurchase(z, { kind: 'more', id: 'track' }, 9999); if (p.kind === 'ready') z = p.state; }
    expect(slotsOf(z)).toBe(MAX_SLOTS);
    for (let k = 0; k < 40; k++) { const p = proposePurchase(z, { kind: 'more', id: 'car' }, 9999); if (p.kind === 'ready') z = p.state; }
    expect(ridersPerRide(z)).toBe(MAX_CARS * 4);
    const seats6 = wear({ ...z, owned: [...z.owned, 'bd:dragon'] }, 'bd:dragon')!;
    expect(ridersPerRide(seats6)).toBe(MAX_CARS * 6);
  });
});

describe('a Ride', () => {
  it('pays 2, one more for the photo, one more for a new Guest Coaster or a new Thrill best; at most 4', () => {
    const y = freshYard(), g = planRide(y, 'guest')!, m = planRide(y, 'mine')!;
    expect(payFor(y, g, { photo: true, stars: 0, starsOf: 0 }).tokens).toBe(4);
    expect(payFor(y, m, { photo: false, stars: 0, starsOf: 0 }).tokens).toBe(3); // the first ride is a new best
    const again = finishRide(y, m, { photo: false, stars: 0, starsOf: 0 });
    expect(payFor(again, planRide(again, 'mine')!, { photo: false, stars: 0, starsOf: 0 }).tokens).toBe(2);
    expect(MOST_RIDE_TOKENS).toBe(4);
  });
  it('is used at its end, counts its riders, moves on to the next Guest Coaster and gives its prize', () => {
    let y = freshYard();
    y = finishRide(y, planRide(y, 'guest')!, { photo: false, stars: 0, starsOf: 0 });
    expect(y.rides).toBe(0); expect(y.guest).toBe(2); expect(y.riders).toBeGreaterThan(0);
    y = { ...y, guest: 5, rides: 1 };
    y = finishRide(y, planRide(y, 'guest')!, { photo: false, stars: 0, starsOf: 0 });
    expect(y.prizes).toEqual(['pc:gold-loop']);
    expect(myPrizeInTray(y)).toBe(true);
  });
  it('can not be taken on a coaster that rolls back', () => {
    const y = withPieces(owning('pc:hump2'), ['pc:lift3', 'pc:drop2', 'pc:hump2']);
    expect(planRide(y, 'mine')).toBeNull();
    expect(planRide(y, 'guest')).not.toBeNull();
  });
  it('ranks by riders have no last one', () => {
    expect(rankOf(0).name).toBe(RANKS[0].name);
    const top = RANKS.at(-1)!.at;
    expect(rankOf(top + LEGEND_EVERY * 7 + 1)).toMatchObject({ name: 'Coaster Legend', number: 8 });
    expect(rankOf(1e7).next).toBeGreaterThan(1e7);
  });
});
const myPrizeInTray = (y: YardState) => trayFor(withPieces(y, ['pc:lift5', 'pc:drop3'])).includes('pc:gold-loop');

describe('reading a save', () => {
  it('drops what it can not read, cuts a track at the first piece that does not fit or is not his, and keeps what is earned', () => {
    const y = readYard({ owned: ['pc:loop', 'pc:lift5', 'pc:drop5', 'nope'], coasters: [{ pieces: ['pc:lift5', 'pc:drop5', 'pc:loop', 'pc:splash', 'pc:camel4'], best: 70 }, { pieces: ['pc:lift3'] }],
      train: { body: 'bd:gold', paint: 'pt:red' }, spots: ['rk:ferris', 'sd:bench'], rides: -3, guest: 12, prizes: ['pc:triple', 'pc:nope'], trophies: ['first', 'x'] });
    expect(y.owned).toContain('pc:loop');
    expect(y.owned).not.toContain('nope');
    expect(y.coasters).toHaveLength(1); // no second coaster bought
    expect(y.coasters[0]!.pieces).toEqual(['pc:lift5', 'pc:drop5', 'pc:loop']); // the pool isn't his
    expect(y.coasters[0]!.best).toBe(70);
    expect(y.train.body).toBe('bd:classic');
    expect(y.spots[0]).toBe('');
    expect(y.rides).toBe(0);
    expect(y.guest).toBe(12);
    expect(y.prizes).toEqual(['pc:triple']);
    expect(y.trophies).toEqual(['first']);
  });
});
