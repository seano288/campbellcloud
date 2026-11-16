// The phonics word list: phonetically regular words a first grader can sound out (to read) or work out from their sounds (to spell),
// each tagged with its Pattern. Plain data, no game code: Word Wreckers (spelling) uses it now and Dino Dig (reading) is meant to share
// it, so neither game forks it.
//
// The Patterns come in this order, and a word's Pattern is the latest one it uses (a word with a blend and a vowel team is a vowel-team
// word), so a word is only ever asked once every Pattern in it has been met:
//   1. cvc       short-vowel consonant-vowel-consonant words: cat, hen, pig, dog, bug
//   2. digraph   two letters, one sound: sh, ch, th, wh, ck, ng, and a doubled ll, ss, ff
//   3. blend     two or three sounds together at the start or the end: st, bl, tr, fr, -nd, -mp, -st
//   4. magic-e   a final e that makes the vowel say its name: cake, bike, bone, cube
//   5. team      two vowels, one sound: ee, ea, ai, ay, oa, ow (only as in snow)
//   6. r         an r after the vowel: ar, or, er, ir, ur
//
// A word is written as its sounds, one per box, separated by dots: 'sh.i.p' is ship (three sounds), 'c.a_e.k' is cake (the a and the
// final e are one sound, a_e, and the e is written at the end). Left out on purpose:
//   - words that sound like another word spelled differently (sea/see, tail/tale, son/sun, bell/belle, week/weak): HOMOPHONES below,
//     so hearing a word always means one spelling;
//   - words said two ways (wind, read, bow, row, live, tear), ow as in cow, ea as in head, a soft c or g (rice, page);
//   - sight words that break the rules (said, was, the): Sight Squad owns those.

export const PATTERN_IDS = ['cvc', 'digraph', 'blend', 'magic-e', 'team', 'r'] as const;
export type PatternId = (typeof PATTERN_IDS)[number];

const SPECS = {
  cvc: [
    'c.a.t', 'b.a.t', 'h.a.t', 'm.a.p', 'v.a.n', 'c.a.p', 'c.a.n', 'p.a.n', 'r.a.t', 'b.a.g', 'r.a.m',
    'b.e.d', 'h.e.n', 'p.e.n', 't.e.n', 'n.e.t', 'w.e.b', 'l.e.g', 'j.e.t', 
    'p.i.g', 'l.i.p', 'p.i.n', 'd.i.g', 'k.i.d', 'b.i.g', 's.i.t',
    'd.o.g', 'f.o.x', 'b.o.x', 'p.o.t', 'm.o.p', 'l.o.g', 'f.o.g', 
    'b.u.g', 'c.u.p', 'b.u.s', 'm.u.d', 'h.u.g', 'n.u.t', 't.u.b', 'c.u.b', 'r.u.n', 'h.u.t', 
  ],
  digraph: [
    'sh.i.p', 'sh.o.p', 'f.i.sh', 'd.i.sh', 'sh.e.d', 'sh.e.ll', 'ch.i.n', 'ch.i.p', 'ch.o.p', 'ch.i.ck', 'r.i.ch',
    'b.a.th', 'm.o.th', 'th.i.ck', 'd.u.ck', 's.o.ck', 'r.o.ck', 'k.i.ck', 'n.e.ck', 'l.u.ck',
    'wh.i.p', 'h.i.ll', 'd.o.ll', 'p.u.ff', 'k.i.ng', 's.o.ng', 'l.o.ng', 'w.i.ng',
  ],
  blend: [
    'f.r.o.g', 'f.l.a.g', 'd.r.u.m', 'c.r.a.b', 'c.l.a.p', 's.l.e.d', 'n.e.s.t', 't.e.n.t', 'h.a.n.d', 'p.l.a.n.t',
    's.t.o.p', 's.k.u.n.k', 's.w.i.m', 's.p.i.n', 't.r.i.p', 'g.r.a.b', 'p.l.u.g', 's.l.i.p', 's.n.a.p', 
    'c.l.i.p', 'b.r.i.ck', 'd.e.s.k', 'j.u.m.p', 'l.a.m.p', 'm.i.l.k', 'g.i.f.t', 
    'p.o.n.d', 't.r.u.ck', 'b.l.a.ck', 's.t.i.ck', 'd.r.e.ss', 'g.r.a.ss', 'b.r.u.sh', 
    'l.u.n.ch', 'sh.r.i.m.p',
  ],
  'magic-e': [
    'c.a_e.k', 'b.i_e.k', 'b.o_e.n', 'c.u_e.b', 'k.i_e.t', 'h.o_e.m', 'r.o_e.p', 'g.r.a_e.p', 's.n.a_e.k', 's.l.i_e.d',
    's.m.i_e.l', 'g.a_e.m', 'l.a_e.k', 'c.a_e.v', 't.a_e.p', 'n.a_e.m', 'r.i_e.d', 'f.i_e.v',
    'n.i_e.n', 'j.o_e.k', 's.t.o_e.n', 'n.o_e.t', 't.u_e.b', 'c.u_e.t', 'f.l.u_e.t', 'sh.a_e.p', 'sh.i_e.n',
    'd.r.i_e.v', 's.m.o_e.k', 'g.l.o_e.b', 's.k.a_e.t', 'c.o_e.n',
  ],
  team: [
    't.r.ee', 'sh.ee.p', 's.ea.l', 'l.ea.f', 'p.ea.ch', 's.n.ai.l', 't.r.ai.n', 'p.ai.n.t', 'b.oa.t', 'g.oa.t',
    's.oa.p', 'c.oa.t', 's.n.ow', 'g.r.ee.n', 's.l.ee.p', 'j.ee.p', 't.ee.th', 'd.r.ea.m', 
    'th.r.ee', 'n.ai.l', 'ch.ai.n', 'p.l.ay', 'd.ay', 's.p.r.ay', 't.oa.s.t', 'g.r.ow', 'sh.ow',
    'b.l.ow', 's.t.r.ee.t', 's.p.ea.k', 'b.ea.k', 'b.r.ai.n',
  ],
  r: [
    'c.ar', 's.t.ar', 'sh.ar.k', 'b.ar.n', 'j.ar', 'f.ar.m', 'p.ar.k', 'y.ar.n', 'ar.m', 'c.ar.d', 'sh.ar.p',
    's.m.ar.t', 's.t.ar.t', 's.c.ar.f', 'h.or.n', 'f.or.k', 'c.or.n', 's.t.or.m', 'sh.or.t', 's.p.or.t', 
    'b.ir.d', 'g.ir.l', 'sh.ir.t', 's.k.ir.t', 'd.ir.t', 'f.ir.s.t', 'b.ur.n', 'ch.ur.ch', 'h.ur.t',
    'c.ur.l', 'f.er.n',
  ],
} as const satisfies Record<PatternId, readonly string[]>;

// ---------- spelling a word out of its sounds, in the type system too ----------

type Piece<P extends string> = P extends `${infer V}_e` ? V : P;
type HasE<P extends string> = P extends `${string}_e` ? true : false;
type Spell<S extends string, Acc extends string = '', E extends boolean = false> =
  S extends `${infer H}.${infer T}` ? Spell<T, `${Acc}${Piece<H>}`, HasE<H> extends true ? true : E>
    : `${Acc}${Piece<S>}${(HasE<S> extends true ? true : E) extends true ? 'e' : ''}`;

export type Spec = (typeof SPECS)[PatternId][number];
/** Every word on the list. */
export type Word = Spell<Spec>;

/** A word as its sounds: each box's spelling ('a_e' is the magic-e vowel, its e written at the end of the word). */
export interface WordInfo {
  readonly word: Word;
  readonly pattern: PatternId;
  readonly sounds: readonly string[];
}

/** The written word from its sounds: 'c.a_e.k' is "cake". */
export function spell(sounds: readonly string[]): string {
  let out = '', magic = false;
  for (const s of sounds) { if (s.endsWith('_e')) { out += s.slice(0, -2); magic = true; } else out += s; }
  return magic ? `${out}e` : out;
}

export const WORD_INFO: readonly WordInfo[] = (Object.entries(SPECS) as [PatternId, readonly string[]][])
  .flatMap(([pattern, specs]) => specs.map(spec => { const sounds = spec.split('.'); return { word: spell(sounds) as Word, pattern, sounds }; }));
export const WORDS: readonly Word[] = WORD_INFO.map(w => w.word);
export const isWord = (x: unknown): x is Word => (WORDS as readonly unknown[]).includes(x);
export const infoOf = (w: Word): WordInfo => WORD_INFO.find(i => i.word === w)!;
export const wordsIn = (p: PatternId): Word[] => WORD_INFO.filter(i => i.pattern === p).map(i => i.word);

// ---------- what each spelling of a sound is ----------

/** The spellings on the list that make the same sound. A sound with one spelling here has no other on the list. */
export const SAME_SOUND: readonly (readonly string[])[] = [
  ['c', 'k', 'ck'],
  ['a_e', 'ai', 'ay'],
  ['ee', 'ea'],
  ['o_e', 'oa', 'ow'],
  ['er', 'ir', 'ur'],
  ['l', 'll'], ['s', 'ss'], ['f', 'ff'],
  ['w', 'wh'],
];
/** Which spellings say the same sound as this one (itself included). */
export const sameSound = (spelling: string): readonly string[] => SAME_SOUND.find(g => g.includes(spelling)) ?? [spelling];

export const VOWELS = ['a', 'e', 'i', 'o', 'u'] as const;
/** The vowel sounds: short vowels, magic e, teams and r-controlled. */
export const isVowelSound = (s: string) => /^[aeiou]$/.test(s) || s.endsWith('_e') || ['ee', 'ea', 'ai', 'ay', 'oa', 'ow', 'ar', 'or', 'er', 'ir', 'ur'].includes(s);
/** Two letters for one sound (and the doubled ll, ss, ff). */
export const DIGRAPHS = ['sh', 'ch', 'th', 'wh', 'ck', 'ng', 'll', 'ss', 'ff'] as const;
export const TEAMS = ['ee', 'ea', 'ai', 'ay', 'oa', 'ow'] as const;
export const R_VOWELS = ['ar', 'or', 'er', 'ir', 'ur'] as const;

// ---------- pictures ----------

/** Apple emoji, only where the picture is plainly that word to a six-year-old (a hen is just as likely "chicken", so it has none). */
export const PICTURES: Partial<Record<Word, string>> = {
  cat: '🐈', bat: '🦇', hat: '🎩', map: '🗺️', van: '🚐', cap: '🧢', can: '🥫', pan: '🍳', rat: '🐀', ram: '🐏',
  bed: '🛏️', pen: '🖊️', ten: '🔟', net: '🥅', web: '🕸️', leg: '🦵', pig: '🐖', lip: '👄', pin: '📌',
  dog: '🐕', fox: '🦊', box: '📦', log: '🪵', fog: '🌫️', bug: '🐛', cup: '🥤', bus: '🚌', nut: '🥜', hut: '🛖',
  ship: '🚢', fish: '🐟', shell: '🐚', chick: '🐤', bath: '🛁', duck: '🦆', sock: '🧦', rock: '🪨', king: '🤴',
  frog: '🐸', flag: '🚩', drum: '🥁', crab: '🦀', clap: '👏', sled: '🛷', nest: '🪺', tent: '⛺', hand: '✋', plant: '🪴',
  stop: '🛑', skunk: '🦨', brick: '🧱', milk: '🥛', gift: '🎁', truck: '🚚', dress: '👗', brush: '🪥', shrimp: '🦐',
  cake: '🎂', bike: '🚲', bone: '🦴', cube: '🧊', kite: '🪁', home: '🏠', rope: '🪢', grape: '🍇', snake: '🐍', slide: '🛝',
  smile: '😃', game: '🎮', globe: '🌍', skate: '⛸️',
  tree: '🌳', sheep: '🐑', seal: '🦭', leaf: '🍃', peach: '🍑', snail: '🐌', train: '🚂', paint: '🎨', boat: '⛵', goat: '🐐',
  soap: '🧼', coat: '🧥', snow: '❄️', jeep: '🚙', teeth: '🦷', chain: '⛓️', brain: '🧠',
  car: '🚗', star: '⭐', shark: '🦈', jar: '🫙', yarn: '🧶', arm: '💪', scarf: '🧣', horn: '📯', fork: '🍴', corn: '🌽',
  storm: '⛈️', bird: '🐦', girl: '👧', shirt: '👕', church: '⛪',
};

// ---------- kept off the list ----------

/** Words that sound like another word spelled differently. None may be on the list. */
export const HOMOPHONES: readonly string[] = [
  'sun', 'son', 'red', 'read', 'but', 'butt', 'in', 'inn', 'him', 'hymn', 'jam', 'jamb', 'rap', 'wrap', 'wet', 'whet', 'wig', 'whig', 'ant', 'aunt',
  'bell', 'belle', 'ring', 'wring', 'sick', 'sic', 'lock', 'loch', 'check', 'cheque', 'step', 'steppe', 'mask', 'masque', 'plum', 'plumb',
  'gate', 'gait', 'wave', 'waive', 'time', 'thyme', 'mule', 'mewl', 'made', 'maid', 'tale', 'tail', 'rose', 'rows', 'nose', 'knows',
  'plane', 'plain', 'whale', 'wail', 'hole', 'whole', 'sale', 'sail', 'male', 'mail', 'pale', 'pail', 'main', 'mane', 'pain', 'pane',
  'rain', 'rein', 'reign', 'wait', 'weight', 'way', 'weigh', 'hay', 'hey', 'tray', 'trey', 'gray', 'grey', 'be', 'bee', 'sea', 'see',
  'meet', 'meat', 'week', 'weak', 'peek', 'peak', 'beet', 'beat', 'heel', 'heal', 'feet', 'feat', 'tea', 'tee', 'flea', 'flee', 'team', 'teem',
  'seed', 'cede', 'need', 'knead', 'beach', 'beech', 'bean', 'been', 'wheel', "we'll", 'road', 'rode', 'toad', 'towed', 'row', 'roe',
  'tow', 'toe', 'slow', 'sloe', 'low', 'lo', 'throw', 'throe', 'bowl', 'bole', 'so', 'sew', 'know', 'no', 'hare', 'hair', 'deer', 'dear',
  'fir', 'fur', 'surf', 'serf', 'heard', 'herd', 'turn', 'tern', 'for', 'four', 'fort', 'forte', 'horse', 'hoarse', 'war', 'wore', 'cart', 'carte',
];
/** Words said two ways, or with a vowel this list doesn't teach. None may be on the list. */
export const NOT_REGULAR: readonly string[] = ['wind', 'read', 'live', 'bow', 'row', 'tear', 'lead', 'close', 'cow', 'how', 'now', 'head', 'bread', 'rice', 'page', 'nurse', 'purse'];
