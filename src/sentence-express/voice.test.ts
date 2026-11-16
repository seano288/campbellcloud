// Every line the game can build at run time has a recorded clip on disk, and nothing on disk is left over. Phrases built with a
// cast (a word of a sentence, a question about it, a station's line, a thing's name, a number) slip past the type checker, so they
// are listed here the way the game builds them.
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { earnedLine } from '../currency/kind';
import { EXPRESS_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES } from './learning';
import { CHEERS, goLine, MOST_EARNED, NUMBERS_TO, openLine, PHRASES, starLine, wordPhrase } from './phrases';
import { EXTRA_WORDS, piecesOf } from './reading/problems';
import { capitalLine, markLine } from './reading/teach';
import { SENTENCES } from './sentences/index';
import { LINE, TAB_NAMES } from './shed/catalogue';
import { ITEMS } from './shed/trainset';
import { CLIPS } from './voice.gen';

const DIR = resolve(import.meta.dirname, '../../public/sentence-express-voice');
const has = new Set<string>(PHRASES);

describe('the recorded voice', () => {
  it('every phrase has a clip in the index and on disk, and every clip on disk is used', () => {
    const clips = CLIPS as Record<string, string>;
    const missing = PHRASES.filter(p => !clips[p] || !statSync(resolve(DIR, clips[p]!), { throwIfNoEntry: false })?.isFile());
    expect(missing).toEqual([]);
    const used = new Set(PHRASES.map(p => clips[p]));
    expect(readdirSync(DIR).filter(f => f.endsWith('.mp3') && !used.has(f))).toEqual([]);
    expect(Object.keys(clips).filter(p => !has.has(p))).toEqual([]);
  });
  it('every line built at run time is a phrase', () => {
    const built: string[] = [
      // every word of every sentence, as a car in the yard (engine with its capital) or a word in a sentence, and the slipped-in words
      ...SENTENCES.flatMap(s => [...s.words.map(wordPhrase), ...piecesOf(s).filter(p => !/^[.?!]$/.test(p)).map(wordPhrase)]),
      ...EXTRA_WORDS.map(wordPhrase),
      ...SENTENCES.flatMap(s => [s.text, ...s.ask.map(([q]) => q), markLine(s.mark), ...s.words.map((_, i) => capitalLine(s, i))]),
      ...LINE.flatMap(s => [goLine(s), openLine(s)]),
      ...ITEMS.map(i => i.name),
      ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(EXPRESS_CURRENCY, i + 1)),
      ...Array.from({ length: NUMBERS_TO + 5 }, (_, i) => `${Math.min(i, NUMBERS_TO)}`), // Shed's n(): prices, Bolts short and Deliveries
      ...MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`]),
      ...Object.values(LOCKED_HINTS), ...Object.values(TAB_NAMES), ...CHEERS,
    ];
    expect([...new Set(built.filter(p => !has.has(p)))]).toEqual([]);
  });
  it('says "an" before a vowel sound ("You are an Engine and Caboose star!")', () => {
    expect(PHRASES.filter(p => /\ba [aeio]/i.test(p))).toEqual([]);
    expect(PHRASES.filter(p => /\ban [^aeiou]/i.test(p))).toEqual([]);
  });
});
