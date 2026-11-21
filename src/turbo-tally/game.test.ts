import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { allBought, EARNABLE, finishRace, FIRST_RACES, fitOwned, freshGarage, frontier, goalOf, isOpen, MOST_RACE_BOLTS, MYSTERY_PICK, mysteryOpen, nextMysteryPrize, nextStar, nextTrack, payFor, pickTrack, planFor, proposePurchase, readGarage, record, setNumber, starCount, type GarageState } from './garage/garage';
import { ALL_KEYS, BODIES, BOOSTERS, DECALS, ENGINES, FLAMES, fit, forSale, HORNS, keysIn, MYSTERY_KEYS, MYSTERY_PARTS, PAINTS, partOf, priceOf, RIMS, RIVAL_PARTS, SLOTS, slotOf, starterCar, statsOf, TYRES, WINGS, type PartKey } from './garage/parts';
import { createPractice, SAVE_KEY, SAVE_VERSION, settleRace, tallySave, type TallyState } from './game';
import { freshLearning } from './learning';
import { MOST_EARNED, needLine, NUMBERS_TO, PHRASES, PRICE_TENS, PRICE_TOP, sayable } from './phrases';
import { featuredOn, RIVALS, STARS, type RacePlan } from './race/rivals';
import { mysteryTrack, TRACKS, type TrackDef } from './race/tracks';

const cupPlan = (track: TrackDef): RacePlan => ({ track, mode: 'cup', star: 0, level: 0 });
import { CLIPS } from './voice.gen';

const store = (state: TallyState = tallySave.fresh()) => ({
  get state() { return state; },
  commit(change: (s: TallyState) => TallyState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
});

describe('the save', () => {
  it('has its own key and a version', () => { expect(SAVE_KEY).toBe('turbo-tally-save'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const garage = { ...freshGarage(), owned: [...freshGarage().owned, 'engine:v8' as PartKey, 'wing:zippy' as PartKey], car: { ...fit(starterCar(), 'engine:v8'), number: 42 }, races: 3, raced: 2,
      tracks: { t1: { best: 2, losses: 0, beaten: true, stars: 2 }, t2: { best: 4, losses: 2, beaten: false, stars: 0 } }, cups: ['tarmac' as const], picked: 't1', last: 'm7', goal: 'engine:turbo' as PartKey,
      mystery: { level: 7, losses: 1 } };
    const s: TallyState = { learning: freshLearning(), currency: { balance: 17 }, garage };
    expect(tallySave.decode(JSON.parse(JSON.stringify(tallySave.encode(s))))).toEqual(s);
  });
  it('starts fresh from a version it does not know', () => expect(tallySave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0));
  it('never fits a part he does not own, whatever the save says', () => {
    const g = readGarage({ owned: ['engine:putt'], car: { engine: 'engine:rocket', body: 'wing:big', number: 300 }, tracks: { t1: { best: 1, beaten: true }, t99: { best: 1 } }, cups: ['tarmac', 'mars'] });
    expect(g.car).toEqual(starterCar());
    expect(Object.keys(g.tracks)).toEqual(['t1']);
    expect(g.cups).toEqual(['tarmac']);
  });
  it('reads a save from before Stars and the Mystery Race with everything kept: no Stars yet, Mystery Level 1', () => {
    const old = { owned: ['engine:putt', 'engine:rocket', 'wing:zippy'], car: { engine: 'engine:rocket', number: 9 }, races: 2, raced: 40,
      tracks: Object.fromEntries(TRACKS.slice(0, 24).map(t => [t.id, { best: 1, losses: 0, beaten: true }])), cups: ['tarmac', 'dirt', 'sand', 'snow', 'night', 'volcano'], picked: null, last: 't24' };
    const g = readGarage(old);
    expect(g.owned).toContain('engine:rocket');
    expect(g.car.engine).toBe('engine:rocket');
    expect(record(g, TRACKS[23]!)).toEqual({ best: 1, losses: 0, beaten: true, stars: 0 });
    expect(g.mystery).toEqual({ level: 1, losses: 0 });
    expect(nextTrack(g).id).toBe('t25'); // straight on to the Jungle Cup
    expect(g.cups).toHaveLength(6);
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
  it('has about 380 things to earn: parts in every slot, Rival and Mystery parts, tracks, Cup trophies and Stars', () => {
    expect([BODIES, ENGINES, TYRES, WINGS, BOOSTERS, PAINTS, RIMS, DECALS, HORNS, FLAMES].map(x => x.length)).toEqual([26, 12, 11, 11, 11, 32, 18, 28, 14, 16]);
    expect(RIVAL_PARTS).toHaveLength(30);
    expect(MYSTERY_PARTS).toHaveLength(10);
    const total = EARNABLE.parts + EARNABLE.tracks + EARNABLE.cups + EARNABLE.stars;
    expect(total).toBeGreaterThanOrEqual(375);
    // the shop alone costs more than four times what it did (2,734 Bolts)
    expect(ALL_KEYS.filter(forSale).reduce((n, k) => n + priceOf(k)!, 0)).toBeGreaterThan(4 * 2734);
    expect(new Set(ALL_KEYS).size).toBe(ALL_KEYS.length);
    expect(new Set(ALL_KEYS.map(k => partOf(k).name)).size).toBe(ALL_KEYS.length); // every name is its own clip
  });
  it('prices every part so the voice can say it: any number to 100, whole tens to 400; a free starter in every slot; prizes never for sale', () => {
    for (const k of ALL_KEYS) {
      const p = priceOf(k);
      if (p === null) continue;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(PRICE_TOP);
      if (p > NUMBERS_TO) { expect(p % 10, k).toBe(0); expect(PRICE_TENS).toContain(`${p}`); }
      expect(sayable(p)).toEqual({ said: `${p}`, exact: true });
    }
    for (const s of SLOTS) expect(keysIn(s).filter(k => priceOf(k) === 0)).toHaveLength(1);
    for (const r of RIVALS) if (r.prize) { expect(forSale(r.prize)).toBe(false); expect(priceOf(r.prize)).toBeNull(); }
    for (const k of MYSTERY_KEYS) expect(forSale(k)).toBe(false);
    expect(new Set(RIVALS.flatMap(r => r.prize ?? [])).size).toBe(RIVAL_PARTS.length);
    // "You need 137 more Bolts" isn't a clip: it's "about 140"
    expect(needLine(137)).toEqual(['You need about', '140', 'more Bolts.']);
    expect(needLine(37)).toEqual(['You need', '37', 'more Bolts.']);
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
    expect(MOST_EARNED).toBeGreaterThanOrEqual(Math.max(6, MOST_RACE_BOLTS));
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
    expect(payFor(freshGarage(), cupPlan(t1), 4, false)).toMatchObject({ bolts: 2, prize: null, opened: null });
    const won = payFor(freshGarage(), cupPlan(t1), 3, true);
    expect(won).toMatchObject({ bolts: 3, prize: featuredOn(t1).prize, opened: TRACKS[1] });
    expect(payFor(freshGarage(), cupPlan(t1), 1, true).bolts).toBe(5);
    expect(payFor(freshGarage(), cupPlan(TRACKS[30]!), 1, true, 6).bolts).toBe(7); // six cars: one for each beaten
    expect(5).toBeLessThanOrEqual(MOST_EARNED);
  });
  it('settles a Race: uses it, keeps the record, fits the prize, opens the next track; a loss slows that Rival next time', () => {
    const s = store();
    const lost = settleRace(s, cupPlan(TRACKS[0]!), 4, false)!;
    expect(lost.beat).toBe(false);
    expect(s.state.garage.races).toBe(0);
    expect(record(s.state.garage, TRACKS[0]!)).toEqual({ best: 4, losses: 1, beaten: false, stars: 0 });
    expect(settleRace(s, cupPlan(TRACKS[0]!), 1, true)).toBeNull(); // no Race left: nothing happens
    s.commit(st => ({ ...st, garage: { ...st.garage, races: 1 } }));
    settleRace(s, cupPlan(TRACKS[0]!), 2, true);
    const g = s.state.garage;
    expect(g.owned).toContain(featuredOn(TRACKS[0]!).prize);
    expect(g.car.wing).toBe(featuredOn(TRACKS[0]!).prize);
    expect(record(g, TRACKS[0]!)).toEqual({ best: 2, losses: 0, beaten: true, stars: 0 });
    expect(isOpen(g, TRACKS[1]!)).toBe(true);
    expect(frontier(g)!.id).toBe('t2');
    expect(s.state.currency.balance).toBe(2 + 4);
  });
  it('wins the Cup at the Cup Final, and the prize is never given twice', () => {
    let g = freshGarage();
    for (const t of TRACKS.slice(0, 4)) { const pay = payFor(g, cupPlan(t), 1, true); g = finishRace({ ...g, races: 1 }, cupPlan(t), pay); }
    expect(g.cups).toEqual(['tarmac']);
    expect(g.owned.filter(k => RIVALS.some(r => r.prize === k))).toHaveLength(3);
    const again = payFor(g, cupPlan(TRACKS[0]!), 1, true);
    expect(again.prize).toBeNull();
    expect(again.opened).toBeNull();
    expect(payFor(g, cupPlan(TRACKS[3]!), 1, true).cup).toBeNull();
  });
  it('races a beaten track again for three Stars, each won only by coming first, then just for fun', () => {
    let g: GarageState = { ...freshGarage(), tracks: { t1: { best: 2, losses: 0, beaten: true, stars: 0 } } };
    const t1 = TRACKS[0]!;
    expect(planFor(g, t1)).toMatchObject({ mode: 'star', star: 1 });
    expect(nextTrack(g).id).toBe('t2'); // the next track to beat comes first
    const second = payFor(g, planFor(g, t1), 2, false);
    expect(second).toMatchObject({ bolts: 4, star: null });
    g = finishRace({ ...g, races: 1, picked: 't1' }, planFor(g, t1), second);
    expect(record(g, t1)).toMatchObject({ stars: 0, losses: 1, best: 2 });
    expect(g.picked).toBe('t1'); // "Race again" tries the same Star
    for (const [star, bonus] of [[1, 3], [2, 5], [3, 8]] as const) {
      const plan = planFor(g, t1);
      expect(plan).toMatchObject({ mode: 'star', star });
      const pay = payFor(g, plan, 1, true);
      expect(pay).toMatchObject({ star, bolts: 5 + bonus });
      g = finishRace({ ...g, races: 1 }, plan, pay);
      expect(record(g, t1)).toMatchObject({ stars: star, losses: 0 });
    }
    expect(planFor(g, t1).mode).toBe('fun');
    expect(payFor(g, planFor(g, t1), 1, true)).toMatchObject({ bolts: 5, star: null, prize: null });
    expect(starCount(g)).toBe(STARS);
  });
  it('sends the Race button to the next track to beat, then the Stars (every first Star before any second), then the Mystery Race', () => {
    const all = Object.fromEntries(TRACKS.map(t => [t.id, { best: 1, losses: 0, beaten: true, stars: 0 }]));
    let g: GarageState = { ...freshGarage(), tracks: { ...all, t2: { ...all.t2!, stars: 1 } }, cups: ['tarmac'] };
    expect(nextStar(g)!.id).toBe('t1');
    g = { ...g, tracks: { ...g.tracks, t1: { ...g.tracks.t1!, stars: 1 } } };
    expect(nextStar(g)!.id).toBe('t3');
    g = { ...g, tracks: Object.fromEntries(TRACKS.map(t => [t.id, { best: 1, losses: 0, beaten: true, stars: 3 }])) };
    expect(nextTrack(g).id).toBe('m1');
    expect(nextTrack(pickTrack(g, 't5')!).id).toBe('t5');
    expect(nextTrack(pickTrack(g, MYSTERY_PICK)!).id).toBe('m1');
  });
  it('opens the Mystery Race with the Tarmac Cup; first place goes up a Level, and every fifth Level wins a Mystery part', () => {
    expect(mysteryOpen(freshGarage())).toBe(false);
    expect(pickTrack(freshGarage(), MYSTERY_PICK)).toBeNull();
    let g: GarageState = { ...freshGarage(), cups: ['tarmac'] };
    expect(nextMysteryPrize(g)).toEqual({ level: 5, prize: MYSTERY_KEYS[0] });
    for (let level = 1; level <= 5; level++) {
      const plan = planFor(g, mysteryTrack(g.mystery.level));
      expect(plan).toMatchObject({ mode: 'mystery', level });
      const lost = payFor(g, plan, 2, false, 6);
      expect(lost).toMatchObject({ bolts: 6, level: null, prize: null });
      g = finishRace({ ...g, races: 1 }, plan, lost);
      expect(g.mystery).toEqual({ level, losses: 1 });
      const won = payFor(g, plan, 1, true, 6);
      expect(won.level).toBe(level + 1);
      expect(won.bolts).toBeGreaterThan(7);
      expect(won.prize).toBe(level === 5 ? MYSTERY_KEYS[0] : null);
      g = finishRace({ ...g, races: 1 }, plan, won);
      expect(g.mystery).toEqual({ level: level + 1, losses: 0 });
    }
    expect(g.owned).toContain(MYSTERY_KEYS[0]);
    expect(g.car.paint).toBe(MYSTERY_KEYS[0]);
    expect(nextMysteryPrize(g)).toEqual({ level: 10, prize: MYSTERY_KEYS[1] });
    expect(readGarage(JSON.parse(JSON.stringify(g))).mystery).toEqual({ level: 6, losses: 0 });
  });
});

describe('the voice', () => {
  it('has a clip for every line', () => { for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy(); });
});
