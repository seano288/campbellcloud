// Thousands of generated questions of every kind and Level, checked against the brief's rules: one right answer, nothing past 100 or
// below zero, rulers drawn with zero at the first tick and even ticks, Level 1 rulers from zero and Level 3 never, wrong choices that are
// real mistakes, Best Guess from the hand-checked table with choices at least five times apart, and Two Units never asking to convert.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import {
  CM_PER_IN, IN_CM, KINDS, makeQuestion, otherReading, RULER_PAD, rulerTicks, storyAnswer, storyPicture, storySaid, TOP, wrongEstimate,
  type Kind, type Level, type Question,
} from './problems';
import { BIG, SMALL, THINGS, thingOf } from './things';

const LEVELS = [1, 2, 3] as const, STRETCH = [0, 1, 2] as const;
function many(kind: Kind, level: Level, n = 600): Question[] {
  const rng = seeded(kind.length * 1000 + level * 77), out: Question[] = [];
  for (let i = 0; i < n; i++) out.push(makeQuestion(kind, level, STRETCH[i % 3] as Stretch, rng));
  return out;
}
const all = KINDS.flatMap(k => LEVELS.flatMap(l => many(k, l)));
const numbers = (q: Question): number[] => {
  switch (q.kind) {
    case 'ruler': return [q.bar.start, q.bar.len, q.bar.start + q.bar.len, q.ruler.top];
    case 'longer': return q.form === 'jumps' ? [q.a, q.b] : [q.a.start, q.a.len, q.b.start, q.b.len, q.a.start + q.a.len, q.b.start + q.b.len];
    case 'line': return q.form === 'hops' ? [q.a, q.b, q.a + q.b] : q.form === 'ones' ? [q.lo, q.n, q.lo + 10] : [q.n];
    case 'story': return [q.x, q.y, Number(q.answer)];
    case 'units': return q.form === 'which' ? [q.inches, q.cm] : q.form === 'more' ? [q.n] : [q.big.n, q.small.n];
    case 'guess': return q.form === 'about' ? q.choices.map(Number) : [];
  }
};

describe('every question', () => {
  it('has exactly one right answer, the right Level, and wrong answers that are not it', () => {
    for (const q of all) {
      expect(q.answer).not.toBe('');
      expect(q.traps.some(t => t.value === q.answer)).toBe(false);
      if ('choices' in q && q.choices) {
        expect(q.choices.filter(c => c === q.answer).length, JSON.stringify(q)).toBe(1);
        expect(new Set(q.choices).size).toBe(q.choices.length);
      }
    }
    for (const k of KINDS) for (const l of LEVELS) expect(many(k, l, 20).every(q => q.level === l && q.kind === k)).toBe(true);
  });
  it('never passes 100, and no answer is below zero', () => {
    for (const q of all) {
      for (const n of numbers(q)) { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(TOP); }
      if (/^\d+$/.test(q.answer)) { expect(Number(q.answer)).toBeGreaterThanOrEqual(0); expect(Number(q.answer)).toBeLessThanOrEqual(TOP); }
      for (const t of q.traps) if (/^\d+$/.test(t.value)) expect(Number(t.value)).toBeLessThanOrEqual(TOP);
    }
  });
  it('is the same question from the same seed', () => {
    for (const k of KINDS) expect(makeQuestion(k, 2, 1, seeded(9))).toEqual(makeQuestion(k, 2, 1, seeded(9)));
  });
});

describe('Ruler', () => {
  it('draws every ruler with its zero at the first tick, in from the end of the wood, and the ticks evenly spaced', () => {
    expect(RULER_PAD).toBeGreaterThan(0);
    for (const q of all) {
      if (q.kind !== 'ruler' && !(q.kind === 'longer' && q.form === 'ruler')) continue;
      const r = q.ruler, t = rulerTicks(r);
      expect(t.top[0]).toBe(RULER_PAD);
      expect(t.top.length).toBe(r.top + 1);
      for (let i = 1; i < t.top.length; i++) expect(t.top[i]! - t.top[i - 1]!).toBeCloseTo(1, 9);
      if (r.other) {
        expect(t.bottom[0]).toBe(RULER_PAD);
        const gap = t.bottom[1]! - t.bottom[0]!;
        for (let i = 1; i < t.bottom.length; i++) expect(t.bottom[i]! - t.bottom[i - 1]!).toBeCloseTo(gap, 9);
        expect(gap).toBeCloseTo(r.unit === 'in' ? 1 / CM_PER_IN : CM_PER_IN, 9);
      }
    }
  });
  it('starts a Level 1 thing at zero, always, and a Level 3 thing never', () => {
    for (const q of many('ruler', 1, 2000)) if (q.kind === 'ruler') expect(q.bar.start).toBe(0);
    for (const q of many('ruler', 3, 2000)) if (q.kind === 'ruler') expect(q.bar.start).toBeGreaterThan(0);
  });
  it('lays every thing from tick to tick, on the ruler, and asks its length', () => {
    for (const q of all) {
      if (q.kind !== 'ruler') continue;
      expect(Number.isInteger(q.bar.start) && Number.isInteger(q.bar.len)).toBe(true);
      expect(q.bar.len).toBeGreaterThanOrEqual(1);
      expect(q.bar.start + q.bar.len).toBeLessThanOrEqual(q.ruler.top);
      expect(q.answer).toBe(String(q.bar.len));
    }
  });
  it('Level 1 is whole inches up to 6; Level 2 inches to 12, then centimetres to 20', () => {
    for (const q of many('ruler', 1)) if (q.kind === 'ruler') { expect(q.ruler.unit).toBe('in'); expect(q.bar.len).toBeLessThanOrEqual(6); }
    const two = many('ruler', 2, 1500).filter(q => q.kind === 'ruler');
    for (const q of two) if (q.kind === 'ruler') expect(q.bar.len).toBeLessThanOrEqual(q.ruler.unit === 'in' ? 12 : 20);
    expect(two.some(q => q.kind === 'ruler' && q.ruler.unit === 'cm')).toBe(true);
  });
  it('knows the real mistakes: the number at the far end, counting the ticks, and the other side of the ruler', () => {
    for (const q of many('ruler', 3, 2000)) {
      if (q.kind !== 'ruler') continue;
      const end = q.bar.start + q.bar.len;
      expect(q.traps).toContainEqual({ value: String(end), why: 'end' });
      if (q.bar.len + 1 !== end) expect(q.traps).toContainEqual({ value: String(q.bar.len + 1), why: 'ticks' });
      if (q.ruler.other && otherReading(q.ruler, q.bar.len) !== q.bar.len) expect(q.traps.some(t => t.value === String(otherReading(q.ruler, q.bar.len)))).toBe(true);
    }
    for (const q of many('ruler', 1)) if (q.kind === 'ruler') expect(q.traps.some(t => t.why === 'ticks')).toBe(true);
  });
});

describe('Best Guess', () => {
  it('uses only the hand-checked things: small ones under a foot, big ones at least four feet', () => {
    for (const t of SMALL) { expect(t.inches).toBeLessThan(12); expect(t.about.unit).toBe('in'); }
    for (const t of BIG) { expect(t.inches).toBeGreaterThanOrEqual(48); expect(t.about.unit).toBe('ft'); }
    for (const t of THINGS) { const real = t.about.unit === 'in' ? t.inches : t.inches / 12; expect(Math.abs(real - t.about.n) / real).toBeLessThan(.25); }
    for (const q of many('guess', 1).concat(many('guess', 2), many('guess', 3))) {
      if (q.kind !== 'guess') continue;
      for (const id of q.form === 'longer' ? [q.a, q.b] : [q.thing]) expect(() => thingOf(id)).not.toThrow();
    }
  });
  it('picks two things at least five times apart in length', () => {
    for (const q of many('guess', 1, 2000)) {
      if (q.kind !== 'guess' || q.form !== 'longer') continue;
      const a = thingOf(q.a).inches, b = thingOf(q.b).inches;
      expect(Math.max(a, b) / Math.min(a, b)).toBeGreaterThanOrEqual(5);
      expect(q.answer).toBe(a > b ? q.a : q.b);
    }
  });
  it('offers two estimates at least five times apart, the right one the about-length', () => {
    for (const q of many('guess', 2, 2000)) {
      if (q.kind !== 'guess' || q.form !== 'about') continue;
      const [x, y] = q.choices.map(Number) as [number, number];
      expect(Math.max(x, y) / Math.min(x, y)).toBeGreaterThanOrEqual(5);
      const t = thingOf(q.thing);
      expect(Number(q.answer)).toBe(q.unit === 'cm' ? t.cm : t.about.n);
    }
    for (let n = 1; n <= 40; n++) { const w = wrongEstimate(n, seeded(n)); expect(Math.max(w, n) / Math.min(w, n)).toBeGreaterThanOrEqual(5); }
  });
  it('asks inches for small things and feet for big ones', () => {
    for (const q of many('guess', 3)) if (q.kind === 'guess' && q.form === 'unit') expect(q.answer).toBe(thingOf(q.thing).about.unit);
  });
});

describe('How Much Longer', () => {
  it('Level 1: two bars from zero; Level 3: bars that do not line up, where reading the ends gives the wrong answer', () => {
    for (const q of many('longer', 1)) if (q.kind === 'longer' && q.form === 'ruler') { expect(q.a.start).toBe(0); expect(q.b.start).toBe(0); expect(q.answer).toBe(String(q.a.len - q.b.len)); }
    for (const q of many('longer', 3, 2000)) {
      if (q.kind !== 'longer' || q.form !== 'ruler') throw new Error('Level 3 is on a ruler');
      expect(q.a.start).not.toBe(q.b.start);
      expect(q.answer).toBe(String(q.a.len - q.b.len));
      expect(Math.abs(q.a.start + q.a.len - (q.b.start + q.b.len))).not.toBe(q.a.len - q.b.len);
      expect(q.traps.some(t => t.why === 'ends')).toBe(true);
    }
  });
  it('Level 2: two jumps as numbers, within 100', () => {
    for (const q of many('longer', 2)) if (q.kind === 'longer' && q.form === 'jumps') { expect(q.a).toBeGreaterThan(q.b); expect(q.answer).toBe(String(q.a - q.b)); }
  });
});

describe('Jump Line', () => {
  it('Level 1 asks a ten on a line of tens, never one that is written; Level 2 a one on a stretch of ten', () => {
    for (const q of many('line', 1)) if (q.kind === 'line' && q.form === 'tens') { expect(q.n % 10).toBe(0); expect(q.labels).not.toContain(q.n); expect(q.labels).toContain(0); }
    for (const q of many('line', 2)) if (q.kind === 'line' && q.form === 'ones') { expect(q.n).toBeGreaterThan(q.lo); expect(q.n).toBeLessThan(q.lo + 10); expect(q.labels).not.toContain(q.n); }
  });
  it('Level 3: a hop and another, with the real mistakes as the wrong choices', () => {
    for (const q of many('line', 3, 2000)) {
      if (q.kind !== 'line' || q.form !== 'hops') throw new Error('Level 3 is hops');
      expect(q.answer).toBe(String(q.a + q.b));
      for (const c of q.choices) if (c !== q.answer) expect(q.traps.map(t => t.value)).toContain(c);
    }
  });
});

describe('Length Stories', () => {
  it('has one right answer, never a number the story says, with the bars drawn to match', () => {
    for (const l of LEVELS) for (const q of many('story', l, 1500)) {
      if (q.kind !== 'story') continue;
      const ans = storyAnswer(q.form, q.x, q.y);
      expect(q.answer).toBe(String(ans));
      expect(ans).toBeGreaterThan(0);
      expect([q.x, q.y]).not.toContain(ans);
      for (const c of q.choices) expect([String(q.x), String(q.y)]).not.toContain(c);
      const p = storyPicture(q);
      if (p.join) expect(p.first.n + p.second.n).toBe(p.whole.n); else expect(p.top.n - p.bottom.n).toBe(p.diff.n);
      const said = storySaid(q, n => `${n} feet`);
      expect(said).toContain(`${q.x} feet`); expect(said).toContain(`${q.y} feet`); expect(said).not.toContain(`${ans} feet`);
    }
  });
  it('Level 1 puts together, Level 2 takes away and compares (with a "longer" story that adds), Level 3 asks the start', () => {
    const forms = (l: Level) => new Set(many('story', l).map(q => (q.kind === 'story' ? q.form : '')));
    expect([...forms(1)].sort()).toEqual(['add-piece', 'end-to-end']);
    expect(forms(2).has('cut') && forms(2).has('shorter-than') && forms(2).has('longer-than')).toBe(true);
    expect(forms(3).has('start-add') && forms(3).has('start-cut')).toBe(true);
  });
});

describe('Two Units', () => {
  it('never asks him to convert: every answer is a unit, more or fewer, or one of the two numbers on the screen', () => {
    for (const l of LEVELS) for (const q of many('units', l, 1500)) {
      if (q.kind !== 'units') continue;
      if (q.form === 'which') expect(['in', 'cm']).toContain(q.answer);
      if (q.form === 'more') expect(['more', 'fewer']).toContain(q.answer);
      if (q.form === 'match') { expect(q.choices).toEqual(expect.arrayContaining([String(q.big.n), String(q.small.n)])); expect(q.choices.length).toBe(2); }
    }
  });
  it('the smaller unit always gives the bigger number', () => {
    for (const [i, c] of IN_CM) expect(c).toBeGreaterThan(i);
    for (const q of many('units', 1)) if (q.kind === 'units' && q.form === 'which') expect(q.answer).toBe(q.want === 'bigger' ? 'cm' : 'in');
    for (const q of many('units', 2, 1500)) if (q.kind === 'units' && q.form === 'more') {
      const order = { cm: 0, in: 1, ft: 2 } as const;
      expect(q.answer).toBe(order[q.to] < order[q.unit] ? 'more' : 'fewer');
    }
    for (const q of many('units', 3)) if (q.kind === 'units' && q.form === 'match') { expect(q.small.n).toBeGreaterThan(q.big.n); expect(q.answer).toBe(String(q.ask === q.big.unit ? q.big.n : q.small.n)); }
  });
  it('asks "more" and "fewer" about as often as each other', () => {
    const qs = many('units', 2, 2000).filter(q => q.kind === 'units' && q.form === 'more');
    const more = qs.filter(q => q.answer === 'more').length / qs.length;
    expect(more).toBeGreaterThan(.3); expect(more).toBeLessThan(.7);
  });
});
