// Fractions as a 6-year-old meets them: no notation, only things cut into pieces and the words for the pieces. A
// fraction here is "n of the d equal pieces", said as words ("three quarters"), and drawn as a pizza, a cake or a
// chocolate bar. Every sentence is a whole recorded phrase (tools/make_voice.py), so the voice never stitches a number
// into the middle of a sentence.

/** How many equal pieces a whole is cut into. */
export const DENS = [2, 3, 4, 6, 8] as const;
export type Den = (typeof DENS)[number];

export interface Frac { readonly n: number; readonly d: Den }
export type FracKey = `${number}/${Den}`;
export const key = (f: Frac): FracKey => `${f.n}/${f.d}`;
export const parseKey = (k: string): Frac | null => {
  const m = /^(\d+)\/(\d+)$/.exec(k);
  if (!m) return null;
  const n = Number(m[1]), d = Number(m[2]) as Den;
  return DENS.includes(d) && n >= 0 && n <= d ? { n, d } : null;
};
/** Same amount: two quarters is one half. */
export const same = (a: Frac, b: Frac) => a.n * b.d === b.n * a.d;
export const bigger = (a: Frac, b: Frac) => a.n * b.d > b.n * a.d;

export const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'] as const;
export type NumberWord = (typeof NUMBER_WORDS)[number];
export const numberWord = (n: number): NumberWord => NUMBER_WORDS[n]!;
const cap = <S extends string>(s: S) => (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<S>;

/** The pieces' names, one and many. */
export const PIECE_NAMES = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'] } as const;
type PiecePlural = (typeof PIECE_NAMES)[Den][1];

/** Every fraction the game says, in words. */
export const FRAC_WORDS = {
  '1/2': 'one half', '1/3': 'one third', '1/4': 'one quarter', '1/6': 'one sixth', '1/8': 'one eighth',
  '2/3': 'two thirds', '3/4': 'three quarters', '2/4': 'two quarters', '2/6': 'two sixths', '3/6': 'three sixths', '4/6': 'four sixths',
  '5/6': 'five sixths', '2/8': 'two eighths', '3/8': 'three eighths', '4/8': 'four eighths', '5/8': 'five eighths', '6/8': 'six eighths',
} as const satisfies Partial<Record<FracKey, string>>;
export type FracWord = (typeof FRAC_WORDS)[keyof typeof FRAC_WORDS];
export type SaidFrac = keyof typeof FRAC_WORDS;
export const fracWord = (f: Frac): FracWord => {
  const w = (FRAC_WORDS as Record<string, FracWord>)[key(f)];
  if (!w) throw new Error(`No words for ${key(f)}`);
  return w;
};
export const said = (f: Frac) => key(f) in FRAC_WORDS;
export const unit = (d: Den): Frac => ({ n: 1, d });

// ---------- the things that get cut ----------

/** The pizza is cut into wedges; the cake and the chocolate bar into rectangles. */
export const FOODS = ['pizza', 'cake', 'chocolate bar'] as const;
export type Food = (typeof FOODS)[number];
export const FOOD_ICONS: Record<Food, string> = { pizza: '🍕', cake: '🎂', 'chocolate bar': '🍫' };

/**
 * A food cut into pieces: each piece's share of the whole (they add up to 1), and which pieces are coloured in.
 * Equal pieces all have the same share.
 */
export interface Picture { readonly food: Food; readonly pieces: readonly number[]; readonly shaded: readonly number[] }
export const equalPieces = (d: number) => Array.from({ length: d }, () => 1 / d);
export const isEqual = (p: Picture) => p.pieces.every(w => Math.abs(w - 1 / p.pieces.length) < 1e-6);
export const cut = (food: Food, d: number, shaded = 0): Picture => ({ food, pieces: equalPieces(d), shaded: Array.from({ length: shaded }, (_, i) => i) });

// ---------- everything said about fractions ----------
// The sentences' types leave the fraction and the numbers open (`${string}`): every combination the game can say is
// listed by problemPhrases(), and the voice check fails the build if one isn't recorded.

/** "Four equal pieces are quarters." */
export const piecesAre = (d: Den) => `${cap(numberWord(d))} equal pieces are ${PIECE_NAMES[d][1]}.` as `${string} equal pieces are ${PiecePlural}.`;
/** "So one piece is one quarter." */
export const onePieceIs = (d: Den) => `So one piece is ${fracWord(unit(d))}.` as `So one piece is ${string}.`;
/** "Three quarters means three of the four equal pieces." */
export const means = (f: Frac) => `${cap(fracWord(f))} means ${numberWord(f.n)} of the ${numberWord(f.d)} equal pieces.` as `${string} means ${string} of the ${string} equal pieces.`;
/** "This one has three quarters left!" / "That one has one third left." */
export const thisShows = (f: Frac) => `This one has ${fracWord(f)} left!` as `This one has ${string} left!`;
export const thatShows = (f: Frac) => `That one has ${fracWord(f)} left.` as `That one has ${string} left.`;
/** What a wrong picture shows, including the whole thing and nothing (the other choices before he knows two words). */
export const thatOne = (f: Frac) => (f.n === f.d ? 'That one is the whole thing.' : f.n === 0 ? 'That one is all gone.' : thatShows(f));
/** "The pizza is cut into four equal pieces." */
export const cutInto = (food: Food, d: Den) => `The ${food} is cut into ${numberWord(d)} equal pieces.` as `The ${Food} is cut into ${string} equal pieces.`;
/** "Find the pizza with three quarters left!" */
export const findLine = (f: Frac, food: Food) => `Find the ${food} with ${fracWord(f)} left!` as `Find the ${Food} with ${string} left!`;
/** "Color one half of the cake!" */
export const colorLine = (f: Frac, food: Food) => `Color ${fracWord(f)} of the ${food}!` as `Color ${string} of the ${Food}!`;
/** "You colored three of the eight pieces." */
export const coloredLine = (k: number, d: Den) => `You colored ${numberWord(k)} of the ${numberWord(d)} pieces.` as `You colored ${string} of the ${string} pieces.`;
/** "One half of four pieces is two pieces." */
export const partOf = (f: Frac, d: Den) => {
  const k = (f.n * d) / f.d;
  return `${cap(fracWord(f))} of ${numberWord(d)} pieces is ${numberWord(k)} ${k === 1 ? 'piece' : 'pieces'}.` as `${string} of ${string} pieces is ${string} ${'piece' | 'pieces'}.`;
};
/** "Which is bigger, one half or one quarter?" */
export const whichBigger = (a: Frac, b: Frac) => `Which is bigger, ${fracWord(a)} or ${fracWord(b)}?` as `Which is bigger, ${string} or ${string}?`;
/** "So one half is bigger!" / "One half is the same as two quarters!" */
export const isBigger = (f: Frac) => `So ${fracWord(f)} is bigger!` as `So ${string} is bigger!`;
export const isSame = (a: Frac, b: Frac) => `${cap(fracWord(a))} is the same as ${fracWord(b)}!` as `${string} is the same as ${string}!`;
/** "Which pizza is cut into equal pieces?" */
export const whichFair = (food: Food) => `Which ${food} is cut into equal pieces?` as `Which ${Food} is cut into equal pieces?`;
/** "Four friends share a pizza. How many equal pieces should we cut?" */
export const friendsShare = (n: number, food: Food) => `${cap(numberWord(n))} friends share a ${food}. How many equal pieces should we cut?` as `${string} friends share a ${Food}. How many equal pieces should we cut?`;
export const friendsNeed = (n: number) => `${cap(numberWord(n))} friends need ${numberWord(n)} equal pieces.` as `${string} friends need ${string} equal pieces.`;
/** "There are eight cookies. You get one quarter. How many cookies do you get?" */
export const cookiesAsk = (total: number, f: Frac) => `There are ${numberWord(total)} cookies. You get ${fracWord(f)} of them. How many cookies do you get?` as `There are ${string} cookies. You get ${string} of them. How many cookies do you get?`;
/** "Share them onto four plates." */
export const platesLine = (d: Den) => `Let's share them onto ${numberWord(d)} plates.` as `Let's share them onto ${string} plates.`;
export const eachGets = (k: number) => (k === 1 ? 'Each plate gets one cookie.' : `Each plate gets ${numberWord(k)} cookies.`) as `Each plate gets ${string} ${'cookie' | 'cookies'}.`;
export const youGet = (k: number) => (k === 1 ? 'So you get one cookie!' : `So you get ${numberWord(k)} cookies!`) as `So you get ${string} ${'cookie' | 'cookies'}!`;
/** The Fuel Lock: "Fill the tank three quarters full!" */
export const fillLine = (f: Frac) => `Fill the tank ${fracWord(f)} full!` as `Fill the tank ${string} full!`;
export const filledLine = (k: number, d: Den) => `You filled ${numberWord(k)} of the ${numberWord(d)} parts.` as `You filled ${string} of the ${string} parts.`;
export const partsOfTank = (f: Frac, d: Den) => {
  const k = (f.n * d) / f.d;
  return `${cap(fracWord(f))} of ${numberWord(d)} parts is ${numberWord(k)} ${k === 1 ? 'part' : 'parts'}.` as `${string} of ${string} parts is ${string} ${'part' | 'parts'}.`;
};

// ---------- meeting a new word, before he is ever asked about it ----------
// Each word is shown before it's asked: "Look! A whole pizza. The pizza is cut into two equal pieces. … Two equal pieces
// are halves. So one piece is one half. Two halves make the whole pizza!" A quarter is met as half of a half, an eighth
// as half of a quarter and a sixth as half of a third.

/** The order he meets the words in: halves first, then quarters (half of a half), thirds, and eighths and sixths last. */
export const WORD_ORDER = [2, 4, 3, 8, 6] as const satisfies readonly Den[];
/** How a word is cut: straight into thirds, or by halving again (quarters are halves cut in half). */
export const MEET_CUTS: Record<Den, readonly Den[]> = { 2: [2], 4: [2, 4], 3: [3], 8: [4, 8], 6: [3, 6] };
/** "Look! A whole pizza." */
export const wholeFood = (food: Food) => `Look! A whole ${food}.` as `Look! A whole ${Food}.`;
/** "Now cut each half in half!" */
export const cutEachInHalf = (d: 2 | 3 | 4) => `Now cut each ${PIECE_NAMES[d][0]} in half!` as `Now cut each ${'half' | 'third' | 'quarter'} in half!`;
/** "Half of a half is one quarter!" */
export const HALF_OF = { 4: 'Half of a half is one quarter!', 8: 'Half of a quarter is one eighth!', 6: 'Half of a third is one sixth!' } as const;
/** "Four quarters make the whole pizza!" */
export const makeTheWhole = (d: Den, food: Food) => `${cap(numberWord(d))} ${PIECE_NAMES[d][1]} make the whole ${food}!` as `${string} ${PiecePlural} make the whole ${Food}!`;
/** "Tap one quarter!": any one piece is right. */
export const tapOne = (d: Den) => `Tap ${fracWord(unit(d))}!` as `Tap ${string}!`;

export type NumberPhrase = `${number}`;
export const numberPhrase = (n: number) => String(n) as NumberPhrase;

export const FRACTION_LINES = [
  'Not quite!', 'Try again!', "Let's look together.", 'Look!', 'Tap the pieces to color them.', 'Color some pieces!',
  'Equal pieces are all the same size.', 'These pieces are all the same size!', 'These pieces are not the same size.',
  'What is one piece called?', 'More pieces means smaller pieces!', 'They are the same!', 'One piece for each friend!',
  "Let's count the pieces.", 'Tap the tank to fill it.', 'A new word!', 'That one is the whole thing.', 'That one is all gone.',
] as const;
export type FractionLine = (typeof FRACTION_LINES)[number];
export type FractionPhrase = FractionLine | FracWord | NumberPhrase
  | ReturnType<typeof piecesAre> | ReturnType<typeof onePieceIs> | ReturnType<typeof means> | ReturnType<typeof thisShows> | ReturnType<typeof thatShows>
  | ReturnType<typeof cutInto> | ReturnType<typeof findLine> | ReturnType<typeof colorLine> | ReturnType<typeof coloredLine> | ReturnType<typeof partOf>
  | ReturnType<typeof whichBigger> | ReturnType<typeof isBigger> | ReturnType<typeof isSame> | ReturnType<typeof whichFair>
  | ReturnType<typeof friendsShare> | ReturnType<typeof friendsNeed> | ReturnType<typeof cookiesAsk> | ReturnType<typeof platesLine>
  | ReturnType<typeof eachGets> | ReturnType<typeof youGet> | ReturnType<typeof fillLine> | ReturnType<typeof filledLine> | ReturnType<typeof partsOfTank>
  | ReturnType<typeof wholeFood> | ReturnType<typeof cutEachInHalf> | (typeof HALF_OF)[keyof typeof HALF_OF] | ReturnType<typeof makeTheWhole> | ReturnType<typeof tapOne>;
