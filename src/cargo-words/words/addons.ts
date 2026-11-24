// Add-Ons: a container bolted on the front (un, re) or the back (ful, less, er, est) of a word he knows. Only add-ons Hook and Ladder's
// Endings doesn't teach (it has -s, -ed and -ing), and only words that mean what their parts say: unhappy is not happy, refill is fill
// again, helpful is full of help, endless is without an end. Never a word that only looks like one (uncle, under, until, refuse, really,
// reptile). Plain data, no game code.
//
// Un here only ever means not: unpack, unzip, unplug and unload (un- as "undo") are left out, since the lesson says "Un means not." Retell
// is left out because Aria says it "retail" however it's written. Handful and armful are left out too: they mean as much as a hand holds,
// not full of a hand, so "Ful means full of." does not fit them.
//
// - `means`: what the whole word means, said after "Which word means" (Level 2) and in the lesson ("Unlock means not locked.").
// - `pic`: an emoji for Level 1 (un and re only), where the base word's picture is offered beside it when it has one (`basePic`).
// - `near`: two real words that look like the base word but are not inside the whole word, for Level 3's "Which word is hiding in careful?"
//   (care, not core or cart; a word that is inside it, like car, is never offered).

export const ADD_ONS = ['un', 're', 'ful', 'less', 'er', 'est'] as const;
export type AddOn = (typeof ADD_ONS)[number];
export const FRONT: readonly AddOn[] = ['un', 're'];

/** What each add-on means, said in the lesson. */
export const ADD_ON_MEANS = {
  un: 'Un means not.', re: 'Re means again.', ful: 'Ful means full of.', less: 'Less means without.', er: 'Er means more.', est: 'Est means the most.',
} as const satisfies Record<AddOn, string>;

export interface AddOnWord {
  readonly word: string;
  readonly base: string;
  readonly add: AddOn;
  readonly means: string;
  readonly pic?: string;
  readonly basePic?: string;
  readonly near: readonly [string, string];
}

const a = (word: string, base: string, add: AddOn, means: string, near: [string, string], pics: { pic?: string; basePic?: string } = {}): AddOnWord => ({ word, base, add, means, near, ...pics });

export const ADD_ON_WORDS: readonly AddOnWord[] = [
  // un: not
  a('unlock', 'lock', 'un', 'not locked', ['luck', 'lick'], { pic: '🔓', basePic: '🔒' }),
  a('unhappy', 'happy', 'un', 'not happy', ['hop', 'pup'], { pic: '☹️', basePic: '😀' }),
  a('unsafe', 'safe', 'un', 'not safe', ['save', 'same']),
  a('unwell', 'well', 'un', 'not well', ['will', 'wet']),
  a('unclean', 'clean', 'un', 'not clean', ['clap', 'cream']),
  a('unlit', 'lit', 'un', 'not lit', ['lid', 'let']),
  a('unfit', 'fit', 'un', 'not fit', ['fat', 'fist']),
  a('unseen', 'seen', 'un', 'not seen', ['sun', 'seed']),
  // re: again
  a('replay', 'play', 're', 'play again', ['pray', 'plan'], { pic: '🔁', basePic: '▶️' }),
  a('reload', 'load', 're', 'load again', ['road', 'loaf'], { pic: '🔄' }),
  a('refill', 'fill', 're', 'fill again', ['fell', 'film']),
  a('repaint', 'paint', 're', 'paint again', ['pant', 'print']),
  a('restart', 'start', 're', 'start again', ['stamp', 'stark']),
  a('reheat', 'heat', 're', 'heat again', ['hat', 'meat']),
  a('replant', 'plant', 're', 'plant again', ['plank', 'slant']),
  a('recheck', 'check', 're', 'check again', ['chick', 'neck']),
  a('repack', 'pack', 're', 'pack again', ['peck', 'pick']),
  a('reseal', 'seal', 're', 'seal again', ['sell', 'meal']),
  // ful: full of
  a('helpful', 'help', 'ful', 'full of help', ['held', 'kelp']),
  a('careful', 'care', 'ful', 'full of care', ['core', 'cart']),
  a('hopeful', 'hope', 'ful', 'full of hope', ['hose', 'rope']),
  a('restful', 'rest', 'ful', 'full of rest', ['rust', 'nest']),
  a('thankful', 'thank', 'ful', 'full of thanks', ['think', 'tank']),
  a('playful', 'play', 'ful', 'full of play', ['pray', 'plan']),
  a('useful', 'use', 'ful', 'full of use', ['fuse', 'muse']),
  // less: without
  a('helpless', 'help', 'less', 'without help', ['held', 'kelp']),
  a('careless', 'care', 'less', 'without care', ['core', 'cart']),
  a('endless', 'end', 'less', 'without an end', ['and', 'bend']),
  a('harmless', 'harm', 'less', 'without harm', ['hard', 'farm']),
  a('spotless', 'spot', 'less', 'without a spot', ['spit', 'stop']),
  a('seedless', 'seed', 'less', 'without seeds', ['sled', 'weed']),
  a('wingless', 'wing', 'less', 'without wings', ['wig', 'king']),
  a('restless', 'rest', 'less', 'without rest', ['rust', 'nest']),
  a('cordless', 'cord', 'less', 'without a cord', ['card', 'cork']),
  a('painless', 'pain', 'less', 'without pain', ['pan', 'rain']),
  // er: more; est: the most
  a('longer', 'long', 'er', 'more long', ['lung', 'song']),
  a('longest', 'long', 'est', 'the most long', ['lung', 'song']),
  a('shorter', 'short', 'er', 'more short', ['shirt', 'sport']),
  a('shortest', 'short', 'est', 'the most short', ['shirt', 'sport']),
  a('darker', 'dark', 'er', 'more dark', ['bark', 'dart']),
  a('darkest', 'dark', 'est', 'the most dark', ['bark', 'dart']),
  a('thicker', 'thick', 'er', 'more thick', ['think', 'trick']),
  a('thickest', 'thick', 'est', 'the most thick', ['think', 'trick']),
  a('faster', 'fast', 'er', 'more fast', ['fist', 'mast']),
  a('fastest', 'fast', 'est', 'the most fast', ['fist', 'mast']),
  a('softer', 'soft', 'er', 'more soft', ['sift', 'loft']),
  a('softest', 'soft', 'est', 'the most soft', ['sift', 'loft']),
];

/** The -er and -est words Level 3 asks with a picture: which of these ships or containers is it? */
export const COMPARE_BASES = ['long', 'short', 'dark', 'thick'] as const;
export type CompareBase = (typeof COMPARE_BASES)[number];

/** Never on the Add-Ons table: they only look like an add-on and a word. */
export const NOT_ADD_ONS: readonly string[] = ['unpack', 'unzip', 'unplug', 'unload', 'retell', 'handful', 'armful', 'uncle', 'under', 'until', 'unit', 'refuse', 'really', 'reptile', 'ready', 'remote', 'never', 'number', 'butter', 'hammer', 'tiger', 'paper', 'river', 'sister', 'winter', 'corner'];

/** The joined word, and what's written on each container. */
export const partsOf = (w: AddOnWord): [string, string] => (FRONT.includes(w.add) ? [w.add, w.base] : [w.base, w.add]);
export const addOnWord = (w: string) => ADD_ON_WORDS.find(x => x.word === w)!;
