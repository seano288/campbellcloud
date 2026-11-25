// Thousands of generated questions, each checked: exactly one right answer, the answer is what the motion model says happens, the scene
// that plays agrees with it, and the brief's rules hold (no weight-falls-faster question, hills apart, an agreed magnet table, grounds
// never close, Bump seen from above).
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { coastDistance, MAGNET_REACH } from '../physics/motion';
import { arrowAngle, choiceName, HILL_APART, isRightAnswer, KINDS, makeQuestion, outcome, type Level, type Question } from './problems';
import { hillRun } from './hills';
import { bumpAt, groundsX, laneDuration, lanesOf, loadsEnd, magnetTry, nearAt, polesGap, pushesX, sceneDuration, throughAt } from './scenes';
import { ACTIONS, comparable, GROUNDS, groundOf, THINGS, thingOf } from './tables';

const N = 1500;
const all: Question[] = [];
for (const k of KINDS) for (const l of [1, 2, 3] as const) { const r = seeded(k.length * 100 + l); for (let i = 0; i < N; i++) all.push(makeQuestion(k, l, r)); }
const of = (k: string, l?: Level) => all.filter(q => q.kind === k && (l === undefined || q.level === l));

describe('every question', () => {
  it('has two or more different choices and exactly one right answer', () => {
    for (const q of all) {
      expect(new Set(q.choices).size, q.text).toBe(q.choices.length);
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.choices.filter(c => isRightAnswer(q, c)).length, JSON.stringify(q.scene)).toBe(1);
      expect(isRightAnswer(q, 'nonsense')).toBeNull();
    }
  });
  it('has the answer the motion model works out from its scene', () => {
    for (const q of all) expect(outcome(q), JSON.stringify(q.scene)).toBe(q.answer);
  });
  it('matches its Level: the scene each Level asks for', () => {
    const types = (k: string, l: Level) => new Set(of(k, l).map(q => q.scene.type));
    expect(types('push', 1)).toEqual(new Set(['act'])); expect(types('push', 2)).toEqual(new Set(['way'])); expect(types('push', 3)).toEqual(new Set(['pushes']));
    expect(of('hill', 1).every(q => q.scene.type === 'hills' && q.scene.lanes.length === 2 && q.scene.lanes.every(l => l.hill === undefined))).toBe(true);
    expect(of('hill', 2).every(q => q.scene.type === 'hills' && q.scene.lanes.length === 1 && q.scene.lanes[0]!.hill !== undefined)).toBe(true);
    expect(of('hill', 3).every(q => q.scene.type === 'hills' && q.scene.lanes.length === 3)).toBe(true);
    for (const [l, mode] of [[1, 'far'], [2, 'start'], [3, 'stop']] as const) expect(of('heavy', l).every(q => q.scene.type === 'loads' && q.scene.mode === mode)).toBe(true);
    expect(of('rough', 1).every(q => q.scene.type === 'grounds' && q.scene.mode === 'far')).toBe(true);
    expect(of('rough', 2).every(q => q.scene.type === 'grounds' && q.scene.mode === 'first')).toBe(true);
    expect(of('rough', 3).every(q => q.scene.type === 'grounds' && (q.scene.mode === 'station' || q.scene.mode === 'long'))).toBe(true);
    for (const [l, mode] of [[1, 'ball'], [2, 'wall'], [3, 'side']] as const) expect(of('bump', l).every(q => q.scene.type === 'bump' && q.scene.mode === mode)).toBe(true);
    expect(types('magnet', 1)).toEqual(new Set(['magnet'])); expect(types('magnet', 2)).toEqual(new Set(['poles'])); expect(types('magnet', 3)).toEqual(new Set(['near', 'through']));
  });
  it('does not always have the same answer: the right choice moves about', () => {
    for (const k of KINDS) for (const l of [1, 2, 3] as const) {
      const qs = of(k, l), first = qs.filter(q => q.choices[0] === q.answer).length / qs.length;
      if (k === 'bump' && l === 1) continue; // "rolls on" is always right, and that's the lesson; its button moves with the ball's way
      expect(first, `${k} ${l}`).toBeLessThan(.75);
    }
  });
  it('says what it asks with clips the game has, and its word, ground and thing choices are named', async () => {
    const { PHRASES } = await import('../phrases'), said = new Set<string>(PHRASES);
    for (const q of all.filter((_, i) => i % 7 === 0)) {
      for (const p of q.ask) expect(said.has(p), p).toBe(true);
      if (q.choiceKind === 'word' || q.choiceKind === 'ground' || q.choiceKind === 'thing') for (const c of q.choices) expect(said.has(choiceName(q.choiceKind, c)!)).toBe(true);
    }
  });
});

describe('the scene that plays agrees with the answer', () => {
  it('pushes and loads: the cart picked goes farthest (or is the one that does not start, or goes farthest while being stopped)', () => {
    for (const q of [...of('push', 3), ...of('heavy')]) {
      const sc = q.scene;
      if (sc.type === 'pushes') { const ends = sc.lanes.map(l => pushesX(l.impulse, 99)); expect(sc.lanes[ends.indexOf(Math.max(...ends))]!.cart).toBe(q.answer); }
      if (sc.type === 'loads') {
        const ends = sc.lanes.map(l => loadsEnd(sc.mode, l.mass));
        const pick = sc.mode === 'start' ? sc.lanes.filter((_, i) => ends[i] === 0) : [sc.lanes[ends.indexOf(Math.max(...ends))]!];
        expect(pick.length).toBe(1);
        expect(pick[0]!.cart).toBe(q.answer);
        // the light cart visibly moves when the starting push gets it going
        if (sc.mode === 'start') for (let i = 0; i < ends.length; i++) if (ends[i]! > 0) expect(ends[i]).toBeGreaterThan(.2);
      }
    }
  });
  it('hills: the scene rolls the cart over exactly when the answer says, and the faster one is the one started higher', () => {
    for (const q of of('hill')) {
      const sc = q.scene;
      if (sc.type !== 'hills') continue;
      if (q.answer === 'yes' || q.answer === 'no') expect(hillRun(sc.lanes[0]!).over).toBe(q.answer === 'yes');
      else if (sc.lanes.every(l => l.hill === undefined)) expect(sc.lanes.find(l => l.cart === q.answer)!.start).toBe(Math.max(...sc.lanes.map(l => l.start)));
      else { const over = sc.lanes.filter(l => hillRun(l).over); expect(over.map(l => l.cart)).toEqual([q.answer]); }
    }
  });
  it('grounds: the cart goes farthest on the smoothest ground and stops first on the roughest', () => {
    for (const q of of('rough')) {
      const sc = q.scene;
      if (sc.type !== 'grounds') continue;
      const ends = sc.lanes.map(l => groundsX(l.ground, 99));
      const far = sc.lanes[ends.indexOf(Math.max(...ends))]!.ground, near = sc.lanes[ends.indexOf(Math.min(...ends))]!.ground;
      expect(q.answer).toBe(sc.mode === 'far' || sc.mode === 'long' ? far : near);
    }
  });
  it('bumps: the ball goes off the way the answer arrow points', () => {
    for (const q of of('bump').filter((_, i) => i % 5 === 0)) {
      const sc = q.scene;
      if (sc.type !== 'bump') continue;
      const end = bumpAt(sc, 3), start = bumpAt(sc, 0);
      if (sc.mode === 'ball') { expect(end.a.x).toBeCloseTo(bumpAt(sc, 1).a.x, 6); expect(Math.sign(end.b!.x - start.b!.x)).toBe(Math.sign(sc.v.x)); expect(q.answer).toBe('on'); continue; }
      const mid = bumpAt(sc, 2), a = (Math.atan2(end.a.y - mid.a.y, end.a.x - mid.a.x) * 180) / Math.PI;
      const gap = Math.min(Math.abs(((a - arrowAngle(q.answer)) % 360 + 360) % 360), 360 - Math.abs(((a - arrowAngle(q.answer)) % 360 + 360) % 360));
      expect(gap, JSON.stringify(sc)).toBeLessThan(3);
    }
  });
  it('magnets: the thing picked is the one that jumps; the ends slide together or apart as answered', () => {
    for (const q of of('magnet')) {
      const sc = q.scene;
      if (sc.type === 'magnet') {
        const jumped = sc.things.filter(t => magnetTry(thingOf(t).magnetic, 3).jumped);
        if (sc.mode === 'which') expect(jumped).toEqual([q.answer]); else expect(jumped.length === 1).toBe(q.answer === 'yes');
      }
      if (sc.type === 'poles') expect(polesGap(sc.ends, 3) < polesGap(sc.ends, 0)).toBe(q.answer === 'together');
      if (sc.type === 'near') { const moved = sc.clips.filter(c => nearAt(c.d, 3) < c.d); expect(moved.map(c => c.cart)).toEqual([q.answer]); }
      if (sc.type === 'through') expect(throughAt(thingOf(sc.thing).magnetic, 3).thing > 0).toBe(q.answer === 'yes');
    }
  });
  it('every lane has an end (the player speeds up any lane longer than a few seconds to watch)', () => {
    for (const q of all.filter((_, i) => i % 11 === 0)) {
      expect(sceneDuration(q.scene)).toBeLessThanOrEqual(25);
      for (let i = 0; i < lanesOf(q.scene); i++) expect(laneDuration(q.scene, i)).toBeGreaterThan(0);
    }
  });
});

describe("the brief's rules", () => {
  it('no question depends on weight making something fall or roll downhill faster: the hills never differ in load, Heavy and Light is all on flat ground', () => {
    for (const q of all) {
      const sc = q.scene;
      // the only scenes with a slope are Hills, and a Hills scene has no load or mass anywhere in it
      if (sc.type === 'hills') { expect(JSON.stringify(sc)).not.toMatch(/mass|load|bag/); expect(q.ask.join(' ')).not.toMatch(/heavy|light|full|empty|weigh/i); }
      if (sc.type === 'loads') expect(['far', 'start', 'stop']).toContain(sc.mode); // flat ground: no slope in loadsX at all
      if (q.kind === 'heavy') expect(sc.type).toBe('loads');
    }
    // and the hill a heavy cart would roll down is the same hill an empty one does: the run has no weight in it
    expect(hillRun({ start: 3 })).toBe(hillRun({ start: 3 }));
  });
  it('hills compare heights that differ clearly: no two within a fifth of each other', () => {
    for (const q of of('hill')) {
      const sc = q.scene;
      if (sc.type !== 'hills') continue;
      const hs = [...new Set(sc.lanes.flatMap(l => [l.start, ...(l.hill === undefined ? [] : [l.hill])]))];
      for (const a of hs) for (const b of hs) if (a !== b) expect(Math.max(a, b) / Math.min(a, b)).toBeGreaterThanOrEqual(HILL_APART - 1e-9);
    }
  });
  it('magnets use only the hand-checked table: no coins, cans, jewellery, foil, keys, spoons or plain "metal"', () => {
    for (const t of THINGS) expect(t.name).not.toMatch(/coin|can\b|jewel|ring|foil|key|spoon|metal|tin/i);
    for (const t of THINGS.filter(x => x.magnetic)) expect(t.name).toMatch(/iron|steel/);
    for (const q of of('magnet')) {
      const sc = q.scene;
      const ids = sc.type === 'magnet' ? sc.things : sc.type === 'through' ? [sc.thing] : sc.type === 'near' ? ['clip'] : [];
      for (const id of ids) expect(THINGS.some(t => t.id === id)).toBe(true);
    }
  });
  it('rough and smooth never pairs two grounds that are close', () => {
    expect(comparable('grass', 'carpet')).toBe(false);
    expect(comparable('grass', 'sand')).toBe(false);
    expect(comparable('ice', 'floor')).toBe(false);
    for (const q of of('rough')) {
      const sc = q.scene;
      if (sc.type !== 'grounds') continue;
      for (const a of sc.lanes) for (const b of sc.lanes) if (a !== b) expect(comparable(a.ground, b.ground), `${a.ground} ${b.ground}`).toBe(true);
      const ds = sc.lanes.map(l => coastDistance(4, groundOf(l.ground).resistance));
      for (const a of ds) for (const b of ds) if (a !== b) expect(Math.max(a, b) / Math.min(a, b)).toBeGreaterThanOrEqual(2.5);
    }
    expect(GROUNDS.map(g => g.id)).toEqual(['ice', 'floor', 'carpet', 'grass', 'sand']);
  });
  it('bump is drawn from above on a flat table: its scenes have no slope or height in them', () => {
    for (const q of of('bump')) { expect(q.scene.type).toBe('bump'); expect(JSON.stringify(q.scene)).not.toMatch(/start|hill|slope|height/); }
  });
  it('push or pull uses only actions with one plain answer', () => {
    expect(ACTIONS.map(a => a.said).join(' ')).not.toMatch(/door|throw|dog/i);
    expect(new Set(ACTIONS.map(a => a.is))).toEqual(new Set(['push', 'pull']));
  });
  it('near and far: the near clip is well inside the magnet\'s reach and the far one well outside it', () => {
    for (const q of of('magnet', 3)) if (q.scene.type === 'near') { const ds = q.scene.clips.map(c => c.d).sort((a, b) => a - b); expect(ds[0]).toBeLessThan(MAGNET_REACH * .6); expect(ds[1]).toBeGreaterThan(MAGNET_REACH * 2); }
  });
});
