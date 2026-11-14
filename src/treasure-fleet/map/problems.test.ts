// The rules the brief asks the tests to enforce, checked on many generated questions of every kind, Level and Stretch: exactly one
// thing answers, a named thing is the only one of its kind, compass questions never depend on a diagonal, grid labels never vary,
// clues end on an empty square on the map, and only one map from above matches the scene.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { cells, countOf, inLine, isRiver, LETTERS, letterOf, numberOf, onSide, RHYMING, same, squareName, thingAt, type Cell, type IsleMap, type Thing } from './map';
import {
  at, isAnswer, keyAnswer, legsOf, makeAbove, makeClue, makeGrid, makeKey, makeQuestion, makeWhere, numAnswer, orderOf, pickAnswer,
  rightAnswer, type Kind, type Level, type Question,
} from './problems';

const LEVELS: Level[] = [1, 2, 3], STRETCHES: Stretch[] = [0, 1, 2], SEEDS = 80;
const each = (f: (level: Level, stretch: Stretch, seed: number) => void) => { for (const l of LEVELS) for (const s of STRETCHES) for (let seed = 1; seed <= SEEDS; seed++) f(l, s, seed); };
const unique = (m: IsleMap, t: Thing) => expect(countOf(m, t.sym), `${t.sym} is on the map more than once`).toBe(1);
const onMap = (m: IsleMap) => m.things.forEach(t => {
  expect(t.x >= 0 && t.y >= 0 && t.x < m.w && t.y < m.h).toBe(true);
  expect(m.things.filter(u => same(u, t))).toHaveLength(1); // one thing to a square
  expect(isRiver(m, t)).toBe(t.sym === 'bridge'); // a bridge only on the river, and nothing else on it
});

/** Every answer a child could give, and which of them are right by reading the map, not the question's own record. */
function everyAnswer(q: Question): string[] {
  if (q.kind === 'above') return q.options.map((_, i) => pickAnswer(i));
  if (q.kind === 'grid' && q.form === 'which') return q.choices.map((_, i) => pickAnswer(i));
  if (q.kind === 'key' && q.form === 'symbol') return q.key.map(keyAnswer);
  if (q.kind === 'key' && q.form === 'count') return q.choices.map(numAnswer);
  return cells(q.map.w, q.map.h).map(at).filter(a => isAnswer(q, a));
}

describe('Where Is It', () => {
  it('has exactly one thing that answers, in line with the thing named, and nothing else anywhere on that side', () => each((level, stretch, seed) => {
    const q = makeWhere(level, stretch, seeded(seed));
    onMap(q.map);
    q.map.things.forEach(t => unique(q.map, t)); // every thing can be named
    const right = q.map.things.filter(t => {
      if (q.form === 'side') return onSide(q.ref, q.rel, t);
      if (q.form === 'between') { const across = q.a.y === q.b.y, k = across ? t.x : t.y, lo = Math.min(across ? q.a.x : q.a.y, across ? q.b.x : q.b.y), hi = Math.max(across ? q.a.x : q.a.y, across ? q.b.x : q.b.y); return k > lo && k < hi; }
      const best = Math.min(...q.map.things.map(u => depth(q.dir, u)));
      return depth(q.dir, t) === best;
    });
    expect(right).toEqual([q.answer]);
    if (q.form === 'side') expect(inLine(q.ref, q.rel, q.answer)).toBe(true); // never a diagonal
    if (q.form === 'between') expect(q.a.x === q.b.x || q.a.y === q.b.y).toBe(true);
    const answers = everyAnswer(q).filter(a => a === rightAnswer(q));
    expect(answers).toHaveLength(1);
  }));
  it('stays on left, right, above and below at Level 1, then brings the compass', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const l1 = makeWhere(1, 2, seeded(seed)), l2 = makeWhere(2, 0, seeded(seed)), l3 = makeWhere(3, 1, seeded(seed));
      expect(l1.form === 'side' && ['left', 'right', 'above', 'below'].includes(l1.rel)).toBe(true);
      expect(l1.rose).toBe('none');
      expect(l2.form === 'side' && ['north', 'south', 'east', 'west'].includes(l2.rel)).toBe(true);
      expect(l2.rose).toBe('lit');
      expect(l3.rose).toBe('plain');
    }
  });
  it('asks "between" and "furthest" at Level 3', () => {
    const forms = new Set(Array.from({ length: 200 }, (_, i) => makeWhere(3, 0, seeded(i + 1)).form));
    expect([...forms].sort()).toEqual(['between', 'furthest', 'side']);
  });
});
const depth = (dir: string, t: Cell) => (dir === 'north' ? t.y : dir === 'south' ? -t.y : dir === 'west' ? t.x : -t.x);

describe('Map Key', () => {
  it('has one right answer, and a thing it names is the only one of its kind', () => each((level, stretch, seed) => {
    const q = makeKey(level, stretch, seeded(seed));
    onMap(q.map);
    expect(q.key.includes('river')).toBe(q.map.river !== null);
    q.map.things.forEach(t => expect(q.key).toContain(t.sym)); // the key lists everything on the map
    if (q.form === 'symbol') expect(q.key).toContain(q.ask);
    if (q.form === 'find') { expect(q.map.things.filter(t => t.sym === q.ask)).toEqual([q.answer]); expect(level).toBe(2); }
    if (q.form === 'count') {
      expect(countOf(q.map, q.ask)).toBe(q.count);
      expect(q.choices.filter(c => c === countOf(q.map, q.ask))).toHaveLength(1);
      expect(Math.min(...q.choices)).toBeGreaterThan(0);
    }
    if (q.form === 'river') {
      const sign = q.dir === 'east' ? 1 : -1;
      expect(q.map.things.filter(t => (t.x - q.map.river!) * sign > 0)).toEqual([q.answer]);
      unique(q.map, q.answer);
    }
    expect(everyAnswer(q).filter(a => a === rightAnswer(q))).toHaveLength(1);
    expect(everyAnswer(q)).toContain(rightAnswer(q));
  }));
});

describe('Grid Square', () => {
  it('names squares one way only: letters along the bottom from the left, numbers up the side from the bottom, letter first', () => {
    expect(squareName(3, { x: 1, y: 1 })).toBe('B2');
    expect(squareName(5, { x: 0, y: 4 })).toBe('A1');
    expect(squareName(5, { x: 4, y: 0 })).toBe('E5');
    expect(LETTERS.map((_, x) => letterOf(x)).join('')).toBe('ABCDE');
    expect(numberOf(5, 4)).toBe(1);
  });
  it('is 3 by 3 at Level 1 and 5 by 5 after, and has one right answer', () => each((level, stretch, seed) => {
    const q = makeGrid(level, stretch, seeded(seed));
    onMap(q.map);
    expect(q.map.w).toBe(level === 1 ? 3 : 5);
    expect(q.map.h).toBe(q.map.w);
    expect(q.form).toBe(level === 3 ? 'which' : 'tap');
    if (q.form === 'which') {
      unique(q.map, q.thing);
      expect(q.choices.filter(c => same(c, q.thing))).toHaveLength(1);
      expect(new Set(q.choices.map(c => squareName(5, c))).size).toBe(3);
      // two different rhyming letters are never rivals
      const letters = new Set(q.choices.map(c => letterOf(c.x)));
      expect([...letters].filter(l => RHYMING.includes(l)).length).toBeLessThanOrEqual(1);
    }
    expect(everyAnswer(q).filter(a => a === rightAnswer(q))).toHaveLength(1);
  }));
});

describe('Follow the Clues', () => {
  it('ends on a square on the map that holds nothing, after one, two or three clues that turn each time', () => each((level, stretch, seed) => {
    const q = makeClue(level, stretch, seeded(seed));
    onMap(q.map);
    expect(q.clues).toHaveLength(level);
    const legs = legsOf(q)!;
    expect(legs).not.toBeNull();
    const end = legs.at(-1)!.at(-1)!;
    expect(same(end, q.end)).toBe(true);
    expect(thingAt(q.map, end)).toBeNull();
    expect(thingAt(q.map, q.start)).toBeNull();
    q.clues.forEach((c, i) => { if (i) expect(['north', 'south'].includes(c.dir)).not.toBe(['north', 'south'].includes(q.clues[i - 1]!.dir)); });
    // only a Level 3 clue names a landmark, never the last one, and it's the one thing of its kind
    const marks = q.clues.filter(c => 'to' in c);
    expect(marks).toHaveLength(level === 3 ? 1 : 0);
    if (level === 3) { expect('to' in q.clues.at(-1)!).toBe(false); marks.forEach(m => 'to' in m && unique(q.map, m.to)); }
    // nothing stands on the way except the landmark it walks to
    legs.flat().forEach(c => { const t = thingAt(q.map, c); if (t) expect(marks.some(m => 'to' in m && same(m.to, t))).toBe(true); });
    expect(everyAnswer(q).filter(a => a === rightAnswer(q))).toHaveLength(1);
  }));
});

describe('Map Key counting', () => {
  it('puts the right number in every place among its choices, so the middle button is not always it', () => {
    const places = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const q = makeKey(3, 0, seeded(seed));
      if (q.form !== 'count') continue;
      expect(q.choices).toEqual([q.choices[0]!, q.choices[0]! + 1, q.choices[0]! + 2]); // three in a row, smallest first
      places.add(q.choices.indexOf(q.count));
    }
    expect([...places].sort()).toEqual([0, 1, 2]);
  });
});

describe('From Above', () => {
  it('has exactly one map whose things go left to right as in the scene', () => each((level, stretch, seed) => {
    const q = makeAbove(level, stretch, seeded(seed));
    expect(q.options).toHaveLength(level === 1 ? 2 : 3);
    const matching = q.options.filter(m => orderOf(m.things) === orderOf(q.scene));
    expect(matching).toEqual([q.options[q.answer]]);
    expect(new Set(q.options.map(m => orderOf(m.things))).size).toBe(q.options.length);
    q.options.forEach(onMap);
    if (level === 3) q.options.forEach(m => expect(m.things.map(t => t.sym).sort()).toEqual(q.scene.map(t => t.sym).sort())); // only a position changes
  }));
});

describe('every kind', () => {
  it('makes a question quickly for every Level and Stretch', () => {
    const kinds: Kind[] = ['where', 'key', 'grid', 'clue', 'above'];
    for (const k of kinds) each((l, s, seed) => { if (seed <= 10) expect(makeQuestion(k, l, s, seeded(seed * 7)).kind).toBe(k); });
  });
});
