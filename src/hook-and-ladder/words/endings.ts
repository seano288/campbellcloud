// Endings: -s, -ed and -ing on words that don't change their spelling (CCSS L.1.4c's own example: look, looks, looked, looking;
// TEKS 1.3(C): the meaning of -s, -ed and -ing). Regular words only: no ran, mice, feet; no -es (box, boxes); and, by default, no
// word that changes its spelling (hop, hopping; bake, baked), since no first-grade standard asks for those. Plain data.
//
// - THINGS: one, or more than one (dog, dogs). Each has a picture, drawn once or two and three times.
// - ACTIONS: the -s, -ed and -ing forms all just add the ending. Each fits "Yesterday he ___.", "Right now he is ___." and
//   "Every day he ___." with no word after it.

export const THINGS = ['dog', 'cat', 'cup', 'hen', 'bug', 'book', 'tree', 'star', 'bell', 'key', 'drum', 'kite', 'duck', 'frog', 'pig', 'car', 'hat', 'sock', 'shoe', 'egg', 'boot', 'bike'] as const;
export const ACTIONS = ['jump', 'kick', 'play', 'look', 'help', 'walk', 'pull', 'cook', 'paint', 'climb', 'yell', 'spray', 'roll', 'call', 'crawl', 'clean', 'talk', 'float'] as const;
export type Thing = (typeof THINGS)[number];
export type Action = (typeof ACTIONS)[number];

export const ENDINGS = ['s', 'ed', 'ing'] as const;
export type Ending = (typeof ENDINGS)[number];

/** The sentence starts for Level 2, and the ending each one needs. Every other form is wrong after it. */
export const FRAMES = [
  { start: 'Yesterday he', ending: 'ed' },
  { start: 'Right now he is', ending: 'ing' },
  { start: 'Every day he', ending: 's' },
] as const satisfies readonly { start: string; ending: Ending }[];
export type FrameStart = (typeof FRAMES)[number]['start'];

/**
 * The choices a frame offers besides the right one: never a form that could also fit. "Every day he jumped." can be a fair
 * sentence (every day, last summer), and "Right now he is kicked." is one too, so neither frame offers -ed.
 */
export const FRAME_WRONGS: Readonly<Record<Ending, readonly ('' | Ending)[]>> = { ed: ['', 'ing'], ing: ['', 's'], s: ['', 'ing'] };

export const withEnding = (word: string, ending: '' | Ending) => word + ending;
