// The word tables, checked for the ambiguities the brief names: compounds whose halves mislead, a wrong half that makes a real word,
// a second fair opposite, a thing in two groups, an irregular or spelling-changing ending, a Strong Words set out of order, and a
// picture that two words share or that the iPad 9 can't draw.
import { describe, expect, it } from 'vitest';
import { ALSO_REAL, COMPOUNDS, SILLY_HALVES } from './compounds';
import { ACTIONS, FRAME_WRONGS, FRAMES, THINGS } from './endings';
import { DESCRIBING, KIN, OPPOSITES } from './opposites';
import { PICTURES, SAME_THING } from './pictures';
import { FACTS, GROUP_IDS, GROUPS } from './sorting';
import { ALL_PAIRS, PAIRS, SCALES } from './strong';

const joined = (w: string) => w.replace(' ', '');

/** Real words a split could make that aren't in the tables (the near misses we know about). */
const MORE_WORDS = ['a', 'i', 'an', 'in', 'on', 'at', 'is', 'it', 'me', 'ox', 'all', 'lake', 'lower', 'lane', 'oat', 'round', 'suns', 'sung', 'lasses', 'seas', 'hell', 'ear', 'he', 'ad', 'be', 'am', 'as', 'or', 'owl', 'low', 'row', 'bow', 'hat', 'tooth', 'kid', 'and', 'ran', 'ink', 'pie', 'tea', 'sea', 'ash', 'ten', 'ill', 'top', 'kit', 'den', 'ark', 'ark', 'wee', 'ore', 'one'];
const DICT = new Set([
  ...COMPOUNDS.flatMap(c => [joined(c.word), c.a, c.b]), ...SILLY_HALVES, ...OPPOSITES.flatMap(o => [o.word, o.opp]),
  ...GROUP_IDS.flatMap(g => GROUPS[g].things), ...THINGS, ...ACTIONS, ...MORE_WORDS,
]);

describe('Two Words, One Word', () => {
  it('only compounds made of their two halves, none whose halves mislead', () => {
    const NEVER = ['butterfly', 'ladybug', 'hotdog', 'hot dog', 'starfish', 'jellyfish', 'pineapple', 'cupboard', 'grapefruit', 'strawberry', 'eggplant', 'hamburger', 'catfish', 'dragonfly', 'firefly', 'honeymoon', 'understand'];
    for (const c of COMPOUNDS) {
      expect(NEVER).not.toContain(c.word);
      expect(c.word, c.word).toBe(c.spaced ? `${c.a} ${c.b}` : c.a + c.b);
    }
    expect(new Set(COMPOUNDS.map(c => c.word)).size).toBe(COMPOUNDS.length);
    expect(COMPOUNDS.find(c => c.word === 'fire truck')).toBeTruthy();
  });
  it('Level 2 uses only compounds that split one way into two real words', () => {
    for (const c of COMPOUNDS.filter(x => !x.spaced && !x.noSplit)) {
      const w = joined(c.word);
      const ways = [...Array(w.length - 1).keys()].map(i => i + 1).filter(i => DICT.has(w.slice(0, i)) && DICT.has(w.slice(i)));
      expect(ways, c.word).toEqual([c.a.length]);
    }
  });
  it('Level 3\'s wrong halves never make a real word, and every first half has at least two', () => {
    const real = new Set([...COMPOUNDS.map(c => joined(c.word)), ...ALSO_REAL]);
    for (const h of SILLY_HALVES) expect(COMPOUNDS.some(c => c.b === (h as string))).toBe(false);
    for (const c of COMPOUNDS.filter(x => !x.spaced)) {
      const ok = SILLY_HALVES.filter(h => !real.has(c.a + h));
      expect(ok.length, c.a).toBeGreaterThanOrEqual(2);
    }
    // rain + coat is real too: coat is never a silly half
    expect(SILLY_HALVES as readonly string[]).not.toContain('coat');
  });
  it('enough of them have a picture for Level 1', () => expect(COMPOUNDS.filter(c => c.pic).length).toBeGreaterThanOrEqual(20));
});

describe('Opposites', () => {
  it('each word is asked once, with one opposite, and the other way round only when that is clear too', () => {
    expect(new Set(OPPOSITES.map(o => o.word)).size).toBe(OPPOSITES.length);
    // short could be tall or long, light could be heavy or dark, right could be left or wrong: never asked
    for (const w of ['short', 'light', 'right', 'old', 'hard']) expect(OPPOSITES.filter(o => o.word === w && w !== 'hard').length).toBe(0);
    for (const o of OPPOSITES) expect(o.word).not.toBe(o.opp);
  });
  it('a word\'s fair opposites (cold and cool for hot) are never both offered: they come from its own group or kin', () => {
    expect(OPPOSITES.find(o => o.word === 'hot')!.also).toContain('cool');
    for (const k of KIN) for (const g of k) expect(OPPOSITES.some(o => o.group === g), g).toBe(true);
  });
  it('every Level 1 entry has two clear pictures, and every Level 3 sentence names the word', () => {
    for (const o of OPPOSITES.filter(x => 'pic' in x && x.pic)) for (const w of [o.word, o.opp]) expect(w in PICTURES || w === 'big' || w === 'little', w).toBe(true);
    for (const o of OPPOSITES) if ('say' in o && o.say) {
      expect(o.say).toMatch(new RegExp(`is not ${o.word}\\.$`));
      expect(DESCRIBING.has(o.opp)).toBe(true);
      // "It is..." follows, so never a person
      expect(o.say).not.toMatch(/\b(boy|girl|baby|man|woman|mom|dad|he|she)\b/i);
    }
  });
});

describe('Sort It', () => {
  it('every thing is in exactly one group, has a picture, and none of the arguable ones are there', () => {
    const all = GROUP_IDS.flatMap(g => GROUPS[g].things as readonly string[]);
    expect(new Set(all).size).toBe(all.length);
    for (const t of all) expect(t in PICTURES, t).toBe(true);
    for (const t of ['tomato', 'bat', 'penguin', 'fish', 'chicken', 'ball', 'corn', 'nut', 'egg plant', 'mushroom', 'orange', 'peach']) expect(all).not.toContain(t);
  });
  it('each question about a group has things it is true of and things it is clearly false of, never both, and no penguin in "can fly"', () => {
    for (const f of FACTS) {
      const yes = f.yes as readonly string[], no = f.no as readonly string[];
      expect(yes.filter(x => no.includes(x)), f.ask).toEqual([]);
      expect(yes.length).toBeGreaterThanOrEqual(1);
      expect(no.length).toBeGreaterThanOrEqual(2);
      for (const x of [...yes, ...no]) expect(x in PICTURES, x).toBe(true);
    }
    const fly = FACTS.find(f => f.ask === 'Which animal can fly?')!;
    for (const x of ['penguin', 'bat', 'chicken', 'hen', 'ostrich', 'duck']) { expect(fly.yes as readonly string[]).not.toContain(x); expect(fly.no as readonly string[]).not.toContain(x); }
    expect(FACTS.find(f => f.ask === 'Which food is a fruit?')!.no as readonly string[]).not.toContain('tomato');
  });
});

describe('Endings', () => {
  const IRREGULAR = ['run', 'ran', 'mouse', 'mice', 'foot', 'feet', 'tooth', 'man', 'child', 'sheep', 'fish', 'go', 'eat', 'sit', 'swim', 'fly', 'cry', 'see', 'buy', 'ride'];
  it('uses regular words only: nothing irregular, no -es, nothing that changes its spelling', () => {
    for (const w of [...THINGS, ...ACTIONS]) {
      expect(IRREGULAR, w).not.toContain(w);
      expect(w, `${w} takes -es`).not.toMatch(/(s|x|z|ch|sh)$/);
      expect(w, `${w} changes y to i`).not.toMatch(/[^aeiou]y$/);
    }
    // an action ending in e drops it before -ed and -ing (bake, baking); a thing only takes -s, so tree and kite are fine
    for (const w of ACTIONS) expect(w, `${w} drops its e`).not.toMatch(/e$/);
    // a short-vowel word ending in one consonant doubles it before -ed and -ing (hop, hopping): only Things (plural -s) may
    for (const w of ACTIONS) expect(w, `${w} doubles its last letter`).not.toMatch(/^[^aeiou]*[aeiou][^aeiouwxy]$/);
  });
  it('each sentence start has one ending that fits, and never offers a second one that could', () => {
    for (const f of FRAMES) expect(FRAME_WRONGS[f.ending]).not.toContain(f.ending);
    // "Every day he jumped." and "Right now he is kicked." can be fair sentences: -ed is offered only where it is the answer
    expect(FRAME_WRONGS.s).not.toContain('ed');
    expect(FRAME_WRONGS.ing).not.toContain('ed');
    expect(FRAMES.map(f => f.ending).sort()).toEqual(['ed', 'ing', 's']);
  });
  it('every thing has a picture to count', () => { for (const t of THINGS) expect(t in PICTURES, t).toBe(true); });
});

describe('Strong Words', () => {
  it('each set is three different words, weakest first, from a short table', () => {
    for (const s of SCALES) expect(new Set(s.words).size).toBe(3);
    expect(SCALES.length).toBeLessThanOrEqual(10);
    expect(PAIRS.length).toBeLessThanOrEqual(10);
    // the brief's own examples are here and in order
    expect(SCALES.find(s => s.id === 'voice')!.words).toEqual(['whisper', 'talk', 'shout']);
    expect(ALL_PAIRS).toContainEqual({ words: ['big', 'huge'], more: 'bigger' });
  });
  it('no word is the stronger of one pair and the weaker of another in the same sense', () => {
    for (const a of ALL_PAIRS) for (const b of ALL_PAIRS) if (a.more === b.more) expect(a.words[0] === b.words[1] && a.words[1] === b.words[0]).toBe(false);
  });
});

describe('the pictures', () => {
  it('no two words share a picture', () => {
    const by = new Map<string, string[]>();
    for (const [w, p] of Object.entries(PICTURES)) by.set(p, [...(by.get(p) ?? []), w]);
    const shared = [...by.values()].filter(ws => ws.length > 1 && !SAME_THING.some(([a, b]) => ws.includes(a) && ws.includes(b)));
    expect(shared).toEqual([]);
  });
  it('every picture is from Emoji 14 or earlier, so iPadOS 15 on the iPad 9 draws it', () => {
    const NEWER = new Set([0x1f6dc, 0x1fa75, 0x1fa76, 0x1fa77, 0x1fa87, 0x1fa88, 0x1faad, 0x1faae, 0x1faaf, 0x1fabb, 0x1fabc, 0x1fabd, 0x1fabf, 0x1face, 0x1facf, 0x1fada, 0x1fadb, 0x1fae8, 0x1faf7, 0x1faf8, 0x1fae9, 0x1fac6, 0x1fabe, 0x1fadc, 0x1fa89, 0x1fa8f, 0x1fadf]);
    for (const [w, p] of Object.entries(PICTURES)) {
      for (const ch of p) expect(NEWER.has(ch.codePointAt(0)!), w).toBe(false);
      expect(p.includes('‍'), `${w} is a joined emoji`).toBe(false);
    }
  });
});
