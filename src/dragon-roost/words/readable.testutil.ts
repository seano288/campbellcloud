// For tests only: whether he can read a word. It is on Sight Squad's, Dino Dig's (and so Word Wreckers'), or Cargo Words' lists, or it
// is one of this game's own words (allowed.ts), or one of those with a plain -s, -es, -ed or -ing (Hook and Ladder's Endings).
import { WORDS as SIGHT, NOUNS } from '../../sight-squad/words/list';
import { WORDS as DINO } from '../../dino-dig/words/list';
import { WORDS as CARGO } from '../../cargo-words/words/words';
import { ADD_ON_WORDS } from '../../cargo-words/words/addons';
import { GAME_WORDS } from './allowed';
import { baseOf } from './sentences';

const LISTS = new Set<string>([
  ...SIGHT, ...NOUNS, ...DINO, ...CARGO.map(w => w.word), ...ADD_ON_WORDS.flatMap(w => [w.word, w.base, ...w.near]),
].map(w => w.toLowerCase()));
const OWN = new Set(GAME_WORDS.map(w => w.toLowerCase()));
export const canRead = (w: string) => {
  const x = w.toLowerCase();
  return OWN.has(x) || baseOf(x).some(b => LISTS.has(b) || OWN.has(b));
};
