// Strong Words: words that mean nearly the same, one stronger than another (CCSS L.1.5d: adjectives differing in intensity, large
// and gigantic; verbs differing in manner, look and peek and stare). This is the hardest content to get right, so it is a short,
// hand-checked table, and the parent should read every set before it ships. Plain data.
//
// - SCALES: three words, weakest first, each clearly more than the one before. Level 2 asks for the strongest ("Which is the
//   loudest?"), Level 3 for all three in order.
// - PAIRS: two words, the weaker first. Level 1 asks "Which is bigger, big or huge?". Every scale also gives its pairs.
// - `more`: the question's word ("bigger"), `most`: Level 2's ("biggest"), `order`: Level 3's instruction.

export interface Scale {
  readonly id: string;
  readonly words: readonly [string, string, string];
  readonly more: string;
  readonly most: string;
  readonly order: string;
}
export interface Pair { readonly words: readonly [string, string]; readonly more: string }

export const SCALES = [
  { id: 'size', words: ['little', 'big', 'huge'], more: 'bigger', most: 'biggest', order: 'Put them in order, from smallest to biggest.' },
  { id: 'hot', words: ['warm', 'hot', 'boiling'], more: 'hotter', most: 'hottest', order: 'Put them in order, from coolest to hottest.' },
  { id: 'cold', words: ['cool', 'cold', 'freezing'], more: 'colder', most: 'coldest', order: 'Put them in order, from warmest to coldest.' },
  { id: 'voice', words: ['whisper', 'talk', 'shout'], more: 'louder', most: 'loudest', order: 'Put them in order, from quiet to loud.' },
  { id: 'move', words: ['walk', 'jog', 'run'], more: 'faster', most: 'fastest', order: 'Put them in order, from slow to fast.' },
  { id: 'wet', words: ['damp', 'wet', 'soaked'], more: 'wetter', most: 'wettest', order: 'Put them in order, from driest to wettest.' },
  { id: 'door', words: ['tap', 'knock', 'bang'], more: 'louder', most: 'loudest', order: 'Put them in order, from quiet to loud.' },
  { id: 'look', words: ['peek', 'look', 'stare'], more: 'longer', most: 'longest', order: 'Put them in order, from short to long.' },
] as const satisfies readonly Scale[];

export const PAIRS = [
  { words: ['small', 'tiny'], more: 'smaller' },
  { words: ['good', 'great'], more: 'better' },
  { words: ['bad', 'awful'], more: 'worse' },
  { words: ['hungry', 'starving'], more: 'hungrier' },
  { words: ['full', 'stuffed'], more: 'fuller' },
  { words: ['dirty', 'filthy'], more: 'dirtier' },
  { words: ['sip', 'gulp'], more: 'bigger' },
  { words: ['scared', 'terrified'], more: 'more scared' },
] as const satisfies readonly Pair[];

/** Every Level 1 pair: the table's own, and each scale's three (first and second, second and third, first and third). */
export const ALL_PAIRS: readonly Pair[] = [
  ...SCALES.flatMap(s => [
    { words: [s.words[0], s.words[1]] as const, more: s.more },
    { words: [s.words[1], s.words[2]] as const, more: s.more },
    { words: [s.words[0], s.words[2]] as const, more: s.more },
  ]),
  ...PAIRS,
];
