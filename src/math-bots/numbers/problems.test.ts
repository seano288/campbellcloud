import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { numberChoices } from './choices';
import { factsFor, makeQuestion, MATH_KINDS, SKIP_TOP, STORIES, valueOf, type Kind, type Level, type Question } from './problems';

const LEVELS: Level[] = [1, 2, 3], STRETCHES: Stretch[] = [0, 1, 2];
function each(kind: Kind, check: (q: Question, level: Level, stretch: Stretch) => void, runs = 400) {
  const rng = seeded(7);
  for (const level of LEVELS) for (const stretch of STRETCHES) for (let i = 0; i < runs; i++) check(makeQuestion(kind, level, rng, { stretch }), level, stretch);
}
const n = (q: Question) => Number(q.answer);

describe('every kind', () => {
  it.each(MATH_KINDS)('%s offers a fair set of answers', kind => each(kind, q => {
    const values = q.traps.map(t => t.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values).not.toContain(q.answer);
    if (q.input === 'strip') { expect(n(q)).toBeGreaterThanOrEqual(0); expect(n(q)).toBeLessThanOrEqual(20); }
    if (q.input === 'wheels') { expect(n(q)).toBeLessThan(100); expect(n(q)).toBeGreaterThanOrEqual(0); }
    if (q.input === 'choices') {
      expect(q.choices).toHaveLength(3);
      expect(new Set(q.choices).size).toBe(3);
      expect(q.choices).toContain(n(q));
      expect(q.choices!.every(c => c >= 0)).toBe(true);
      expect([...q.choices!].sort((a, b) => a - b)).toEqual(q.choices);
    }
  }));
  it('can avoid repeating the last answer', () => {
    const rng = seeded(3);
    let repeats = 0;
    for (let i = 0, last = ''; i < 500; i++) { const q = makeQuestion('ten', 2, rng, { avoid: last }); if (q.answer === last) repeats++; last = q.answer; }
    expect(repeats).toBe(0);
  });
});

describe('answers are arithmetically right', () => {
  it('make ten', () => each('ten', q => {
    if (q.kind !== 'ten') throw 0;
    if (q.form === 'look') expect(n(q)).toBe(q.n);
    else if (q.form === 'partners') expect(q.n + n(q)).toBe(10);
    else expect(q.part + n(q)).toBe(q.whole);
  }));
  it('count on', () => each('on', q => {
    if (q.kind !== 'on') throw 0;
    if (q.form === 'countUp') { expect(q.from + n(q)).toBe(q.to); expect(q.to).toBeLessThanOrEqual(20); return; }
    expect(n(q)).toBe(q.a + q.b);
    if (q.form === 'biggerFirst') { expect(Math.max(q.a, q.b)).toBeGreaterThanOrEqual(2 * Math.min(q.a, q.b)); expect(Math.min(q.a, q.b)).toBeLessThanOrEqual(4); }
  }));
  it('facts', () => each('facts', q => {
    if (q.kind !== 'facts') throw 0;
    expect(q.eq.a + q.eq.b).toBe(q.eq.c);
    expect(n(q)).toBe(q.eq.op === 'add' ? q.eq.c : q.eq.a);
  }));
  it('over ten always crosses ten', () => each('over', q => {
    if (q.kind !== 'over') throw 0;
    if (q.form === 'through') { expect(q.c).toBeGreaterThan(10); expect(q.c - q.b).toBeLessThan(10); expect(n(q)).toBe(q.c - q.b); return; }
    expect(q.a + q.b).toBeGreaterThan(10);
    expect(n(q)).toBe(q.a + q.b);
    if (q.form === 'fill') {
      expect(q.moved + q.left).toBe(q.b);
      if (q.steps) { expect(q.steps).toContain(q.left); expect(q.steps.length).toBe(3); }
    }
  }));
  it('missing part', () => each('part', q => {
    if (q.kind !== 'part') throw 0;
    switch (q.form) {
      case 'bond': expect(q.here + n(q)).toBe(q.whole); break;
      case 'addTo': expect(q.a + n(q)).toBe(q.c); break;
      case 'takeFrom': expect(q.c - n(q)).toBe(q.a); break;
      case 'firstAdd': expect(n(q) + q.b).toBe(q.c); break;
      case 'flipTake': expect(n(q) - q.b).toBe(q.a); break;
    }
  }));
  it('weigh-in', () => each('scale', q => {
    if (q.kind !== 'scale') throw 0;
    if (q.form === 'same') expect(valueOf(q.eq.left) === valueOf(q.eq.right)).toBe(q.answer === 'same');
    else if (q.form === 'cards') {
      const truths = q.cards.map((c, i) => (valueOf(c.left) === valueOf(c.right) ? i : -1)).filter(i => i >= 0);
      expect(truths).toEqual([n(q)]);
    } else {
      expect(q.a + q.b).toBe(n(q) + q.c);
      expect(q.a + q.b).toBeLessThanOrEqual(20);
      expect(q.traps.some(t => Number(t.value) === q.a + q.b)).toBe(true);
    }
  }));
  it('stories keep to their numbers and never go negative', () => each('story', q => {
    if (q.kind !== 'story') throw 0;
    expect(n(q)).toBeGreaterThan(0);
    expect(n(q)).toBeLessThanOrEqual(20);
    expect(q.lines.join(' ')).not.toMatch(/\{|\}|-\d|\b0\b/);
    expect(q.lines.join(' ')).not.toMatch(/kill|shoot|destroy/i);
    expect(q.lines.join(' ')).not.toMatch(/\b1\b/); // the sentences are plural
  }));
  it('tens and ones', () => each('tens', q => {
    if (q.kind !== 'tens') throw 0;
    if (q.form === 'read') expect(n(q)).toBe(q.rods * 10 + q.cubes);
    else if (q.form === 'make') expect(n(q)).toBe(q.n);
    else if (q.form === 'howManyTens') expect(n(q) * 10).toBe(q.n);
    else expect(q.answer).toBe(q.a < q.b ? '<' : q.a > q.b ? '>' : '=');
  }));
  it('skip count', () => each('skip', (q, level, stretch) => {
    if (q.kind !== 'skip') throw 0;
    expect(q.step).toBe({ 1: 10, 2: 5, 3: 2 }[level]);
    expect(n(q)).toBeLessThanOrEqual(SKIP_TOP);
    expect(n(q)).toBeGreaterThan(0);
    if (q.form === 'groups') { expect(n(q)).toBe(q.groups * q.step); return; }
    if (q.form === 'next') {
      expect(q.shown).toHaveLength(3);
      expect([...q.shown, n(q)].every((x, i, all) => i === 0 || x === all[i - 1]! + q.step)).toBe(true);
    } else {
      const full = q.shown.map(x => x ?? n(q));
      expect(q.shown.filter(x => x === null)).toHaveLength(1);
      expect(full.every((x, i) => i === 0 || x === full[i - 1]! + q.step)).toBe(true);
      expect(Math.max(...full)).toBeLessThanOrEqual(SKIP_TOP);
    }
    if (stretch === 0) expect(q.form).toBe('next');
    if (q.form === 'next') expect(q.shown[0]).toBeGreaterThan(0);
    expect(q.traps.some(t => t.why === 'counted by ones')).toBe(true);
  }));
});

describe('skip count crossing a hundred', () => {
  it('can offer the 200 mistake', () => {
    const rng = seeded(2);
    let offered = 0;
    for (let i = 0; i < 4000; i++) { const q = makeQuestion('skip', 1, rng, { stretch: 1 }); if (q.choices?.includes(200)) { offered++; expect(q.answer).toBe('110'); } }
    expect(offered).toBeGreaterThan(0);
  });
});

describe('facts sets', () => {
  it('match the research', () => {
    expect(factsFor(2).map(p => p.join('+')).sort()).toEqual(['4+3', '5+3', '5+4', '6+3']);
    expect(factsFor(3).map(p => p.join('+'))).toContain('8+7');
    expect(new Set(factsFor(1).map(String)).size).toBe(factsFor(1).length);
  });
  it('keep a Level from repeating another', () => {
    const one = new Set(factsFor(1).map(String));
    expect(factsFor(3).some(p => one.has(String(p)))).toBe(false);
  });
});

describe('stories', () => {
  it('keep the answer from always adding', () => {
    const rng = seeded(1), ops = { add: 0, sub: 0 };
    for (let i = 0; i < 400; i++) { const q = makeQuestion('story', 2, rng, { stretch: 2, want: i % 2 ? 'add' : 'sub' }); if (q.kind === 'story') ops[STORIES[q.id].slot === 'c' ? 'add' : 'sub']++; }
    expect(Math.min(ops.add, ops.sub)).toBeGreaterThan(100);
  });
});

describe('numberChoices', () => {
  it('spreads the right answer across low, middle and high', () => {
    const rng = seeded(11), at = [0, 0, 0];
    for (let i = 0; i < 3000; i++) { const c = numberChoices(rng, 10, [9, 11, 12], 2, 0, 20); at[c.indexOf(10)]!++; }
    for (const count of at) expect(count).toBeGreaterThan(700);
  });
  it('stays in range at the edges', () => {
    const rng = seeded(5);
    for (let i = 0; i < 500; i++) for (const t of [0, 1, 19, 20]) {
      const c = numberChoices(rng, t, [], 2, 0, 20);
      expect(c).toHaveLength(3);
      expect(c.every(x => x >= 0 && x <= 20)).toBe(true);
    }
  });
});
