// The five kinds of question, each made about one word he has heard (the word is never shown until he has built it), and how an
// answer is checked. Every question has exactly one right answer: the word spelled the usual way.
//
//   build  Build It: tap letter tiles into the boxes. L1 exactly the letters, L2 one or two spare letters, L3 spares that look or
//          sound like the word's letters (b/d, c/k, e/i).
//   gap    Missing Sound: the word with one box empty; pick the tile. L1 the first sound, L2 the last, L3 the vowel. The wrong tiles
//          always say a different sound (never k for c), so the one he hears is the only one that fits.
//   chunk  Chunks: build it from sound chunks (sh, ck, ee, a_e) instead of letters. L1 two chunks (sh + ip), L2 each sound a chunk
//          and one spare, L3 spares that say the same sound another way (ai, ay, a_e).
//   fix    Fix It: a wrong spelling of the word he hears; tap the mistake, then pick the right tile. L1 the mistake glows, L2 he finds
//          it, L3 the mistake is a missing letter (tap where it goes) or an extra one (tap it).
//   pick   Which Looks Right: tap the right spelling. L1 two, L2 three, L3 three in a short phrase.
//
// Answers are strings. Build It and Chunks are checked a tile at a time ('more' while right so far); Fix It's first tap (where the
// mistake is) is checked on its own before the fix.
import { pick, shuffle, type Rng } from '../../game/rng';
import type { Stretch } from '../../modes/progress';
import { infoOf, isVowelSound, sameSound, VOWELS, type PatternId, type Word } from '../../dino-dig/words/list';
import { added, confused, dropped, hasChunk, LOOKALIKE, onsetRime, pickWrongs, respelled, showable, shown, spell, type Mistake } from './words';

export const KINDS = ['build', 'gap', 'chunk', 'fix', 'pick'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;

export interface BuildQ { kind: 'build'; word: Word; tiles: string[] }
export interface GapQ { kind: 'gap'; word: Word; box: number; choices: string[]; answer: string }
export interface ChunkQ { kind: 'chunk'; word: Word; parts: string[]; tiles: string[] }
/** `shown`: the wrong spelling's boxes (a swap) or letters (a missing or extra letter). `choices`: tiles for the fix. */
export interface FixQ { kind: 'fix'; word: Word; mistake: Mistake; shown: string[]; marked: boolean; choices: string[] }
export interface PickQ { kind: 'pick'; word: Word; choices: string[]; phrase: string | null }
/** Meeting a Pattern: three example words, the Pattern's sounds lit. Any tap goes on. */
export interface MeetQ { kind: 'meet'; pattern: PatternId; examples: readonly Word[] }
export type Question = BuildQ | GapQ | ChunkQ | FixQ | PickQ;

// ---------- the short phrases for Which Looks Right, Level 3 ----------

/** A short phrase with the word in it, read aloud. Only words with two wrong spellings to offer have one. */
export const PHRASES = {
  cap: 'a red cap', fox: 'a red fox', box: 'a big box', cup: 'a cup of milk', cub: 'a bear cub',
  duck: 'a duck in the pond', neck: 'a long neck', kick: 'kick the ball', thick: 'a thick book', rich: 'a rich king',
  crab: 'a red crab', clap: 'clap your hands', skunk: 'a little skunk', brick: 'a red brick', desk: 'my desk', milk: 'a cup of milk',
  truck: 'a big truck', black: 'a black cat',
  cake: 'a big cake', bike: 'my red bike', bone: 'a dog bone', cube: 'an ice cube', home: 'at home', rope: 'a long rope',
  grape: 'a green grape', snake: 'a long snake', smile: 'a big smile', game: 'a fun game', lake: 'swim in the lake', cave: 'a dark cave',
  tape: 'a roll of tape', name: 'my name', ride: 'a bike ride', joke: 'a funny joke', stone: 'a big stone', note: 'a note for Mom',
  tube: 'a long tube', cute: 'a cute pup', flute: 'play the flute', shape: 'a fun shape', shine: 'the sun will shine',
  drive: 'drive the car', smoke: 'smoke from the fire', globe: 'a big globe', skate: 'skate on the ice', cone: 'an ice cream cone',
  sheep: 'a white sheep', leaf: 'a green leaf', peach: 'a ripe peach', snail: 'a slow snail', train: 'a long train', paint: 'red paint',
  boat: 'a red boat', goat: 'a little goat', soap: 'soap and water', coat: 'my warm coat', snow: 'cold snow', green: 'a green frog',
  sleep: 'go to sleep', jeep: 'a red jeep', teeth: 'brush your teeth', dream: 'a good dream', three: 'three cats', nail: 'a nail and a hammer',
  chain: 'a long chain', play: 'come and play', day: 'a sunny day', spray: 'spray the plants', toast: 'toast and jam', grow: 'watch it grow',
  blow: 'blow a bubble', street: 'down the street', speak: 'speak up', beak: 'a long beak', brain: 'a big brain', tree: 'a tall tree',
  seal: 'a seal in the sea', show: 'a fun show',
  shark: 'a big shark', park: 'go to the park', card: 'a birthday card', scarf: 'a warm scarf', fork: 'a fork and a spoon',
  corn: 'corn on the cob', bird: 'a little bird', girl: 'a girl and a dog', shirt: 'a red shirt', skirt: 'a pink skirt', dirt: 'mud and dirt',
  first: 'I am first', burn: 'the fire can burn', church: 'a white church', hurt: 'my leg is hurt', curl: 'a curl of hair',
  fern: 'a green fern', car: 'a fast car', star: 'a bright star', barn: 'a red barn', jar: 'a jar of jam', farm: 'on the farm',
  yarn: 'a ball of yarn', arm: 'my arm', sharp: 'a sharp tooth', smart: 'a smart dog', start: 'ready to start', horn: 'honk the horn',
  storm: 'a big storm', short: 'a short tail', sport: 'my best sport',
} as const satisfies Partial<Record<Word, string>>;
export type PickPhrase = (typeof PHRASES)[keyof typeof PHRASES];
export const phraseOf = (w: Word): PickPhrase | null => (w in PHRASES ? PHRASES[w as keyof typeof PHRASES] : null);
/** The phrase with this spelling in place of the word. */
export const inPhrase = (phrase: string, word: string, spelling: string) => phrase.replace(new RegExp(`\\b${word}\\b`), spelling);

// ---------- the examples a Pattern is met with ----------

export const EXAMPLES: Record<PatternId, readonly Word[]> = {
  cvc: ['cat', 'pig', 'bug'], digraph: ['ship', 'chick', 'duck'], blend: ['frog', 'stop', 'hand'],
  'magic-e': ['cake', 'bike', 'bone'], team: ['tree', 'boat', 'snail'], r: ['car', 'corn', 'bird'],
};

// ---------- tiles ----------

const LETTERS = 'abcdefghijklmnoprstuvwyz'.split('');
const CONSONANTS = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z', 'sh', 'ch', 'th', 'ck', 'ng'];
const MAGIC = ['a_e', 'i_e', 'o_e', 'u_e'], TEAM_POOL = ['ee', 'ai', 'oa'], R_POOL = ['ar', 'or', 'ir'];
const isMulti = (s: string) => s.length > 1;
const differs = (a: string, b: string) => a !== b && !sameSound(a).includes(b);

/** Other spellings of the same family (consonant, short vowel, magic e, team, r) that say a different sound. */
function familyOf(s: string): string[] {
  if (/^[aeiou]$/.test(s)) return [...VOWELS];
  if (s.endsWith('_e')) return MAGIC;
  if (['ee', 'ea', 'ai', 'ay', 'oa', 'ow'].includes(s)) return TEAM_POOL;
  if (['ar', 'or', 'er', 'ir', 'ur'].includes(s)) return R_POOL;
  return isMulti(s) ? ['sh', 'ch', 'th', 'ck', 'ng'] : CONSONANTS.filter(c => !isMulti(c));
}

/** A shuffle that never leaves the tiles in the right order (a free answer). */
function mixed(rng: Rng, tiles: readonly string[], right: readonly string[]) {
  for (let i = 0; i < 12; i++) { const out = shuffle(rng, tiles); if (out.slice(0, right.length).join('|') !== right.join('|')) return out; }
  return [...tiles].reverse();
}

// ---------- Build It ----------

/** Spare letters for Build It, Level 3: ones that look or sound like the word's own (b/d, c/k, e/i, m/n). */
export function lookalikeSpares(w: Word): string[] {
  const out = new Set<string>();
  for (const ch of w) for (const l of LOOKALIKE[ch] ?? []) if (!w.includes(l)) out.add(l);
  return [...out];
}

function makeBuild(level: Level, stretch: Stretch, w: Word, rng: Rng): BuildQ {
  const letters = [...w];
  let spares: string[] = [];
  if (level === 2) {
    const near = new Set(lookalikeSpares(w));
    spares = shuffle(rng, LETTERS.filter(l => !w.includes(l) && !near.has(l))).slice(0, stretch >= 2 ? 2 : 1);
  } else if (level === 3) {
    const like = shuffle(rng, lookalikeSpares(w)), n = stretch >= 2 ? 3 : 2;
    spares = like.slice(0, n);
    if (spares.length < n) spares.push(...shuffle(rng, LETTERS.filter(l => !w.includes(l) && !spares.includes(l))).slice(0, n - spares.length));
  }
  return { kind: 'build', word: w, tiles: mixed(rng, [...letters, ...spares], letters) };
}

// ---------- Missing Sound ----------

/** Which box Missing Sound empties at each Level: the first, the last, the vowel. */
export function gapBox(level: Level, w: Word): number {
  const { sounds } = infoOf(w);
  if (level === 1) return 0;
  if (level === 2) return sounds.length - 1;
  return sounds.findIndex(isVowelSound);
}

function makeGap(level: Level, stretch: Stretch, w: Word, rng: Rng): GapQ {
  const { sounds } = infoOf(w), box = gapBox(level, w), answer = sounds[box]!;
  const like = LOOKALIKE[answer] ?? [];
  let pool = familyOf(answer).filter(s => differs(s, answer));
  if (stretch === 0) pool = pool.filter(s => !like.includes(s));
  const n = stretch >= 2 ? 3 : 2;
  const wrong = [...(stretch >= 2 ? like.filter(s => pool.includes(s)).slice(0, 1) : []), ...shuffle(rng, pool)];
  const choices = [...new Set(wrong)].slice(0, n);
  return { kind: 'gap', word: w, box, answer, choices: shuffle(rng, [answer, ...choices]) };
}

// ---------- Chunks ----------

/** A spare that is inside one of the word's chunks, or has one inside it, could build the word another way (c + k for ck): never. */
const overlaps = (spare: string, parts: readonly string[]) => parts.some(p => shown(p).includes(shown(spare)) || shown(spare).includes(shown(p)));

/** The spellings that would say the same as one of the word's chunks another way (ai for a_e), for Level 3's spares. */
export function sameSoundSpares(w: Word): string[] {
  const { sounds } = infoOf(w), out = new Set<string>();
  sounds.forEach((s, i) => {
    if (!isMulti(s) && !['c', 'k'].includes(s)) return;
    // never a spare that would build a real word that sounds the same (seel for seal)
    for (const a of sameSound(s)) if (a !== s && !overlaps(a, sounds) && showable(spell(sounds.map((x, j) => (j === i ? a : x))), w)) out.add(a);
  });
  return [...out];
}

function makeChunk(level: Level, stretch: Stretch, w: Word, rng: Rng): ChunkQ {
  const info = infoOf(w);
  if (level === 1) { const parts = onsetRime(info)!; return { kind: 'chunk', word: w, parts, tiles: mixed(rng, parts, parts) }; }
  const parts = [...info.sounds];
  let spares: string[];
  if (level === 2) {
    const multi = parts.find(isMulti) ?? parts[0]!;
    spares = shuffle(rng, familyOf(multi).filter(s => !parts.some(p => !differs(p, s)) && !overlaps(s, parts))).slice(0, stretch >= 2 ? 2 : 1);
  } else {
    spares = shuffle(rng, sameSoundSpares(w)).slice(0, stretch >= 2 ? 3 : 2);
  }
  return { kind: 'chunk', word: w, parts, tiles: mixed(rng, [...parts, ...spares], parts) };
}

// ---------- Fix It ----------

/** Level 3's mistakes: a missing or extra letter, in a spelling short enough that a ⌃ for every gap fits a phone (six letters). */
export const FIX_L3_MAX = 6;
const l3Mistakes = (w: Word) => [...dropped(w), ...added(w)].filter(m => m.text.length <= FIX_L3_MAX);

/** The wrong spelling of a swap, as boxes. */
const swappedBoxes = (w: Word, m: Extract<Mistake, { kind: 'swap' }>) => infoOf(w).sounds.map((s, i) => (i === m.box ? m.wrong : s));

function makeFix(level: Level, stretch: Stretch, w: Word, rng: Rng): FixQ {
  if (level === 3) {
    const ms = l3Mistakes(w), m = pick(rng, ms);
    if (m.kind === 'drop') {
      const others = shuffle(rng, LETTERS.filter(l => l !== m.letter && spell([...m.text.slice(0, m.at), l, ...m.text.slice(m.at)]) !== w)).slice(0, 2);
      return { kind: 'fix', word: w, mistake: m, shown: [...m.text], marked: false, choices: shuffle(rng, [m.letter, ...others]) };
    }
    return { kind: 'fix', word: w, mistake: m, shown: [...m.text], marked: false, choices: [] };
  }
  const easy = confused(w), sound = respelled(w);
  // L1 and the first Stretch of L2: a mistake that sounds wrong (pog for pig) when there is one; then one that sounds right (kat for cat)
  const pool = (stretch === 0 && easy.length ? easy : stretch >= 1 && sound.length ? sound : [...easy, ...sound]);
  const m = pick(rng, pool) as Extract<Mistake, { kind: 'swap' }>;
  const family = [...sameSound(m.right), ...familyOf(m.right), ...(LOOKALIKE[m.right] ?? [])];
  const others = shuffle(rng, [...new Set(family)].filter(s => s !== m.right && s !== m.wrong)).slice(0, 2);
  return { kind: 'fix', word: w, mistake: m, shown: swappedBoxes(w, m), marked: level === 1, choices: shuffle(rng, [m.right, ...others]) };
}

// ---------- Which Looks Right ----------

function makePick(level: Level, w: Word, rng: Rng): PickQ {
  const wrongs = pickWrongs(w), n = level === 1 ? 1 : 2;
  // the ones that sound right come first in pickWrongs; take from the front, in a new order
  const chosen = shuffle(rng, wrongs.slice(0, Math.max(n, Math.min(wrongs.length, 3)))).slice(0, n);
  return { kind: 'pick', word: w, choices: shuffle(rng, [w, ...chosen]), phrase: level === 3 ? phraseOf(w) : null };
}

// ---------- which words each kind can ask ----------

/** Can this kind ask about this word at this Level? */
export function canAsk(kind: Kind, level: Level, w: Word): boolean {
  const info = infoOf(w);
  switch (kind) {
    case 'build': return level < 3 || lookalikeSpares(w).length > 0; // L3 needs a letter that looks or sounds like one of its own
    case 'gap': return gapBox(level, w) >= 0;
    case 'chunk': return hasChunk(info) && (level === 1 ? onsetRime(info) !== null : info.sounds.length >= 3 && (level === 2 || sameSoundSpares(w).length > 0));
    case 'fix': return level === 3 ? l3Mistakes(w).length > 0 : confused(w).length + respelled(w).length > 0;
    case 'pick': return pickWrongs(w).length >= (level === 1 ? 1 : 2) && (level !== 3 || phraseOf(w) !== null);
  }
}

export function makeQuestion(kind: Kind, level: Level, stretch: Stretch, w: Word, rng: Rng): Question {
  switch (kind) {
    case 'build': return makeBuild(level, stretch, w, rng);
    case 'gap': return makeGap(level, stretch, w, rng);
    case 'chunk': return makeChunk(level, stretch, w, rng);
    case 'fix': return makeFix(level, stretch, w, rng);
    case 'pick': return makePick(level, w, rng);
  }
}

// ---------- checking an answer ----------

/** Fix It's answers: "3" tapped box 3; "3=ck" put ck there; "+2" tapped the gap before letter 2; "+2=m" put m there; "-4" took letter 4 out. */
function checkFix(q: FixQ, a: string): boolean | 'more' | null {
  const m = q.mistake;
  if (m.kind === 'swap') {
    const [box, put] = a.split('=') as [string, string | undefined];
    const i = Number(box);
    if (!Number.isInteger(i) || i < 0 || i >= q.shown.length) return null;
    if (put === undefined) return i === m.box ? 'more' : false;
    if (!q.choices.includes(put)) return null;
    return spell(q.shown.map((s, j) => (j === i ? put : s))) === q.word;
  }
  const letters = q.shown;
  if (a.startsWith('-')) {
    const i = Number(a.slice(1));
    if (!Number.isInteger(i) || i < 0 || i >= letters.length) return null;
    return letters.filter((_, j) => j !== i).join('') === q.word;
  }
  if (a.startsWith('+')) {
    const [gap, put] = a.slice(1).split('=') as [string, string | undefined];
    const g = Number(gap);
    if (!Number.isInteger(g) || g < 0 || g > letters.length) return null;
    const fits = (l: string) => [...letters.slice(0, g), l, ...letters.slice(g)].join('') === q.word;
    if (put === undefined) return m.kind === 'drop' && fits(m.letter) ? 'more' : false;
    if (!q.choices.includes(put)) return null;
    return fits(put);
  }
  return null;
}

/** Is this answer right? `more`: right so far. `null`: not an answer at all. */
export function check(q: Question, a: string): boolean | 'more' | null {
  switch (q.kind) {
    case 'build': {
      if (!a || a.length > q.word.length || !/^[a-z]+$/.test(a)) return null;
      return a === q.word ? true : q.word.startsWith(a) ? 'more' : false;
    }
    case 'gap': return q.choices.includes(a) ? a === q.answer : null;
    case 'chunk': {
      const seq = a.split('|');
      if (!a || seq.length > q.parts.length || seq.some(s => !q.tiles.includes(s))) return null;
      const ok = seq.every((s, i) => s === q.parts[i]);
      return ok ? (seq.length === q.parts.length ? true : 'more') : false;
    }
    case 'fix': return checkFix(q, a);
    case 'pick': return q.choices.includes(a) ? a === q.word : null;
  }
}

/** The right answer in full, for the tests and the browser tour. */
export function rightAnswer(q: Question): string {
  switch (q.kind) {
    case 'build': return q.word;
    case 'gap': return q.answer;
    case 'chunk': return q.parts.join('|');
    case 'pick': return q.word;
    case 'fix': {
      const m = q.mistake;
      if (m.kind === 'swap') return `${m.box}=${m.right}`;
      if (m.kind === 'drop') return `+${m.at}=${m.letter}`;
      return `-${m.at}`;
    }
  }
}
