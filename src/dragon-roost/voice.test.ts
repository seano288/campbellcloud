// Every line the game can build at run time has a recorded clip on disk, and nothing on disk is left over. Phrases are built from the
// word tables (a word of a sentence, a question about it, a name, a price), which the type checker can't see, so they are listed here the
// way the game builds them: every question of every kind and Level, every lesson's lines, every Meeting, the Roost and the Flight.
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { earnedLine } from '../currency/kind';
import { seeded } from '../game/rng';
import { CUR } from './branding';
import { PLACES } from './flight/course';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES } from './learning';
import { meeting } from './questions/meetings';
import { makeQuestion, type Level } from './questions/problems';
import { CHEERS, MOST_EARNED, needLine, openedLine, pairLine, pastLine, PHRASES, priceLine, starLine, wordPhrase } from './phrases';
import { ITEMS, REPEATS } from './roost/catalog';
import { MARK_NAMES, NAME_ADJECTIVES, NAME_NOUNS, STAGE_NAMES } from './roost/dragons';
import { RANKS, TROPHIES } from './roost/roost';
import { CLIPS } from './voice.gen';
import { PASTS, PLURALS, SQUEEZE_SENTENCES, SQUEEZES, squeezed, whole } from './words/frames';
import { SENTENCES } from './words/sentences';
import { TERMS } from './words/terms';

const DIR = resolve(import.meta.dirname, '../../public/dragon-roost-voice');
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
    const built: string[] = [];
    // every question of every kind and Level says its ask; every lesson says the right word, the tapped one, the whole frame
    for (const kind of MODE_IDS) for (const level of [1, 2, 3] as Level[]) {
      const rng = seeded(kind.length * 31 + level);
      for (let i = 0; i < 300; i++) {
        const q = makeQuestion(kind, level, rng);
        built.push(...q.ask, ...(q.choices ?? []).filter(() => q.stage.type === 'words').map(wordPhrase));
        if (q.stage.type === 'tap') built.push(...q.stage.s.words.map(w => wordPhrase(w.text)));
        if (q.stage.type === 'gap') built.push(whole(q.stage.f));
        if (q.stage.type === 'sort') built.push(wordPhrase(q.stage.word));
      }
    }
    built.push(...SENTENCES.flatMap(s => s.words.map(w => wordPhrase(w.text))), ...PLURALS.flatMap(p => [wordPhrase(p.one), pairLine(p.one, p.many)]),
      ...PASTS.map(([a, b]) => pastLine(a, b)), ...SQUEEZES.flatMap(s => [s.from, wordPhrase(s.word)]), ...SQUEEZE_SENTENCES.map(squeezed),
      ...(['noun', 'verb', 'adj'] as const).flatMap(k => Object.values(TERMS[k])));
    // the Meetings
    for (const m of MODE_IDS) built.push(...meeting(m).flatMap(b => b.say));
    // the end of a Round, Home and the kinds
    built.push(...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(CUR, i + 1)), ...MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(m), openedLine(m)]), ...Object.values(LOCKED_HINTS), ...CHEERS);
    // the Roost: every thing's name, every price and need, the dragons' names and stages; the Flight: places, ranks, trophies, marks
    built.push(...ITEMS.map(i => i.name), ...REPEATS.map(r => r.name), ...NAME_ADJECTIVES, ...NAME_NOUNS, ...STAGE_NAMES, ...MARK_NAMES, ...RANKS.map(r => r.name), ...TROPHIES.map(t => t.name), ...PLACES.map(p => p.name));
    for (let n = 1; n <= 400; n++) built.push(...priceLine(n), ...needLine(n));
    for (let n = 0; n <= 100; n++) built.push(`${n}`);
    expect([...new Set(built.filter(p => !has.has(p)))]).toEqual([]);
  });
  it('says "an" before a vowel sound', () => {
    expect(PHRASES.filter(p => /\ba [aeio]/i.test(p) && !/\ba (one|uni)/i.test(p))).toEqual([]);
    expect(PHRASES.filter(p => /\ban [^aeiou]/i.test(p))).toEqual([]);
  });
  it('keeps the clips to a size the site can carry', () => {
    const bytes = readdirSync(DIR).filter(f => f.endsWith('.mp3')).reduce((s, f) => s + statSync(resolve(DIR, f)).size, 0);
    console.log(`${PHRASES.length} clips, ${(bytes / 1024 / 1024).toFixed(1)} MiB`);
    expect(bytes).toBeLessThan(30 * 1024 * 1024);
  });
});
