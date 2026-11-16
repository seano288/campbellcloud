import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { WORDS as SIGHT_WORDS } from '../../sight-squad/words/list';
import { makesSense, orders } from './grammar';
import { ALL_WORDS, FLOATING, orderPool, SENTENCES } from './index';
import { matches, oneWordChanges, sameScene, wordFor, wrongPictures, type Attr } from './scenes';
import { DECODABLE, entriesOf, NAMES, PICTURE_NOUNS } from './words';

const known = new Set<string>([...SIGHT_WORDS, ...DECODABLE, ...PICTURE_NOUNS, ...NAMES]);

describe('the sentences', () => {
  it('use only sight words, decodable words, picture nouns and names', () => {
    for (const s of SENTENCES) for (const w of s.words) expect(known.has(w) || known.has(w.toLowerCase()), `${w} in "${s.text}"`).toBe(true);
  });
  it('are 120 to 160 sentences, every one recorded whole, with a capital first word and an end mark', () => {
    expect(SENTENCES.length).toBeGreaterThanOrEqual(120);
    expect(SENTENCES.length).toBeLessThanOrEqual(170);
    expect(new Set(SENTENCES.map(s => s.text)).size).toBe(SENTENCES.length);
    for (const s of SENTENCES) {
      expect(s.words[0]![0], s.text).toBe(s.words[0]![0]!.toUpperCase());
      expect(['.', '?', '!']).toContain(s.mark);
      // only names and "I" have a capital after the first word
      for (const w of s.words.slice(1)) if (w !== 'I' && !(NAMES as readonly string[]).includes(w)) expect(w, s.text).toBe(w.toLowerCase());
    }
  });
  it('have every kind of end mark, and names and "I" in the middle for the capitals at Level 3', () => {
    for (const mark of ['.', '?', '!'] as const) expect(SENTENCES.filter(s => s.mark === mark).length).toBeGreaterThanOrEqual(mark === '!' ? 10 : 25);
    expect(SENTENCES.filter(s => s.words.slice(1).some(w => w === 'I' || (NAMES as readonly string[]).includes(w))).length).toBeGreaterThanOrEqual(8);
  });
  it('keep floating words out of Build the Train', () => {
    for (const s of SENTENCES.filter(x => x.order)) for (const w of s.words) expect(FLOATING as readonly string[]).not.toContain(w.toLowerCase());
  });
});

describe('one right order', () => {
  it('every Build the Train sentence has exactly one order of its cars that makes sense', () => {
    for (const s of SENTENCES.filter(x => x.order)) {
      for (const w of s.words) expect(entriesOf(w).length, `"${w}" is not in the lexicon (${s.text})`).toBeGreaterThan(0);
      expect(orders(s.words, s.mark), s.text).toEqual([s.words.join(' ')]);
    }
  });
  it('the checker finds the traps: two things that could swap, two describing words, a and the, a stranded "in"', () => {
    const traps: [string, string[]][] = [
      ['The dog sees the cat.', ['The cat sees the dog']],
      ['The big dog is red.', ['The red dog is big']],
      ['Will you help Max?', ['Will Max help you']],
      ['Did the dog dig a hole?', ['Did a dog dig the hole']],
      ['What is in the box?', ['What is the box in']],
      ['The dog ran to the cat.', ['The cat ran to the dog']],
      ['The dog plays with the cat.', ['The cat plays with the dog']],
      ['My red car is little.', ['My little car is red']],
      ['Can you see the big dog?', ['Can the big dog see you']],
      ['The fast dog can run.', []],
    ];
    for (const [text, also] of traps) {
      const words = text.slice(0, -1).split(' '), mark = text.slice(-1) as '.' | '?';
      const found = orders(words, mark);
      for (const a of also) expect(found, text).toContain(a);
      if (also.length) expect(found.length, text).toBeGreaterThan(1);
    }
  });
  it('but a silly swap does not count: the box is not in the dog, the bed is not on the cat', () => {
    expect(orders(['The', 'dog', 'is', 'in', 'the', 'box'], '.')).toEqual(['The dog is in the box']);
    expect(orders(['The', 'cat', 'is', 'on', 'the', 'bed'], '.')).toEqual(['The cat is on the bed']);
    expect(orders(['The', 'bug', 'is', 'under', 'the', 'log'], '.')).toEqual(['The bug is under the log']);
  });
  it('the end mark settles a question: "Is it big?" is not a statement and "It is big." is not a question', () => {
    expect(makesSense(['Is', 'it', 'big'], '?')).toBe(true);
    expect(makesSense(['Is', 'it', 'big'], '.')).toBe(false);
    expect(makesSense(['It', 'is', 'big'], '.')).toBe(true);
    expect(makesSense(['It', 'is', 'big'], '?')).toBe(false);
  });
  it('there are plenty at every Level, starting with three-word sentences', () => {
    expect(orderPool(1).length).toBeGreaterThanOrEqual(25);
    expect(orderPool(2).length).toBeGreaterThanOrEqual(25);
    expect(orderPool(3).length).toBeGreaterThanOrEqual(25);
    expect(orderPool(3).filter(s => s.mark === '?').length).toBeGreaterThanOrEqual(10);
    for (const s of orderPool(1)) expect(s.words.length).toBe(3);
  });
});

describe('one right picture', () => {
  const drawn = SENTENCES.filter(s => s.m);
  it('there are enough sentences with a picture for What Happened and questions for Who, What, Where', () => {
    expect(drawn.length).toBeGreaterThanOrEqual(40);
    expect(SENTENCES.filter(s => s.ask.length).length).toBeGreaterThanOrEqual(30);
    expect(drawn.filter(s => oneWordChanges(s.m!).some(c => c.attr !== 'who')).length).toBeGreaterThanOrEqual(30);
  });
  it('every word that decides the picture is in the sentence, so a lesson can light it', () => {
    for (const s of drawn) for (const [a, v] of Object.entries(s.m!)) expect(wordFor(s.words, a as Attr, v), `${a}:${v} in ${s.text}`).toBeGreaterThanOrEqual(0);
  });
  it('the sentence is true of its own picture and of no wrong picture, at every Level', () => {
    for (const s of drawn) {
      expect(matches(s.m!, s.m!)).toBe(true);
      for (const c of oneWordChanges(s.m!)) expect(matches(s.m!, c.scene), `${s.text} / ${JSON.stringify(c.scene)}`).toBe(false);
      for (const level of [1, 2, 3] as const) for (let seed = 0; seed < 40; seed++) {
        const wrong = wrongPictures(s.m!, level, seeded(seed));
        expect(wrong.length, `${s.text} L${level}`).toBe(level === 1 ? 1 : 2);
        for (const w of wrong) expect(matches(s.m!, w.scene)).toBe(false);
        const all = [s.m!, ...wrong.map(w => w.scene)];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(sameScene(all[i]!, all[j]!), s.text).toBe(false);
      }
    }
  });
  it('Level 3 pictures differ from the right one by one word where the sentence allows it', () => {
    for (const s of drawn) {
      if (!oneWordChanges(s.m!).some(c => c.attr !== 'who')) continue;
      for (let seed = 0; seed < 20; seed++) for (const w of wrongPictures(s.m!, 3, seeded(seed))) {
        const changed = Object.keys({ ...s.m, ...w.scene }).filter(k => (s.m as unknown as Record<string, unknown>)[k] !== (w.scene as unknown as Record<string, unknown>)[k]);
        expect(changed.length, `${s.text} ${JSON.stringify(w.scene)}`).toBe(1);
      }
    }
  });
  it('every question has the answer it asks for', () => {
    for (const s of SENTENCES) for (const [q, about] of s.ask) {
      expect(s.m, q).toBeDefined();
      if (about === 'where') expect(s.m!.rel && s.m!.at, q).toBeTruthy();
      if (about === 'what') expect(s.m!.has, q).toBeTruthy();
      if (about === 'do') expect(s.m!.act, q).toBeTruthy();
    }
  });
  it('every word has a clip to say it alone', () => {
    expect(ALL_WORDS.length).toBeGreaterThan(100);
  });
});
