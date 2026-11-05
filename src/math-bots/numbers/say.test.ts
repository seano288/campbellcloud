import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { MATH_KINDS, makeBoard, makeQuestion, STORIES, type Level } from './problems';
import { PHRASES } from '../phrases';
import { cardLine, line, promptOf, sentenceOf, speech, storyParts, type AnyQuestion } from './say';
import { MEETING_SCRIPTS, meetingsFor, missSteps, teachSteps } from './teach';
import { keepRange } from './trim';
import { MEETINGS } from '../learning';
import { CLIPS } from '../voice.gen';

const known = new Set<string>(PHRASES);
const LEVELS: Level[] = [1, 2, 3];
const every = (check: (q: AnyQuestion, level: Level) => void) => {
  const rng = seeded(12);
  for (const kind of MATH_KINDS) for (const level of LEVELS) for (const stretch of [0, 1, 2] as const) for (let i = 0; i < 150; i++) check(makeQuestion(kind, level, rng, { stretch }), level);
  for (const level of LEVELS) for (let i = 0; i < 100; i++) check(makeBoard(level, rng), level);
};
const wrongOf = (q: AnyQuestion) => (q.input === 'cards' ? ['0', '1', '2'].find(x => x !== q.answer)! : q.input === 'sign' ? '<' : q.input === 'same' ? 'same' : (q.traps[0]?.value ?? String(Number(q.answer) + 1)));

describe('everything said is recorded', () => {
  it('has a clip for every phrase', () => { for (const p of known) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy(); });
  it('prompts', () => every((q, level) => { for (const p of promptOf(q, level).speech) expect(known, `"${p}"`).toContain(p); }));
  it('stories split into recorded pieces', () => {
    for (const s of Object.values(STORIES)) for (const l of s.lines) for (const p of speech(storyParts(l.replace(/\{[abcd]\}/g, '7')))) expect(known, `"${p}" in ${l}`).toContain(p);
  });
  it('lessons', () => every((q, level) => {
    for (const steps of [missSteps(q, wrongOf(q)), teachSteps(q, false)]) for (const step of steps) for (const p of speech(step.say)) expect(known, `"${p}" for ${JSON.stringify(q)} level ${level}`).toContain(p);
  }), 30_000); // thousands of questions: seconds on a busy CI runner
  it('Meetings', () => {
    for (const m of MEETINGS) { const s = MEETING_SCRIPTS[m]; for (const p of [...s.steps.flatMap(x => speech(x.say)), s.tap]) expect(known, p).toContain(p); }
  });
  it('weigh-in cards', () => every(q => { if (q.kind === 'scale' && q.form === 'cards') for (const c of q.cards) for (const p of cardLine(c).speech) expect(known).toContain(p); }));
});

describe('hearing is never enough', () => {
  it('shows every number it says', () => every((q, level) => {
    const { text, speech: said } = promptOf(q, level), shown = new Set(text.match(/\d+/g) ?? []);
    for (const p of said) if (/^\d+$/.test(p)) expect(shown, text).toContain(p);
  }));
});

describe('the word rule', () => {
  it('holds in every phrase', () => {
    for (const p of known) {
      expect(p, p).not.toMatch(/\b(kill|kills|killed|shoot|shot|destroy|destroys|destroyed)\b/i);
      expect(p, p).not.toMatch(/\bsum\b/i);
      expect(p, p).not.toMatch(/battle ?bots/i);
    }
  });
});

describe('lessons', () => {
  it('a first miss ends by letting him try again', () => every(q => {
    expect(missSteps(q, wrongOf(q)).at(-1)!.say).toEqual(['Try again!']);
  }));
  it('teaching never just says the answer: it has a picture or a reason', () => every(q => {
    const steps = teachSteps(q, false);
    expect(steps.length).toBeGreaterThan(1);
  }));
  it('says the long line about = only once', () => {
    const rng = seeded(1);
    let q = makeQuestion('scale', 3, rng);
    while (q.kind !== 'scale' || q.form !== 'balance') q = makeQuestion('scale', 3, rng);
    const said = (flag: boolean) => teachSteps(q, flag).flatMap(s => speech(s.say));
    expect(said(false)).toContain('It means both sides are the same.');
    expect(said(true)).not.toContain('It means both sides are the same.');
  });
  it('every picture a question needs has a Meeting', () => every(q => { for (const m of meetingsFor(q)) expect(MEETINGS).toContain(m); }));
});

describe('chains', () => {
  it('leave punctuation out of the speech and keep numerals in the text', () => {
    expect(line(8, 'in the box.', 3, 'more.', 'How many in all?').text).toBe('8 in the box. 3 more. How many in all?');
    expect(sentenceOf('The crew finds 3 bolts, then 4, then 5.').speech).toEqual(['The crew finds', '3', 'bolts, then', '4', 'then', '5']);
  });
});

describe('trimming a clip', () => {
  const clip = [...Array(4000).fill(0), ...Array(2000).fill(0.5), ...Array(20000).fill(0)];
  it('keeps the speech and a short gap, longer after a sentence', () => {
    const [a, b] = keepRange(clip, 16000, 'piece'), [, c] = keepRange(clip, 16000, 'sentence');
    expect(a).toBeLessThan(4000);
    expect(a).toBeGreaterThan(3000);
    expect(b).toBeGreaterThan(6000);
    expect(b).toBeLessThan(8000);
    expect(c).toBeGreaterThan(b);
  });
  it('leaves silence alone', () => expect(keepRange([0, 0, 0], 16000, 'piece')).toEqual([0, 3]));
});
