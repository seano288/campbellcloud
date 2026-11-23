// Every line the game can build at run time has a recorded clip on disk, and nothing on disk is left over. Lines built from pieces
// (a number, a name from the City) slip past the type checker, so they are listed here the way the game builds them.
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { seeded } from '../game/rng';
import { BUILDINGS, DISTRICTS, JOB_KINDS, JOB_NAMES, JOB_THINGS, NAMED_JOBS, PAINTS, PARTS, STREET_THINGS, TROPHIES, VEHICLES } from './city/catalog';
import { RANKS } from './city/city';
import { genDesign } from './city/gen';
import { MODE_IDS, MODE_NAMES } from './learning';
import { makeQuestion, type Kind, type Level } from './math/problems';
import { HUNDREDS, PHRASES, PRICE_TENS, starLine } from './phrases';
import { CLIPS } from './voice.gen';
import { promptOf } from './views';

const DIR = resolve(import.meta.dirname, '../../public/skyline-voice');
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
  it('every name in the City, and every number it says, is a clip', () => {
    const built: string[] = [
      ...BUILDINGS, ...VEHICLES, ...PAINTS, ...STREET_THINGS, ...PARTS, ...NAMED_JOBS, ...TROPHIES, ...DISTRICTS,
    ].map(x => x.name);
    built.push(...JOB_KINDS.flatMap(k => [JOB_NAMES[k], JOB_THINGS[k]]), ...RANKS, ...MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`]));
    for (let seed = 1; seed < 500; seed++) built.push(...genDesign(seed).said);
    built.push(...Array.from({ length: 201 }, (_, i) => `${i}`), ...HUNDREDS, ...PRICE_TENS);
    expect([...new Set(built.filter(p => !has.has(p)))]).toEqual([]);
  });
  it('every question is said with clips it has', () => {
    const rng = seeded(11), kinds: Kind[] = ['groups', 'array', 'pair', 'count', 'share', 'times'];
    for (const k of kinds) for (const l of [1, 2, 3] as Level[]) for (let i = 0; i < 300; i++) {
      const p = promptOf(makeQuestion(k, l, 2, rng));
      for (const piece of p.speech) expect(has.has(piece as string), `${k} L${l}: "${String(piece)}"`).toBe(true);
    }
  });
  it('says "an" before a vowel sound ("You are an Equal Groups star!")', () => {
    expect(PHRASES.filter(p => /\ba [aeiou]/i.test(p))).toEqual([]);
  });
});

describe('the × sign is always said "rows of" or "groups of", and "times" only from Times Level 2', () => {
  it('Times Level 1 never says "times"; Level 2 and 3 say it beside "groups of"', () => {
    const rng = seeded(4);
    for (let i = 0; i < 400; i++) {
      const one = promptOf(makeQuestion('times', 1, (i % 3) as 0 | 1 | 2, rng)).speech as string[];
      expect(one).not.toContain('times');
      const q2 = makeQuestion('times', 2, 2, rng), two = promptOf(q2).speech as string[];
      expect(two).toContain('times');
      expect(two.includes('groups of') || two.includes('rows of')).toBe(true);
      const q3 = makeQuestion('times', 3, 2, rng), three = promptOf(q3).speech as string[];
      expect(three).toContain('times');
    }
  });
  it('a question that shows the sign also says what it means', () => {
    const rng = seeded(8);
    for (let i = 0; i < 300; i++) {
      const q = makeQuestion('times', 1, 0, rng);
      const said = promptOf(q).speech as string[];
      if (q.kind === 'times' && q.form === 'match') expect(said).toContain('rows of');
    }
  });
  it('no other kind says "times"', () => {
    const rng = seeded(2);
    for (const k of ['groups', 'array', 'pair', 'count', 'share'] as Kind[]) for (let i = 0; i < 300; i++) expect(promptOf(makeQuestion(k, ((i % 3) + 1) as Level, 2, rng)).speech).not.toContain('times');
  });
});
