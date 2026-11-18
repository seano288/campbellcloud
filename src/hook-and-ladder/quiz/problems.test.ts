// Every question of every kind, Level and Stretch, over many seeds: exactly one choice is right, it matches its Level, and its wrong
// choices are never secretly fair.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { COMPOUNDS } from '../words/compounds';
import { opposite as entry } from './problems';
import { FACTS, GROUPS } from '../words/sorting';
import { SCALES } from '../words/strong';
import { answersOf, groupOf, isAnswer, isRightAnswer, makeQuestion, oppWrongs, REAL_JOINS, SEP, type Kind, type Level, type Question } from './problems';
import { picOf } from '../words/pictures';
import { OPPOSITES } from '../words/opposites';
import { oppSentenceAsk } from './views';

const KINDS: Kind[] = ['join', 'opposite', 'sort', 'ending', 'strong'];
const LEVELS: Level[] = [1, 2, 3];
const STRETCH: Stretch[] = [0, 1, 2];
function each(f: (q: Question, kind: Kind, level: Level) => void) {
  for (const kind of KINDS) for (const level of LEVELS) for (const stretch of STRETCH) {
    const rng = seeded(kind.length * 1000 + level * 100 + stretch);
    for (let i = 0; i < 300; i++) f(makeQuestion(kind, level, stretch, rng), kind, level);
  }
}
const FORMS: Record<Kind, Record<Level, string[]>> = {
  join: { 1: ['pic'], 2: ['split'], 3: ['half'] },
  opposite: { 1: ['pic'], 2: ['say'], 3: ['sentence'] },
  sort: { 1: ['all'], 2: ['odd'], 3: ['name', 'fact'] },
  ending: { 1: ['count'], 2: ['frame'], 3: ['hide'] },
  strong: { 1: ['pair'], 2: ['most'], 3: ['order'] },
};

describe('every question', () => {
  it('matches its kind and Level', () => each((q, kind, level) => { expect(q.kind).toBe(kind); expect(FORMS[kind][level]).toContain(q.form); }));
  it('has exactly one right choice', () => each(q => {
    const options = answersOf(q);
    if (options.length) {
      expect(new Set(options).size, JSON.stringify(q)).toBe(options.length);
      expect(options.filter(o => isRightAnswer(q, o)), JSON.stringify(q)).toEqual([q.answer]);
      for (const o of options) expect(isAnswer(q, o)).toBe(true);
    }
    expect(isRightAnswer(q, q.answer)).toBe(true);
    expect(isAnswer(q, 'not-a-thing')).toBe(false);
  }));
  it('Sort It\'s "tap all" is right only with exactly the things in the group', () => each(q => {
    if (q.kind !== 'sort' || q.form !== 'all') return;
    const ins = q.items.filter(x => groupOf(x) === q.group);
    expect(ins.length).toBeGreaterThanOrEqual(2);
    expect(isRightAnswer(q, [...ins].reverse().join(SEP))).toBe(true);
    expect(isRightAnswer(q, ins.slice(1).join(SEP))).toBe(false);
    expect(isRightAnswer(q, q.items.join(SEP))).toBe(false);
    expect(q.items.length).toBe(6);
  }));
  it('Strong Words in order is right only weakest to strongest', () => each(q => {
    if (q.kind !== 'strong' || q.form !== 'order') return;
    const s = SCALES[q.scale]!;
    expect(isRightAnswer(q, s.words.join(SEP))).toBe(true);
    expect(isRightAnswer(q, [...s.words].reverse().join(SEP))).toBe(false);
  }));
});

describe('the ambiguities the brief names', () => {
  it('Two Words: a wrong picture shares no half; a wrong half never makes a real word', () => each(q => {
    if (q.kind !== 'join') return;
    const c = COMPOUNDS.find(x => x.word === q.word)!;
    if (q.form === 'pic') {
      expect(picOf(q.word)).toBeTruthy();
      for (const o of q.choices.filter(x => x !== q.word)) { const d = COMPOUNDS.find(x => x.word === o)!; expect([d.a, d.b]).not.toContain(c.a); expect([d.a, d.b]).not.toContain(c.b); expect(picOf(o)).toBeTruthy(); }
    }
    if (q.form === 'split') { expect(c.spaced).toBeFalsy(); expect(Number(q.answer)).toBe(c.a.length); }
    if (q.form === 'half') for (const h of q.choices.filter(x => x !== q.answer)) expect(REAL_JOINS.has(q.a + h), q.a + h).toBe(false);
  }));
  it('Opposites: a wrong choice is never another fair opposite (no cool beside cold)', () => each(q => {
    if (q.kind !== 'opposite') return;
    const o = entry(q.word), fair = [o.opp, ...('also' in o ? o.also ?? [] : [])];
    for (const x of q.choices.filter(c => c !== q.answer)) { expect(fair).not.toContain(x); expect(oppWrongs(o)).toContain(x); }
    if (q.form === 'pic') for (const x of q.choices) expect(picOf(x) !== null || x === 'big' || x === 'little', x).toBe(true);
  }));
  it('Opposites: no wrong choice is a near miss a child could fairly pick (the opposite of float is not heavy)', () => {
    // judged by hand in the review pass: each of these sits close enough to the word that a six-year-old picking it isn't wrong
    const NEAR: Record<string, string[]> = {
      float: ['heavy', 'down', 'under'], day: ['dark', 'light'], night: ['light', 'dark'], dark: ['day', 'night', 'white', 'black'],
      tall: ['low'], long: ['near', 'far'], sit: ['up', 'down'], asleep: ['up', 'down'], awake: ['up', 'down'], laugh: ['quiet', 'loud'],
      cry: ['quiet', 'loud'], happy: ['good', 'bad'], sad: ['good', 'bad'], good: ['sad', 'happy'], on: ['out', 'under', 'in'], in: ['off', 'on'],
      yes: ['never', 'always'], no: ['never', 'always'], win: ['last', 'first'], front: ['last', 'first'], first: ['back', 'front', 'win', 'lose'],
      high: ['short'], up: ['sit', 'stand', 'asleep', 'awake', 'sink', 'float'],
    };
    each(q => {
      if (q.kind !== 'opposite') return;
      expect(q.choices.filter(c => c !== q.answer && (NEAR[q.word] ?? []).includes(c)), JSON.stringify(q)).toEqual([]);
    });
    for (const [w, near] of Object.entries(NEAR)) if (OPPOSITES.some(o => o.word === w)) for (const x of near) expect(oppWrongs(entry(w)), `${w}: ${x}`).not.toContain(x);
  });
  it('every question offers as many choices as its Level promises', () => each((q, _kind, level) => {
    if (q.kind === 'opposite') expect(q.choices.length, JSON.stringify(q)).toBe(level === 1 ? (q.choices.length === 3 ? 3 : 2) : 3);
    if (q.kind === 'join' && q.form !== 'split') expect(q.choices.length).toBeGreaterThanOrEqual(2);
    if (q.kind === 'join' && q.form === 'half') expect(q.choices.length).toBe(3);
    if (q.kind === 'sort' && q.form !== 'all') expect(q.form === 'odd' ? q.items.length : q.choices.length).toBe(q.form === 'odd' ? 4 : 3);
    if (q.kind === 'ending') expect(q.choices.length).toBe(q.form === 'count' ? 2 : 3);
  }));
  it('Opposites Level 3 asks for the opposite, so a true but other word (the towel is soft) is not right too', () => {
    const asked = oppSentenceAsk('The towel is not wet.', 'wet', ['dry', 'soft', 'long']);
    expect(asked.slice(0, 4)).toEqual(['The towel is not wet.', 'It is...', 'Tap the opposite of', 'wet']);
  });
  it('Sort It: the odd one is the only one from another group; a question about a group offers one true thing', () => each(q => {
    if (q.kind !== 'sort') return;
    if (q.form === 'odd') expect(q.items.filter(x => groupOf(x) !== q.group)).toEqual([q.answer]);
    if (q.form === 'name') { for (const x of q.items) expect(groupOf(x)).toBe(q.group); expect(new Set(q.choices.map(g => GROUPS[g].plural)).size).toBe(3); }
    if (q.form === 'fact') { const f = FACTS[q.fact]!; expect(q.choices.filter(x => (f.yes as readonly string[]).includes(x))).toEqual([q.answer]); for (const x of q.choices.filter(c => c !== q.answer)) expect(f.no as readonly string[]).toContain(x); }
  }));
  it('Endings: the word hiding in it is there, and no wrong one is', () => each(q => {
    if (q.kind !== 'ending') return;
    if (q.form === 'hide') { expect(q.shown.startsWith(q.answer)).toBe(true); for (const x of q.choices.filter(c => c !== q.answer)) expect(q.shown.includes(x)).toBe(false); }
    if (q.form === 'count') expect(q.answer).toBe(q.n === 1 ? q.word : `${q.word}s`);
  }));
});
