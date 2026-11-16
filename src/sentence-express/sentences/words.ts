// Every word a Sentence Express sentence may use, and what it is (a small lexicon for the order checker in grammar.ts).
//
// The vocabulary is Sight Squad's 100 sight words (src/sight-squad/words/list.ts, read only: the test checks against it), a short
// list of decodable words kept here (short vowels, a few blends and digraphs and a magic e: "dig", "mud", "nest", "hole"), a few
// picture nouns ("train", "ball", "bird") and four names. There is no Dino Dig game, so the decodable words live in this file.
//
// What a word is (its part of speech) and what it means (whether it is alive, how big it is, whether something fits in it) is only
// as much as the checker needs to tell "The dog is in the box." (sensible) from "The box is in the dog." (not), so it can find every
// other order of a sentence's words that a child could fairly call right.

/** Short words he can sound out: short vowels, a few blends and digraphs, a magic e. Not in Sight Squad's list. */
export const DECODABLE = [
  'dog', 'dogs', 'cat', 'cats', 'pig', 'pigs', 'hen', 'fox', 'frog', 'frogs', 'duck', 'ducks', 'fish', 'bug', 'bugs',
  'bus', 'van', 'jet', 'hat', 'box', 'bag', 'bed', 'cup', 'rug', 'mat', 'log', 'nest', 'egg', 'hill', 'pond', 'mud', 'hole', 'cake', 'sun',
  'kid', 'kids', 'fun', 'park', 'bath',
  'runs', 'hop', 'hops', 'sit', 'sits', 'sat', 'nap', 'naps', 'swim', 'swims', 'dig', 'digs', 'has', 'kick', 'kicks', 'fix', 'sing',
  'sings', 'likes', 'sees', 'jumps', 'jumped', 'helps', 'gets', 'got', 'made', 'plays', 'eats', 'rides', 'wants', 'look', 'looks',
  'hot', 'wet', 'sad', 'us', 'ate', 'flies', 'pet', 'pets', 'win', 'hats', 'stopped', 'ran',
] as const;
/** Picture words: nouns a first grader knows by sight from the picture. */
export const PICTURE_NOUNS = ['train', 'ball', 'bird', 'birds', 'tree', 'car', 'boat', 'sky'] as const;
/** Names start with a capital letter wherever they are in a sentence. */
export const NAMES = ['Sam', 'Pam', 'Max', 'Ben', 'Mom', 'Dad'] as const;
export type Name = (typeof NAMES)[number];
export const isName = (w: string): w is Name => (NAMES as readonly string[]).includes(w);

// ---------- what a word is ----------

/** What a noun names, for "is it alive", "can it go in something", "can it be eaten". */
export type Cls = 'person' | 'animal' | 'vehicle' | 'thing' | 'food' | 'place' | 'sky' | 'event';
export interface NounInfo {
  readonly head: string;
  readonly num: 'sg' | 'pl' | 'any';
  readonly cls: Cls;
  /** Roughly how big: 1 a bug or a ball, 3 a dog or a box, 5 a bed or a car, 9 the sky. */
  readonly size: number;
  /** Something can be in it / on it / under it. */
  readonly holds?: boolean; readonly top?: boolean; readonly over?: boolean;
  readonly flies?: boolean; readonly swims?: boolean;
  /** Said without "a" or "the": "I want cake.", "in mud". */
  readonly mass?: boolean;
}
export type Entry =
  | { c: 'D'; num?: 'sg' | 'pl' }
  | { c: 'NUM'; num: 'sg' | 'pl' }
  | { c: 'A'; kind: 'size' | 'color' | 'feel' | 'temp' | 'wet' | 'new' }
  | { c: 'N'; n: NounInfo }
  | { c: 'PRS'; num: 'sg' | 'pl'; p: 1 | 2 | 3; cls: Cls | 'any' }
  | { c: 'PRO'; cls: Cls | 'any' }
  | { c: 'V'; lemma: string; form: 'base' | 's' | 'past' }
  | { c: 'AUX'; w: 'can' | 'will' | 'did' | 'do' }
  | { c: 'COP'; num: 'sg' | 'pl'; p1?: boolean }
  | { c: 'P'; w: string }
  | { c: 'PRT'; w: string }
  | { c: 'ADV'; w: string }
  | { c: 'WH'; w: 'what' | 'where' | 'who' }
  | { c: 'TO' } | { c: 'NOT' } | { c: 'THIS' };

const N = (head: string, num: NounInfo['num'], cls: Cls, size: number, more: Partial<NounInfo> = {}): Entry => ({ c: 'N', n: { head, num, cls, size, ...more } });
const both = (sg: string, pl: string | null, cls: Cls, size: number, more: Partial<NounInfo> = {}) =>
  [[sg, [N(sg, 'sg', cls, size, more)]], ...(pl ? [[pl, [N(sg, 'pl', cls, size, more)]]] : [])] as [string, Entry[]][];

/** Verbs: their three forms and what they take. */
export interface VerbInfo {
  readonly forms: readonly [base: string, s: string, past: string];
  /** Does it take an object: never, maybe, always. */
  readonly obj: 'no' | 'opt' | 'yes';
  /** Who can do it. */
  readonly subj: readonly Cls[];
  /** What it can be done to. */
  readonly objs?: readonly Cls[];
  /** Little words that go with it: "look up", "sit down", "run away". */
  readonly prts?: readonly string[];
  /** Places it can go or happen: "run to Mom", "sit on the bed", "look at the dog". */
  readonly preps?: readonly string[];
  /** "like to play", "want to go". */
  readonly toV?: boolean;
  /** Only things that fly or swim. */
  readonly needs?: 'flies' | 'swims';
}
const ALIVE: Cls[] = ['person', 'animal'];
export const VERBS: Record<string, VerbInfo> = {
  run: { forms: ['run', 'runs', 'ran'], obj: 'no', subj: [...ALIVE, 'vehicle'], prts: ['up', 'down', 'away', 'out'], preps: ['to', 'in', 'up', 'down', 'with', 'into', 'on'] },
  jump: { forms: ['jump', 'jumps', 'jumped'], obj: 'no', subj: ALIVE, prts: ['up', 'down'], preps: ['on', 'in', 'into', 'up'] },
  hop: { forms: ['hop', 'hops', 'hopped'], obj: 'no', subj: ALIVE, prts: ['up', 'down', 'away'], preps: ['on', 'in', 'into', 'to', 'up'] },
  sit: { forms: ['sit', 'sits', 'sat'], obj: 'no', subj: ALIVE, prts: ['down', 'up'], preps: ['on', 'in', 'by', 'under', 'with'] },
  nap: { forms: ['nap', 'naps', 'napped'], obj: 'no', subj: ALIVE, preps: ['on', 'in', 'under', 'by'] },
  play: { forms: ['play', 'plays', 'played'], obj: 'no', subj: ALIVE, preps: ['with', 'in', 'on', 'at', 'by', 'under'] },
  swim: { forms: ['swim', 'swims', 'swam'], obj: 'no', subj: ALIVE, preps: ['in', 'to', 'with'], needs: 'swims' },
  dig: { forms: ['dig', 'digs', 'dug'], obj: 'opt', subj: ALIVE, objs: ['place'], preps: ['in', 'with', 'by', 'under'] },
  fly: { forms: ['fly', 'flies', 'flew'], obj: 'no', subj: ['animal', 'vehicle'], prts: ['up', 'away', 'down'], preps: ['in', 'to', 'up', 'over'], needs: 'flies' },
  go: { forms: ['go', 'goes', 'went'], obj: 'no', subj: [...ALIVE, 'vehicle'], prts: ['up', 'down', 'out', 'away', 'in'], preps: ['to', 'in', 'into', 'up', 'down', 'on', 'with'] },
  come: { forms: ['come', 'comes', 'came'], obj: 'no', subj: [...ALIVE, 'vehicle'], prts: ['out', 'in', 'down', 'up'], preps: ['to', 'with', 'in', 'into'] },
  walk: { forms: ['walk', 'walks', 'walked'], obj: 'no', subj: ALIVE, prts: ['away', 'up', 'down'], preps: ['to', 'in', 'up', 'down', 'with', 'on'] },
  stop: { forms: ['stop', 'stops', 'stopped'], obj: 'opt', subj: [...ALIVE, 'vehicle'], objs: ['vehicle', 'animal', 'person'], preps: ['at', 'by'] },
  eat: { forms: ['eat', 'eats', 'ate'], obj: 'opt', subj: ALIVE, objs: ['food'], preps: ['in', 'on', 'with', 'at'] },
  see: { forms: ['see', 'sees', 'saw'], obj: 'opt', subj: ALIVE, objs: ['person', 'animal', 'vehicle', 'thing', 'food', 'place', 'sky'], preps: ['in', 'on', 'under', 'at', 'by'] },
  look: { forms: ['look', 'looks', 'looked'], obj: 'no', subj: ALIVE, prts: ['up', 'down', 'out'], preps: ['at', 'in', 'under', 'for', 'up', 'down', 'on'] },
  like: { forms: ['like', 'likes', 'liked'], obj: 'yes', subj: ALIVE, objs: ['person', 'animal', 'vehicle', 'thing', 'food', 'place', 'sky', 'event'], toV: true },
  want: { forms: ['want', 'wants', 'wanted'], obj: 'yes', subj: ALIVE, objs: ['person', 'animal', 'vehicle', 'thing', 'food', 'event'], toV: true },
  have: { forms: ['have', 'has', 'had'], obj: 'yes', subj: ALIVE, objs: ['animal', 'vehicle', 'thing', 'food', 'event'] },
  get: { forms: ['get', 'gets', 'got'], obj: 'opt', subj: ALIVE, objs: ['animal', 'vehicle', 'thing', 'food'], prts: ['up', 'out', 'down'], preps: ['in', 'on', 'into', 'for', 'at'] },
  find: { forms: ['find', 'finds', 'found'], obj: 'yes', subj: ALIVE, objs: ['person', 'animal', 'vehicle', 'thing', 'food'], preps: ['in', 'on', 'under', 'by'] },
  help: { forms: ['help', 'helps', 'helped'], obj: 'opt', subj: ALIVE, objs: ['person', 'animal'] },
  make: { forms: ['make', 'makes', 'made'], obj: 'yes', subj: ['person'], objs: ['food', 'thing'], preps: ['for', 'with'] },
  ride: { forms: ['ride', 'rides', 'rode'], obj: 'opt', subj: ['person'], objs: ['vehicle'], preps: ['in', 'on', 'to', 'with'] },
  fix: { forms: ['fix', 'fixes', 'fixed'], obj: 'yes', subj: ['person'], objs: ['vehicle', 'thing'] },
  kick: { forms: ['kick', 'kicks', 'kicked'], obj: 'opt', subj: ALIVE, objs: ['thing'], preps: ['to', 'up', 'in', 'into'] },
  sing: { forms: ['sing', 'sings', 'sang'], obj: 'no', subj: ['person', 'animal'], preps: ['to', 'with', 'in', 'for'] },
  park: { forms: ['park', 'parks', 'parked'], obj: 'opt', subj: ['person', 'vehicle'], objs: ['vehicle'], preps: ['in', 'by', 'at'] },
  pet: { forms: ['pet', 'pets', 'pet'], obj: 'yes', subj: ['person'], objs: ['animal'] },
  win: { forms: ['win', 'wins', 'won'], obj: 'opt', subj: ALIVE, objs: ['thing'] },
  do: { forms: ['do', 'does', 'did'], obj: 'yes', subj: ALIVE, objs: ['thing', 'food', 'event', 'animal', 'person', 'vehicle', 'place'] },
};

const LEXICON = new Map<string, Entry[]>([
  ['the', [{ c: 'D' }]], ['a', [{ c: 'D', num: 'sg' }]], ['my', [{ c: 'D' }]], ['his', [{ c: 'D' }]], ['our', [{ c: 'D' }]],
  ['your', [{ c: 'D' }]], ['her', [{ c: 'D' }, { c: 'PRO', cls: 'person' }]], ['this', [{ c: 'D', num: 'sg' }, { c: 'THIS' }]],
  ['one', [{ c: 'NUM', num: 'sg' }]], ['two', [{ c: 'NUM', num: 'pl' }]], ['three', [{ c: 'NUM', num: 'pl' }]],
  ['big', [{ c: 'A', kind: 'size' }]], ['little', [{ c: 'A', kind: 'size' }]],
  ...['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown'].map(w => [w, [{ c: 'A', kind: 'color' }]] as [string, Entry[]]),
  ['funny', [{ c: 'A', kind: 'feel' }]], ['sad', [{ c: 'A', kind: 'feel' }]], ['good', [{ c: 'A', kind: 'feel' }]],
  ['hot', [{ c: 'A', kind: 'temp' }]], ['wet', [{ c: 'A', kind: 'wet' }]], ['new', [{ c: 'A', kind: 'new' }]],
  ['I', [{ c: 'PRS', num: 'sg', p: 1, cls: 'person' }]], ['we', [{ c: 'PRS', num: 'pl', p: 1, cls: 'person' }]],
  ['you', [{ c: 'PRS', num: 'pl', p: 2, cls: 'person' }, { c: 'PRO', cls: 'person' }]],
  ['he', [{ c: 'PRS', num: 'sg', p: 3, cls: 'person' }]], ['she', [{ c: 'PRS', num: 'sg', p: 3, cls: 'person' }]],
  ['it', [{ c: 'PRS', num: 'sg', p: 3, cls: 'any' }, { c: 'PRO', cls: 'any' }]], ['they', [{ c: 'PRS', num: 'pl', p: 3, cls: 'any' }]],
  ['me', [{ c: 'PRO', cls: 'person' }]], ['us', [{ c: 'PRO', cls: 'person' }]], ['him', [{ c: 'PRO', cls: 'person' }]], ['them', [{ c: 'PRO', cls: 'any' }]],
  ['can', [{ c: 'AUX', w: 'can' }]], ['will', [{ c: 'AUX', w: 'will' }]], ['did', [{ c: 'AUX', w: 'did' }]], ['do', [{ c: 'AUX', w: 'do' }]],
  ['is', [{ c: 'COP', num: 'sg' }]], ['are', [{ c: 'COP', num: 'pl' }]], ['was', [{ c: 'COP', num: 'sg', p1: true }]],
  ...['in', 'on', 'under', 'at', 'with', 'by', 'into', 'for', 'over'].map(w => [w, [{ c: 'P', w }]] as [string, Entry[]]),
  ['to', [{ c: 'P', w: 'to' }, { c: 'TO' }]],
  ['up', [{ c: 'P', w: 'up' }, { c: 'PRT', w: 'up' }]], ['down', [{ c: 'P', w: 'down' }, { c: 'PRT', w: 'down' }]],
  ['out', [{ c: 'PRT', w: 'out' }]], ['away', [{ c: 'PRT', w: 'away' }]],
  ['here', [{ c: 'ADV', w: 'here' }]], ['there', [{ c: 'ADV', w: 'there' }]], ['now', [{ c: 'ADV', w: 'now' }]], ['too', [{ c: 'ADV', w: 'too' }]],
  ['not', [{ c: 'NOT' }]],
  ['what', [{ c: 'WH', w: 'what' }]], ['where', [{ c: 'WH', w: 'where' }]], ['who', [{ c: 'WH', w: 'who' }]],
  // nouns
  ...both('dog', 'dogs', 'animal', 3, { swims: true }), ...both('cat', 'cats', 'animal', 2), ...both('pig', 'pigs', 'animal', 3),
  ...both('hen', 'hens', 'animal', 2), ...both('fox', null, 'animal', 3), ...both('frog', 'frogs', 'animal', 1, { swims: true }),
  ...both('duck', 'ducks', 'animal', 2, { swims: true, flies: true }), ...both('bug', 'bugs', 'animal', 1, { flies: true }),
  ...both('bird', 'birds', 'animal', 1, { flies: true }), ...both('kid', 'kids', 'person', 4, { swims: true }),
  ['fish', [N('fish', 'any', 'animal', 1, { swims: true })]],
  ...both('bus', null, 'vehicle', 7, { holds: true, top: true, over: true }), ...both('car', 'cars', 'vehicle', 6, { holds: true, top: true, over: true }),
  ...both('train', 'trains', 'vehicle', 7, { holds: true, top: true }), ...both('van', null, 'vehicle', 6, { holds: true, top: true, over: true }),
  ...both('jet', null, 'vehicle', 7, { holds: true, flies: true }), ...both('boat', null, 'vehicle', 6, { holds: true, top: true, swims: true }),
  ...both('hat', 'hats', 'thing', 1, { over: true }), ...both('ball', 'balls', 'thing', 1), ...both('cup', null, 'thing', 1, { holds: true, over: true }),
  ...both('box', null, 'thing', 3, { holds: true, top: true, over: true }), ...both('bag', null, 'thing', 2, { holds: true }),
  ...both('bed', null, 'thing', 5, { holds: true, top: true, over: true }), ...both('rug', null, 'thing', 4, { top: true, over: true }),
  ...both('mat', null, 'thing', 4, { top: true, over: true }), ...both('log', null, 'thing', 4, { top: true, over: true }),
  ...both('nest', null, 'thing', 2, { holds: true }), ...both('egg', 'eggs', 'food', 1), ...both('cake', null, 'food', 2, { mass: true }),
  ...both('tree', null, 'place', 8, { holds: true, over: true }), ...both('hill', null, 'place', 9, { top: true }),
  ...both('pond', null, 'place', 8, { holds: true }), ...both('mud', null, 'place', 8, { holds: true, mass: true }), ...both('hole', null, 'place', 4, { holds: true }),
  ...both('park', null, 'place', 9, { holds: true }), ...both('bath', null, 'place', 5, { holds: true }), ...both('sun', null, 'sky', 9, { over: true }),
  ...both('sky', null, 'sky', 9, { holds: true }), ...both('fun', null, 'event', 0), ...both('pet', null, 'animal', 2),
  ...NAMES.map(n => [n, [N(n, 'sg', 'person', n === 'Mom' || n === 'Dad' ? 5 : 4, { swims: true })]] as [string, Entry[]]),
]);
// Verbs, by every form, and the words that are a verb and a noun ("play", "park", "pet")
for (const [lemma, v] of Object.entries(VERBS)) {
  v.forms.forEach((w, i) => {
    const e: Entry = { c: 'V', lemma, form: (['base', 's', 'past'] as const)[i]! };
    LEXICON.set(w, [...(LEXICON.get(w) ?? []), e]);
  });
}
LEXICON.set('play', [...LEXICON.get('play')!, N('play', 'sg', 'event', 0)]);
LEXICON.set('run', [...LEXICON.get('run')!, N('run', 'sg', 'event', 0)]);
LEXICON.set('nap', [...LEXICON.get('nap')!, N('nap', 'sg', 'event', 0)]);
LEXICON.set('ride', [...LEXICON.get('ride')!, N('ride', 'sg', 'event', 0)]);
LEXICON.set('swim', [...LEXICON.get('swim')!, N('swim', 'sg', 'event', 0)]);

/** What a word can be. The first word of a sentence is looked up without its capital. */
export function entriesOf(word: string): readonly Entry[] {
  return LEXICON.get(word) ?? LEXICON.get(word.toLowerCase()) ?? [];
}
export const LEXICON_WORDS = [...LEXICON.keys()];
