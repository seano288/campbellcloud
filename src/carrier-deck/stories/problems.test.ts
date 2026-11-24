// The brief's "Rules the tests must enforce", over thousands of generated questions of every kind, Level and Stretch.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import {
  carries, COMPARE, eqText, isRightAnswer, KINDS, makeQuestion, MIN, NOUNS, ONE_STEP, oneStepGuesses, onLine, solve, TOP, TWO_STEP,
  type Kind, type Level, type Question, type Story,
} from './problems';
import { parseEq } from './teach';

const LEVELS: Level[] = [1, 2, 3], STRETCHES: Stretch[] = [0, 1, 2];
function* every(per = 200, kinds: readonly Kind[] = KINDS) {
  const rng = seeded(4242);
  for (const kind of kinds) for (const level of LEVELS) for (const stretch of STRETCHES) for (let i = 0; i < per; i++) yield { q: makeQuestion(kind, level, stretch, rng), kind, level, stretch };
}
const storyOf = (q: Question): Story | null => (q.kind === 'one' || q.kind === 'pick' || q.kind === 'compare' ? q.story : null);
/** Every number shown or said in the question. */
function shown(q: Question): number[] {
  if (q.kind === 'board') return [...q.bars, q.top];
  if (q.kind === 'two') return [...q.story.sentences.flatMap(s => s.nums), q.story.middle, q.story.answer];
  const s = q.kind === 'pick' ? q.choices.flatMap(c => c.match(/\d+/g)!.map(Number)) : [];
  return [...q.story!.sentences.flatMap(x => x.nums), ...s];
}
const words = (q: Question) => (q.kind === 'board' ? '' : q.story.sentences.map(s => s.text).join(' ').toLowerCase());
const opOfQ = (q: Question) => (q.kind === 'two' ? (q.story.eqs[1].op === '+' ? 'add' : 'sub') : storyOf(q)!.op);

describe('every question', () => {
  it('has exactly one right answer, never below zero and never over 100, and every number shown is between 2 and 99', () => {
    for (const { q } of every()) {
      const at = JSON.stringify(q);
      if (q.kind === 'pick') {
        expect(q.choices.filter(c => isRightAnswer(q, c)).length, at).toBe(1);
        expect(new Set(q.choices).size, at).toBe(q.choices.length);
      } else if (q.kind === 'two' && q.stepped) {
        expect(isRightAnswer(q, q.answer)).toBe(true);
      } else {
        const right = Array.from({ length: 100 }, (_, n) => n).filter(n => isRightAnswer(q, String(n)));
        expect(right, at).toEqual([Number(q.answer)]);
      }
      const answer = q.kind === 'pick' ? storyOf(q)!.answer : q.kind === 'two' ? q.story.answer : Number(q.answer);
      expect(answer, at).toBeGreaterThan(0);
      expect(answer, at).toBeLessThanOrEqual(TOP);
      for (const n of shown(q)) { expect(n, at).toBeLessThanOrEqual(q.kind === 'board' ? 100 : TOP); if (q.kind !== 'board') expect(n, at).toBeGreaterThanOrEqual(MIN); }
    }
  });
  it('the number sentence in the story\'s order has the answer in its box', () => {
    for (const { q } of every(150, ['one', 'pick', 'compare'])) { const s = storyOf(q)!; expect(solve(s.eq), JSON.stringify(q)).toBe(s.answer); }
    for (const { q } of every(150, ['two'])) {
      if (q.kind !== 'two') continue;
      expect(solve(q.story.eqs[0])).toBe(q.story.middle);
      expect(solve(q.story.eqs[1])).toBe(q.story.answer);
    }
  });
  it('never asks a number the story already says, so echoing one is never right', () => {
    for (const { q } of every(150, ['one', 'compare', 'two'])) {
      const said = q.kind === 'board' ? [] : q.story.sentences.flatMap(s => s.nums);
      expect(said, JSON.stringify(q)).not.toContain(q.kind === 'two' ? q.story.answer : Number(q.answer));
    }
  });
});

describe('a story\'s words never give the sum away', () => {
  /** Of the stories that say this word, the share solved by adding. */
  function share(kinds: readonly Kind[], word: RegExp) {
    let add = 0, all = 0;
    for (const { q } of every(150, kinds)) {
      if (q.kind === 'board' || !word.test(words(q))) continue;
      all++;
      if (opOfQ(q) === 'add') add++;
    }
    return { add, all, share: add / all };
  }
  it('about half the stories that say "more" are solved by taking away', () => {
    const s = share(['one', 'pick', 'compare', 'two'], /\bmore\b/);
    expect(s.share, JSON.stringify(s)).toBeGreaterThan(.3);
    expect(s.share).toBeLessThan(.7);
  });
  it('about half the stories that say "left" or "fewer" are solved by adding', () => {
    const s = share(['one', 'pick', 'compare', 'two'], /\b(left|fewer)\b/);
    expect(s.share, JSON.stringify(s)).toBeGreaterThan(.3);
    expect(s.share).toBeLessThan(.7);
  });
  it('and every kind with such stories has both ways', () => {
    for (const kind of ['one', 'compare', 'two'] as const) for (const w of [/\bmore\b/, /\b(left|fewer)\b/]) {
      const s = share([kind], w);
      if (!s.all) continue;
      expect(s.add, `${kind} ${w}`).toBeGreaterThan(0);
      expect(s.add, `${kind} ${w}`).toBeLessThan(s.all);
    }
  });
});

describe('every number that is needed is said and shown', () => {
  it('a one-step story says both its numbers, and only Which Sum Level 3 says one more, of a different kind of thing', () => {
    for (const { q, level } of every(150, ['one', 'pick', 'compare'])) {
      const s = storyOf(q)!, said = s.sentences.flatMap(x => x.nums);
      const needed = Object.entries(s.nums).filter(([k]) => k !== s.ask && k !== '#x').map(([, v]) => v);
      expect([...said].sort(), JSON.stringify(q)).toEqual([...needed, ...(s.extra ? [s.extra.n] : [])].sort());
      for (const x of s.sentences) expect(x.text, 'the numbers are on screen').toBe(x.text.replace(/\d+/g, d => d));
      if (s.extra) {
        expect(q.kind === 'pick' && level === 3).toBe(true);
        const line = s.sentences[s.extra.at]!.text;
        expect(line).not.toMatch(new RegExp(`\\b${s.noun}\\b`)); // another kind of thing: sailors watched a story about jets
        expect(s.extra.at).toBeLessThan(s.sentences.length - 1);
        // the sentence after it names the story's own thing, so nothing after it could be about the sailors (pass 2)
        expect(s.sentences[s.extra.at + 1]!.text, JSON.stringify(s.sentences.map(x => x.text))).toMatch(new RegExp(`\\b${s.noun}\\b`));
      } else expect(q.kind === 'pick' && level === 3).toBe(false);
    }
  });
});

describe('Two Steps', () => {
  it('are true two-step stories: the first step\'s answer is needed, and no one step on two of the numbers gets the answer', () => {
    for (const { q } of every(200, ['two'])) {
      if (q.kind !== 'two') continue;
      const s = q.story, said = s.sentences.flatMap(x => x.nums), at = JSON.stringify(q);
      expect(said, at).not.toContain(s.middle);
      expect([s.eqs[1].l, s.eqs[1].r], at).toContain(s.middle);
      expect(oneStepGuesses(said), at).not.toContain(s.answer);
    }
  });
  it('Level 1 stays within 20 and adds twice; Level 2 adds and takes away; at Level 1 Stretch 0 the middle question comes first', () => {
    for (const { q, level, stretch } of every(150, ['two'])) {
      if (q.kind !== 'two') continue;
      const ops = q.story.eqs.map(e => e.op);
      if (level === 1) { expect(ops).toEqual(['+', '+']); expect(Math.max(...shown(q))).toBeLessThanOrEqual(20); }
      if (level === 2) expect(new Set(ops).size).toBe(2);
      expect(q.stepped).toBe(level === 1 && stretch === 0);
    }
  });
});

describe('Which Sum', () => {
  it('Level 1 offers the sum and the take-away, Level 2 a sentence with a box, and the wrong ones are the real mistakes', () => {
    for (const { q, level } of every(200, ['pick'])) {
      if (q.kind !== 'pick') continue;
      const s = q.story, at = JSON.stringify(q);
      expect(q.choices.length, at).toBe(level === 1 ? 2 : 3);
      if (level === 1) expect(q.answer, at).toMatch(/= \?$/);
      if (level === 2) expect(q.answer, at).not.toMatch(/= \?$/); // the change (or start) has the box
      for (const c of q.choices.filter(c => c !== q.answer)) {
        const nums = c.match(/\d+/g)!.map(Number), said = s.sentences.flatMap(x => x.nums);
        for (const n of nums) expect(said, at).toContain(n); // only the story's own numbers
        if (level === 3) expect(q.choices.some(x => x.match(/\d+/g)!.map(Number).includes(s.extra!.n)), at).toBe(true);
      }
      expect(eqText(s.eq)).toMatch(/\?/);
    }
  });
});

describe('How Many More', () => {
  it('draws the two rows at Level 1 and early Level 2, and the tricky ones are only at Level 3', () => {
    for (const { q, level, stretch } of every(150, ['compare'])) {
      if (q.kind !== 'compare') continue;
      expect(q.bars).toBe(level === 1 || (level === 2 && stretch < 2));
      const tricky = q.story.ask !== '#d';
      expect(tricky).toBe(level === 3 && !['deckFewer', 'heliMore'].includes(q.story.id));
    }
  });
});

describe('Mission Board', () => {
  it('bars end on a marked line at Levels 1 and 2; halfway only at Level 3, and only on a scale of twos or tens', () => {
    for (const { q, level } of every(300, ['board'])) {
      if (q.kind !== 'board') continue;
      const off = q.bars.filter(b => !onLine(b, q.step));
      if (level < 3) expect(off, JSON.stringify(q)).toEqual([]);
      else {
        expect([2, 10]).toContain(q.step);
        for (const b of off) expect(b % q.step).toBe(q.step / 2);
      }
      expect(q.step).toBe(level === 1 ? 1 : level === 2 ? (q.step === 2 ? 2 : 5) : q.step);
      expect(new Set(q.bars).size).toBe(4);
      for (const b of q.bars) expect(b).toBeLessThanOrEqual(q.top);
    }
  });
  it('reads one bar, then how many more between two, then how many in all for two or three', () => {
    for (const { q, level } of every(150, ['board'])) {
      if (q.kind !== 'board') continue;
      const v = q.asked.map(i => q.bars[i]!);
      if (level === 1) expect(Number(q.answer)).toBe(v[0]);
      if (level === 2) expect(Number(q.answer)).toBe(v[0]! - v[1]!);
      if (level === 3) { expect(Number(q.answer)).toBe(v.reduce((a, b) => a + b, 0)); expect(v.length).toBeGreaterThanOrEqual(2); }
    }
  });
});

describe('the story tables', () => {
  it('keep to five nouns', () => {
    for (const t of [...Object.values(ONE_STEP), ...Object.values(COMPARE), ...Object.values(TWO_STEP)]) {
      expect(NOUNS).toContain(t.noun);
      const text = t.lines.flat().join(' ').toLowerCase();
      for (const w of ['planes', 'ships\b', 'cars', 'people']) expect(text).not.toMatch(new RegExp(`\\b${w}`));
    }
  });
  it('never say kill, shoot, destroy or a weapon', () => {
    const text = JSON.stringify([ONE_STEP, COMPARE, TWO_STEP]).toLowerCase();
    for (const w of ['kill', 'shoot', 'destroy', 'bomb', 'missile', 'gun', 'weapon', 'enemy', 'attack']) expect(text).not.toContain(w);
  });
});

describe('Deck Log matches its Level', () => {
  it('Level 1 asks only the end (round tens at Stretch 0, never carrying); the change from Level 2; the start only at Level 3', () => {
    for (const { q, level, stretch } of every(200, ['one'])) {
      if (q.kind !== 'one') continue;
      const s = q.story, n = Object.values(s.nums);
      if (level === 1) {
        expect(['#e', '#w']).toContain(s.ask);
        if (stretch === 0) for (const x of n) expect(x % 10).toBe(0);
      }
      if (s.ask === '#s') expect(level).toBe(3);
      if (s.ask === '#c' || s.ask === '#q') expect(level).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('no story needs a harder sum than its Level (pass 2)', () => {
  /** The ones of a take-away need a ten broken: 52 − 18. */
  const borrows = (a: number, b: number) => a % 10 < b % 10;
  it('Deck Log Level 1 never carries or borrows, and Two Steps Level 2 Stretch 0 neither', () => {
    for (const { q, level, stretch } of every(200, ['one', 'two'])) {
      if (q.kind === 'one' && level === 1) {
        const n = q.story.nums, [x, y] = q.story.shape === 'part' ? [n['#p']!, n['#q']!] : q.story.shape === 'join' ? [n['#s']!, n['#c']!] : [n['#e']!, n['#c']!]; // the two that add up to the whole
        expect(carries(x, y), JSON.stringify(q.story.sentences.map(s => s.text))).toBe(false);
      }
      if (q.kind === 'two' && level === 2 && stretch === 0) {
        for (const e of q.story.eqs) expect(e.op === '+' ? carries(e.l!, e.r!) : borrows(e.l!, e.r!), JSON.stringify(e)).toBe(false);
      }
    }
  });
  it('Two Steps Level 1 stays within 20 at every step', () => {
    for (const { q, level } of every(200, ['two'])) if (q.kind === 'two' && level === 1) for (const n of [...q.story.sentences.flatMap(s => s.nums), q.story.middle, q.story.answer]) expect(n).toBeLessThanOrEqual(20);
  });
});

describe('Which Sum Level 1 (pass 2)', () => {
  it('the wrong choice is the other operation on the story\'s same two numbers', () => {
    for (const { q, level } of every(200, ['pick'])) {
      if (q.kind !== 'pick' || level !== 1) continue;
      const right = parseEq(q.answer), wrong = parseEq(q.choices.find(c => c !== q.answer)!);
      expect(wrong.op, JSON.stringify(q.choices)).not.toBe(right.op);
      expect([wrong.l, wrong.r].sort(), JSON.stringify(q.choices)).toEqual([right.l, right.r].sort());
    }
  });
});
