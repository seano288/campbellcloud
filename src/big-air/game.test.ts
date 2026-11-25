import { describe, expect, it } from 'vitest';
import type { SolvedProblem } from '../learning/session';
import { airSave, createPractice, SAVE_KEY, SAVE_VERSION, settleJump, type AirState } from './game';
import {
  bought, buyable, courseOf, freshArena, JUMP_BOLTS, missingNeed, MOST_JUMP_BOLTS, nextTarget, planJump, rankOf, RANKS, readArena, SHOWS_AFTER, statsOf, trophiesFor,
  type ArenaState, type JumpResult,
} from './arena/arena';
import { FOR_SALE, ITEMS, REPEATS, repeatPrice, ROWS } from './arena/catalog';
import { LENGTHS, needLine, PHRASES, PRICE_TOP, sayable, SMALL_UNITS_TO, unitSaid } from './phrases';
import { CLIPS } from './voice.gen';
import { PLACE_KEY } from './nav';
import { jumpWith } from './jump/sim';
import { KINDS, makeQuestion, storySaid, thingOf } from './questions/problems';
import { seeded } from '../game/rng';

function store(initial: AirState = airSave.fresh()) {
  let state = initial;
  return {
    get state() { return state; },
    commit(change: (s: AirState) => AirState | null) { const next = change(state); if (!next) return { kind: 'rejected' as const, reason: 'rejected' as const }; state = next; return { kind: 'accepted' as const, state, saved: Promise.resolve(true) }; },
  };
}
const solved = (i: number, outcome: SolvedProblem['outcome'] = 'clean'): SolvedProblem => ({ index: i, outcome, misses: outcome === 'clean' ? 0 : 1, helped: false, replay: false });
const result = (a: ArenaState, child: 'skilled' | 'nothing' = 'skilled'): JumpResult => { const p = planJump(a), s = jumpWith(p.setup, child); return { feet: s.feet, clean: !!s.landed?.clean, tape: [[1, 1, 0, 0]], setup: p.setup }; };

describe('the save', () => {
  it('has its own keys and a version', () => { expect(SAVE_KEY).toBe('big-air-save'); expect(PLACE_KEY).toBe('big-air-place'); expect(SAVE_VERSION).toBe(1); });
  it('round-trips, with the Record Board and the best jump to watch again', () => {
    let a = bought({ ...freshArena(), owned: [...freshArena().owned] }, { kind: 'item', id: 'part:engine:v6' });
    const plan = planJump(a), res = result(a);
    a = { ...a, records: [{ feet: res.feet, jump: 1 }], best: { feet: res.feet, jump: 1, setup: res.setup, tape: res.tape, row: plan.course.target }, rowsCleared: 4, shows: 2, tries: { row: 1, show: 2 }, more: { ...a.more, seats: 3 } };
    const s = { ...airSave.fresh(), currency: { balance: 42 }, arena: a };
    const back = airSave.decode(JSON.parse(JSON.stringify(airSave.encode(s))));
    expect(back.currency.balance).toBe(42);
    expect(back.arena.truck.engine).toBe('part:engine:v6');
    expect(back.arena.records).toEqual([{ feet: res.feet, jump: 1 }]);
    expect(back.arena.best).toEqual(a.best);
    expect(back.arena.rowsCleared).toBe(4);
    expect(back.arena.tries).toEqual({ row: 1, show: 2 });
    expect(back.arena.more.seats).toBe(3);
  });
  it("starts fresh from a version it does not know, and drops what it can't read", () => {
    expect(airSave.decode({ version: 99, balance: 5 }).currency.balance).toBe(0);
    const odd = readArena({ owned: ['nope', 'part:engine:v8'], truck: { engine: 'part:engine:v8', tires: 'part:engine:v8', colour: 'colour:gold' }, jumps: -2, night: true, best: { feet: 10, setup: { top: 1 } } });
    expect(odd.owned).not.toContain('nope');
    expect(odd.truck.engine).toBe('part:engine:v8');
    expect(odd.truck.tires).toBe('part:tires:street'); // an engine can't be tires
    expect(odd.truck.colour).toBe('colour:red'); // not owned
    expect(odd.jumps).toBe(0);
    expect(odd.night).toBe(false); // no floodlights
    expect(odd.best).toBeNull();
  });
});

describe('a Round and a Jump', () => {
  it('pays a Bolt for each clean answer and one for finishing, and earns a Jump', () => {
    const s = store(), practice = createPractice(s);
    const started = practice.start();
    expect(started.kind).toBe('accepted');
    if (started.kind !== 'accepted') return;
    for (let i = 1; i <= 5; i++) practice.solve(started.roundId, solved(i, i === 3 ? 'missed' : 'clean'), { mode: 'ruler', push: true });
    practice.terminal({ roundId: started.roundId, status: 'completed', results: [1, 2, 3, 4, 5].map(i => solved(i, i === 3 ? 'missed' : 'clean')) });
    expect(s.state.currency.balance).toBe(5);
    expect(s.state.arena.jumps).toBe(2); // the free first one, and this Round's
  });
  it('a Jump is used when it ends, pays, fills the Record Board, and does nothing without one', () => {
    const s = store({ ...airSave.fresh(), arena: { ...freshArena(), jumps: 1 } });
    const plan = planJump(s.state.arena), res = result(s.state.arena);
    const pay = settleJump(s, plan, res)!;
    expect(pay.bolts).toBeGreaterThanOrEqual(JUMP_BOLTS);
    expect(pay.bolts).toBeLessThanOrEqual(MOST_JUMP_BOLTS);
    expect(s.state.arena.jumps).toBe(0);
    expect(s.state.arena.jumped).toBe(1);
    expect(s.state.arena.records[0]!.feet).toBe(res.feet);
    expect(s.state.arena.best?.feet).toBe(res.feet);
    expect(settleJump(s, plan, res)).toBeNull();
  });
  it('the first Jump goes over the first Row; clearing a Row opens the next in the shop, and it must be bought', () => {
    let a = freshArena();
    expect(nextTarget(a)).toEqual({ kind: 'row', n: 1 });
    expect(missingNeed(a, { kind: 'item', id: 'row:2' })).toBe('row:1');
    a = { ...a, rowsCleared: 1 };
    expect(missingNeed(a, { kind: 'item', id: 'row:2' })).toBeNull();
    expect(buyable(a, { kind: 'item', id: 'row:3' })).toBe(false);
    expect(nextTarget(a)).toEqual({ kind: 'again', n: 1 });
    a = bought(a, { kind: 'item', id: 'row:2' });
    expect(nextTarget(a)).toEqual({ kind: 'row', n: 2 });
  });
  it('after the first Rows a Show is always on offer, taking turns with the Rows', () => {
    let a: ArenaState = { ...freshArena(), rowsCleared: SHOWS_AFTER, owned: [...freshArena().owned, `row:${SHOWS_AFTER + 1}`] };
    expect(nextTarget(a).kind).toBe('row');
    a = { ...a, lastRow: true };
    expect(nextTarget(a)).toEqual({ kind: 'show', n: 1 });
    a = { ...a, rowsCleared: ROWS.length };
    expect(nextTarget(a).kind).toBe('show');
  });
  it('falling short is not failing: the same Row waits, with more tail wind each try, and it clears in the end', () => {
    // a Row far longer than the starting truck can jump
    let a: ArenaState = { ...freshArena(), rowsCleared: 8, owned: [...freshArena().owned, 'row:9'], jumps: 20 };
    const s = store({ ...airSave.fresh(), arena: a });
    let tries = 0;
    while (s.state.arena.rowsCleared === 8 && tries < 12) {
      a = s.state.arena;
      const plan = planJump(a);
      const pay = settleJump(s, plan, result(a, 'skilled'))!;
      if (plan.course.target.kind !== 'row') continue; // Shows take turns with the Rows
      expect(plan.setup.help).toBe(tries);
      tries++;
      if (!pay.cleared) expect(pay.help).toBe(tries);
    }
    expect(tries).toBeGreaterThan(1);
    expect(s.state.arena.rowsCleared).toBe(9);
    expect(s.state.arena.tries.row).toBe(0);
  });
  it('a Show is the same Show on a reload, and its length is what the tape must reach', () => {
    const c = courseOf({ kind: 'show', n: 37 });
    expect(courseOf({ kind: 'show', n: 37 })).toEqual(c);
    expect(c.feet).toBeGreaterThan(0);
  });
  it('better parts change the Jump: engine, tires, springs, booster and ramp all show in its numbers', () => {
    const a = freshArena(), s0 = statsOf(a);
    const up = (id: string) => statsOf(bought({ ...a }, { kind: 'item', id }));
    expect(up('part:engine:v8').top).toBeGreaterThan(s0.top);
    expect(up('part:tires:big').accel).toBeGreaterThan(s0.accel);
    expect(up('part:springs:shocks').window).toBeGreaterThan(s0.window);
    expect(up('part:booster:big').boost).toBeGreaterThan(s0.boost);
    expect(up('ramp:runup:long').runUp).toBeGreaterThan(s0.runUp);
    expect(up('ramp:kicker:steep').angle).toBeGreaterThan(s0.angle);
    expect(up('ramp:landing:air').window).toBeGreaterThan(s0.window);
    expect(statsOf({ ...a, more: { ...a.more, engine: 5 } }).top).toBeGreaterThan(statsOf({ ...a, more: { ...a.more, engine: 4 } }).top);
  });
  it('ranks go up with Jumps, and after Legend a numbered Legend every 40, without end; trophies come with distance', () => {
    expect(rankOf(0).name).toBe('Rookie');
    const top = RANKS.at(-1)!.at;
    expect(rankOf(top + 40)).toMatchObject({ name: 'Legend', number: 2 });
    expect(rankOf(top + 4000).number).toBe(101);
    expect(trophiesFor(45)).toEqual([20, 30, 40]);
  });
});

describe('the catalogue', () => {
  it('has unique ids and names, and every Row is as long as its things', () => {
    expect(new Set(ITEMS.map(i => i.id)).size).toBe(ITEMS.length);
    expect(new Set(ITEMS.map(i => i.name)).size).toBe(ITEMS.length);
    for (let i = 1; i < ROWS.length; i++) expect(ROWS[i]!.feet).toBeGreaterThanOrEqual(ROWS[i - 1]!.feet - 6);
  });
});

describe('the voice', () => {
  it('has a clip for every line', () => { for (const p of PHRASES) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy(); });
  it('says every length with its unit as one clip, "1 foot" and "2 feet" apart, and every distance to 999', () => {
    const said = new Set<string>(PHRASES);
    expect(said.has('1 foot') && said.has('2 feet') && said.has('1 inch') && said.has('1 centimetre')).toBe(true);
    expect(said.has('1 feet')).toBe(false);
    for (let n = 0; n <= 999; n++) for (const p of unitSaid(n, 'ft')) expect(said.has(p), `${n}: ${p}`).toBe(true);
    for (const u of ['in', 'cm'] as const) for (let n = 0; n <= SMALL_UNITS_TO; n++) for (const p of unitSaid(n, u)) expect(said.has(p), `${n} ${u}: ${p}`).toBe(true);
  });
  it('has a clip for every inch and centimetre a question or its lesson can say', () => {
    const said = new Set<string>(PHRASES), rng = seeded(11), needed = new Set<string>();
    const need = (n: number, u: 'in' | 'ft' | 'cm') => { for (const p of unitSaid(n, u)) needed.add(p); };
    for (const k of KINDS) for (const l of [1, 2, 3] as const) for (let i = 0; i < 3000; i++) {
      const q = makeQuestion(k, l, (i % 3) as 0 | 1 | 2, rng);
      if (q.kind === 'ruler') need(Number(q.answer), q.ruler.unit);
      if (q.kind === 'longer') need(Number(q.answer), q.form === 'jumps' ? 'ft' : q.ruler.unit);
      if (q.kind === 'guess') {
        if (q.form === 'about') { for (const c of q.choices) need(Number(c), q.unit); need(thingOf(q.thing).about.n, thingOf(q.thing).about.unit); }
        else for (const id of q.form === 'longer' ? [q.a, q.b] : [q.thing]) need(thingOf(id).about.n, thingOf(id).about.unit);
      }
      if (q.kind === 'units' && q.form === 'more') need(q.n, q.unit);
    }
    for (const p of needed) expect(said.has(p), p).toBe(true);
    // past 40, only whole fives are recorded in inches and centimetres
    expect(LENGTHS.filter(p => /inch|centimetre/.test(p) && Number(p.split(' ')[0]) > SMALL_UNITS_TO).length).toBe(2 * 12);
  });
  it('can say every question of every kind', () => {
    const said = new Set<string>(PHRASES), rng = seeded(4);
    for (const k of KINDS) for (const l of [1, 2, 3] as const) for (let i = 0; i < 200; i++) {
      const q = makeQuestion(k, l, (i % 3) as 0 | 1 | 2, rng);
      if (q.kind === 'story') for (const p of storySaid(q, n => `${n} feet`)) expect(said.has(p), p).toBe(true);
    }
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
  it('can say every thing for sale by name, and every Row', () => { const said = new Set<string>(PHRASES); for (const i of ITEMS) expect(said.has(i.name), i.name).toBe(true); });
});
