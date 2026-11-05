import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { numberChoices } from './choices';
import { CHART_TOP, chartKeeps, crossingFacts, factsFor, hiddenCell, rowWindow, makeQuestion, MATH_KINDS, SKIP_TOP, STORIES, STRIP_UNITS, unitsOf, valueOf, type Bar, type Kind, type Level, type Question } from './problems';
import { DRAWINGS, FILLS, FILLS_BY_STRETCH, type Drawing, type ShapeName, type Tile } from './shapes';

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

describe('the four later kinds, over many thousands of questions', () => {
  const RUNS = 3000, range = (q: Question) => (q.choices ?? []);
  it('number chart', () => each('chart', (q, level, stretch) => {
    if (q.kind !== 'chart') throw 0;
    expect(n(q)).toBeGreaterThanOrEqual(1);
    expect(n(q)).toBeLessThanOrEqual(CHART_TOP);
    expect(n(q)).toBeLessThanOrEqual(q.to);
    expect(range(q).every(c => c >= 1 && c <= 200)).toBe(true);
    if (level === 1) expect(q.to).toBe(stretch === 0 ? 30 : 50);
    if (q.form === 'tap') expect(n(q)).toBe(q.n);
    if (q.form === 'next') {
      expect(q.shown).toEqual([n(q) - 2, n(q) - 1]);
      expect(hiddenCell(q, n(q))).toBe(true);
      if (level === 1) expect(n(q) % 10).toBeGreaterThanOrEqual(2); // crossing a ten waits for Level 2
      if (level === 2) expect(n(q) % 10).toBeLessThanOrEqual(1);
    }
    if (q.form === 'more') {
      expect(level).toBe(3);
      expect(n(q) - q.n).toBe(Number(q.op));
      expect(hiddenCell(q, q.n)).toBe(false);
      expect(hiddenCell(q, n(q))).toBe(stretch > 0);
    }
  }, RUNS), 30_000);
  it('big jumps', () => each('jump', (q, level) => {
    if (q.kind !== 'jump') throw 0;
    expect(n(q)).toBe(q.op === 'add' ? q.a + q.b : q.a - q.b);
    expect(q.input).toBe('wheels');
    expect(n(q)).toBeLessThanOrEqual(99);
    expect(n(q)).toBeGreaterThan(0);
    if (q.op === 'sub') expect(q.form).toBe('decades');
    if (level === 1) { expect(q.a % 10).toBe(0); expect(q.b % 10).toBe(0); expect(n(q)).toBeLessThanOrEqual(90); }
    if (level === 2) expect((q.a % 10) + (q.b % 10)).toBeLessThan(10); // no carrying
    if (q.form === 'cross') expect((q.a % 10) + (q.b % 10)).toBeGreaterThan(9);
  }, RUNS), 30_000);
  it('measure it', () => each('measure', (q, _level, stretch) => {
    if (q.kind !== 'measure') throw 0;
    if (q.form === 'order') {
      const lens = q.bars.map(b => b.len), right = q.bars.find(b => b.id === q.answer)!;
      expect(new Set(lens).size).toBe(3);
      expect(right.len).toBe(q.want === 'longest' ? Math.max(...lens) : Math.min(...lens));
      for (const b of q.bars) expect(b.start + b.len).toBeLessThanOrEqual(STRIP_UNITS);
      if (stretch === 0) expect(q.bars.every(b => b.start === 0)).toBe(true);
      expect(q.traps.map(t => t.value).sort()).toEqual(q.bars.map(b => b.id).filter(id => id !== q.answer).sort());
    }
    if (q.form === 'rope') {
      const [a, b] = q.bars as [Bar, Bar];
      expect(q.rope).toBe(a.len);
      expect(a.len).not.toBe(b.len);
      expect(q.answer).toBe(a.len > b.len ? 'a' : 'b');
      for (const x of q.bars) { expect(x.start + x.len).toBeLessThanOrEqual(STRIP_UNITS); expect(x.start + q.rope).toBeLessThanOrEqual(STRIP_UNITS); }
    }
    if (q.form === 'lay' || q.form === 'count') { expect(n(q)).toBe(q.len); expect(q.len).toBeGreaterThanOrEqual(2); expect(q.len).toBeLessThanOrEqual(12); }
    if (q.form === 'fewer') { expect(q.len % 2).toBe(0); expect(q.answer).toBe(q.want === 'fewer' ? 'big' : 'small'); }
    if (q.form === 'right') {
      expect(new Set(q.rows.map(r => r.laying)).size).toBe(3);
      expect(q.rows.find(r => r.id === q.answer)!.laying).toBe('right');
      for (const r of q.rows) for (const at of unitsOf(q.len, r.laying)) expect(at + 1).toBeLessThanOrEqual(STRIP_UNITS);
    }
  }, RUNS), 30_000);
  it('lays a right measure end to end, and a wrong one really wrong', () => {
    for (let len = 4; len <= 12; len++) {
      const steps = (l: 'right' | 'gaps' | 'overlap') => unitsOf(len, l).slice(1).map((at, i) => at - unitsOf(len, l)[i]!);
      expect(unitsOf(len, 'right')).toHaveLength(len);
      expect(steps('right').every(s => s === 1)).toBe(true);
      expect(steps('gaps').every(s => s > 1.15)).toBe(true);
      expect(steps('overlap').every(s => s < 0.9)).toBe(true);
      for (const l of ['gaps', 'overlap'] as const) expect(unitsOf(len, l).at(-1)! + 1).toBeCloseTo(len); // they still reach the end
    }
  });
  it('shapes', () => each('shape', (q, level, stretch) => {
    if (q.kind !== 'shape') throw 0;
    const named = (t: Tile, name: ShapeName) => (DRAWINGS[t.id] as Drawing).is === name;
    if (q.form === 'every') {
      expect(q.tiles).toHaveLength(6);
      expect(q.targets.length).toBeGreaterThanOrEqual(2);
      q.tiles.forEach((t, i) => expect(named(t, q.name), `${t.id} for ${q.name}`).toBe(q.targets.includes(i)));
      expect(q.answer).toBe('all');
      expect(q.traps).toHaveLength(6 - q.targets.length);
    }
    if (q.form === 'notA') {
      const at = Number(q.answer.slice(5));
      q.tiles.forEach((t, i) => expect(named(t, q.name)).toBe(i !== at));
    }
    if (q.form === 'every' || q.form === 'notA') {
      if (q.name === 'rectangle') expect(q.tiles.some(t => t.id === 'square')).toBe(false); // a square is one, and that's not for this Level
      if (stretch === 0 && q.name === 'triangle' && q.form === 'every') expect(q.tiles.every(t => t.turn === 0)).toBe(true);
    }
    if (q.form === 'rule') {
      const at = Number(q.answer.slice(5));
      q.tiles.forEach((t, i) => { const d: Drawing = DRAWINGS[t.id]; expect(d.closed && d.sides === q.sides && !d.flaw).toBe(i === at); });
    }
    if (q.form === 'sides') expect(n(q)).toBe((DRAWINGS[q.tile.id] as Drawing).sides);
    if (q.form === 'fill') {
      expect(level).toBe(3);
      expect(FILLS_BY_STRETCH[stretch]).toContain(q.fill);
      for (const p of FILLS[q.fill].parts) expect(q.bank).toContain(p.piece);
      expect(q.bank).toHaveLength(3);
    }
  }, RUNS), 30_000);
});

describe('the window of rows on a short screen', () => {
  it('always holds every number a question is about, at every size', () => each('chart', q => {
    if (q.kind !== 'chart') throw 0;
    const total = Math.ceil(q.to / 10);
    for (let fit = 3; fit <= 12; fit++) {
      const [first, last] = rowWindow(total, fit, chartKeeps(q));
      expect(first).toBeGreaterThanOrEqual(0);
      expect(last).toBeLessThanOrEqual(total);
      expect(last - first).toBe(Math.min(fit, total));
      for (const n of chartKeeps(q)) { const row = Math.floor((n - 1) / 10); expect(row, `${n} in ${first}-${last}`).toBeGreaterThanOrEqual(first); expect(row).toBeLessThan(last); }
    }
  }), 30_000);
  it('holds ten more, and ten less, in every case', () => {
    for (let n = 1; n <= 110; n++) for (let fit = 3; fit <= 11; fit++) {
      const [first, last] = rowWindow(12, fit, [n, n + 10]), row = Math.floor((n - 1) / 10);
      expect(row >= first && row + 1 < last).toBe(true);
    }
  });
  it("doesn't always put the number in the same place", () => {
    const places = new Set(Array.from({ length: 40 }, (_, i) => { const n = 41 + i; return Math.floor((n - 1) / 10) - rowWindow(12, 6, [n])[0]; }));
    expect(places.size).toBeGreaterThan(2);
  });
});

describe('what Shapes shows', () => {
  it('leaves hexagons out of every form at Stretch 0', () => {
    const rng = seeded(21);
    for (const level of LEVELS) for (let i = 0; i < 3000; i++) {
      const q = makeQuestion('shape', level, rng, { stretch: 0 });
      if (q.kind !== 'shape') throw 0;
      const ids = q.form === 'sides' ? [q.tile.id] : q.form === 'fill' ? [] : q.tiles.map(t => t.id);
      expect(ids).not.toContain('hexagon');
      if (q.form === 'rule') expect(q.sides).not.toBe(6);
      if (q.form === 'sides') expect(n(q)).not.toBe(6);
      if (q.form === 'fill') expect(q.fill).not.toBe('hexSix');
    }
  }, 30_000);
  it('has real squares wherever a part is called one', () => {
    for (const f of Object.values(FILLS)) for (const p of f.parts) {
      if (p.piece !== 'square') continue;
      const [, x, y, x2, y2] = p.d.match(/^M(\d+) (\d+) H(\d+) V(\d+)/)!.map(Number) as [number, number, number, number, number];
      expect(Math.abs(x2 - x), `${f.says} ${p.d}`).toBe(Math.abs(y2 - y));
    }
  });
});

describe('facts that cross ten', () => {
  it('have no family in common with the Levels, and fit the strip', () => {
    const levels = new Set([1, 2, 3].flatMap(l => factsFor(l as Level)).map(([a, b]) => `${Math.max(a, b)}+${Math.min(a, b)}`));
    expect(crossingFacts().length).toBeGreaterThan(5);
    for (const [a, b] of crossingFacts()) { expect(levels.has(`${a}+${b}`)).toBe(false); expect(a + b).toBeGreaterThan(10); expect(a + b).toBeLessThanOrEqual(20); }
  });
});
