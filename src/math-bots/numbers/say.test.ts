import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { MATH_KINDS, makeBoard, makeQuestion, STORIES, type Level } from './problems';
import { PHRASES } from '../phrases';
import { cardLine, line, promptOf, sentenceOf, speech, storyParts, textOf, type AnyQuestion } from './say';
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
/** Something he could really tap for this question, every kind of input. */
const wrongOf = (q: AnyQuestion) => (q.input === 'tiles' || q.input === 'fill' || q.input === 'pick' ? q.traps[0]?.value ?? 'piece:square' : q.input === 'cards' ? ['0', '1', '2'].find(x => x !== q.answer)! : q.input === 'sign' ? '<' : q.input === 'same' ? 'same' : (q.traps[0]?.value ?? String(Number(q.answer) + 1)));

describe('everything said is recorded', () => {
  it('has a clip for every phrase', () => { for (const p of known) expect(CLIPS[p as keyof typeof CLIPS], p).toBeTruthy(); });
  it('prompts', () => every((q, level) => { for (const p of promptOf(q, level).speech) expect(known, `"${p}"`).toContain(p); }), 30_000);
  it('stories split into recorded pieces', () => {
    for (const s of Object.values(STORIES)) for (const l of s.lines) for (const p of speech(storyParts(l.replace(/\{[abcd]\}/g, '7')))) expect(known, `"${p}" in ${l}`).toContain(p);
  });
  it('lessons', () => every((q, level) => {
    for (const steps of [missSteps(q, wrongOf(q)), teachSteps(q, false)]) for (const step of steps) for (const p of speech(step.say)) expect(known, `"${p}" for ${JSON.stringify(q)} level ${level}`).toContain(p);
  }), 30_000); // thousands of questions: seconds on a busy CI runner
  it('every wrong answer in the later kinds', () => {
    const rng = seeded(5);
    for (const kind of ['chart', 'jump', 'measure', 'shape'] as const) for (const level of LEVELS) for (const stretch of [0, 1, 2] as const) for (let i = 0; i < 300; i++) {
      const q = makeQuestion(kind, level, rng, { stretch });
      for (const t of q.traps) for (const step of missSteps(q, t.value)) for (const p of speech(step.say)) expect(known, `"${p}" for ${t.value} in ${JSON.stringify(q)}`).toContain(p);
    }
  }, 60_000); // thousands of questions, every trap of each: slow on a busy CI runner
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
  it('shows every number a lesson says, on its caption or its picture', () => every(q => {
    for (const step of teachSteps(q, false)) {
      if (step.tick !== undefined || !step.caption) continue; // a count on the picture, or a line the screen already shows
      const shown = new Set(textOf(step.say).match(/\d+/g) ?? []);
      for (const p of speech(step.say)) if (/^\d+$/.test(p)) expect(shown).toContain(p);
    }
  }), 30_000);
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
  const shapeQs = () => { const rng = seeded(31), out: AnyQuestion[] = []; for (const level of [1, 2] as const) for (const stretch of [0, 1, 2] as const) for (let i = 0; i < 800; i++) out.push(makeQuestion('shape', level, rng, { stretch })); return out; };
  const missSaid = (q: AnyQuestion, value: string) => missSteps(q, value).flatMap(st => speech(st.say));
  it('never tells a foil from a four-sided shape by counting four sides', () => {
    for (const q of shapeQs()) {
      if (q.kind !== 'shape' || (q.form !== 'every' && q.form !== 'notA') || (q.name !== 'square' && q.name !== 'rectangle')) continue;
      const foils = q.form === 'every' ? q.traps.map(t => t.value) : [q.answer];
      for (const v of foils) {
        const counted = (said: string[]) => said.includes('That one has') && said.includes('4');
        expect(counted(missSaid(q, v)), `${q.tiles[Number(v.slice(5))]!.id} for ${q.name}`).toBe(false);
        if (q.form === 'notA') expect(counted(teachSteps(q, false).flatMap(st => speech(st.say)))).toBe(false);
      }
    }
  });
  it('still counts sides where the count is the difference', () => {
    const q = shapeQs().find(x => x.kind === 'shape' && x.form === 'every' && x.name === 'triangle' && x.tiles.some(t => t.id === 'square'));
    if (q?.kind !== 'shape' || q.form !== 'every') throw 0;
    expect(missSaid(q, `tile:${q.tiles.findIndex(t => t.id === 'square')}`)).toContain('That one has');
  });
  it('a miss on Which takes never sounds like he was right', () => {
    const rng = seeded(8);
    for (let i = 0; i < 2000; i++) {
      const q = makeQuestion('measure', 3, rng, { stretch: 2 });
      if (q.kind !== 'measure' || q.form !== 'fewer') continue;
      expect(missSaid(q, q.traps[0]!.value)[0]).toBe(q.want === 'fewer' ? 'Big ones cover more, so it takes fewer of them.' : 'Small ones cover less, so it takes more of them.');
    }
  });
  it('never names a piece in the Fill prompt', () => {
    const rng = seeded(4);
    for (const stretch of [0, 1, 2] as const) for (let i = 0; i < 300; i++) {
      const q = makeQuestion('shape', 3, rng, { stretch });
      expect(promptOf(q, 3).text).not.toMatch(/square|triangle|circle|rectangle|hexagon|half/i);
    }
  });
  it('a first miss ends by letting him try again', () => every(q => {
    expect(missSteps(q, wrongOf(q)).at(-1)!.say).toEqual(['Try again!']);
  }), 30_000);
  it('a first miss never says the right answer in the later kinds', () => every(q => {
    if (q.kind !== 'chart' && q.kind !== 'jump') return;
    const wrong = wrongOf(q);
    if (wrong === q.answer) return;
    expect(missSteps(q, wrong).flatMap(st => speech(st.say))).not.toContain(q.answer);
  }), 30_000);
  it('teaching never just says the answer: it has a picture or a reason', () => every(q => {
    const steps = teachSteps(q, false);
    expect(steps.length).toBeGreaterThan(1);
  }), 30_000);
  it('says the long line about = only once', () => {
    const rng = seeded(1);
    let q = makeQuestion('scale', 3, rng);
    while (q.kind !== 'scale' || q.form !== 'balance') q = makeQuestion('scale', 3, rng);
    const said = (flag: boolean) => teachSteps(q, flag).flatMap(s => speech(s.say));
    expect(said(false)).toContain('It means both sides are the same.');
    expect(said(true)).not.toContain('It means both sides are the same.');
  });
  it('every picture a question needs has a Meeting', () => every(q => { for (const m of meetingsFor(q)) expect(MEETINGS).toContain(m); }), 30_000);
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
