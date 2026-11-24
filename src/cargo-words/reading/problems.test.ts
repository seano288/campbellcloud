// Thousands of generated questions of every kind, Level and Stretch: exactly one answer is right, each matches its Level's row in the
// spec, the words use only sounds he has met (or a type whose Meeting comes first), Read It never says its word before he answers, Split
// It at Level 3 always says the word slowly, the Add-Ons ask what their parts mean, and nothing rude sits on a spare container.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { PHRASES } from '../phrases';
import { MEETINGS } from '../learning';
import { NEW_HERE, rSoundOf, typesOf } from '../words/sounds';
import { pictureClash, wordOf, WORDS } from '../words/words';
import { askedClips, askedFor } from './asked';
import { allAnswers, breakAt, closeSpare, isRightAnswer, isRude, KINDS, makeQuestion, needsOf, PIC_ALIKE, splitLevel, splitWhy, stageOf, stressedOf, heardAs, type Level, type Question } from './problems';

const N = 450;
function* all(kind: (typeof KINDS)[number], level: Level) {
  const rng = seeded(kind.length * 1000 + level * 37);
  for (let i = 0; i < N; i++) yield makeQuestion(kind, level, (i % 3) as Stretch, rng);
}
const phrases = new Set<string>(PHRASES);

describe('every question', () => {
  for (const kind of KINDS) for (const level of [1, 2, 3] as const) {
    it(`${kind} Level ${level}: exactly one answer is right, and every word it shows and says is recorded`, () => {
      for (const q of all(kind, level)) {
        const right = allAnswers(q).filter(a => isRightAnswer(q, a));
        expect(right, `${q.kind} ${q.word}`).toHaveLength(1);
        for (const c of askedClips(askedFor(q))) expect(phrases.has(c), c).toBe(true);
        // it names the new syllable types its word uses, so their Meetings come first
        for (const n of q.needs) expect(MEETINGS).toContain(n);
        expect(q.word).toMatch(/^[a-z]+$/);
      }
    });
  }
});

describe('each Level matches its row', () => {
  it('How Many Containers: one or two beats with a picture, one to three heard, one to four written and not said', () => {
    for (const q of all('count', 1)) { expect(q.syls.length).toBeLessThanOrEqual(2); expect(wordOf(q.word).pic).toBeTruthy(); if (q.kind === 'count') expect(q.show).toBe('pic'); }
    for (const q of all('count', 2)) expect(q.syls.length).toBeLessThanOrEqual(3);
    for (const q of all('count', 3)) { expect(q.syls.length).toBeLessThanOrEqual(4); expect(askedClips(askedFor(q))).not.toContain(q.word); }
    expect([...all('count', 3)].some(q => q.syls.length === 4)).toBe(true);
  });
  it('Load the Ship: two containers exactly at Level 1, three and a spare at Level 2, a close spare at Level 3', () => {
    for (const q of all('build', 1)) if (q.kind === 'build') { expect(q.syls).toHaveLength(2); expect(q.spare).toBeNull(); expect([...q.boxes].sort()).toEqual([...q.syls].sort()); }
    for (const q of all('build', 2)) if (q.kind === 'build') { expect(q.syls).toHaveLength(3); expect(q.spare).toBeTruthy(); expect(q.boxes).toHaveLength(4); }
    for (const q of all('build', 3)) if (q.kind === 'build') { expect(q.spare).toBeTruthy(); expect(q.syls).not.toContain(q.spare); }
  });
  it('Load the Ship: the containers are never already in order, and never two alike', () => {
    for (const level of [1, 2, 3] as const) for (const q of all('build', level)) if (q.kind === 'build') {
      expect(new Set(q.boxes).size).toBe(q.boxes.length);
      expect(q.boxes.filter(b => q.syls.includes(b)).join('|')).not.toBe(q.syls.join('|'));
    }
  });
  it('Level 3\'s spare looks or sounds close: one letter away from a syllable of the word (changed, dropped or two swapped)', () => {
    // (pass 2: was "shares two letters", which a two-letter container one vowel away (pi, pe) failed and an unrelated one (net, ten) passed)
    const oneAway = (a: string, b: string) => {
      if (a === b) return false;
      if (a.length === b.length) { const d = [...a].map((c, i) => (c === b[i] ? -1 : i)).filter(i => i >= 0); return d.length === 1 || (d.length === 2 && d[1] === d[0]! + 1 && a[d[0]!] === b[d[1]!] && a[d[1]!] === b[d[0]!]); }
      const [long, short] = a.length > b.length ? [a, b] : [b, a];
      return long.length === short.length + 1 && [...long].some((_, i) => long.slice(0, i) + long.slice(i + 1) === short);
    };
    let close = 0, n = 0;
    for (const q of all('build', 3)) if (q.kind === 'build' && q.spare) { n++; if (q.syls.some(s => oneAway(s, q.spare!))) close++; }
    expect(close / n).toBeGreaterThan(0.9);
  });
  it('Split It: joined words and twin letters, then two different letters, then one letter in the middle, said slowly', () => {
    for (const level of [1, 2, 3] as const) for (const q of all('split', level)) if (q.kind === 'split') {
      expect(splitLevel(wordOf(q.word))).toBe(level);
      expect(q.slow).toBe(level === 3);
      const a = askedFor(q);
      if (level === 3) { expect(a.kind).toBe('slow'); if (a.kind === 'slow') expect(a.syls).toHaveLength(2); }
      else expect(askedClips(a)).not.toContain(q.word);
      expect(q.word.length).toBeLessThanOrEqual(7);
    }
    expect([...all('split', 1)].some(q => q.kind === 'split' && q.why === 'twin') && [...all('split', 1)].some(q => q.kind === 'split' && q.why === 'compound')).toBe(true);
    expect([...all('split', 3)].some(q => q.kind === 'split' && q.why === 'open') && [...all('split', 3)].some(q => q.kind === 'split' && q.why === 'closed')).toBe(true);
  });
  it('Read It: never says its word; two pictures then three; three beats at Level 3; pictures that can\'t be mistaken', () => {
    for (const level of [1, 2, 3] as const) for (const q of all('read', level)) if (q.kind === 'read') {
      expect(askedClips(askedFor(q))).not.toContain(q.word);
      expect(q.choices).toHaveLength(level === 1 ? 2 : 3);
      expect(q.syls.length >= 3).toBe(level === 3);
      for (const a of q.choices) for (const b of q.choices) if (a !== b) expect(pictureClash(a, b), `${a} ${b}`).toBe(false);
      for (const c of q.choices) expect(wordOf(c).pic).toBeTruthy();
      if (level === 1) expect(stageOf(wordOf(q.word))).toBe(1);
    }
    expect([...all('read', 2)].some(q => stageOf(wordOf(q.word)) === 2)).toBe(true);
  });
  it('Read It\'s other pictures start with the same letter where the table has one', () => {
    let same = 0, n = 0;
    for (const q of all('read', 2)) if (q.kind === 'read') for (const c of q.choices) if (c !== q.word) { n++; if (c[0] === q.word[0]) same++; }
    expect(same / n).toBeGreaterThan(0.2);
  });
  it('Bossy R: a long word\'s r team (one of each sound), then reading, then loading with an r spare', () => {
    for (const q of all('r', 1)) if (q.kind === 'r' && q.form === 'gap') {
      expect(q.syls.length).toBe(2);
      expect(rSoundOf(q.syls[q.gap]!)).toBeTruthy();
      expect(q.choices.filter(c => ['er', 'ir', 'ur'].includes(c))).toHaveLength(1);
      expect(q.choices).toContain('ar'); expect(q.choices).toContain('or');
    }
    for (const q of all('r', 2)) { expect(q.kind === 'r' && q.form).toBe('read'); expect(q.syls.some(s => rSoundOf(s))).toBe(true); expect(askedClips(askedFor(q))).not.toContain(q.word); }
    for (const q of all('r', 3)) if (q.kind === 'r' && q.form === 'build') {
      expect(q.spare).toBeTruthy();
      // the spare is one of the word's r containers with its r saying another sound, never another spelling of the same one
      const from = q.syls.find(x => rSoundOf(x) && ['ar', 'or', 'er'].some(o => x.replace(/[aeiou]r/, o) === q.spare));
      expect(from, `${q.word} ${q.spare}`).toBeTruthy();
      expect(rSoundOf(q.spare!)).not.toBe(rSoundOf(from!));
    }
  });
  it('Add-Ons: pictures of un and re words, then what a word means, then the hiding word and -er and -est', () => {
    for (const q of all('addon', 1)) if (q.kind === 'addon') {
      expect(q.form).toBe('pic'); expect(['un', 're']).toContain(q.add.add);
      if (q.form === 'pic') for (const g of PIC_ALIKE) expect(q.choices.filter(c => g.includes(c)).length).toBeLessThanOrEqual(1);
    }
    for (const q of all('addon', 2)) if (q.kind === 'addon' && q.form === 'means') {
      expect(new Set(q.choices).size).toBe(3);
      expect(q.choices).toContain(q.add.base);
    }
    const forms = new Set([...all('addon', 3)].map(q => q.kind === 'addon' && q.form));
    expect(forms).toEqual(new Set(['hide', 'compare']));
    for (const q of all('addon', 3)) if (q.kind === 'addon' && q.form === 'hide') for (const c of q.choices) if (c !== q.add.base) expect(q.word.includes(c)).toBe(false);
  });
});

describe('sounds he has met', () => {
  it('heard words at Level 1 (and the first stretch of Level 2) use only Dino Dig\'s sounds', () => {
    for (const kind of ['count'] as const) for (const q of all(kind, 1)) expect(q.needs).toEqual([]);
    const rng = seeded(5);
    for (let i = 0; i < 400; i++) expect(makeQuestion('count', 2, 0, rng).needs).toEqual([]);
  });
  it('Load the Ship and Read It at Level 1 use only closed and magic-e syllables (and digraphs and blends) at first', () => {
    const rng = seeded(9);
    for (let i = 0; i < 400; i++) { expect(stageOf(wordOf(makeQuestion('build', 1, 0, rng).word))).toBe(1); expect(stageOf(wordOf(makeQuestion('read', 1, 0, rng).word))).toBe(1); }
  });
  it('a question needs exactly the new types its word uses', () => {
    for (const w of WORDS) expect(needsOf(w.syls)).toEqual([...new Set(typesOf(w.syls).filter(t => (NEW_HERE as readonly string[]).includes(t!)))]);
  });
});

describe('one right answer by sound, not only by spelling', () => {
  /** How the voice says this container in this place in the word (the clip he would hear), and how it says a spare there. */
  const heard = heardAs;
  it('a spare never sounds like the container it would stand in for (rock-et is said "rock-it", so "it" is never beside "et")', () => {
    for (const [kind, level] of [['build', 2], ['build', 3], ['r', 3]] as const) for (const q of all(kind, level)) {
      if (!('spare' in q) || !q.spare) continue;
      q.syls.forEach((_, i) => {
        const swapped = q.syls.map((x, j) => (j === i ? q.spare! : x));
        expect(heard(swapped, i), `${q.word}: ${q.spare} for ${q.syls[i]}`).not.toBe(heard(q.syls, i));
      });
    }
  });
  it('a spare is a container he can say: no "dne" or "tmie"', () => {
    for (const q of all('build', 3)) if (q.kind === 'build' && q.spare) expect(q.spare, q.word).toMatch(/^([^aeiouy]*|[bcdfgpt][rl]|s[ptc][rl]?)[aeiouy]+[^aeiou]*e?$/);
  });
  it('Bossy R asks only an ar or or that is said strongly, never one said "er" (for-GOT)', () => {
    for (const q of all('r', 1)) if (q.kind === 'r' && q.form === 'gap') {
      const s = q.syls[q.gap]!;
      if (rSoundOf(s) !== 'er') expect(stressedOf(wordOf(q.word)), `${q.word} ${s}`).toContain(q.gap);
    }
  });
});

describe('Split It: the rule the lesson says finds the break', () => {
  const vowel = (ch: string) => 'aeiou'.includes(ch);
  for (const w of WORDS.filter(x => splitLevel(x) !== null)) it(w.syls.join('|'), () => {
    const why = splitWhy(w), at = breakAt(w), word = w.word;
    // the letters between the first vowel sound and the next
    const v1 = word.search(/[aeiou]/), end1 = v1 + (word.slice(v1).match(/^[aeiou]+/)![0].length), v2 = word.slice(end1).search(/[aeiouy]/) + end1, middle = word.slice(end1, v2);
    if (why === 'compound') return; // two small words he can read
    if (why === 'twin') expect(word[at - 1]).toBe(word[at]);
    if (why === 'two') { expect(middle, 'two letters between the vowels').toHaveLength(2); expect(at).toBe(end1 + 1); }
    if (why === 'le') expect(word.slice(at)).toMatch(/^[^aeiou]le$/);
    if (why === 'open') expect(at).toBe(end1);
    if (why === 'closed') { expect(middle).toHaveLength(1); expect(at).toBe(end1 + 1); }
    if (why === 'ck') { expect(middle).toBe('ck'); expect(at).toBe(end1 + 2); }
    if (why === 'vowels') expect(vowel(word[at - 1]!) && vowel(word[at]!)).toBe(true);
  });
});

describe('nothing rude on a container', () => {
  it('no spare, close or not, is rude', () => {
    const rng = seeded(3);
    for (const w of WORDS.filter(x => x.syls.length >= 2)) for (let i = 0; i < 6; i++) { expect(isRude(closeSpare(w, rng)), w.word).toBe(false); }
  });
});

export type { Question };
