// Everything the game can say has a clip: every phrase on the list is recorded, and every line the letters, the lessons, the reward and
// the made things (modules, rocks, plants, lucky statues, Landing numbers) can say is on the list.
import { describe, expect, it } from 'vitest';
import { BADGES, NEW_CREW } from './base/base';
import { moduleWords } from './base/BaseMap';
import { specialWords } from './base/BaseScreen';
import { ITEMS, REPEATS } from './base/catalog';
import { rockFor, specialFor } from './base/gen';
import { MODE_IDS, MODE_NAMES, LOCKED_HINTS } from './learning';
import { mailPhrases, PHRASES, PRICE_TENS } from './phrases';
import { closeWord, softWord } from './landing/sim';
import { CLIPS } from './voice.gen';

const listed = new Set<string>(PHRASES);
describe('the voice', () => {
  it('every phrase has a recorded clip', () => {
    const clips = CLIPS as Record<string, string>;
    expect(PHRASES.filter(p => !clips[p])).toEqual([]);
  });
  it('every sentence of every letter, question, answer, lesson line and clue is on the list', () => {
    expect(mailPhrases().filter(p => !listed.has(p))).toEqual([]);
  });
  it('every name in the reward, and every made thing, can be said', () => {
    const lines = [
      ...ITEMS.map(i => i.name), ...REPEATS.map(r => r.name), ...BADGES.map(b => b.name), ...NEW_CREW.flatMap(c => [c.name, c.line]),
      ...MODE_IDS.map(m => MODE_NAMES[m]), ...Object.values(LOCKED_HINTS), ...PRICE_TENS,
      ...Array.from({ length: 400 }, (_, k) => moduleWords(`gen:${k}`)).flat(),
      ...Array.from({ length: 400 }, (_, k) => { const r = rockFor(k + 1); return [r.colour, r.word]; }).flat(),
      ...Array.from({ length: 400 }, (_, k) => { const s = specialFor((k + 1) * 5)!; return specialWords(s); }).flat(),
      ...[0, 2, 4, 9, 20].flatMap(x => [softWord(x), closeWord(x)]),
    ];
    expect([...new Set(lines.filter(l => !listed.has(l)))]).toEqual([]);
  });
});
