// Sort It: things that belong together. Every thing here belongs to exactly one of the groups (no tomato, fruit or vegetable; no bat,
// animal or toy; no fish or chicken, animal or food), and every one has an unmistakable picture. Plain data, no game code.
//
// Level 3 asks what a group is ("A dog, a cat and a cow are all..."), then a question about one thing in a group (CCSS L.1.5b:
// "a duck is a bird that swims"). Each FACT lists the things it is true of and the things it is clearly false of; only those are
// offered, so the one right choice is the one true thing (no penguin in "can fly": it is in neither list).

export const GROUP_IDS = ['animals', 'food', 'clothes', 'go', 'body'] as const;
export type GroupId = (typeof GROUP_IDS)[number];

export interface Group {
  readonly id: GroupId;
  /** As said in "Tap all the ___!" and "These are all ___." */
  readonly plural: string;
  /** As said in "A shoe is not ___." */
  readonly one: string;
  readonly things: readonly string[];
}

export const GROUPS = {
  animals: {
    id: 'animals', plural: 'animals', one: 'an animal',
    things: ['dog', 'cat', 'cow', 'pig', 'horse', 'sheep', 'frog', 'lion', 'bear', 'rabbit', 'mouse', 'elephant', 'monkey', 'giraffe', 'zebra', 'snake', 'turtle', 'tiger', 'fox', 'owl', 'bee', 'duck', 'bird', 'eagle', 'parrot', 'whale', 'octopus', 'shark', 'ant', 'camel'],
  },
  food: {
    id: 'food', plural: 'food', one: 'food',
    things: ['apple', 'banana', 'grapes', 'carrot', 'bread', 'cookie', 'egg', 'cheese', 'pizza', 'pear', 'strawberry', 'lemon', 'donut', 'sandwich', 'pie', 'cherries', 'broccoli', 'cake'],
  },
  clothes: { id: 'clothes', plural: 'clothes', one: 'clothes', things: ['shirt', 'pants', 'dress', 'sock', 'shoe', 'hat', 'coat', 'scarf', 'glove', 'boot'] },
  go: { id: 'go', plural: 'things that go', one: 'a thing that goes', things: ['car', 'bus', 'truck', 'train', 'boat', 'plane', 'bike', 'helicopter', 'rocket', 'tractor', 'scooter'] },
  body: { id: 'body', plural: 'body parts', one: 'a body part', things: ['nose', 'ear', 'eye', 'hand', 'foot', 'leg', 'mouth', 'tooth', 'tongue'] },
} as const satisfies Readonly<Record<GroupId, Group>>;

export interface Fact {
  /** The question, said and shown. */
  readonly ask: string;
  /** Said after the right thing's name when he's shown it: "owl. It can fly!" */
  readonly says: string;
  readonly yes: readonly string[];
  readonly no: readonly string[];
}

const CANT_FLY = ['dog', 'cat', 'cow', 'pig', 'horse', 'sheep', 'frog', 'lion', 'bear', 'rabbit', 'mouse', 'elephant', 'monkey', 'giraffe', 'zebra', 'tiger', 'fox', 'camel'] as const;
const ON_LAND = ['dog', 'cat', 'cow', 'pig', 'horse', 'sheep', 'lion', 'bear', 'rabbit', 'mouse', 'elephant', 'monkey', 'giraffe', 'zebra', 'tiger', 'fox', 'camel'] as const;

export const FACTS = [
  { ask: 'Which animal can fly?', says: 'It can fly!', yes: ['owl', 'bee', 'bird', 'eagle', 'parrot'], no: CANT_FLY },
  { ask: 'Which animal lives in the sea?', says: 'It lives in the sea!', yes: ['whale', 'octopus', 'shark'], no: ON_LAND },
  { ask: 'Which animal has a long neck?', says: 'It has a long neck!', yes: ['giraffe'], no: ['dog', 'cat', 'pig', 'mouse', 'frog', 'bear', 'rabbit', 'fox', 'bee', 'ant'] },
  { ask: 'Which animal has stripes?', says: 'It has stripes!', yes: ['zebra', 'tiger'], no: ['dog', 'cow', 'pig', 'sheep', 'frog', 'elephant', 'mouse', 'rabbit', 'bear', 'duck', 'owl'] },
  { ask: 'Which animal has a trunk?', says: 'It has a trunk!', yes: ['elephant'], no: ['dog', 'cat', 'cow', 'pig', 'horse', 'lion', 'rabbit', 'zebra', 'giraffe', 'monkey'] },
  { ask: 'Which food is a fruit?', says: 'It is a fruit!', yes: ['apple', 'banana', 'grapes', 'pear', 'strawberry', 'lemon', 'cherries'], no: ['bread', 'cookie', 'egg', 'cheese', 'pizza', 'donut', 'sandwich', 'pie', 'cake', 'carrot', 'broccoli'] },
  { ask: 'Which food is a vegetable?', says: 'It is a vegetable!', yes: ['carrot', 'broccoli'], no: ['bread', 'cookie', 'egg', 'cheese', 'pizza', 'donut', 'cake', 'apple', 'banana', 'grapes', 'cherries'] },
  { ask: 'Which one do you wear on your feet?', says: 'You wear it on your feet!', yes: ['shoe', 'sock', 'boot'], no: ['hat', 'shirt', 'scarf', 'glove', 'dress', 'coat'] },
  { ask: 'Which one do you wear on your head?', says: 'You wear it on your head!', yes: ['hat'], no: ['sock', 'shoe', 'boot', 'pants', 'glove', 'dress', 'shirt'] },
  { ask: 'Which one do you wear on your hands?', says: 'You wear it on your hands!', yes: ['glove'], no: ['sock', 'shoe', 'boot', 'pants', 'hat', 'dress', 'scarf'] },
  { ask: 'Which one flies in the sky?', says: 'It flies in the sky!', yes: ['plane', 'helicopter', 'rocket'], no: ['car', 'bus', 'truck', 'train', 'bike', 'tractor', 'scooter', 'boat'] },
  { ask: 'Which one goes on the water?', says: 'It goes on the water!', yes: ['boat'], no: ['car', 'bus', 'truck', 'train', 'bike', 'tractor', 'scooter', 'plane', 'helicopter', 'rocket'] },
  { ask: 'Which one runs on tracks?', says: 'It runs on tracks!', yes: ['train'], no: ['car', 'bus', 'truck', 'bike', 'tractor', 'scooter', 'boat', 'plane', 'helicopter', 'rocket'] },
  { ask: 'Which one do you smell with?', says: 'You smell with it!', yes: ['nose'], no: ['ear', 'eye', 'hand', 'foot', 'leg', 'tooth'] },
  { ask: 'Which one do you hear with?', says: 'You hear with it!', yes: ['ear'], no: ['nose', 'eye', 'hand', 'foot', 'leg', 'tooth', 'mouth'] },
  { ask: 'Which one do you see with?', says: 'You see with it!', yes: ['eye'], no: ['nose', 'ear', 'hand', 'foot', 'leg', 'tooth', 'mouth'] },
  { ask: 'Which one do you walk on?', says: 'You walk on it!', yes: ['foot'], no: ['nose', 'ear', 'eye', 'hand', 'tooth', 'mouth', 'tongue'] },
] as const satisfies readonly Fact[];
