// The word tables, checked for the ambiguities the brief names: one agreed set of break points per word that follows the syllable
// rules; every syllable made of sounds he has met; pictures only where they can't be mistaken; Add-Ons words that mean what their parts
// say; nothing rude or frightening on a container; and one sound for each syllable clip.
import { describe, expect, it } from 'vitest';
import { DINO_PATTERNS_MET } from './dino';
import { ADD_ON_WORDS, ADD_ONS, NOT_ADD_ONS, partsOf } from './addons';
import { syllableSounds } from './said';
import { DIGRAPHS, MET_IN_DINO_DIG, NEW_HERE, TEAMS, typeOf, typesOf } from './sounds';
import { ARGUED, LOOK_ALIKE, NOT_HERE, pictureClash, SYLLABLES, WORDS } from './words';
import { isRude, RUDE_INSIDE } from '../reading/problems';

const vowel = (ch: string) => 'aeiou'.includes(ch);
/** Blends that start a syllable and stay together (tel|e|scope, mi|cro|scope). */
const BLENDS = ['sc', 'sk', 'st', 'sp', 'sl', 'sn', 'sm', 'sw', 'cr', 'pl', 'bl', 'br', 'tr', 'gr', 'fr', 'dr', 'cl', 'fl', 'gl', 'pr', 'scr', 'str', 'spr'];

describe('the word table', () => {
  it('has every word once, lowercase, written as its syllables', () => {
    expect(new Set(WORDS.map(w => w.word)).size).toBe(WORDS.length);
    for (const w of WORDS) {
      expect(w.word).toMatch(/^[a-z]+$/);
      expect(w.syls.join('')).toBe(w.word);
      expect(w.syls.every(s => s.length > 0)).toBe(true);
    }
  });
  it('has enough words of each length for every kind', () => {
    const n = (k: number) => WORDS.filter(w => w.syls.length === k).length;
    expect(n(1)).toBeGreaterThanOrEqual(20);
    expect(n(2)).toBeGreaterThanOrEqual(150);
    expect(n(3)).toBeGreaterThanOrEqual(15);
    expect(n(4)).toBeGreaterThanOrEqual(3);
  });
  it('leaves out every word whose break is argued over, and the brief\'s own examples', () => {
    for (const w of ['lemon', 'every', 'family', 'different']) expect(ARGUED[w]).toBeTruthy();
    for (const w of [...Object.keys(ARGUED), ...Object.keys(NOT_HERE)]) expect(WORDS.some(x => x.word === w), w).toBe(false);
  });
});

describe('break points follow the syllable rules', () => {
  for (const w of WORDS.filter(x => x.syls.length > 1)) {
    it(w.syls.join('|'), () => {
      for (let i = 0; i < w.syls.length - 1; i++) {
        const a = w.syls[i]!, b = w.syls[i + 1]!, x = a.at(-1)!, y = b[0]!;
        // the joint of two small words is where it breaks, whatever letters meet there (grass+hopper)
        if (w.compound && i === 0) continue;
        // never splits a digraph, a vowel team or a bossy r
        expect((DIGRAPHS as readonly string[]).includes(x + y) && x !== y && !/^[a-z]le$/.test(b), `digraph ${x}${y}`).toBe(false);
        expect((TEAMS as readonly string[]).includes(x + y), `team ${x}${y}`).toBe(false);
        expect(vowel(x) && y === 'r' && !vowel(b[1] ?? ''), `bossy r split ${a}|${b}`).toBe(false);
        // a consonant-le syllable takes the one consonant before it (jun|gle too: the n and g are two sounds there)
        if (/^[a-z]le$/.test(b)) { expect(vowel(b[0]!)).toBe(false); continue; }
        if (w.compound) continue;
        // two consonants between vowels split between them (a blend or digraph stays together)
        const lastVowel = a.search(/[aeiou][^aeiou]*$/), tail = a.slice(lastVowel + 1), head = b.slice(0, b.search(/[aeiouy]/));
        const middle = tail + head;
        if (middle.length >= 2 && !(DIGRAPHS as readonly string[]).includes(middle) && !BLENDS.includes(head)) expect(tail.length, `${a}|${b}`).toBeGreaterThanOrEqual(1);
      }
    });
  }
});

describe('every syllable uses sounds he has met', () => {
  it('in Dino Dig, or one of the three types met in a Meeting here', () => {
    for (const w of WORDS) {
      const t = typesOf(w.syls);
      expect(t.includes(null), `${w.syls.join('|')}: ${t.join(',')}`).toBe(false);
      for (const x of t) expect([...MET_IN_DINO_DIG, ...NEW_HERE]).toContain(x);
    }
  });
  it('Dino Dig teaches every Pattern the types above lean on, Bossy R among them', () => {
    expect(DINO_PATTERNS_MET).toEqual(['cvc', 'digraph', 'blend', 'magic-e', 'team', 'r']);
  });
  it('one sound for each syllable, so each has one clip', () => {
    const { said, clashes } = syllableSounds();
    expect(clashes).toEqual([]);
    expect(Object.keys(said).sort()).toEqual([...SYLLABLES].sort());
  });
});

describe('pictures', () => {
  it('are only on words with a plain picture, and never shared', () => {
    const pics = WORDS.filter(w => w.pic).map(w => w.pic);
    expect(new Set(pics).size).toBe(pics.length);
  });
  it('look-alike groups keep rabbit away from bunny', () => {
    expect(pictureClash('rabbit', 'bunny')).toBe(true);
    for (const g of LOOK_ALIKE) expect(g.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Add-Ons', () => {
  it('has only un, re, ful, less, er and est: none of Hook and Ladder\'s Endings (-s, -ed, -ing)', () => {
    expect([...ADD_ONS]).toEqual(['un', 're', 'ful', 'less', 'er', 'est']);
    for (const a of ADD_ON_WORDS) expect(a.word).not.toMatch(/(ing|ed)$/);
  });
  it('every word is its parts joined, and means what its parts say', () => {
    for (const a of ADD_ON_WORDS) {
      expect(partsOf(a).join(''), a.word).toBe(a.word);
      if (a.add === 'un') expect(a.means).toMatch(/^(not |take|open|pull)/);
      if (a.add === 're') expect(a.means).toMatch(/ again$/);
      if (a.add === 'ful') expect(a.means).toMatch(/^(full of|as much as)/);
      if (a.add === 'less') expect(a.means).toMatch(/^without/);
      if (a.add === 'er') expect(a.means).toMatch(/^more /);
      if (a.add === 'est') expect(a.means).toMatch(/^the most /);
    }
  });
  it('never treats uncle, under, refuse or really as an add-on word', () => {
    for (const w of ['uncle', 'under', 'refuse', 'really', ...NOT_ADD_ONS]) expect(ADD_ON_WORDS.some(a => a.word === w), w).toBe(false);
  });
  it('the near words for "Which word is hiding" are real-looking, not inside the word, and use met sounds', () => {
    for (const a of ADD_ON_WORDS) for (const n of a.near) {
      expect(a.word.includes(n), `${n} is inside ${a.word}`).toBe(false);
      expect(n).not.toBe(a.base);
      const t = WORDS.find(w => w.word === n) ? typesOf(WORDS.find(w => w.word === n)!.syls) : [typeOf(n, true)];
      expect(t.includes(null), n).toBe(false);
    }
  });
  it('the base word is inside the whole word, and uses met sounds', () => {
    for (const a of ADD_ON_WORDS) {
      expect(a.word.includes(a.base)).toBe(true);
      const t = WORDS.find(w => w.word === a.base) ? typesOf(WORDS.find(w => w.word === a.base)!.syls) : [typeOf(a.base, true)];
      expect(t.includes(null), a.base).toBe(false);
    }
  });
});

describe('nothing rude or frightening', () => {
  it('on any container (syllable) or inside any word', () => {
    expect(SYLLABLES.filter(isRude)).toEqual([]);
    for (const w of [...WORDS.map(x => x.word), ...ADD_ON_WORDS.flatMap(a => [a.word, ...a.near])]) for (const r of RUDE_INSIDE) expect(w.includes(r), `${r} in ${w}`).toBe(false);
  });
});
