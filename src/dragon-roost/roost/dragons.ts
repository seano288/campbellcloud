// Dragons: what hatches from an egg, how a dragon grows as he flies it, and the names he can give it.
//
// After the forty named eggs, every Wild Egg is made from its number: eight kinds of part (body, head, horns, wings, tail, colour, accent
// and pattern) and a breath give far more dragons than he can ever hatch. The same number always gives the same dragon, so a reload
// shows the same egg. Rarer parts (the rainbow breath, the long horns, the big sails) turn up more the further he has got, and every
// fifth wild egg has a part no bought egg has: crystal horns, rainbow wings or a starry back.
import { seeded } from '../../game/rng';
import { BREATHS, PARTS, WILD_ONLY, type BreathId, type DragonLook } from '../art/dragon';
import { EGGS, STARTER_LOOK, type EggItem } from './catalog';

export const STARTER_EGG = 'starter';
export const isWild = (egg: string) => /^wild:\d+$/.test(egg);
export const wildNumber = (egg: string) => Number(egg.slice(5));

/** The dragon in Wild Egg `n` (from 1). */
export function wildLook(n: number): DragonLook {
  const rng = seeded(0xd1a9 ^ Math.imul(n, 2246822519));
  const pickBelow = (top: number) => Math.floor(rng() * top);
  // the further he has got, the more of each part's rarer end can come up
  const reach = Math.min(1, .55 + n / 60);
  const part = (count: number) => pickBelow(Math.max(2, Math.round(count * reach)));
  const special = n % 5 === 0 ? (['horns', 'wings', 'pattern'] as const)[(n / 5) % 3]! : null;
  const rare = rng() < Math.min(.35, .05 + n / 200);
  const breath: BreathId = rare ? 'rainbow' : BREATHS[pickBelow(4)]!;
  return {
    body: part(PARTS.body), head: part(PARTS.head),
    horns: special === 'horns' ? WILD_ONLY.horns : part(PARTS.horns - 1),
    wings: special === 'wings' ? WILD_ONLY.wings : part(PARTS.wings - 1),
    tail: part(PARTS.tail), colour: pickBelow(PARTS.colour), accent: pickBelow(PARTS.accent),
    pattern: special === 'pattern' ? WILD_ONLY.pattern : part(PARTS.pattern - 1),
    breath,
  };
}
/** How many Rounds a wild egg takes to hatch. */
export const wildRounds = (n: number) => 4 + (n % 3);

export const eggItem = (egg: string): EggItem | undefined => EGGS.find(e => e.id === egg);
export function lookOfEgg(egg: string): DragonLook {
  if (isWild(egg)) return wildLook(wildNumber(egg));
  return eggItem(egg)?.look ?? STARTER_LOOK;
}
export const roundsOf = (egg: string) => (isWild(egg) ? wildRounds(wildNumber(egg)) : eggItem(egg)?.rounds ?? 3);

// ---------- growing ----------

/** Hatchling, then young after 3 Flights, then great after 8; then a new mark every 4 Flights, without end. */
export const YOUNG_AT = 3, GREAT_AT = 8, MARK_EVERY = 4;
export const stageOf = (flights: number): 0 | 1 | 2 => (flights >= GREAT_AT ? 2 : flights >= YOUNG_AT ? 1 : 0);
export const marksOf = (flights: number) => (flights < GREAT_AT + MARK_EVERY ? 0 : Math.floor((flights - GREAT_AT) / MARK_EVERY));
export const STAGE_NAMES = ['Hatchling', 'Young', 'Great'] as const;
/** Each mark, in turn: a stripe, a horn ring, a star on its wing, and round again. */
export const MARK_NAMES = ['A new stripe!', 'A horn ring!', 'A star on its wing!'] as const;
export const markName = (k: number) => MARK_NAMES[(k - 1) % MARK_NAMES.length]!;

// ---------- names: one describing word and one noun ----------

/** The words he names a dragon with, from the game's own tables (each has its clip). He isn't tested on them. */
export const NAME_ADJECTIVES = ['tiny', 'big', 'happy', 'funny', 'silly', 'sunny', 'jolly', 'smart', 'clever', 'rapid', 'silent', 'sharp', 'soft', 'cute', 'fantastic', 'thick', 'muddy', 'hopeful'] as const;
export const NAME_NOUNS = ['storm', 'star', 'rock', 'flame', 'cake', 'snow', 'rocket', 'comet', 'pumpkin', 'muffin', 'pretzel', 'kite', 'robin', 'tiger', 'pancake', 'bubble', 'globe', 'drum'] as const;
export type NameWord = (typeof NAME_ADJECTIVES)[number] | (typeof NAME_NOUNS)[number];
/** Six of each to choose from, different for each dragon. */
export function nameChoices(id: number): { adj: string[]; noun: string[] } {
  const rng = seeded(id * 7919 + 13);
  const six = (xs: readonly string[]) => [...xs].sort(() => rng() - .5).slice(0, 6);
  return { adj: six(NAME_ADJECTIVES), noun: six(NAME_NOUNS) };
}
export const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
export const shownName = (name: readonly [string, string] | null) => (name ? `${cap(name[0])} ${cap(name[1])}` : '?');
