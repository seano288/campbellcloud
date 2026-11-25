// Thousands of questions of every kind and Level: each has exactly one right answer among what can be tapped, matches its Level, shows
// only words he can read, and no word or sentence comes back within twenty others.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { freshLearning, MODE_IDS, NOT_AGAIN_FOR, recordSolved, type LearningState } from '../learning';
import { mixedSession, type Problem } from '../mix';
import { canRead } from '../words/readable.testutil';
import { lex, TWO_JOBS } from '../words/lexicon';
import { whole, withWord } from '../words/frames';
import { isNoun } from '../words/sentences';
import { isRightAnswer, makeQuestion, possibleAnswers, type Level, type Question } from './problems';

const LEVELS: Level[] = [1, 2, 3];
const all: Question[] = [];
for (const kind of MODE_IDS) for (const level of LEVELS) { const rng = seeded(kind.length * 97 + level); for (let i = 0; i < 400; i++) all.push(makeQuestion(kind, level, rng)); }

const shownWords = (q: Question): string[] => {
  const st = q.stage, out: string[] = [...(q.choices ?? []).flatMap(c => c.split(' '))];
  if (st.type === 'tap') out.push(...st.shown.map(s => s.text));
  if (st.type === 'gap') out.push(...whole(st.f).split(' '));
  if (st.type === 'sort') out.push(st.word);
  if (st.type === 'plural') out.push(st.one);
  if (st.type === 'squeeze') out.push(...st.show.split(' '));
  if (st.type === 'apostrophe') out.push(st.word);
  if (st.type === 'squeeze3') out.push(...st.text.split(' '));
  return out.map(w => w.replace(/[.!?,]/g, '')).filter(w => w && w !== '___' && !/^(person|animal|place|thing)$/.test(w));
};

describe('every question', () => {
  it('has exactly one right answer among what can be tapped', () => {
    for (const q of all) {
      const right = possibleAnswers(q).filter(a => isRightAnswer(q, a));
      expect(right, `${q.kind} ${q.level} ${q.topic}`).toHaveLength(1);
      if (q.choices) expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });
  it('matches its Level and kind', () => {
    for (const q of all) expect(['noun', 'verb', 'adj', 'plural', 'past', 'squeeze', 'capital']).toContain(q.kind);
    const kindsAt = (k: string, l: Level) => new Set(all.filter(q => q.kind === k && q.level === l).map(q => q.stage.type));
    expect(kindsAt('noun', 1)).toEqual(new Set(['words']));
    expect(kindsAt('noun', 2)).toEqual(new Set(['tap']));
    expect(kindsAt('noun', 3)).toEqual(new Set(['sort']));
    expect(kindsAt('adj', 3)).toEqual(new Set(['looks']));
    expect(kindsAt('squeeze', 2)).toEqual(new Set(['squeeze', 'apostrophe']));
  });
  it('shows only words he can read', () => {
    const bad = new Set<string>();
    for (const q of all) for (const w of shownWords(q)) if (!canRead(w)) bad.add(w);
    expect([...bad]).toEqual([]);
  });
  it('Level 1 choices are words with one job, one of each job, and the right one is the one asked', () => {
    for (const q of all.filter(x => x.stage.type === 'words')) {
      for (const c of q.choices!) { expect(TWO_JOBS).not.toContain(c); expect(lex(c)!.jobs).toHaveLength(1); }
      expect(new Set(q.choices!.map(c => lex(c)!.jobs[0]))).toEqual(new Set(['noun', 'verb', 'adj']));
      expect(lex(q.answer)!.jobs[0]).toBe(q.kind);
    }
  });
  it('Nouns Level 2 taps the only noun in its sentence', () => {
    for (const q of all.filter(x => x.kind === 'noun' && x.level === 2)) {
      const st = q.stage as Extract<Question['stage'], { type: 'tap' }>;
      expect(st.shown.filter(w => isNoun(w.role))).toHaveLength(1);
    }
  });
  it('a gap question\'s wrong choices make a sentence that is not the right one', () => {
    for (const q of all.filter(x => x.stage.type === 'gap')) {
      const f = (q.stage as Extract<Question['stage'], { type: 'gap' }>).f;
      for (const c of q.choices!) expect(withWord(f, c) === whole(f)).toBe(c === q.answer);
    }
  });
  it('Big Letters shows the first word right and the words to fix small', () => {
    for (const q of all.filter(x => x.kind === 'capital')) {
      const st = q.stage as Extract<Question['stage'], { type: 'tap' }>;
      expect(st.shown[0]!.text[0]).toMatch(/[A-Z]/);
      for (const i of st.need) expect(st.shown[i]!.text[0]).toMatch(/[a-z]/);
      expect(st.need.length).toBe(q.level === 3 ? 2 : 1);
    }
  });
  it('Adjectives Level 3: the two dragons differ in one look, and only one sentence is true of the one pointed at', () => {
    for (const q of all.filter(x => x.kind === 'adj' && x.level === 3)) {
      const st = q.stage as Extract<Question['stage'], { type: 'looks' }>;
      const [a, b] = st.dragons, diff = a.filter((l, i) => l.value !== b[i]!.value);
      expect(diff).toHaveLength(1);
      const mine = st.dragons[st.point];
      expect(q.choices!.filter(c => mine.some(l => l.text === c))).toEqual([q.answer]);
    }
  });
});

describe('not again until twenty others', () => {
  /** A scripted Round loop: every kind open at a Level, every answer right; the session's own topics in order. */
  function run(level: Level, rounds: number, seed: number, kinds: readonly string[] = MODE_IDS) {
    let state: LearningState = { ...freshLearning(), met: [...MODE_IDS] };
    for (const k of MODE_IDS) state.modes[k] = { ...state.modes[k], level, opened: kinds.includes(k) };
    const topics: string[] = [], rng = seeded(seed);
    for (let r = 0; r < rounds; r++) {
      const s = mixedSession(() => state, async () => {}, rng);
      for (let i = 0; i < 5; i++) {
        const p = s.makeProblem(rng) as Problem;
        if (p.mode === 'meet') continue;
        topics.push(p.q.topic);
        state = recordSolved(state, { mode: p.mode, push: false, topic: p.q.topic }, { index: i + 1, outcome: 'clean', misses: 0, helped: false, replay: false }).state;
      }
    }
    return topics;
  }
  for (const level of LEVELS) it(`with every kind open at Level ${level}`, () => {
    const topics = run(level, 200, level * 13);
    for (let i = 0; i < topics.length; i++) expect(topics.slice(Math.max(0, i - NOT_AGAIN_FOR), i), `${topics[i]} at ${i}`).not.toContain(topics[i]);
  });
  it('with only Nouns and Verbs open, at the start', () => {
    for (const level of LEVELS) {
      const topics = run(level, 100, 7 + level, ['noun', 'verb']);
      for (let i = 0; i < topics.length; i++) expect(topics.slice(Math.max(0, i - NOT_AGAIN_FOR), i)).not.toContain(topics[i]);
    }
  });
});
