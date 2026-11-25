// The brief's "Rules the tests must enforce" for the word tables: every word is one he can read, a word with two jobs is never a choice
// alone, each gap has exactly one right word, only forms nobody argues over, no its/it's or your/you're, and Big Letters never asks for
// the capital at the start of a sentence.
import { describe, expect, it } from 'vitest';
import { GAME_WORDS } from './allowed';
import { canRead } from './readable.testutil';
import { LEXICON, ONE_JOB, oneJob, SORTABLE, TWO_JOBS } from './lexicon';
import { forAdj, forCapital, forNoun, forVerb, isNoun, rolesOf, SENTENCES, toFix } from './sentences';
import {
  CHANGING, DISPUTED, gapped, LOOKS, PAST_FRAMES_1, PAST_FRAMES_2, PASTS, PLURAL_FRAMES, PLURAL_FRAMES_3, PLURALS, SQUEEZE_SENTENCES, SQUEEZES, squeezed, TIME_FRAMES,
  VERB_FRAMES, whole,
} from './frames';

const wordsOf = (text: string) => text.replace(/___/g, ' ').split(/[\s.!?,]+/).filter(Boolean);
const ALL_TEXT = [
  ...SENTENCES.map(s => s.text),
  ...[...VERB_FRAMES, ...PLURAL_FRAMES, ...PLURAL_FRAMES_3, ...PAST_FRAMES_1, ...PAST_FRAMES_2, ...TIME_FRAMES].flatMap(f => [whole(f), ...f.wrong]),
  ...SQUEEZE_SENTENCES.flatMap(s => [s.text, squeezed(s), ...s.wrong]),
  ...SQUEEZES.flatMap(s => [s.word, s.from]),
  ...LOOKS.map(l => l.text),
  ...PLURALS.flatMap(p => [p.one, p.many, ...(p.made ? [p.made] : [])]),
  ...ONE_JOB.map(l => l.w),
];

describe('every word is one he can read', () => {
  it('is on Sight Squad, Dino Dig, Word Wreckers or Cargo Words, or is one of the dragon words met first', () => {
    const bad = [...new Set(ALL_TEXT.flatMap(wordsOf).filter(w => !canRead(w)))];
    expect(bad).toEqual([]);
  });
  it('keeps its own words few', () => expect(GAME_WORDS.length).toBeLessThan(100));
});

describe('a word has one job wherever it is asked alone', () => {
  it('no word with two jobs is a Level 1 choice', () => {
    for (const job of ['noun', 'verb', 'adj'] as const) for (const l of oneJob(job)) {
      expect(TWO_JOBS, l.w).not.toContain(l.w);
      expect(l.jobs).toHaveLength(1);
    }
  });
  it('each word is in the lexicon once', () => {
    const ws = LEXICON.map(l => l.w);
    expect(ws.filter((w, i) => ws.indexOf(w) !== i)).toEqual([]);
  });
  it('the brief\'s two-job words are all marked with two jobs', () => {
    for (const w of ['fly', 'play', 'run', 'jump', 'water', 'park', 'orange', 'cold']) expect(LEXICON.find(l => l.w === w)?.jobs.length ?? 0, w).toBeGreaterThan(1);
  });
  it('there are enough of each for a Level 1 question not to come back within twenty', () => {
    expect(oneJob('noun').length).toBeGreaterThanOrEqual(21);
    expect(oneJob('verb').length).toBeGreaterThanOrEqual(21);
    expect(oneJob('adj').length).toBeGreaterThanOrEqual(21);
    expect(SORTABLE.length).toBeGreaterThanOrEqual(21);
  });
  it('person, animal, place or thing has a few of each', () => {
    for (const c of ['person', 'animal', 'place', 'thing'] as const) expect(SORTABLE.filter(l => l.cat === c).length, c).toBeGreaterThanOrEqual(8);
  });
});

describe('the sentences', () => {
  it('every word has a job, and a word with two is marked where it stands', () => {
    const bad: string[] = [];
    for (const s of SENTENCES) for (const w of s.words) {
      const roles = rolesOf(w.text);
      if (!roles.length && !/:/.test(w.text)) bad.push(`${s.text}: ${w.text} unknown`);
    }
    // a word the tables don't know comes out as x; every x must be one the little-word table means
    for (const s of SENTENCES) for (const w of s.words) if (w.role === 'x' && rolesOf(w.text)[0] !== 'x') bad.push(`${s.text}: ${w.text} needs a mark`);
    expect(bad).toEqual([]);
  });
  it('are all different, and about 140 of them', () => {
    const t = SENTENCES.map(s => s.text);
    expect(new Set(t).size).toBe(t.length);
    expect(t.length).toBeGreaterThanOrEqual(130);
  });
  it('have enough for each question', () => {
    expect(SENTENCES.filter(forNoun).length).toBeGreaterThanOrEqual(21);
    expect(SENTENCES.filter(forVerb).length).toBeGreaterThanOrEqual(21);
    expect(SENTENCES.filter(forAdj).length).toBeGreaterThanOrEqual(21);
    expect(SENTENCES.filter(s => forCapital(s, 1)).length).toBeGreaterThanOrEqual(12);
    expect(SENTENCES.filter(s => forCapital(s, 2)).length).toBeGreaterThanOrEqual(12);
    expect(SENTENCES.filter(s => forCapital(s, 3)).length).toBeGreaterThanOrEqual(12);
  });
  it('"tap the noun" has exactly one noun; "tap the verb" one doing word and no helper; "tap the adjective" one and no a, the or my', () => {
    for (const s of SENTENCES.filter(forNoun)) expect(s.words.filter(w => isNoun(w.role))).toHaveLength(1);
    for (const s of SENTENCES.filter(forVerb)) { expect(s.words.filter(w => w.role === 'v')).toHaveLength(1); expect(s.words.filter(w => w.role === 'h')).toHaveLength(0); }
    for (const s of SENTENCES.filter(forAdj)) { expect(s.words.filter(w => w.role === 'a')).toHaveLength(1); expect(s.words.filter(w => w.role === 'd')).toHaveLength(0); }
  });
  it('Big Letters: the first word is right already, and only names, days, months and places are asked', () => {
    for (const s of SENTENCES) {
      expect(s.words[0]!.text[0]).toMatch(/[A-Z]/);
      for (const i of toFix(s)) { expect(i).toBeGreaterThan(0); expect(s.words[i]!.text[0]).toMatch(/[A-Z]/); }
      // nothing else in the sentence has a capital but I, so the only big letters to find are the ones asked for
      s.words.forEach((w, i) => { if (i > 0 && /^[A-Z]/.test(w.text) && w.text !== 'I' && !w.text.startsWith("I'")) expect(toFix(s), `${s.text} ${w.text}`).toContain(i); });
    }
  });
  it('every sentence of each kind sorts into one bin (Big Letters Level 3 always has a place)', () => {
    for (const s of SENTENCES.filter(x => forCapital(x, 3))) expect(toFix(s).map(i => s.words[i]!.role)).toContain('P');
  });
});

describe('the gaps', () => {
  const frames = [...VERB_FRAMES, ...PLURAL_FRAMES, ...PLURAL_FRAMES_3, ...PAST_FRAMES_1, ...PAST_FRAMES_2, ...TIME_FRAMES];
  it('every gap has one right word and different wrong ones, and every frame is different', () => {
    for (const f of frames) {
      expect(f.wrong.length).toBeGreaterThan(0);
      expect(new Set([f.right, ...f.wrong]).size).toBe(f.wrong.length + 1);
      expect(gapped(f)).toContain('___');
    }
    // within a table every frame is different (the same sentence at two Levels is one clip)
    for (const table of [VERB_FRAMES, PLURAL_FRAMES, PLURAL_FRAMES_3, PAST_FRAMES_1, PAST_FRAMES_2, TIME_FRAMES]) {
      const all = table.map(whole);
      expect(new Set(all).size).toBe(all.length);
    }
  });
  it('agreement: one dragon flies, two dragons fly', () => {
    for (const f of VERB_FRAMES) {
      const plural = /^(The dragons|The eggs|The girls|Dragons|They|We|I|You) /.test(f.before);
      expect(f.right.endsWith('s'), whole(f)).toBe(!plural);
    }
  });
  it('More Than One uses only forms nobody argues over, and its Level 1 and 2 only words that change', () => {
    const shown = [...PLURAL_FRAMES, ...PLURAL_FRAMES_3].flatMap(f => [f.right, ...f.wrong]).concat(PLURALS.flatMap(p => [p.one, p.many, p.made ?? '']));
    for (const d of DISPUTED) expect(shown).not.toContain(d);
    for (const f of PLURAL_FRAMES) expect(CHANGING.some(p => [p.one, p.many].includes(f.right))).toBe(true);
  });
  it('Yesterday uses only forms nobody argues over, and every Level 3 frame is about one person or dragon', () => {
    const shown = [...PAST_FRAMES_1, ...PAST_FRAMES_2, ...TIME_FRAMES].flatMap(f => [f.right, ...f.wrong]).concat(PASTS.flat());
    for (const d of DISPUTED) expect(shown).not.toContain(d);
    for (const f of [...PAST_FRAMES_1, ...PAST_FRAMES_2]) expect(f.before.startsWith('Yesterday')).toBe(true);
    for (const f of TIME_FRAMES) {
      expect(f.before).toMatch(/^(Yesterday|Tomorrow) (the dragon|the egg|Sam|Max|Kim|Ben) $/);
      expect(f.right.startsWith('will ')).toBe(f.before.startsWith('Tomorrow'));
    }
    for (const [base] of PASTS) expect(PAST_FRAMES_2.some(f => f.wrong.includes(base))).toBe(true);
  });
  it('Squeeze never asks its against it\'s, or your against you\'re', () => {
    const shown = [...SQUEEZES.flatMap(s => [s.word, s.from]), ...SQUEEZE_SENTENCES.flatMap(s => [s.text, s.word, ...s.wrong])].join(' ').toLowerCase();
    for (const w of ['its', 'your', "you're", 'were', 'his']) expect(shown.split(/[\s.!?]+/)).not.toContain(w);
  });
  it('each squeezed word comes from its two words with the right letters out', () => {
    for (const s of SQUEEZES.filter(x => x.word !== "won't")) {
      const [a, b] = s.from.split(' ') as [string, string], out = s.word.replace("'", '');
      expect(`${a}${b.replace(s.gone, '')}`.toLowerCase(), s.word).toBe(out.toLowerCase());
    }
    for (const s of SQUEEZE_SENTENCES) {
      const pair = s.text.split(' ').slice(s.at, s.at + 2).join(' ').toLowerCase();
      expect(SQUEEZES.find(q => q.word.toLowerCase() === s.word.toLowerCase())!.from.toLowerCase()).toBe(pair);
      for (const w of s.wrong) expect(SQUEEZES.find(q => q.word.toLowerCase() === w.toLowerCase())!.from.toLowerCase()).not.toBe(pair);
    }
  });
  it('Adjectives Level 3 has two of every look, so two dragons can differ in one', () => {
    for (const dim of new Set(LOOKS.map(l => l.dim))) expect(LOOKS.filter(l => l.dim === dim).length).toBeGreaterThanOrEqual(2);
  });
});
