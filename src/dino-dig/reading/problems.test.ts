// Every kind × Level × how far through the Patterns he is × every word it can ask × several seeds. The brief's rules:
//   - a question only uses words from Patterns he has met (choices, Sound Swap's other word, a sentence's words, the silly word's Pattern);
//   - exactly one choice is right, and words the voice says alike are never offered together in Hear It;
//   - every silly word is not a real word, not a name, not rude and sounds out under its Pattern (words/silly.test.ts);
//   - Read It and Read and Find use only words with a clear picture;
//   - Read and Find's sentences use met Patterns plus the first Sight Squad words.
import { beforeAll, describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { WORDS as SIGHT_WORDS } from '../../sight-squad/words/list';
import { infoOf, isVowelSound, PATTERN_IDS, sameSound, WORDS, type PatternId, type Word } from '../words/list';
import { diffBox, heardAlike, oneSoundApart, veryDifferent } from '../words/pairs';
import { hasPicture, IN_OR_ON, pictureClash } from '../words/pictures';
import { SILLY } from '../words/silly';
import {
  canAsk, check, KINDS, latest, listWordsOf, makeQuestion, metWords, nearMiss, sceneKey, sentenceLength, sentenceOf, wordsApart,
  type Level, type Question,
} from './problems';

const LEVELS: Level[] = [1, 2, 3];
const STAGES = PATTERN_IDS.map((_, i) => PATTERN_IDS.slice(0, i + 1));
/** The first seven Sight Squad sets: the sight words a sentence may use. */
const FIRST_SIGHT = SIGHT_WORDS.slice(0, 35).map(w => w.toLowerCase());

/** Every right answer to a question, by trying every choice it offers. */
function rightAnswers(q: Question): string[] {
  switch (q.kind) {
    case 'read': case 'hear': case 'real': return q.choices.filter(c => check(q, c) === true);
    case 'sentence': return q.choices.map(sceneKey).filter(k => check(q, k) === true);
    case 'swap': {
      const boxes = infoOf(q.from).sounds.map((_, i) => `${i}`).filter(b => check(q, b) === 'more');
      return boxes.flatMap(b => q.choices.filter(t => check(q, `${b}=${t}`) === true).map(t => `${b}=${t}`));
    }
  }
}

/** Every question, made once: each kind, Level and stage, each word it can ask, two seeds. */
const ALL: { q: Question; met: readonly PatternId[]; level: Level }[] = [];
beforeAll(() => {
  for (const met of STAGES) for (const kind of KINDS) for (const level of LEVELS) for (const w of WORDS) {
    if (!canAsk(kind, level, w, met)) continue;
    for (const seed of [1, 2]) ALL.push({ q: makeQuestion(kind, level, w, met, seeded(seed * 7919 + w.length)), met, level });
  }
}, 600_000);
function each(fn: (q: Question, met: readonly PatternId[], level: Level) => void) {
  for (const x of ALL) fn(x.q, x.met, x.level);
  return ALL.length;
}

describe('every question', () => {
  it('has exactly one right answer', () => {
    const n = each(q => expect(rightAnswers(q), JSON.stringify(q)).toHaveLength(1));
    expect(n).toBeGreaterThan(5000);
  });
  it('only uses words from the Patterns he has met', () => {
    each((q, met) => {
      const words = metWords(met), used: Word[] = q.kind === 'sentence' ? q.choices.flatMap(listWordsOf) : q.kind === 'swap' ? [q.word, q.from] : q.kind === 'real' ? [q.word] : q.choices;
      for (const w of used) expect(words, `${w} in ${JSON.stringify(q)}`).toContain(w);
      if (q.kind === 'real') expect(met.some(p => SILLY[p].includes(q.silly)), q.silly).toBe(true);
    });
  });
  it('offers each choice once', () => {
    each(q => {
      const keys = q.kind === 'sentence' ? q.choices.map(sceneKey) : q.choices;
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
  it('is counted for the Pattern of the word it asks', () => {
    each(q => expect(PATTERN_IDS).toContain(infoOf(q.word).pattern));
  });
});

describe('Read It', () => {
  it('shows a word with a clear picture, and only pictures that can\'t be mistaken for each other', () => {
    each(q => {
      if (q.kind !== 'read') return;
      for (const c of q.choices) expect(hasPicture(c), c).toBe(true);
      for (const a of q.choices) for (const b of q.choices) if (a !== b) expect(pictureClash(a, b), `${a} ${b}`).toBe(false);
    });
  });
  it('matches its Level: two very different pictures, then three, then three one sound apart where the list has them', () => {
    each((q, _m, level) => {
      if (q.kind !== 'read') return;
      const wrong = q.choices.filter(c => c !== q.word);
      if (level === 1) { expect(q.choices).toHaveLength(2); expect(veryDifferent(wrong[0]!, q.word)).toBe(true); }
      if (level === 2) { expect(q.choices).toHaveLength(3); for (const c of wrong) expect(oneSoundApart(c, q.word)).toBe(false); }
      if (level === 3) { expect(q.choices).toHaveLength(3); expect(wrong.some(c => oneSoundApart(c, q.word))).toBe(true); }
    });
  });
});

describe('Hear It', () => {
  it('never offers two words the voice says alike', () => {
    each(q => {
      if (q.kind !== 'hear') return;
      for (const a of q.choices) for (const b of q.choices) if (a !== b) expect(heardAlike(a, b), `${a} ${b}`).toBe(false);
    });
  });
  it('matches its Level', () => {
    each((q, _m, level) => {
      if (q.kind !== 'hear') return;
      const wrong = q.choices.filter(c => c !== q.word);
      expect(q.choices).toHaveLength(level === 1 ? 2 : 3);
      if (level === 1) expect(veryDifferent(wrong[0]!, q.word)).toBe(true);
      if (level === 2) for (const c of wrong) expect(oneSoundApart(c, q.word)).toBe(false);
      if (level === 3) expect(wrong.some(c => oneSoundApart(c, q.word))).toBe(true);
    });
  });
});

describe('Sound Swap', () => {
  it('changes one sound to make another word on the list, marked at Level 1, two letters for one sound at Level 3', () => {
    each((q, _m, level) => {
      if (q.kind !== 'swap') return;
      expect(diffBox(q.from, q.word)).toBe(q.box);
      expect(q.marked).toBe(level === 1);
      const a = infoOf(q.from).sounds[q.box]!, b = q.answer;
      if (level === 3) expect(a.length > 1 || b.length > 1, `${q.from}>${q.word}`).toBe(true);
      else expect(a.length === 1 && b.length === 1, `${q.from}>${q.word}`).toBe(true);
    });
  });
  it('never asks him to change a word into one the voice says alike (pen to pin)', () => {
    each(q => { if (q.kind === 'swap') expect(heardAlike(q.from, q.word), `${q.from}>${q.word}`).toBe(false); });
  });
  it('offers tiles that each say a different sound, and never the old one', () => {
    each(q => {
      if (q.kind !== 'swap') return;
      const old = infoOf(q.from).sounds[q.box]!;
      expect(q.choices).toContain(q.answer);
      for (const t of q.choices) if (t !== q.answer) { expect(sameSound(q.answer)).not.toContain(t); expect(sameSound(old)).not.toContain(t); }
      // vowels are swapped for vowels, consonants for consonants
      for (const t of q.choices) expect(isVowelSound(t)).toBe(isVowelSound(q.answer));
    });
  });
});

describe('Real or Silly', () => {
  it('pairs a real word with a silly one that fits its Level', () => {
    each((q, _m, level) => {
      if (q.kind !== 'real') return;
      expect(q.choices.sort()).toEqual([q.word, q.silly].sort());
      expect(WORDS as readonly string[]).not.toContain(q.silly);
      if (level === 1) expect(q.silly[0] !== q.word[0] && ![...q.silly].some(c => /[aeiou]/.test(c) && q.word.includes(c)), `${q.word}/${q.silly}`).toBe(true);
      if (level === 2) expect(SILLY[infoOf(q.word).pattern]).toContain(q.silly);
      if (level === 3) expect([...q.silly].filter((c, i) => c !== q.word[i]).length).toBe(1);
      if (level === 3) expect(q.silly.length).toBe(q.word.length);
    });
  });
});

describe('Read and Find', () => {
  it('reads with met words, clear pictures and the first sight words only', () => {
    each((q, met) => {
      if (q.kind !== 'sentence') return;
      const ok = new Set([...metWords(met), ...FIRST_SIGHT, 'a', 'i']);
      for (const s of q.choices) {
        for (const w of sentenceOf(s).replace(/\.$/, '').toLowerCase().split(' ')) expect(ok.has(w), `${w} in ${sentenceOf(s)}`).toBe(true);
        for (const w of listWordsOf(s)) expect(hasPicture(w), w).toBe(true);
      }
      expect(q.word).toBe(latest(listWordsOf(q.scene)));
    });
  });
  it('matches its Level: three words, then four or five, then pictures one word off', () => {
    each((q, _m, level) => {
      if (q.kind !== 'sentence') return;
      const n = sentenceLength(q.scene);
      if (level === 1) expect(n).toBe(3);
      else expect(n === 4 || n === 5, sentenceOf(q.scene)).toBe(true);
      for (const c of q.choices) if (sceneKey(c) !== sceneKey(q.scene)) {
        if (level === 3) expect(wordsApart(c, q.scene), `${sentenceOf(c)} / ${sentenceOf(q.scene)}`).toBe(1);
        else expect(wordsApart(c, q.scene)).toBeGreaterThanOrEqual(1);
        // Level 1: another thing that looks and sounds nothing like it; Level 2: another thing, not one sound apart
        if (level === 1) expect(veryDifferent(c.a, q.scene.a), `${sentenceOf(c)} / ${sentenceOf(q.scene)}`).toBe(true);
        if (level === 2) expect(oneSoundApart(c.a, q.scene.a), `${sentenceOf(c)} / ${sentenceOf(q.scene)}`).toBe(false);
        // "in a" against "on a" only where they plainly differ: a fox on a boat is in it too
        if (c.rel !== q.scene.rel) expect(IN_OR_ON, `${sentenceOf(c)} / ${sentenceOf(q.scene)}`).toContain(q.scene.b);
      }
    });
  });
  it('never offers two pictures that look alike', () => {
    each(q => {
      if (q.kind !== 'sentence') return;
      const ks = q.choices.map(c => `${c.size ?? ''}${c.rel ?? ''}${c.see ? 'see' : ''}`);
      q.choices.forEach((a, i) => q.choices.forEach((b, j) => {
        if (i >= j || ks[i] !== ks[j]) return;
        const same = (x: Word | undefined, y: Word | undefined) => x === y || (!!x && !!y && pictureClash(x, y));
        expect(same(a.a, b.a) && same(a.b, b.b), `${sentenceOf(a)} / ${sentenceOf(b)}`).toBe(false);
      }));
    });
  });
});

describe('teaching a miss', () => {
  it('stacks a wrong word one sound away with the right one', () => {
    expect(nearMiss({ kind: 'hear', word: 'ship', choices: ['ship', 'shop', 'tree'] }, 'shop')).toBe('shop');
    expect(nearMiss({ kind: 'hear', word: 'ship', choices: ['ship', 'shop', 'tree'] }, 'tree')).toBeNull();
    expect(nearMiss({ kind: 'swap', word: 'cot', from: 'cat', box: 1, answer: 'o', choices: [], marked: false } as never, '0')).toBe('cat');
  });
});

describe('enough to ask', () => {
  it('can ask every kind at every Level once every Pattern is met, from many words', () => {
    for (const kind of KINDS) for (const level of LEVELS) expect(WORDS.filter(w => canAsk(kind, level, w, PATTERN_IDS)).length, `${kind} ${level}`).toBeGreaterThanOrEqual(25);
  });
  it('can ask Read It, Hear It and Real or Silly from the first Pattern on', () => {
    for (const kind of ['read', 'hear', 'real'] as const) for (const level of LEVELS) expect(WORDS.some(w => canAsk(kind, level, w, ['cvc'])), `${kind} ${level}`).toBe(true);
  });
});
