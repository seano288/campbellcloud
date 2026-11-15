// Babies: young animals and their parents (NGSS 1-LS3-1). Plain data, no game code.
//
// Each baby's name belongs to one parent in this table, so "This is a calf" never has two right answers (a calf is only the cow's
// here, and a cub only the lion's). Babies that look like their parents come first (Level 1); babies that look different (Level 2)
// grow through a middle step the lesson shows. Level 3 asks how a baby and its parent are the same and how they are different,
// with sentences true or plainly false for every pair it uses.
import type { AnimalId } from './animals';

export interface Baby {
  readonly baby: string;
  readonly parent: AnimalId;
  readonly alike: boolean;
  /** Drawn babies and middle steps (art/drawn.tsx); otherwise the parent's own picture, small. */
  readonly art?: string;
  readonly middle?: string;
  readonly q: string;
  readonly lesson: string;
  /** Wrong parents offered beside the right one: plainly not what it grows into. */
  readonly wrong: readonly AnimalId[];
}

const MAMMALS = ['cat', 'dog', 'sheep', 'pig', 'horse', 'cow', 'lion', 'kangaroo', 'deer'] as const satisfies readonly AnimalId[];
const others = (parent: AnimalId) => MAMMALS.filter(m => m !== parent);

export const BABIES = [
  { baby: 'kitten', parent: 'cat', alike: true, q: 'This is a kitten. What will it grow up to be?', lesson: 'A kitten grows up to be a cat.', wrong: others('cat') },
  { baby: 'puppy', parent: 'dog', alike: true, q: 'This is a puppy. What will it grow up to be?', lesson: 'A puppy grows up to be a dog.', wrong: others('dog') },
  { baby: 'lamb', parent: 'sheep', alike: true, q: 'This is a lamb. What will it grow up to be?', lesson: 'A lamb grows up to be a sheep.', wrong: others('sheep') },
  { baby: 'piglet', parent: 'pig', alike: true, q: 'This is a piglet. What will it grow up to be?', lesson: 'A piglet grows up to be a pig.', wrong: others('pig') },
  { baby: 'foal', parent: 'horse', alike: true, q: 'This is a foal. What will it grow up to be?', lesson: 'A foal grows up to be a horse.', wrong: others('horse') },
  { baby: 'calf', parent: 'cow', alike: true, q: 'This is a calf. What will it grow up to be?', lesson: 'A calf grows up to be a cow.', wrong: others('cow') },
  { baby: 'cub', parent: 'lion', alike: true, q: 'This is a lion cub. What will it grow up to be?', lesson: 'A lion cub grows up to be a lion.', wrong: others('lion') },
  { baby: 'joey', parent: 'kangaroo', alike: true, q: 'This is a joey. What will it grow up to be?', lesson: 'A joey grows up to be a kangaroo.', wrong: others('kangaroo') },
  { baby: 'fawn', parent: 'deer', alike: true, q: 'This is a fawn. What will it grow up to be?', lesson: 'A fawn grows up to be a deer.', wrong: others('deer') },
  { baby: 'tadpole', parent: 'frog', alike: false, art: 'tadpole', middle: 'froglet', q: 'This is a tadpole. What will it grow up to be?', lesson: 'A tadpole grows up to be a frog.', wrong: ['fish', 'snake', 'snail', 'worm'] },
  { baby: 'caterpillar', parent: 'butterfly', alike: false, art: 'caterpillar', middle: 'chrysalis', q: 'This is a caterpillar. What will it grow up to be?', lesson: 'A caterpillar grows up to be a butterfly.', wrong: ['worm', 'snake', 'snail', 'ant'] },
  { baby: 'chick', parent: 'chicken', alike: false, art: 'chick', middle: 'pullet', q: 'This is a chick. What will it grow up to be?', lesson: 'A chick grows up to be a chicken.', wrong: ['cat', 'rabbit', 'pig', 'frog'] },
  { baby: 'cygnet', parent: 'swan', alike: false, art: 'cygnet', middle: 'youngswan', q: 'This is a cygnet. What will it grow up to be?', lesson: 'A cygnet grows up to be a swan.', wrong: ['cat', 'rabbit', 'frog', 'pig'] },
] as const satisfies readonly Baby[];
export type BabyName = (typeof BABIES)[number]['baby'];

// ---------- Level 3: the same, and different ----------

/** Pairs Level 3 asks about: furry four-legged babies whose parents are plainly bigger. */
export const SAME_DIFFERENT = [
  { baby: 'puppy', same: 'How are the puppy and the dog the same?', different: 'How are the puppy and the dog different?', alsoTrue: ['They both have fur.'] },
  { baby: 'kitten', same: 'How are the kitten and the cat the same?', different: 'How are the kitten and the cat different?', alsoTrue: ['They both have fur.'] },
  { baby: 'lamb', same: 'How are the lamb and the sheep the same?', different: 'How are the lamb and the sheep different?', alsoTrue: ['They both have wool.'] },
  { baby: 'foal', same: 'How are the foal and the horse the same?', different: 'How are the foal and the horse different?', alsoTrue: ['They both have hooves.'] },
  { baby: 'calf', same: 'How are the calf and the cow the same?', different: 'How are the calf and the cow different?', alsoTrue: ['They both have hooves.'] },
  { baby: 'cub', same: 'How are the lion cub and the lion the same?', different: 'How are the lion cub and the lion different?', alsoTrue: ['They both have fur.'] },
  { baby: 'piglet', same: 'How are the piglet and the pig the same?', different: 'How are the piglet and the pig different?', alsoTrue: ['They both have a snout.'] },
] as const satisfies readonly { baby: BabyName; same: string; different: string; alsoTrue: readonly string[] }[];

/** True of every pair above. */
export const SAME_ALWAYS = 'They both have four legs.';
/** False of every pair above. */
export const SAME_NEVER = ['They both have wings.', 'They both have feathers.', 'They are the same size.', 'They both have scales.'] as const;
export const DIFFERENT_TRUE = ['The baby is smaller.', 'The grown-up is bigger.'] as const;
export const DIFFERENT_NEVER = ['The baby has wings.', 'The baby has feathers.', 'The baby lives in the ocean.', 'The baby has six legs.'] as const;
/** Pictures for the sentence choices. */
export const SENTENCE_ICONS: Record<string, string> = {
  'They both have four legs.': '🐾', 'They both have fur.': '🧶', 'They both have wool.': '🧶', 'They both have hooves.': '🐴',
  'They both have a snout.': '🐽', 'They both have wings.': '🪽', 'They both have feathers.': '🪶', 'They are the same size.': '🟰',
  'They both have scales.': '🐉', 'The baby is smaller.': '🤏', 'The grown-up is bigger.': '⬆️', 'The baby has wings.': '🪽',
  'The baby has feathers.': '🪶', 'The baby lives in the ocean.': '🌊', 'The baby has six legs.': '🐜',
};
