// Two Words, One Word: compound words whose meaning comes from their two halves (a fire truck is a truck for fires; a toothbrush is
// a brush for teeth). Never one whose halves mislead: no butterfly, ladybug, hot dog, starfish, jellyfish, pineapple, cupboard.
// Plain data, no game code.
//
// - `pic`: the compound has an unmistakable picture (words/pictures.ts), so it can be a Level 1 picture choice.
// - `spaced`: written as two words (fire truck), so it can't be split at Level 2 or built at Level 3.
// - Level 2 (tap where it splits) uses only compounds that split one way into two real words (seashell is out: "seas" + "hell";
//   sunglasses too: "sung" + "lasses").
// - Level 3 (pick the second half) offers wrong halves from SILLY_HALVES, and a wrong half may never make a real word with the first
//   half: ALSO_REAL lists the real words a first half makes beyond this table (rain + coat, sun + hat), and words.test.ts checks
//   every offer against it and the table.

export interface Compound {
  readonly word: string;
  readonly a: string;
  readonly b: string;
  readonly pic?: true;
  readonly spaced?: true;
  /** Not at Level 2: it splits two ways into real words. */
  readonly noSplit?: true;
}

type More = Partial<Pick<Compound, 'pic' | 'spaced' | 'noSplit'>>;
const c = <const W extends string, const A extends string, const B extends string>(word: W, a: A, b: B, more: More = {}) => ({ word, a, b, ...more }) as { readonly word: W; readonly a: A; readonly b: B } & More;

export const COMPOUNDS = [
  c('fire truck', 'fire', 'truck', { pic: true, spaced: true }),
  c('rainbow', 'rain', 'bow', { pic: true }),
  c('football', 'foot', 'ball', { pic: true }),
  c('snowman', 'snow', 'man', { pic: true }),
  c('sunflower', 'sun', 'flower', { pic: true }),
  c('cupcake', 'cup', 'cake', { pic: true }),
  c('popcorn', 'pop', 'corn', { pic: true }),
  c('sailboat', 'sail', 'boat', { pic: true }),
  c('snowflake', 'snow', 'flake', { pic: true }),
  c('toothbrush', 'tooth', 'brush', { pic: true }),
  c('mailbox', 'mail', 'box', { pic: true }),
  c('pancake', 'pan', 'cake', { pic: true }),
  c('sunglasses', 'sun', 'glasses', { pic: true, noSplit: true }),
  c('backpack', 'back', 'pack', { pic: true }),
  c('bathtub', 'bath', 'tub', { pic: true }),
  c('footprint', 'foot', 'print', { pic: true }),
  c('headphones', 'head', 'phones', { pic: true }),
  c('airplane', 'air', 'plane', { pic: true }),
  c('wheelchair', 'wheel', 'chair', { pic: true }),
  c('skateboard', 'skate', 'board', { pic: true }),
  c('watermelon', 'water', 'melon', { pic: true }),
  c('blueberry', 'blue', 'berry', { pic: true }),
  c('basketball', 'basket', 'ball', { pic: true }),
  c('cowboy', 'cow', 'boy', { pic: true }),
  c('seashell', 'sea', 'shell', { pic: true, noSplit: true }),
  c('handbag', 'hand', 'bag', { pic: true }),
  // word only: no picture that could only mean this
  c('bedroom', 'bed', 'room'),
  c('raincoat', 'rain', 'coat'),
  c('goldfish', 'gold', 'fish'),
  c('doghouse', 'dog', 'house'),
  c('birdhouse', 'bird', 'house'),
  c('campfire', 'camp', 'fire'),
  c('treehouse', 'tree', 'house'),
  c('snowball', 'snow', 'ball'),
  c('sandbox', 'sand', 'box'),
  c('sunshine', 'sun', 'shine'),
  c('moonlight', 'moon', 'light'),
  c('bedtime', 'bed', 'time'),
  c('raindrop', 'rain', 'drop'),
  c('fireplace', 'fire', 'place'),
  c('playground', 'play', 'ground'),
  c('doorbell', 'door', 'bell'),
  c('hilltop', 'hill', 'top'),
  c('rowboat', 'row', 'boat'),
] as const satisfies readonly Compound[];

/** Wrong second halves for Level 3: short words he can read, none of them the second half of a compound in the table. */
export const SILLY_HALVES = ['dog', 'cat', 'pig', 'hat', 'cup', 'bus', 'sock', 'egg', 'bug', 'pen', 'jam', 'mop', 'fox', 'van', 'leg', 'nut', 'hen', 'map', 'jet', 'fan'] as const;

/**
 * Real words (and two-word names said as one) that a first half makes beyond the table, so they are never offered as wrong halves.
 * Erring wide on purpose: a wrong half that is only nearly a word is still kept out.
 */
export const ALSO_REAL: readonly string[] = [
  'firedog', 'firefox', 'fireman', 'firepan', 'firebug', 'firecap',
  'raincap', 'rainhat',
  'football', 'footman', 'footcap',
  'snowcap', 'snowcat', 'snowmen', 'snowpup',
  'sunhat', 'sundog', 'suncap', 'sunfan',
  'cupcake',
  'popgun', 'popcan', 'popeye', 'popup', 'popmop',
  'sailcap',
  'toothcap',
  'mailvan', 'mailman', 'mailbag',
  'pancake',
  'backleg', 'backhat', 'backpen', 'backup',
  'bathmat', 'bathcap',
  'headcap', 'headset', 'headpin', 'headman', 'headnut',
  'aircap', 'airbus', 'airman', 'airjet', 'airgun', 'airhen', 'airbag', 'airfan',
  'wheelcap', 'wheelnut',
  'waterhen', 'waterbug', 'waterjet', 'waterfan', 'watermap',
  'bluejay', 'bluecap', 'bluefox',
  'basketcap',
  'cowpat', 'cowpen', 'cowcat',
  'seadog', 'seacat', 'seapig', 'seahen', 'seacap', 'seafox', 'seaegg', 'seabug',
  'handcap', 'handbug',
  'bedbug', 'bedpan', 'bedcap',
  'goldbug', 'goldcap',
  'dogcat', 'dogleg', 'dogfox', 'dogvan',
  'birddog', 'birdcap',
  'campvan', 'campmop',
  'treehen', 'treefox', 'treebug', 'treecat', 'treenut', 'treefan',
  'sandhen', 'sandbug', 'sandcap', 'sanddog',
  'moondog', 'moonman', 'mooncap',
  'playpen', 'playmat', 'playmap',
  'doorcap', 'doorman', 'doormat', 'doorjam',
  'hillcap', 'hillfox',
  'rowcap',
];
