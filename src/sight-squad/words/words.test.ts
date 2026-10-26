import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { PHRASES } from '../phrases';
import { infoOf, likeness, NEVER_FITS, ROLELESS, roleOf, SET_SIZE, WORD_INFO, WORDS, type Word } from './list';
import { canFill, huntTargets, makeFill, makeHear, makeHunt, makeMeet, makeRead, makeSentence, makeSpell, sentenceOf, wrongWords } from './problems';
import { GAP_TEXTS, gapText, meetSentence, readable, SENTENCES, WORDS_WITHOUT_SENTENCES } from './sentences';

const said = new Set<string>(PHRASES);
const setOf = (w: Word) => infoOf(w).set;

describe('the word list', () => {
  it('has 100 different words in sets of 5', () => {
    expect(WORDS).toHaveLength(100);
    expect(new Set(WORDS.map(w => w.toLowerCase())).size).toBe(100);
    expect(WORD_INFO.at(-1)!.set).toBe(100 / SET_SIZE - 1);
  });
  it('keeps look-alikes out of the same set', () => {
    const pairs: [Word, Word][] = [['was', 'saw'], ['on', 'no'], ['the', 'then'], ['of', 'for'], ['there', 'they'], ['here', 'where'], ['to', 'two'], ['run', 'ran'], ['come', 'came' as Word], ['he', 'she'], ['it', 'is'], ['our', 'your']];
    for (const [a, b] of pairs) if (WORDS.includes(b)) expect(setOf(a), `${a} / ${b}`).not.toBe(setOf(b));
  });
  it('marks heart letters inside the word', () => {
    expect(infoOf('said').heart).toEqual([1, 2]);
    expect(infoOf('can').heart).toEqual([]);
    for (const { word, heart } of WORD_INFO) for (const i of heart) expect(i).toBeLessThan(word.length);
  });
  it('gives every word a job, for Fill the Gap', () => {
    expect(ROLELESS()).toEqual([]);
  });
  it('rates look-alikes as alike', () => {
    expect(likeness('was', 'saw')).toBeGreaterThan(likeness('was', 'big'));
    expect(likeness('then', 'the')).toBeGreaterThan(likeness('then', 'up'));
  });
});

describe('the sentences', () => {
  it('cover every word, and are all different', () => {
    expect(WORDS_WITHOUT_SENTENCES).toEqual([]);
    expect(new Set(SENTENCES.map(s => s.text)).size).toBe(SENTENCES.length);
    expect(GAP_TEXTS.length).toBeGreaterThan(90);
  });
  it('only ever share a Fill the Gap recording between words that do the same job (the other choices never do)', () => {
    const byGap = new Map<string, Word[]>();
    for (const s of SENTENCES) if (s.gap) byGap.set(gapText(s), [...(byGap.get(gapText(s)) ?? []), s.gap]);
    for (const [text, gaps] of byGap) expect(new Set(gaps.map(roleOf)).size, text).toBe(1);
  });
  it('can be read early: the first set already has sentences that use only its words', () => {
    expect(readable(['I', 'a', 'see', 'go', 'up']).length).toBeGreaterThan(1);
  });
  it('leave one word out for Fill the Gap, said as blank', () => {
    const s = SENTENCES.find(x => x.text === 'I see a cat.')!;
    expect(s.gap).toBe('a');
    expect(gapText(s)).toBe('I see blank cat.');
  });
  it('meet each word with a sentence that has it', () => {
    for (const [i, w] of WORDS.entries()) expect(meetSentence(w, WORDS.slice(0, i))!.words).toContain(w);
  });
  it('are all recorded', () => {
    for (const s of SENTENCES) { expect(said.has(s.text), s.text).toBe(true); if (s.gap) expect(said.has(gapText(s))).toBe(true); }
  });
});

describe('the questions', () => {
  const rng = seeded(7), known = WORDS.slice(0, 30);
  it('Find It: the word among different ones, more alike as the Level rises', () => {
    for (const w of known) {
      const p1 = makeHear(1, rng, w, known), p3 = makeHear(3, rng, w, known);
      expect(p1.choices).toContain(w); expect(p1.choices).toHaveLength(2); expect(new Set(p3.choices).size).toBe(4);
      expect(p1.choices.filter(c => c !== w).every(c => c[0]!.toLowerCase() !== w[0]!.toLowerCase())).toBe(true);
    }
  });
  it('Word Hunt: two to four copies to find, one with a capital at Level 3', () => {
    const p = makeHunt(3, rng, 'said', known);
    expect(p.cards).toHaveLength(12);
    expect(huntTargets(p).length).toBeGreaterThanOrEqual(3);
    expect(p.cards.some(c => c.shown === 'Said')).toBe(true);
  });
  it('Build It: the word\'s letters (and spares) as tiles, never already in order', () => {
    expect(makeSpell(1, rng, 'I')).toBeNull();
    for (const w of known.filter(x => x.length > 1)) {
      const p = makeSpell(3, rng, w)!;
      expect([...p.tiles].sort().join('').includes('')).toBe(true);
      for (const c of w.toLowerCase()) expect(p.tiles).toContain(c);
      expect(p.tiles).toHaveLength(w.length + 2);
      expect(p.tiles.join('').startsWith(w.toLowerCase())).toBe(false);
    }
  });
  it('Read It: the word is one of the three read aloud', () => {
    const p = makeRead(2, rng, 'look', known);
    expect(p.choices).toContain('look'); expect(p.choices).toHaveLength(3);
  });
  it('Sentence Hunt: only sentences he can read', () => {
    const p = makeSentence(1, rng, 'see', ['I', 'a', 'see'])!;
    expect(sentenceOf(p.sentence).words.every(w => ['I', 'a', 'see'].includes(w))).toBe(true);
    expect(makeSentence(1, rng, 'said', ['I'])).toBeNull();
  });
  it('Fill the Gap: the wrong choices do a job that never fits the gap, so only one fits', () => {
    for (const w of WORDS.filter(x => canFill(x, WORDS))) for (let k = 0; k < 20; k++) {
      const p = makeFill((1 + (k % 3)) as 1 | 2 | 3, rng, w, WORDS)!;
      expect(p.choices).toContain(w);
      for (const c of p.choices.filter(c => c !== w)) expect(NEVER_FITS[roleOf(w)], `${p.sentence} ${c}`).toContain(roleOf(c));
    }
  });
  it('Fill the Gap: never offers a word that also makes sense (the ones a review found)', () => {
    const also: [string, Word[]][] = [['Look at my cat.', ['her', 'his', 'our', 'your']], ['I like her hat.', ['my', 'our', 'your', 'his']], ['Here is my hat.', ['this', 'it']],
      ['It is a bus.', ['here', 'there']], ['She had a hat.', ['saw']], ['We play, then we eat.', ['and', 'but']], ['Come here now!', ['please']],
      ['Help me, please!', ['now']], ['Dad said stop.', ['can', 'will', 'did']], ['Go up!', ['play', 'run']], ['I go to the bus.', ['into', 'by', 'on', 'up']], ['I ran from the dog.', ['to', 'by', 'with', 'after']]];
    for (const [text, fits] of also) {
      const s = SENTENCES.find(x => x.text === text)!;
      for (let k = 0; k < 60; k++) for (const c of makeFill((1 + (k % 3)) as 1 | 2 | 3, rng, s.gap!, WORDS)!.choices.filter(c => c !== s.gap)) expect(fits, `${text}: ${c}`).not.toContain(c);
    }
  });
  it('never offers two words that sound the same', () => {
    for (let k = 0; k < 300; k++) {
      expect(makeHear(3, rng, 'to', WORDS).choices).not.toContain('two');
      expect(makeRead(2, rng, 'two', WORDS).choices).not.toContain('to');
      expect(makeHunt(3, rng, 'to', WORDS).cards.map(c => c.word)).not.toContain('two');
    }
  });
  it('meeting a word reads a sentence with it', () => {
    expect(makeMeet('said', WORDS.slice(0, 24)).sentence).toContain('said');
  });
  it('wrong words are never the right one', () => {
    for (const w of WORDS) expect(wrongWords(w, 3, 3, rng, known)).not.toContain(w);
  });
  it('says every word in every way a question asks it', () => {
    for (const w of WORDS) for (const line of [w, `Find the word ${w}.`, `Find every word that says ${w}.`, `Make the word ${w}.`, `This word is ${w}.`, `This one says ${w}.`, `That one says ${w}.`]) expect(said.has(line), line).toBe(true);
    for (const c of 'abcdefghijklmnopqrstuvwxyz') expect(said.has(`Letter ${c.toUpperCase()}`)).toBe(true);
  });
});
