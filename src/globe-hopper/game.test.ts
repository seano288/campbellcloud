import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { createPractice, globeSave, SAVE_KEY, SAVE_VERSION, settleLaunch, type GlobeState } from './game';
import { bought, buyable, freshBase, liftOf, lookOf, missingNeed, planLaunch, putModule, readBase, tooHeavy, LAUNCH_BOLTS, MOST_LAUNCH_BOLTS, rankOf, RANKS } from './base/base';
import { needLine, PHRASES, PRICE_TOP, sayable } from './phrases';
import { FOR_SALE, PAYLOADS, REPEATS, repeatPrice, SUPPLIES, TEST_PAYLOAD } from './base/catalog';
import { CLIPS } from './voice.gen';
import { PLACE_KEY } from './nav';
import { targetSaid, whereSaid } from './base/labels';
import { FIXED_TARGETS } from './base/missions';

function store(initial: GlobeState = globeSave.fresh()) {
  let state = initial;
  return {
    get state() { return state; },
    commit(change: (s: GlobeState) => GlobeState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
  };
}
const solved = (i: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: false, replay: false });

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('globe-hopper-save'); expect(PLACE_KEY).toBe('globe-hopper-place'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips', () => {
    const base = bought({ ...freshBase(), owned: [...freshBase().owned, 'b:factory'], flownPayloads: ['pl:core'], station: [{ id: 'pl:core', x: 0, y: 0 }] }, { kind: 'more', id: 'module', design: { shape: 2, colour: 3, windows: 1, panels: 2, dish: true } });
    const s = { ...globeSave.fresh(), currency: { balance: 42 }, base: { ...base, flown: 7, photos: ['c:africa' as const, 'p:cairo' as const], bests: { smooth: 91, caught: 4 } } };
    const back = globeSave.decode(JSON.parse(JSON.stringify(globeSave.encode(s))));
    expect(back.currency.balance).toBe(42);
    expect(back.base.flown).toBe(7);
    expect(back.base.photos).toEqual(['c:africa', 'p:cairo']);
    expect(back.base.designs[1]).toEqual({ shape: 2, colour: 3, windows: 1, panels: 2, dish: true });
    expect(back.base.waiting).toEqual(['m:1']);
    expect(back.base.station).toEqual([{ id: 'pl:core', x: 0, y: 0 }]);
    expect(back.base.bests).toEqual({ smooth: 91, caught: 4 });
  });
  it("starts fresh from a version it does not know, and drops what it can't read", () => {
    expect(globeSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0);
    const odd = readBase({ owned: ['b:nope', 'r:crew', 'p:engines:twin'], rockets: { crew: { nose: 'p:engines:twin', engines: 'p:engines:twin', paint: 'paint:gold' } }, flying: 'crew', launches: -2,
      station: [{ id: 'pl:core', x: 0, y: 0 }, { id: 'pl:core', x: 1, y: 0 }, { id: 'pl:lab', x: 5, y: 5 }], photos: ['c:africa', 'x:nope'], night: true });
    expect(odd.owned).not.toContain('b:nope');
    expect(odd.rockets.crew!.engines).toBe('p:engines:twin');
    expect(odd.rockets.crew!.nose).toBe('p:nose:round'); // an engine can't be a nose
    expect(odd.rockets.crew!.paint).toBe('paint:white'); // not owned
    expect(odd.launches).toBe(0);
    expect(odd.station).toEqual([{ id: 'pl:core', x: 0, y: 0 }]); // no repeats, nothing floating apart
    expect(odd.photos).toEqual(['c:africa']);
    expect(odd.night).toBe(false); // no floodlights
  });
});

describe('a Round and a Launch', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Launch', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) practice.solve(started.roundId, solved(i, i === 3 ? 'missed' : 'clean'), { mode: 'globe', push: true });
    practice.terminal({ roundId: started.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 3 ? 'missed' : 'clean')) });
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.base.launches).toBe(2); // the free first one, and this Round's
  });
  it('a Launch is used when it ends, pays, keeps the photos, and does nothing without one', () => {
    const s = store({ ...globeSave.fresh(), base: { ...freshBase(), launches: 1 } });
    const plan = planLaunch(s.state.base);
    expect(plan.payload).toBe(TEST_PAYLOAD.id);
    const pay = settleLaunch(s, plan, { stars: 3, smooth: .9, caught: ['c:africa'] });
    expect(pay?.bolts).toBe(LAUNCH_BOLTS + 1);
    expect(s.state.base.launches).toBe(0);
    expect(s.state.base.flown).toBe(1);
    expect(s.state.base.photos).toEqual(['c:africa']);
    expect(settleLaunch(s, plan, { stars: 3, smooth: .9, caught: [] })).toBeNull();
    expect(MOST_LAUNCH_BOLTS + 6).toBeLessThanOrEqual(15);
  });
  it('carries a payload the rocket can lift; one too heavy waits and is never offered for sale', () => {
    let a = { ...freshBase(), waiting: ['pl:telescope', 'pl:weather'] };
    expect(liftOf(lookOf(a, 'sounding'))).toBe(2);
    expect(planLaunch(a).payload).toBe('pl:weather');
    expect(tooHeavy(a, { kind: 'item', id: 'pl:bigscope' })).toBe(true);
    expect(buyable(a, { kind: 'item', id: 'pl:bigscope' })).toBe(false);
    a = { ...a, waiting: ['pl:telescope'] };
    expect(planLaunch(a).payload).toBe(TEST_PAYLOAD.id);
    expect(planLaunch({ ...a, flownPayloads: ['pl:core'] }).payload).toBe(SUPPLIES.id);
  });
  it('a module he launches waits until he puts it on the Station, the core first, next to what is there', () => {
    const a = { ...freshBase(), unplaced: ['pl:lab', 'pl:core'] };
    expect(putModule(a, 'pl:lab', 0, 0)).toBeNull();
    const b = putModule(a, 'pl:core', 0, 0)!;
    expect(putModule(b, 'pl:lab', 3, 3)).toBeNull();
    expect(putModule(b, 'pl:lab', 1, 0)!.station.length).toBe(2);
  });
  // with a small rocket the core (weight 3) waits on the ground, and Solar Panels (weight 2) used to fly first and become the Station's middle
  it('a module that builds on another waits until that one has flown, so the Station Core is always the first module up', () => {
    const bought = { ...freshBase(), owned: [...freshBase().owned, 'pl:core'], waiting: ['pl:core'] };
    expect(missingNeed(bought, { kind: 'item', id: 'pl:solar' })).toBe('pl:core');
    expect(buyable(bought, { kind: 'item', id: 'pl:solar' })).toBe(false);
    expect(missingNeed({ ...bought, waiting: [], flownPayloads: ['pl:core'] }, { kind: 'item', id: 'pl:solar' })).toBeNull();
  });
  it('a rocket needs a tower tall enough; the flyback booster needs the landing pad and the spaceplane the runway', () => {
    expect(missingNeed(freshBase(), { kind: 'item', id: 'r:launcher' })).toBe('b:tower1');
    expect(missingNeed(freshBase(), { kind: 'item', id: 'r:flyback' })).toBe('b:landing');
    expect(missingNeed(freshBase(), { kind: 'item', id: 'r:spaceplane' })).toBe('b:runway');
    expect(missingNeed(freshBase(), { kind: 'more', id: 'module' })).toBe('b:factory');
  });
  it('ranks go up with Launches, and after the top a numbered Orbit Legend every 40, without end', () => {
    expect(rankOf(0).name).toBe('Cadet');
    const top = RANKS.at(-1)!.at;
    expect(rankOf(top + 40)).toMatchObject({ name: 'Orbit Legend', number: 2 });
    expect(rankOf(top + 4000).number).toBe(101);
  });
});

describe('the voice', () => {
  it('has a clip for every line', () => { for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy(); });
  it('can name every photo target and say where it is', () => {
    const said = new Set<string>(PHRASES);
    for (const id of FIXED_TARGETS) for (const p of [...targetSaid(id), ...whereSaid(id)]) expect(said.has(p), `${id}: ${p}`).toBe(true);
  });
  it('can say every price and every "you need" gap: each thing for sale, the again-and-again things at every rank, any gap to 400', () => {
    const said = new Set<string>(PHRASES);
    const prices = [...FOR_SALE.map(i => i.price), ...REPEATS.flatMap(r => Array.from({ length: 60 }, (_, k) => repeatPrice(r.id, k)))];
    for (const price of prices) {
      expect(price, 'a price over 400').toBeLessThanOrEqual(PRICE_TOP);
      const { said: n, exact } = sayable(price);
      expect(exact, `${price} is not a whole ten`).toBe(true);
      expect(said.has(n)).toBe(true);
    }
    for (let gap = 1; gap <= PRICE_TOP; gap++) for (const p of needLine(gap)) expect(said.has(p), `${gap}: ${p}`).toBe(true);
  });
  it('can say every payload by name', () => { const said = new Set<string>(PHRASES); for (const p of PAYLOADS) expect(said.has(p.name)).toBe(true); });
});
