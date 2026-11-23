// Thousands of questions of every kind, Level and Stretch, held to the brief's rules: exactly one right choice; every array a full
// rectangle with rows going across, never beside its own turn-around except in the turn-around question; totals at 50 or less and no
// group or row over 10; Share It always even; wrong choices that are real mistakes; Odd or Even never about zero.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { addingSentence, isRightAnswer, makeQuestion, MOST_GROUP, MOST_TOTAL, plusCard, timesCard, totalOf, type Kind, type Level, type Question, type Why } from './problems';

const KINDS: Kind[] = ['groups', 'array', 'pair', 'count', 'share', 'times'];
function* every(kind: Kind, per = 600) {
  const rng = seeded(kind.length * 1013);
  for (const level of [1, 2, 3] as Level[]) for (const stretch of [0, 1, 2] as Stretch[]) for (let i = 0; i < per; i++) yield { q: makeQuestion(kind, level, stretch, rng), level, stretch };
}
/** Every answer a question offers, as the view submits them. */
function offered(q: Question): string[] {
  switch (q.kind) {
    case 'groups': return q.form === 'same' ? ['yes', 'no'] : q.form === 'pick' ? q.pictures.map((_, i) => String(i)) : q.choices.map(String);
    case 'array': return q.form === 'turn' ? ['yes', 'no'] : q.form === 'sentence' ? [...q.sentences] : q.choices.map(String);
    case 'pair': return q.form === 'partner' ? ['yes', 'no'] : q.form === 'oddEven' ? ['odd', 'even'] : q.form === 'which' ? q.nums.map(String) : q.form === 'double' ? q.halves.map(String) : q.choices.map(String);
    case 'count': return q.choices.map(String);
    case 'share': {
      if (q.form !== 'deal') return q.choices.map(String);
      // every way to load the trucks with all the boxes, for small cases (the view only submits when the pile is empty)
      const out: string[] = [];
      const go = (left: number, at: number[]) => { if (at.length === q.trucks - 1) { out.push([...at, left].join(',')); return; } for (let k = 0; k <= left; k++) go(left - k, [...at, k]); };
      if (q.total <= 16) go(q.total, []);
      return out;
    }
    case 'times': return q.form === 'fact' ? q.choices.map(String) : q.form === 'match' ? q.pictures.map((_, i) => String(i)) : [...q.cards];
  }
}

describe('every question has exactly one right answer', () => {
  for (const kind of KINDS) it(kind, () => {
    for (const { q, level } of every(kind)) {
      const answers = offered(q), right = answers.filter(a => isRightAnswer(q, a) === true);
      expect(right, `${kind} L${level} ${JSON.stringify(q)}`).toHaveLength(1);
      expect(new Set(answers).size, JSON.stringify(q)).toBe(answers.length);
    }
  });
  it('a choice that equals the answer\'s value is never offered twice in another form', () => {
    for (const { q } of every('times')) {
      if (q.kind !== 'times' || (q.form !== 'turn' && q.form !== 'write')) continue;
      const value = (card: string) => { const [a, op, b] = card.split(' '); return op === '×' ? Number(a) * Number(b) : Number(a) + Number(b); };
      const right = q.answer;
      for (const c of q.cards) if (c !== right) expect(value(c), JSON.stringify(q)).not.toBe(value(right));
    }
  });
});

describe('arrays are full rectangles, rows go across, and the turn-around only where it is asked', () => {
  it('every grid is whole numbers of rows and columns, 1 to 10', () => {
    for (const kind of ['array', 'times'] as Kind[]) for (const { q } of every(kind)) {
      const grids = q.kind === 'array' ? [q, ...(q.form === 'turn' ? [q.other] : [])] : q.kind === 'times' ? (q.form === 'match' ? q.pictures : q.form === 'write' ? [q] : q.form === 'fact' ? [{ rows: q.a, cols: q.b }] : [{ rows: q.a, cols: q.b }]) : [];
      for (const g of grids) {
        expect(Number.isInteger(g.rows) && Number.isInteger(g.cols)).toBe(true);
        expect(g.rows).toBeGreaterThanOrEqual(1); expect(g.cols).toBeGreaterThanOrEqual(1);
        expect(Math.max(g.rows, g.cols)).toBeLessThanOrEqual(MOST_GROUP);
      }
    }
  });
  it('a building of r rows of c never sits beside c rows of r, except in the turn-around question', () => {
    for (const { q } of every('times')) {
      if (q.kind !== 'times') continue;
      if (q.form === 'match') expect(q.pictures.some(p => p.rows === q.cols && p.cols === q.rows && q.rows !== q.cols), JSON.stringify(q)).toBe(false);
      if (q.form === 'write') expect(q.cards).not.toContain(timesCard(q.cols, q.rows) === timesCard(q.rows, q.cols) ? '' : timesCard(q.cols, q.rows));
    }
    for (const { q } of every('array')) {
      if (q.kind !== 'array') continue;
      if (q.form === 'sentence') expect(q.sentences).not.toContain(q.rows === q.cols ? '' : addingSentence(q.cols, q.rows));
    }
  });
  it('the turn-around question is the one place a building is shown tipped on its side', () => {
    let tipped = 0;
    for (const { q } of every('array')) if (q.kind === 'array' && q.form === 'turn') { if (q.other.rows === q.cols && q.other.cols === q.rows) { tipped++; expect(q.answer).toBe('yes'); } else expect(q.answer).toBe('no'); }
    expect(tipped).toBeGreaterThan(50);
  });
  it('Windows Level 1 stays within 5 by 5 (2.OA.C.4)', () => {
    for (const { q, level } of every('array')) if (q.kind === 'array' && level === 1) { expect(q.rows).toBeLessThanOrEqual(5); expect(q.cols).toBeLessThanOrEqual(5); }
  });
});

describe('sizes', () => {
  it('totals stay at 50 or less, and no group or row is bigger than 10', () => {
    for (const kind of KINDS) for (const { q } of every(kind)) {
      expect(totalOf(q), JSON.stringify(q)).toBeLessThanOrEqual(MOST_TOTAL);
      if (q.kind === 'groups' && q.form !== 'same' && q.form !== 'pick') expect(q.each).toBeLessThanOrEqual(MOST_GROUP);
      if (q.kind === 'groups' && q.form === 'same') expect(Math.max(...q.buses)).toBeLessThanOrEqual(MOST_GROUP);
      if (q.kind === 'groups' && q.form === 'pick') for (const p of q.pictures) expect(Math.max(...p)).toBeLessThanOrEqual(MOST_GROUP);
      if (q.kind === 'share') expect((q.form === 'trucks' ? q.each : q.total / q.trucks)).toBeLessThanOrEqual(MOST_GROUP);
      if (q.kind === 'pair' && q.form === 'double') for (const h of q.halves) expect(h).toBeLessThanOrEqual(MOST_GROUP);
    }
  });
  it('Share It always comes out even', () => {
    for (const { q } of every('share')) {
      if (q.kind !== 'share') continue;
      if (q.form === 'trucks') expect(q.total % q.each).toBe(0);
      else expect(q.total % q.trucks).toBe(0);
    }
  });
  it('Odd or Even never asks about zero', () => {
    for (const { q } of every('pair')) {
      if (q.kind !== 'pair') continue;
      const nums = q.form === 'which' ? q.nums : [q.n];
      for (const x of nums) expect(x).toBeGreaterThan(0);
      if (q.form === 'double' || q.form === 'half') expect(q.n % 2).toBe(0);
    }
  });
  it('Count By starts past Math Bots: hundreds to 1,000, tens and fives past 100, then threes and fours', () => {
    for (const { q, level } of every('count')) {
      if (q.kind !== 'count') continue;
      const all = q.shown.map(x => x ?? Number(q.answer));
      if (level === 1) { expect([100, 10]).toContain(q.step); expect(Math.min(...all)).toBeGreaterThan(99); }
      if (level === 2) { expect(q.step).toBe(5); expect(Math.min(...all)).toBeGreaterThanOrEqual(100); expect(Math.max(...all)).toBeLessThanOrEqual(200); }
      if (level === 3) { expect([3, 4]).toContain(q.step); expect(q.groups).toBe(true); expect(Math.max(...all)).toBeLessThanOrEqual(40); }
      for (let i = 1; i < all.length; i++) expect(all[i]! - all[i - 1]!).toBe(q.step);
      // the numbers the lesson says are ones the voice has: to 200, or a whole hundred
      for (const x of all) expect(x <= 200 || x % 100 === 0).toBe(true);
    }
  });
});

describe('wrong choices are real mistakes', () => {
  const allowed: Record<Kind, readonly Why[]> = {
    groups: ['added', 'extra-group', 'missing-group', 'group-count', 'each-count', 'total', 'miscount', 'unequal'],
    array: ['added', 'extra-group', 'missing-group', 'group-count', 'other-way', 'miscount', 'total'],
    pair: ['near-double', 'whole', 'miscount'],
    count: ['by-ones', 'jumped-twice', 'wrong-step', 'stayed', 'miscount'],
    share: ['whole', 'group-count', 'each-count', 'total', 'miscount'],
    times: ['added', 'extra-group', 'missing-group', 'miscount'],
  };
  for (const kind of KINDS) it(kind, () => {
    for (const { q } of every(kind)) {
      if (!('wrong' in q)) continue;
      for (const w of q.wrong) {
        expect(allowed[kind], JSON.stringify(q)).toContain(w.why);
        expect(w.value).not.toBe(q.answer);
      }
      // the totals' commonest mistake, the two numbers added, is there whenever it differs from the answer
      if ((q.kind === 'groups' && (q.form === 'total' || q.form === 'words')) || (q.kind === 'times' && q.form === 'fact')) {
        const [a, b] = q.kind === 'groups' ? [q.groups, q.each] : [q.a, q.b];
        if (a + b !== a * b) expect(q.wrong.map(w => w.value), JSON.stringify(q)).toContain(String(a + b));
      }
      // and each mistake is what it says it is
      for (const w of q.wrong) {
        if (w.why === 'added' && q.kind === 'groups' && 'each' in q && q.form !== 'pick') expect(Number(w.value)).toBe(q.groups + q.each);
        if (w.why === 'extra-group' && q.kind === 'groups' && (q.form === 'total' || q.form === 'words')) expect(Number(w.value)).toBe(q.groups * q.each + q.each);
        if (w.why === 'missing-group' && q.kind === 'groups' && (q.form === 'total' || q.form === 'words')) expect(Number(w.value)).toBe(q.groups * q.each - q.each);
        if (w.why === 'group-count' && q.kind === 'groups' && (q.form === 'total' || q.form === 'words')) expect(Number(w.value)).toBe(q.groups);
        if (w.why === 'added' && q.kind === 'array' && q.form === 'sentence') expect(w.value).toBe(plusCard(q.rows, q.cols));
      }
    }
  });
});

describe('the questions every Level asks', () => {
  it('each kind and Level makes its own forms', () => {
    const forms = new Map<string, Set<string>>();
    for (const kind of KINDS) for (const { q, level } of every(kind, 300)) {
      const key = `${kind} L${level}`;
      if (!forms.has(key)) forms.set(key, new Set());
      forms.get(key)!.add('form' in q ? q.form : '');
    }
    expect([...forms.get('groups L1')!].sort()).toEqual(['buses', 'each', 'same']);
    expect([...forms.get('groups L2')!]).toEqual(['total']);
    expect([...forms.get('groups L3')!].sort()).toEqual(['pick', 'words']);
    expect([...forms.get('array L1')!].sort()).toEqual(['cols', 'rows']);
    expect([...forms.get('array L3')!].sort()).toEqual(['sentence', 'turn']);
    expect([...forms.get('pair L1')!].sort()).toEqual(['oddEven', 'partner']);
    expect([...forms.get('pair L3')!].sort()).toEqual(['double', 'half']);
    expect([...forms.get('share L1')!].sort()).toEqual(['deal', 'each']);
    expect([...forms.get('share L3')!]).toEqual(['trucks']);
    expect([...forms.get('times L1')!].sort()).toEqual(['match', 'write']);
    expect([...forms.get('times L2')!]).toEqual(['fact']);
    expect([...forms.get('times L3')!].sort()).toEqual(['fact', 'turn']);
  });
  it('Times Level 2 is twos, fives and tens; Level 3 threes and fours', () => {
    for (const { q, level } of every('times')) {
      if (q.kind !== 'times' || q.form !== 'fact') continue;
      if (level === 2) expect([2, 5, 10]).toContain(q.b);
      if (level === 3) expect([3, 4]).toContain(q.b);
    }
  });
});
