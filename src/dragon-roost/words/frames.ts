// The kinds' own tables: sentences with a gap and the words that could go in it (the right one first), the words that change for more
// than one or for yesterday, the squeezed words, and the dragons Adjectives Level 3 draws. Plain data, no game code; words.test.ts
// checks every word is one he can read and every gap has exactly one right word.
//
// A frame is written with its choices in brackets, the right one first: 'The dragon [flies|fly] up the hill.' Each frame is recorded
// twice: with its gap (said "blank", as a teacher reads one) for the question, and whole for the lesson.

export interface Frame { readonly spec: string; readonly before: string; readonly after: string; readonly right: string; readonly wrong: readonly string[] }
export function frame(spec: string): Frame {
  const m = /^(.*?)\[([^\]]+)\](.*)$/.exec(spec);
  if (!m) throw new Error(`no gap in ${spec}`);
  const [right, ...wrong] = m[2]!.split('|') as [string, ...string[]];
  return { spec, before: m[1]!, after: m[3]!, right, wrong };
}
/** The frame said whole, with the right word in its gap. */
export const whole = (f: Frame) => strip(`${f.before}${f.right}${f.after}`);
/** The frame with its gap, as shown and said. */
export const gapped = (f: Frame) => strip(`${f.before}___${f.after}`);
/** The frame with a choice in its gap. */
export const withWord = (f: Frame, w: string) => strip(`${f.before}${w}${f.after}`);
const strip = (s: string) => s.replace(/:[a-zA-Z]\b/g, '');

// ---------- Verbs, Level 3: the doing word that fits who does it (L.1.1c) ----------
export const VERB_FRAMES = [
  'The dragon [flies|fly] up the hill.', 'The dragons [fly|flies] up the hill.', 'I [ride|rides] on my dragon.', 'Sam [rides|ride] on the dragon.',
  'We [swim|swims] in the lake.', 'The king [swims|swim] in the lake.', 'The eggs [sit|sits] in the nest.', 'The egg [sits|sit] in the nest.',
  'They [dig|digs] in the mud.', 'The dragon [digs|dig] in the mud.', 'Max [hugs|hug] the dragon.', 'You [hug|hugs] the dragon.',
  'The girl [runs|run] to the roost.', 'The girls [run|runs] to the roost.', 'My dragon [eats|eat] cake.', 'Dragons [eat|eats] cake.',
].map(frame);

// ---------- More Than One (L.2.1b) ----------
export interface Plural { readonly one: string; readonly many: string; readonly same: boolean; readonly made?: string; readonly pic: string }
/** Only forms nobody argues over: no fishes, no persons. `made` is the wrong form a child makes by adding s, shown at Level 3. */
export const PLURALS: readonly Plural[] = [
  { one: 'mouse', many: 'mice', same: false, made: 'mouses', pic: '🐭' },
  { one: 'foot', many: 'feet', same: false, made: 'foots', pic: '🦶' },
  { one: 'tooth', many: 'teeth', same: false, made: 'tooths', pic: '🦷' },
  { one: 'goose', many: 'geese', same: false, made: 'gooses', pic: '🪿' },
  { one: 'man', many: 'men', same: false, made: 'mans', pic: '👨' },
  { one: 'woman', many: 'women', same: false, made: 'womans', pic: '👩' },
  { one: 'child', many: 'children', same: false, made: 'childs', pic: '🧒' },
  { one: 'sheep', many: 'sheep', same: true, made: 'sheeps', pic: '🐑' },
  { one: 'deer', many: 'deer', same: true, made: 'deers', pic: '🦌' },
  { one: 'fish', many: 'fish', same: true, pic: '🐟' },
];
export const CHANGING = PLURALS.filter(p => !p.same);
/** Level 2: one or more than one, from the words round the gap. */
export const PLURAL_FRAMES = [
  'The dragon has two big [feet|foot].', 'I have one sock on my [foot|feet].', 'Three [mice|mouse] ran into the barn.', 'A little [mouse|mice] sat on the egg.',
  'The dragon has sharp [teeth|tooth].', 'The baby has one [tooth|teeth].', 'Five [geese|goose] swim in the pond.', 'A [goose|geese] is on the hill.',
  'Two [men|man] ride the dragon.', 'The [man|men] has a red hat.', 'Three [women|woman] went to the farm.', 'A [woman|women] can see the dragon.',
  'Three [children|child] play in the park.', 'One [child|children] can ride the dragon.', 'Two [mice|mouse] hid in the shed.', 'Ten [geese|goose] sit on the hill.',
].map(frame);
/** Level 3: the words that don't change, mixed with the rest, against the form made by adding s. */
export const PLURAL_FRAMES_3 = [
  'Three [sheep|sheeps] eat the grass.', 'Two [sheep|sheeps] sleep in the barn.', 'Two [deer|deers] ran up the hill.', 'Five [deer|deers] hid in the park.',
  'The dragon has big [feet|foots].', 'Three [mice|mouses] ran into the barn.', 'Two [men|mans] went to the market.', 'The dragon has sharp [teeth|tooths].',
  'Five [geese|gooses] swim in the lake.', 'The [children|childs] play in the park.', 'Two [women|womans] ride the big dragon.', 'Ten [sheep|sheeps] sit on the hill.',
  'Three [deer|deers] sleep by the lake.',
].map(frame);

// ---------- Yesterday (L.1.1e, L.2.1d) ----------
/** Level 1: a plain -ed in a sentence that starts with Yesterday. */
export const PAST_FRAMES_1 = [
  'Yesterday the dragon [jumped|jump|jumps] on the rock.', 'Yesterday Sam [hugged|hug|hugs] the dragon.', 'Yesterday we [played|play|plays] on the hill.',
  'Yesterday the king [looked|look|looks] at the egg.', 'Yesterday the dragon [kicked|kick|kicks] a ball.', 'Yesterday Kim [painted|paint|paints] the egg.',
  'Yesterday the dragon [helped|help|helps] the king.', 'Yesterday Max [walked|walk|walks] up the hill.', 'Yesterday Ben [planted|plant|plants] a tree.',
  'Yesterday the baby [clapped|clap|claps].', 'Yesterday the dragon [rested|rest|rests] in the cave.', 'Yesterday Dot [filled|fill|fills] the cup.',
  'Yesterday the dragon [sprayed|spray|sprays] the grass.', 'Yesterday Tom [smiled|smile|smiles] at the dragon.', 'Yesterday we [visited|visit|visits] the roost.',
].map(frame);
/** The doing words that change, each with the form nobody argues over (no dreamt, dove, lit or hung). */
export const PASTS = [
  ['run', 'ran'], ['fly', 'flew'], ['eat', 'ate'], ['see', 'saw'], ['go', 'went'], ['come', 'came'], ['sit', 'sat'], ['hide', 'hid'], ['tell', 'told'],
  ['dig', 'dug'], ['swim', 'swam'], ['ride', 'rode'], ['make', 'made'], ['find', 'found'], ['sleep', 'slept'], ['grow', 'grew'], ['blow', 'blew'], ['drive', 'drove'],
] as const;
/** Forms that are argued over, or two words: never on a table here. */
export const DISPUTED = ['dreamt', 'dreamed', 'dove', 'dived', 'lit', 'lighted', 'hung', 'hanged', 'shone', 'shined', 'snuck', 'sneaked', 'leapt', 'leaped', 'fishes', 'persons', 'spelt', 'knelt', 'woke', 'waked', 'got', 'gotten'];
/** Level 2: the ones that change. */
export const PAST_FRAMES_2 = [
  'Yesterday the dragon [ran|run|runs] up the hill.', 'Yesterday the dragon [flew|fly|flies] to the lake.', 'Yesterday Sam [ate|eat|eats] a big cake.',
  'Yesterday Kim [saw|see|sees] a red egg.', 'Yesterday we [went|go|goes] to the roost.', 'Yesterday the king [came|come|comes] to the roost.',
  'Yesterday the dragon [sat|sit|sits] on the egg.', 'Yesterday the kitten [hid|hide|hides] in the box.', 'Yesterday Ben [told|tell|tells] the king.',
  'Yesterday the dragon [dug|dig|digs] in the mud.', 'Yesterday we [swam|swim|swims] in the lake.', 'Yesterday Max [rode|ride|rides] the dragon.',
  'Yesterday Dot [made|make|makes] a kite.', 'Yesterday the girl [found|find|finds] a big egg.', 'Yesterday the dragon [slept|sleep|sleeps] in the cave.',
  'Yesterday the dragon [grew|grow|grows] so big!', 'Yesterday the dragon [blew|blow|blows] a big bubble.', 'Yesterday Tom [drove|drive|drives] the truck.',
].map(frame);
/** Level 3: yesterday or tomorrow picks the form. Every one is about one person or one dragon, so the bare word ("Tomorrow Max go") is
 *  never right: "Tomorrow we go" would be. */
export const TIME_FRAMES = [
  'Yesterday the dragon [flew|fly|will fly] to the lake.', 'Tomorrow the dragon [will fly|fly|flew] to the lake.',
  'Yesterday Sam [ran|run|will run] up the hill.', 'Tomorrow Sam [will run|run|ran] up the hill.',
  'Yesterday the dragon [ate|eat|will eat] the cake.', 'Tomorrow the dragon [will eat|eat|ate] the cake.',
  'Yesterday Max [went|go|will go] to the roost.', 'Tomorrow Max [will go|go|went] to the roost.',
  'Yesterday Kim [swam|swim|will swim] in the lake.', 'Tomorrow Kim [will swim|swim|swam] in the lake.',
  'Yesterday Ben [rode|ride|will ride] the dragon.', 'Tomorrow Ben [will ride|ride|rode] the dragon.',
  'Yesterday the egg [sat|sit|will sit] in the nest.', 'Tomorrow the egg [will sit|sit|sat] in the nest.',
  'Yesterday the dragon [dug|dig|will dig] in the mud.', 'Tomorrow the dragon [will dig|dig|dug] in the mud.',
].map(frame);

// ---------- Squeeze (L.2.2c) ----------
export interface Squeeze { readonly word: string; readonly from: string; readonly level: 1 | 3; readonly gone: string }
/** Each squeezed word, the two words it comes from, and the letters that fall out (where the apostrophe goes). Never its/it's or
 *  your/you're: those belong later. */
export const SQUEEZES: readonly Squeeze[] = [
  { word: "don't", from: 'do not', level: 1, gone: 'o' }, { word: "can't", from: 'can not', level: 1, gone: 'no' }, { word: "isn't", from: 'is not', level: 1, gone: 'o' },
  { word: "I'm", from: 'I am', level: 1, gone: 'a' }, { word: "it's", from: 'it is', level: 1, gone: 'i' }, { word: "didn't", from: 'did not', level: 1, gone: 'o' },
  { word: "wasn't", from: 'was not', level: 1, gone: 'o' }, { word: "aren't", from: 'are not', level: 1, gone: 'o' }, { word: "hasn't", from: 'has not', level: 1, gone: 'o' },
  { word: "won't", from: 'will not', level: 3, gone: 'o' }, { word: "I'll", from: 'I will', level: 3, gone: 'wi' }, { word: "we're", from: 'we are', level: 3, gone: 'a' },
  { word: "they're", from: 'they are', level: 3, gone: 'a' }, { word: "he's", from: 'he is', level: 3, gone: 'i' }, { word: "she's", from: 'she is', level: 3, gone: 'i' },
];
export const squeezeOf = (w: string) => SQUEEZES.find(s => s.word === w)!;
/** Where the apostrophe goes in the word: the number of letters before it. */
export const apostropheAt = (w: string) => w.indexOf("'");
/** Level 3: the two words in a sentence, and the squeezed word for them. */
export interface SqueezeSentence { readonly text: string; readonly at: number; readonly word: string; readonly wrong: readonly string[] }
const sq = (text: string, at: number, word: string, wrong: string[]): SqueezeSentence => ({ text, at, word, wrong });
export const SQUEEZE_SENTENCES: readonly SqueezeSentence[] = [
  sq('They are in the roost.', 0, "They're", ["We're", "He's"]), sq('We are on the hill.', 0, "We're", ["They're", "She's"]),
  sq('He is my dragon.', 0, "He's", ["She's", "I'll"]), sq('She is so happy.', 0, "She's", ["He's", "We're"]),
  sq('I will fly to the lake.', 0, "I'll", ["We're", "He's"]), sq('The dragon will not sleep.', 2, "won't", ["isn't", "can't"]),
  sq('We are so big!', 0, "We're", ["They're", "I'll"]), sq('They are funny dragons.', 0, "They're", ["She's", "We're"]),
  sq('He is in the cave.', 0, "He's", ["I'll", "They're"]), sq('I will ride my dragon.', 0, "I'll", ["She's", "We're"]),
  sq('She is up on the hill.', 0, "She's", ["They're", "He's"]), sq('The egg will not hatch.', 2, "won't", ["didn't", "isn't"]),
  sq('It will not fit.', 1, "won't", ["can't", "isn't"]), sq('They are in the lake.', 0, "They're", ["He's", "I'll"]),
];
/** The sentence said with its two words squeezed. */
export const squeezed = (s: SqueezeSentence) => {
  const words = s.text.replace(/[.!?]$/, '').split(' '), end = s.text.at(-1)!;
  return `${[...words.slice(0, s.at), s.word, ...words.slice(s.at + 2)].join(' ')}${end}`;
};

// ---------- Adjectives, Level 3: two dragons, which sentence tells about this one ----------
export interface Look { readonly dim: 'size' | 'colour' | 'tail' | 'mood' | 'mud'; readonly value: string; readonly text: string }
const look = (dim: Look['dim'], value: string, text: string): Look => ({ dim, value, text });
export const LOOKS: readonly Look[] = [
  look('size', 'big', 'The dragon is big.'), look('size', 'little', 'The dragon is little.'),
  look('colour', 'red', 'The dragon is red.'), look('colour', 'blue', 'The dragon is blue.'), look('colour', 'green', 'The dragon is green.'),
  look('colour', 'yellow', 'The dragon is yellow.'), look('colour', 'purple', 'The dragon is purple.'), look('colour', 'black', 'The dragon is black.'),
  look('tail', 'long', 'The dragon has long wings.'), look('tail', 'short', 'The dragon has short wings.'),
  look('mood', 'happy', 'The dragon is happy.'), look('mood', 'unhappy', 'The dragon is unhappy.'),
  look('mud', 'muddy', 'The dragon is muddy.'), look('mud', 'clean', 'The dragon is clean.'),
];
export const LOOK_COLOURS: Readonly<Record<string, string>> = { red: '#e8483b', blue: '#3b82e8', green: '#2fae5a', yellow: '#f5c518', purple: '#8a4fd6', black: '#3a3a44' };
