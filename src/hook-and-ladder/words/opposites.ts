// Opposites: a word and its one clear opposite. Each entry is one way round ("the opposite of hot is cold"); the other way round is
// its own entry only when that is also clear (the opposite of short could be tall or long, so short is never asked). Plain data.
//
// - `also`: other fair opposites, never offered as a wrong choice (cool and chilly for hot). Wrong choices also come only from other
//   `group`s, so a wrong choice is never a second fair answer.
// - `pic`: both words have an unmistakable picture (words/pictures.ts), or are drawn (big and little): Level 1.
// - `say`: the Level 3 sentence, "The soup is not hot." He picks what it is instead ("It is...", so the subject is a thing or an
//   animal, never a person). Only words that describe something have one.

export interface Opposite {
  readonly word: string;
  readonly opp: string;
  readonly group: string;
  readonly also?: readonly string[];
  readonly pic?: true;
  readonly say?: string;
}

const o = <const W extends string, const O extends string, const S extends string = never>(word: W, opp: O, group: string, more: { also?: readonly string[]; pic?: true; say?: S } = {}) =>
  ({ word, opp, group, ...more }) as { readonly word: W; readonly opp: O; readonly group: string; readonly also?: readonly string[]; readonly pic?: true; readonly say?: S };

export const OPPOSITES = [
  o('hot', 'cold', 'heat', { pic: true, also: ['cool', 'chilly', 'icy', 'freezing'], say: 'The soup is not hot.' }),
  o('cold', 'hot', 'heat', { pic: true, also: ['warm', 'boiling'], say: 'The milk is not cold.' }),
  o('big', 'little', 'size', { pic: true, also: ['small', 'tiny'], say: 'The dog is not big.' }),
  o('little', 'big', 'size', { pic: true, also: ['large', 'huge'], say: 'The bug is not little.' }),
  o('happy', 'sad', 'feeling', { pic: true, also: ['upset', 'unhappy'], say: 'The song is not happy.' }),
  o('sad', 'happy', 'feeling', { pic: true, also: ['glad'], say: 'The story is not sad.' }),
  o('fast', 'slow', 'speed', { pic: true, say: 'The snail is not fast.' }),
  o('slow', 'fast', 'speed', { pic: true, also: ['quick'], say: 'The rabbit is not slow.' }),
  o('up', 'down', 'updown', { pic: true }),
  o('down', 'up', 'updown', { pic: true }),
  o('day', 'night', 'time', { pic: true }),
  o('night', 'day', 'time', { pic: true }),
  o('open', 'shut', 'door', { pic: true, also: ['closed'], say: 'The door is not open.' }),
  o('shut', 'open', 'door', { pic: true, say: 'The box is not shut.' }),
  o('loud', 'quiet', 'sound', { pic: true, also: ['soft', 'silent'], say: 'The mouse is not loud.' }),
  o('quiet', 'loud', 'sound', { pic: true, also: ['noisy'], say: 'The drum is not quiet.' }),
  o('laugh', 'cry', 'face', { pic: true }),
  o('cry', 'laugh', 'face', { pic: true }),
  o('smile', 'frown', 'face2', { pic: true }),
  o('left', 'right', 'side', { pic: true }),
  o('wet', 'dry', 'water', { say: 'The towel is not wet.' }),
  o('dry', 'wet', 'water', { also: ['damp', 'soaked'], say: 'The sock is not dry.' }),
  o('full', 'empty', 'fill', { say: 'The cup is not full.' }),
  o('empty', 'full', 'fill', { say: 'The box is not empty.' }),
  o('clean', 'dirty', 'mess', { also: ['messy', 'muddy'], say: 'The pig is not clean.' }),
  o('dirty', 'clean', 'mess', { say: 'The plate is not dirty.' }),
  o('tall', 'short', 'height', { also: ['little', 'small'], say: 'The tree is not tall.' }),
  o('long', 'short', 'length', { also: ['little', 'small'], say: 'The snake is not long.' }),
  o('hard', 'soft', 'feel', { also: ['easy'], say: 'The bed is not hard.' }),
  o('heavy', 'light', 'weight', { say: 'The rock is not heavy.' }),
  o('dark', 'light', 'shine', { also: ['bright'], say: 'The room is not dark.' }),
  o('thick', 'thin', 'thick', { say: 'The book is not thick.' }),
  o('strong', 'weak', 'power', { say: 'The rope is not strong.' }),
  o('easy', 'hard', 'work', { also: ['tough', 'difficult'], say: 'The game is not easy.' }),
  o('good', 'bad', 'goodness', { also: ['awful'] }),
  o('in', 'out', 'inout'),
  o('out', 'in', 'inout'),
  o('on', 'off', 'onoff'),
  o('off', 'on', 'onoff'),
  o('top', 'bottom', 'topbottom'),
  o('bottom', 'top', 'topbottom'),
  o('push', 'pull', 'pushpull'),
  o('pull', 'push', 'pushpull'),
  o('yes', 'no', 'yesno'),
  o('no', 'yes', 'yesno'),
  o('first', 'last', 'order'),
  o('last', 'first', 'order'),
  o('near', 'far', 'distance'),
  o('far', 'near', 'distance', { also: ['close'] }),
  o('high', 'low', 'level'),
  o('low', 'high', 'level'),
  o('early', 'late', 'when'),
  o('late', 'early', 'when'),
  o('before', 'after', 'beforeafter'),
  o('after', 'before', 'beforeafter'),
  o('over', 'under', 'overunder'),
  o('under', 'over', 'overunder'),
  o('inside', 'outside', 'insideout'),
  o('outside', 'inside', 'insideout'),
  o('black', 'white', 'colour'),
  o('white', 'black', 'colour'),
  o('asleep', 'awake', 'sleep'),
  o('awake', 'asleep', 'sleep'),
  o('sit', 'stand', 'sitstand'),
  o('give', 'take', 'givetake'),
  o('float', 'sink', 'water2'),
  o('win', 'lose', 'game'),
  o('front', 'back', 'frontback', { also: ['behind'] }),
  o('always', 'never', 'often'),
  o('come', 'go', 'comego', { also: ['leave'] }),
] as const;
OPPOSITES satisfies readonly Opposite[];

/**
 * Groups too close to give each other wrong choices: the opposite of high is low, and "down" beside it would be a fair answer too.
 * A wrong choice comes only from a group that is not the question's own and not its kin (from every list the group is in).
 */
export const KIN: readonly (readonly string[])[] = [
  ['updown', 'level', 'topbottom', 'overunder'], ['inout', 'insideout'], ['size', 'height', 'length', 'thick', 'weight'],
  ['feeling', 'face', 'face2'], ['when', 'beforeafter', 'order', 'time'], ['door', 'onoff'], ['feel', 'work'], ['water', 'water2'],
  ['comego', 'givetake', 'pushpull'],
  // near misses a child could fairly pick (pass 2): the opposite of laugh is not quiet, of happy not bad, of day not dark, of float not
  // heavy or down, of sit or asleep not up, of on not out or under, of tall not low, of long not near, of yes not never, of win or
  // front not last, of dark not white
  ['feeling', 'face', 'face2', 'goodness', 'sound'], ['time', 'shine', 'colour'], ['water2', 'weight', 'updown', 'overunder'],
  ['updown', 'sitstand', 'sleep'], ['onoff', 'inout', 'overunder'], ['height', 'level'], ['length', 'distance'], ['yesno', 'often'],
  ['game', 'order', 'frontback'],
];

/** Words that describe something, the only ones used in a Level 3 sentence, so every choice fits "It is ___." */
export const DESCRIBING = new Set<string>(OPPOSITES.filter(x => x.say).flatMap(x => [x.word, x.opp]));
