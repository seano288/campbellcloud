import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { allBought, EARNABLE, finishRace, FIRST_RACES, fitOwned, freshGarage, frontier, goalOf, isOpen, nextTrack, payFor, pickTrack, proposePurchase, readGarage, record, setNumber } from './garage/garage';
import { ALL_KEYS, BODIES, BOOSTERS, DECALS, ENGINES, FLAMES, fit, forSale, HORNS, keysIn, PAINTS, partOf, priceOf, RIMS, RIVAL_PARTS, SLOTS, slotOf, starterCar, statsOf, TYRES, WINGS, type PartKey } from './garage/parts';
import { createPractice, SAVE_KEY, SAVE_VERSION, settleRace, tallySave, type TallyState } from './game';
import { freshLearning } from './learning';
import { MOST_EARNED, NUMBERS_TO, PHRASES } from './phrases';
import { featuredOn, RIVALS } from './race/rivals';
import { TRACKS } from './race/tracks';
import { CLIPS } from './voice.gen';

const store = (state: TallyState = tallySave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: TallyState) => TallyState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});

describe('the save', () => {
  it('has its own key and a version', () => { expect(SAVE_KEY).toBe('turbo-tally-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const garage = { ...freshGarage(), owned: [...freshGarage().owned, 'engine:v8' as PartKey, 'wing:zippy' as PartKey], car: { ...fit(starterCar(), 'engine:v8'), number: 42 }, races: 3, raced: 2,
      tracks: { t1: { best: 2, losses: 0, beaten: true }, t2: { best: 4, losses: 2, beaten: false } }, cups: ['tarmac' as const], picked: 't1', last: 't2', goal: 'engine:turbo' as PartKey };
    const s: TallyState = { learning: freshLearning(), currency: { balance: 17 }, garage };
    expect(tallySave.decode(JSON.parse(JSON.stringify(tallySave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know', () => expect(tallySave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0));
  it('never fits a part he does not own, whatever the save says', () => {
    const g = readGarage({ owned: ['engine:putt'], car: { engine: 'engine:rocket', body: 'wing:big', number: 300 }, tracks: { t1: { best: 1, beaten: true }, t99: { best: 1 } }, cups: ['tarmac', 'moon'] });
    expect(g.car).toEqual(starterCar());
    expect(Object.keys(g.tracks)).toEqual(['t1']);
    expect(g.cups).toEqual(['tarmac']);
  });
});

describe('a Round', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Race', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    if (started.kind !== 'accepted') throw new Error('no Round');
    const results: SolvedProblem[] = [];
    for (let i = 1; i <= 5; i++) {
      const fact: SolvedProblem = { index: i, outcome: i === 2 ? 'missed' : 'clean', misses: i === 2 ? 1 : 0, helped: false, replay: false };
      practice.solve(started.roundId, fact, { mode: 'place', push: true });
      results.push(fact);
    }
    expect(practice.terminal({ roundId: started.roundId, status: 'completed', results }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.garage.races).toBe(FIRST_RACES + 1);
  });
});

describe('the Garage', () => {
  it('has about 160 things to earn: parts in every slot, Rival parts, tracks and Cup trophies', () => {
    expect([BODIES, ENGINES, TYRES, WINGS, BOOSTERS, PAINTS, RIMS, DECALS, HORNS, FLAMES].map(x => x.length)).toEqual([12, 8, 8, 8, 8, 24, 12, 20, 10, 10]);
    expect(RIVAL_PARTS).toHaveLength(18);
    const total = EARNABLE.parts + EARNABLE.tracks + EARNABLE.cups;
    expect(total).toBeGreaterThanOrEqual(150);
    expect(new Set(ALL_KEYS).size).toBe(ALL_KEYS.length);
    expect(new Set(ALL_KEYS.map(k => partOf(k).name)).size).toBe(ALL_KEYS.length); // every name is its own clip
  });
  it('prices every part so the voice can say it: at most 100, a free starter in every slot, Rival parts never for sale', () => {
    for (const k of ALL_KEYS) { const p = priceOf(k); if (p !== null) { expect(p).toBeLessThanOrEqual(NUMBERS_TO); expect(p).toBeGreaterThanOrEqual(0); } }
    for (const s of SLOTS) expect(keysIn(s).filter(k => priceOf(k) === 0)).toHaveLength(1);
    for (const r of RIVALS) { expect(forSale(r.prize)).toBe(false); expect(priceOf(r.prize)).toBeNull(); }
    expect(proposePurchase(freshGarage(), 'wing:zippy', 1000)).toEqual({ kind: 'rejected', reason: 'not-for-sale' });
  });
  it('makes the numbers real: an Engine adds Speed, Tyres and a Wing add Grip, a Booster adds boosts', () => {
    const start = statsOf(starterCar());
    expect(start).toMatchObject({ speed: 40, grip: 30, boosts: 1 });
    expect(statsOf(fit(starterCar(), 'engine:v8')).speed).toBeGreaterThan(start.speed);
    expect(statsOf(fit(starterCar(), 'wing:big')).grip).toBeGreaterThan(start.grip);
    expect(statsOf(fit(starterCar(), 'tyres:race')).grip).toBeGreaterThan(start.grip);
    expect(statsOf(fit(starterCar(), 'booster:mega')).boosts).toBe(5);
    expect(statsOf(fit(starterCar(), 'paint:blue'))).toEqual(start); // looks change nothing
    // dearer parts in the go-faster slots are never worse
    for (const s of ['engine', 'wing', 'booster'] as const) {
      const keys = keysIn(s).filter(forSale), v = (k: PartKey) => { const x = statsOf(fit(starterCar(), k)); return s === 'engine' ? x.speed : s === 'wing' ? x.grip : x.boosts; };
      keys.forEach((k, i) => { if (i) expect(v(k)).toBeGreaterThanOrEqual(v(keys[i - 1]!)); });
    }
    expect(statsOf(fit(starterCar(), 'tyres:studded')).suits.snow).toBe(1);
    expect(statsOf(fit(starterCar(), 'tyres:studded')).suits.tarmac).toBeLessThan(1);
  });
  it('the first new part comes within two Rounds', () => {
    const cheapest = Math.min(...ALL_KEYS.filter(k => forSale(k) && priceOf(k)! > 0).map(k => priceOf(k)!));
    // a Round pays at least 1 (finishing), the free first Race at least 2
    expect(cheapest).toBeLessThanOrEqual(1 + 1 + 2);
    expect(MOST_EARNED).toBeGreaterThanOrEqual(6);
  });
  it('buys a part, fits it, and saves toward the cheapest part that changes a number', () => {
    const buy = proposePurchase(freshGarage(), 'engine:zoom', 20);
    if (buy.kind !== 'ready') throw new Error(buy.reason);
    expect(buy.cost).toBe(8);
    expect(buy.state.car.engine).toBe('engine:zoom');
    expect(proposePurchase(freshGarage(), 'engine:zoom', 7)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(buy.state, 'engine:zoom', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(priceOf(goalOf(freshGarage())!)).toBe(6); // the Beach Buggy or the Little Wing, both 6 and both add a number
    expect(['body', 'wing']).toContain(slotOf(goalOf(freshGarage())!));
    expect(fitOwned(freshGarage(), 'engine:v8')).toBeNull();
    expect(setNumber(freshGarage(), 42).car.number).toBe(42);
    expect(setNumber(freshGarage(), 420).car.number).toBe(99);
    expect(allBought(freshGarage())).toBe(false);
    expect(allBought({ owned: ALL_KEYS.filter(forSale) })).toBe(true);
    expect(slotOf('rims:star')).toBe('rims');
  });
});

describe('Races and Cups', () => {
  it('starts with one free Race on the first track, and the others locked', () => {
    const g = freshGarage();
    expect(g.races).toBe(1);
    expect(nextTrack(g).id).toBe('t1');
    expect(isOpen(g, TRACKS[1]!)).toBe(false);
    expect(pickTrack(g, 't2')).toBeNull();
  });
  it('pays every finish, at most 5, and wins the Rival\'s part only by finishing ahead of it', () => {
    const t1 = TRACKS[0]!;
    expect(payFor(freshGarage(), t1, 4, false)).toMatchObject({ bolts: 2, prize: null, opened: null });
    const won = payFor(freshGarage(), t1, 3, true);
    expect(won).toMatchObject({ bolts: 3, prize: featuredOn(t1).prize, opened: TRACKS[1] });
    expect(payFor(freshGarage(), t1, 1, true).bolts).toBe(5);
    expect(5).toBeLessThanOrEqual(MOST_EARNED);
  });
  it('settles a Race: uses it, keeps the record, fits the prize, opens the next track; a loss slows that Rival next time', () => {
    const s = store();
    const lost = settleRace(s, TRACKS[0]!, 4, false)!;
    expect(lost.beat).toBe(false);
    expect(s.state.garage.races).toBe(0);
    expect(record(s.state.garage, TRACKS[0]!)).toEqual({ best: 4, losses: 1, beaten: false });
    expect(settleRace(s, TRACKS[0]!, 1, true)).toBeNull(); // no Race left: nothing happens
    s.commit(st => ({ ...st, garage: { ...st.garage, races: 1 } }));
    settleRace(s, TRACKS[0]!, 2, true);
    const g = s.state.garage;
    expect(g.owned).toContain(featuredOn(TRACKS[0]!).prize);
    expect(g.car.wing).toBe(featuredOn(TRACKS[0]!).prize);
    expect(record(g, TRACKS[0]!)).toEqual({ best: 2, losses: 0, beaten: true });
    expect(isOpen(g, TRACKS[1]!)).toBe(true);
    expect(frontier(g)!.id).toBe('t2');
    expect(s.state.currency.balance).toBe(2 + 4);
  });
  it('wins the Cup at the Cup Final, and the prize is never given twice', () => {
    let g = freshGarage();
    for (const t of TRACKS.slice(0, 4)) { const pay = payFor(g, t, 1, true); g = finishRace({ ...g, races: 1 }, t, pay); }
    expect(g.cups).toEqual(['tarmac']);
    expect(g.owned.filter(k => RIVALS.some(r => r.prize === k))).toHaveLength(3);
    const again = payFor(g, TRACKS[0]!, 1, true);
    expect(again.prize).toBeNull();
    expect(again.opened).toBeNull();
    expect(payFor(g, TRACKS[3]!, 1, true).cup).toBeNull();
  });
});

describe('the voice', () => {
  it('has a clip for every line', () => { for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy(); });
});
