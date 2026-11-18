// Dino Dig's pictures: which words on the shared list (list.ts) have a picture clear enough to read a word and tap it (Read It), and
// to build a scene from (Read and Find). Plain data, no game code. Word Wreckers keeps using PICTURES in list.ts unchanged; this table
// starts from it, takes out the few a child could name another way when he is reading, and adds four the spelling game doesn't use.
//
// Only words whose emoji is unmistakable to a six-year-old: 🐖 pig yes, a lid no. Words with no picture here only appear in Hear It,
// Sound Swap and Real or Silly. The parent should look at the table on the iPad (Apple's emoji), since other systems draw them
// differently.
import { PICTURES, type Word } from './list';

/** On the shared table but not clear enough for Read It: 🌫️ (just grey lines), 🥫 (soup), 🛖 (a hut few children know), ⛈️ (rain). */
export const NOT_CLEAR: readonly Word[] = ['fog', 'can', 'hut', 'storm'];

/** Words on the list with no picture on the shared table, which have one plain enough for reading: the numbers and a wing. */
const MORE: Partial<Record<Word, string>> = { five: '5️⃣', nine: '9️⃣', three: '3️⃣', wing: '🪽' };

export const READ_PICTURES: Readonly<Partial<Record<Word, string>>> = {
  ...Object.fromEntries(Object.entries(PICTURES).filter(([w]) => !(NOT_CLEAR as readonly string[]).includes(w))),
  ...MORE,
};
export const pictureOf = (w: Word): string | undefined => READ_PICTURES[w];
export const hasPicture = (w: Word) => w in READ_PICTURES;

/** Pictures that look alike or that one name fits: never two from one group among a question's choices (🐤 🐦 🦆 could all be "bird"). */
export const LOOK_ALIKE: readonly (readonly Word[])[] = [
  ['chick', 'bird', 'duck'], ['boat', 'ship'], ['sheep', 'goat'], ['leaf', 'plant', 'tree'], ['fish', 'shark', 'shrimp'], ['rock', 'brick'],
  ['hand', 'clap'], ['car', 'truck', 'bus'], ['skate', 'sled'], ['shirt', 'dress'], ['ten', 'three', 'five', 'nine'], ['snow', 'star'],
];
/** Fine to offer side by side. */
export const pictureClash = (a: Word, b: Word) => a === b || LOOK_ALIKE.some(g => g.includes(a) && g.includes(b));

// ---------- Read and Find's scenes ----------

/** Things and animals a short sentence can be about ("A fox in a box."): pictured nouns that take "a". */
export const SUBJECTS = [
  'cat', 'bat', 'hat', 'pig', 'dog', 'fox', 'fish', 'chick', 'duck', 'sock', 'frog', 'crab', 'skunk', 'snake', 'snail', 'bird', 'shell',
  'cake', 'bone', 'peach', 'grape', 'seal', 'goat', 'sheep', 'shrimp', 'nut', 'drum', 'flag', 'kite', 'brush', 'pen', 'shirt', 'star',
] as const satisfies readonly Word[];
/** What a subject can sit on ("A cat on a bed."). */
export const SURFACES: readonly Word[] = ['bed', 'box', 'log', 'rock', 'truck', 'sled', 'bus', 'boat', 'ship', 'slide', 'bike', 'car', 'brick'];
/** What a subject can be in ("A fox in a box."). */
export const CONTAINERS: readonly Word[] = ['box', 'nest', 'jar', 'truck', 'boat', 'tent', 'car', 'bus', 'ship', 'bed'];
/** Where "in a" and "on a" plainly mean two different pictures, so Read and Find's Level 3 may offer one against the other. Not a bed,
 *  a boat, a bus or a ship: a cat in bed is on it too, and a fox on a boat is in it (he rides on a bus). */
export const IN_OR_ON: readonly Word[] = ['box', 'car', 'truck'];
