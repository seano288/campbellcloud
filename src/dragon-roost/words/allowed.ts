// Dragon Roost's own words: the ones a question may show that are not on Sight Squad's, Dino Dig's, Word Wreckers' or Cargo Words' lists.
// Every other word in a question is on one of those lists (or is one of them with a plain -s, -es, -ed or -ing), and words.test.ts
// checks it. Plain data.
//
// - The dragon words the brief names (dragon, egg, roost, flame; wing is a Dino Dig word) and the dragon's own doing words, met first in
//   the Meetings, each with the dragon showing it and the voice saying it.
// - The words the kinds exist to teach: the plurals and pasts that change, the squeezed words, the time words, and the names, days,
//   months and places that need a big letter. Each is met in its kind's Meeting and said in every lesson that shows it.

export const DRAGON_WORDS = ['dragon', 'egg', 'roost', 'flame', 'roar', 'glide', 'flap', 'loop', 'dive', 'hatch', 'flies', 'flew'] as const;
export const TIME_WORDS = ['yesterday', 'tomorrow'] as const;
export const PLURAL_WORDS = ['mouse', 'mice', 'foot', 'feet', 'tooth', 'goose', 'geese', 'man', 'men', 'woman', 'women', 'child', 'deer'] as const;
export const PAST_WORDS = ['ate', 'came', 'sat', 'hid', 'hide', 'told', 'tell', 'dug', 'swam', 'rode', 'made', 'found', 'slept', 'grew', 'blew', 'drove'] as const;
export const SQUEEZE_WORDS = ["don't", "can't", "isn't", "I'm", "it's", "didn't", "wasn't", "aren't", "hasn't", "won't", "I'll", "we're", "they're", "he's", "she's", 'am'] as const;
/** Names of people and pets: short, and each one read the usual way. */
export const NAMES = ['Sam', 'Max', 'Pip', 'Ben', 'Kim', 'Meg', 'Tom', 'Jill'] as const;
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
/** Places that need a big letter (L.2.2a, geographic names): real ones, each made of sounds he has met. */
export const PLACES = ['Spain', 'Rome', 'Texas', 'Paris', 'London', 'Japan', 'Peru', 'China'] as const;

export const GAME_WORDS: readonly string[] = [...DRAGON_WORDS, ...TIME_WORDS, ...PLURAL_WORDS, ...PAST_WORDS, ...SQUEEZE_WORDS, ...NAMES, ...DAYS, ...MONTHS, ...PLACES];

/** Pictures for the game's own words, shown when they are met and in the lessons. */
export const WORD_PICS: Readonly<Record<string, string>> = {
  dragon: '🐉', egg: '🥚', roost: '🏔️', flame: '🔥', mouse: '🐭', mice: '🐭🐭', foot: '🦶', feet: '🦶🦶', tooth: '🦷', teeth: '🦷🦷', goose: '🪿', geese: '🪿🪿',
  man: '👨', men: '👨👨', woman: '👩', women: '👩👩', child: '🧒', children: '🧒🧒', sheep: '🐑', deer: '🦌', fish: '🐟',
};
