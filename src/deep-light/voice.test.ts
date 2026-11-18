// Every line the game can build at run time has a recorded clip on disk, and nothing on disk is left over. Phrases built with a cast
// (a thing's name, an animal's name and fact, a number) slip past the type checker, so they are listed here the way the game builds them.
import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { earnedLine } from '../currency/kind';
import { DEEP_CURRENCY } from './branding';
import { ALL_KEYS, infoOf, TAB_NAMES } from './dock/parts';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES } from './learning';
import { BETTER, CHEERS, MOST_EARNED, NEEDS_LINE, NUMBERS_TO, PHRASES, SAID_NAMES, starLine } from './phrases';
import { KEY, LIGHT_THINGS, MATERIALS, MOON, SHADOW_THINGS, SHAKERS, SIGNAL_ITEMS, SOUND_Q3, SOUNDS, WALL_SAID, WHY_CHOICES } from './science/things';
import { ANIMALS } from './sea/animals';
import { ZONES } from './sea/zones';
import { CLIPS } from './voice.gen';

const DIR = resolve(import.meta.dirname, '../../public/deep-light-voice');
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
      ...ANIMALS.flatMap(a => [a.name, a.fact]), ...ZONES.map(z => z.name), ...ALL_KEYS.map(k => infoOf(k).name), ...Object.values(TAB_NAMES),
      ...LIGHT_THINGS.map(t => t.name), MOON.name, ...MATERIALS.map(m => m.name), ...SHADOW_THINGS.map(t => t.name), ...SOUNDS.map(s => s.name),
      ...SHAKERS.map(s => s.name), ...SIGNAL_ITEMS.map(s => s.said), ...KEY.map(k => k.said), ...WHY_CHOICES.map(c => c.said), ...Object.values(WALL_SAID),
      ...Object.values(SOUND_Q3).flatMap(f => [f.q, f.right, ...f.wrong]), ...Object.values(SAID_NAMES), ...Object.values(BETTER), ...Object.values(NEEDS_LINE),
      ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(DEEP_CURRENCY, i + 1)),
      ...Array.from({ length: NUMBERS_TO + 5 }, (_, i) => `${Math.min(i, NUMBERS_TO)}`),
      ...MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`]),
      ...Object.values(LOCKED_HINTS), ...CHEERS,
    ];
    expect([...new Set(built.filter(p => !has.has(p)))]).toEqual([]);
  });
  it('says "an" before a vowel sound', () => {
    expect(PHRASES.filter(p => /\ba [aeio]/i.test(p))).toEqual([]);
    expect(PHRASES.filter(p => /\ban [^aeiou]/i.test(p) && !/\ban hour\b/.test(p))).toEqual([]);
  });
});
