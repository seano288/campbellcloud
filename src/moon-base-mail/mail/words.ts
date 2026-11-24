// Every word a letter, a report, a written answer or a label may use. A passage he cannot read turns the game into a listening game, so
// the tests read every word of every passage against this (mail.test.ts).
//
// A word is allowed when it is (read only, from the other reading games' own lists):
//   - a Sight Squad word or picture word (src/sight-squad/words/list.ts);
//   - a Dino Dig word, which is also Word Wreckers' table (src/dino-dig/words/list.ts);
//   - a Cargo Words long word, add-on word or add-on base (src/cargo-words/words/);
//   - (default, for the parent to confirm) a Sentence Express word (its sentences' lexicon: dog, sat, came, went, found ...), and a
//     word he read in Hook and Ladder (its Endings words, its compound words and their halves, its opposites), since he has read them
//     all in those games;
//   - one of those with a regular ending he met in Hook and Ladder's Endings (-s, -es, -ed, -ing: hop, hopped, hopping; bake, baked) or
//     in Cargo Words' Add-Ons (-er, -est: big, bigger);
//   - a base word (BASE_WORDS below): moon, dome, rover, the crew's names. Each is met first, with its picture and the voice, in a
//     Meeting before the first passage that uses it (learning.ts).
// Names and "I" keep their capitals; a sentence's first word has one.
import { NOUNS as SIGHT_NOUNS, WORDS as SIGHT_WORDS } from '../../sight-squad/words/list';
import { WORDS as DINO_WORDS } from '../../dino-dig/words/list';
import { WORDS as LONG_WORDS } from '../../cargo-words/words/words';
import { ADD_ON_WORDS } from '../../cargo-words/words/addons';
import { DECODABLE, LEXICON_WORDS, NAMES as SE_NAMES, PICTURE_NOUNS } from '../../sentence-express/sentences/words';
import { ACTIONS, THINGS } from '../../hook-and-ladder/words/endings';
import { COMPOUNDS } from '../../hook-and-ladder/words/compounds';
import { OPPOSITES } from '../../hook-and-ladder/words/opposites';

/** Where an allowed word comes from (the spec counts them). */
export type Source = 'sight' | 'dino' | 'cargo' | 'sentence' | 'hook' | 'base';

const lower = (w: string) => w.toLowerCase();
export const SOURCES: Record<Exclude<Source, 'base'>, ReadonlySet<string>> = {
  sight: new Set([...SIGHT_WORDS, ...SIGHT_NOUNS].map(lower)),
  dino: new Set(DINO_WORDS.map(lower)),
  cargo: new Set([...LONG_WORDS.map(w => w.word), ...ADD_ON_WORDS.flatMap(a => [a.word, a.base])].map(lower)),
  sentence: new Set([...DECODABLE, ...PICTURE_NOUNS, ...LEXICON_WORDS, ...SE_NAMES].map(lower)),
  hook: new Set([...THINGS, ...ACTIONS, ...COMPOUNDS.flatMap(c => [c.word, c.a, c.b]), ...OPPOSITES.flatMap(o => [o.word, o.opp])].flatMap(w => w.split(' ')).map(lower)),
};

/**
 * The base words: the Moon Base's own words, few enough to meet one small group at a time, each with a picture (an emoji, or `art` for
 * one drawn in code) and the voice. Grouped in the order he meets them: a Meeting shows one group.
 */
export interface BaseWord { readonly word: string; readonly pic: string; readonly group: number }
const GROUPS: readonly (readonly [word: string, pic: string][])[] = [
  // 0: the crew (names he can sound out, all but Ava), and him: every letter is to "the Commander"
  [['Ava', '👩‍🚀'], ['Kit', '👧'], ['Jo', '🧑'], ['Dot', '🤖'], ['Pip', '🐈'], ['Commander', '🎖️']],
  // 1: the base
  [['moon', '🌕'], ['dome', 'art:dome'], ['base', 'art:base'], ['Earth', '🌍'], ['space', '🌌']],
  // 2: going outside
  [['suit', 'art:suit'], ['boots', '🥾'], ['air', '💨'], ['hatch', 'art:hatch']],
  // 3: getting about
  [['rover', 'art:rover'], ['lander', 'art:lander'], ['crew', '👩‍🚀']],
  // 4: around the base
  [['food', '🍲'], ['water', '💧'], ['dust', 'art:dust'], ['crater', 'art:crater']],
  // 5: the mail and the base's jobs
  [['mail', '✉️'], ['report', '📋'], ['put', '👇'], ['room', '🚪']],
  // 6: words for the reports
  [['planet', '🪐'], ['light', '💡'], ['gravity', '⬇️'], ['ice', '🧊'], ['around', '🔄'], ['wind', '🌬️'], ['cloud', '☁️']],
  // 7: how someone feels
  [['scared', '😨'], ['tired', '😴'], ['mad', '😠']],
  // 8: telling a story in order
  [['next', '➡️']],
] as const;
export const BASE_WORDS: readonly BaseWord[] = GROUPS.flatMap((g, group) => g.map(([word, pic]) => ({ word, pic, group })));
export const BASE_GROUP_COUNT = GROUPS.length;
const BASE = new Map(BASE_WORDS.map(b => [lower(b.word), b]));
/** Plural or ending forms of base words count as the base word (rovers, landers, craters, put). */
export const baseWordOf = (w: string): BaseWord | null => {
  const l = lower(w);
  return BASE.get(l) ?? BASE.get(l.replace(/s$/, '')) ?? BASE.get(l.replace(/ing$/, '')) ?? BASE.get(l.replace(/tting$/, 't')) ?? null;
};

/** Names start with a capital wherever they are. */
export const NAMES = ['Ava', 'Sam', 'Kit', 'Ben', 'Jo', 'Dot', 'Pip', 'Max', 'Mom', 'Dad', 'Earth', 'Commander'] as const;
export const isName = (w: string) => (NAMES as readonly string[]).includes(w);

/** The words of a sentence, without marks (a word keeps an inner apostrophe or hyphen). */
export const wordsOf = (s: string): string[] => s.split(/[^A-Za-z'-]+/).map(w => w.replace(/^['-]+|['-]+$/g, '')).filter(Boolean);

function inLists(l: string): Source | null {
  for (const [src, set] of Object.entries(SOURCES) as [Source, ReadonlySet<string>][]) if (set.has(l)) return src;
  return null;
}

/** The plain forms a word with a regular ending could have come from: hopped from hop, baked from bake, boxes from box, cries from cry. */
export function stems(l: string): string[] {
  const out: string[] = [];
  const push = (s: string) => { if (s.length >= 2) out.push(s); };
  for (const end of ['ing', 'ed', 'est', 'er']) {
    if (!l.endsWith(end)) continue;
    const s = l.slice(0, -end.length);
    push(s); push(`${s}e`);
    if (/([b-df-hj-np-tv-z])\1$/.test(s)) push(s.slice(0, -1)); // hopped, hopping
    if (end === 'ed' && s.endsWith('i')) push(`${s.slice(0, -1)}y`); // dried
  }
  if (l.endsWith('ies')) push(`${l.slice(0, -3)}y`);
  if (l.endsWith('es')) push(l.slice(0, -2));
  if (l.endsWith('s') && !l.endsWith('ss')) push(l.slice(0, -1));
  return out;
}

/** Where a word comes from, or null if he can't be expected to read it. */
export function sourceOf(w: string): Source | null {
  const l = lower(w);
  if (baseWordOf(w) && !inLists(l)) return 'base';
  const direct = inLists(l);
  if (direct) return direct;
  for (const s of stems(l)) { const src = inLists(s); if (src) return src; }
  return null;
}
export const isAllowed = (w: string) => sourceOf(w) !== null;
/** The base words a piece of text uses (so it waits for their Meeting). */
export const baseWordsIn = (text: string): BaseWord[] =>
  [...new Set(wordsOf(text).filter(w => sourceOf(w) === 'base').map(w => baseWordOf(w)!))];
