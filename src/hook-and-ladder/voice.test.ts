// Every line the game can build at run time has a recorded clip on disk, and nothing on disk is left over. Phrases built with a cast
// (a word, a scene's name, a thing's name, a number) slip past the type checker, so they are listed here the way the game builds them.
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { earnedLine } from '../currency/kind';
import { LADDER_CURRENCY } from './branding';
import { SCENES } from './call/scenes';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES } from './learning';
import { CHEERS, groupLine, moreAsk, MOST_EARNED, mostAsk, notLine, NUMBERS_TO, PHRASES, sortAsk, starLine, wordPhrase } from './phrases';
import { ALL_WORDS } from './quiz/problems';
import { endingLine } from './quiz/teach';
import { CATALOGUE, TAB_NAMES, TABS } from './station/parts';
import { CLIPS } from './voice.gen';
import { FRAMES } from './words/endings';
import { OPPOSITES } from './words/opposites';
import { FACTS, GROUP_IDS, GROUPS } from './words/sorting';
import { ALL_PAIRS, SCALES } from './words/strong';

const DIR = resolve(import.meta.dirname, '../../public/hook-and-ladder-voice');
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
  it('every content word is its own clip', () => {
    expect(ALL_WORDS.map(wordPhrase).filter(w => !has.has(w))).toEqual([]);
    for (const g of GROUP_IDS) expect(has.has(GROUPS[g].plural)).toBe(true);
  });
  it('every line built at run time is a phrase', () => {
    const built: string[] = [
      ...GROUP_IDS.flatMap(g => [sortAsk(g), groupLine(g), notLine(g)]),
      ...SCALES.flatMap(s => [moreAsk(s.more), mostAsk(s.most), s.order, s.more]), ...ALL_PAIRS.flatMap(p => [moreAsk(p.more), p.more]),
      ...FACTS.flatMap(f => [f.ask, f.says]), ...OPPOSITES.flatMap(o => ('say' in o && o.say ? [o.say] : [])), ...FRAMES.map(f => f.start),
      ...['s', 'ed', 'ing'].flatMap(e => [endingLine(e, 0), endingLine(e, 1), endingLine(e, 2)]),
      ...SCENES.map(s => s.name), ...TABS.flatMap(t => [TAB_NAMES[t], ...CATALOGUE[t].flatMap(i => [i.name, ...(i.trick ? [i.trick] : [])])]),
      ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(LADDER_CURRENCY, i + 1)),
      ...Array.from({ length: NUMBERS_TO + 5 }, (_, i) => `${Math.min(i, NUMBERS_TO)}`),
      ...MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`]),
      ...Object.values(LOCKED_HINTS), ...CHEERS,
    ];
    expect([...new Set(built.filter(p => !has.has(p)))]).toEqual([]);
  });
  it('says "an" before a vowel sound ("You are an Opposites star!")', () => {
    expect(PHRASES.filter(p => /\ba [aeio]/i.test(p))).toEqual([]);
    expect(PHRASES.filter(p => /\ban [^aeiou]/i.test(p))).toEqual([]);
  });
});
