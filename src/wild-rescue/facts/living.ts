// Alive or Not: living things and what they need (K-LS1-1, built on in first grade). Plain data, no game code.
//
// The things here are chosen so no child could argue: no seeds, dead leaves, fire, clouds, the sun, robots or toys that look like
// they move by themselves. Needs keep to the plain ones: a plant needs sunlight, water and air; an animal needs food, water, air and
// shelter. Things a child could argue about (does a plant need soil, or food? does an animal need sunlight?) are never offered as
// a right or a wrong answer.

export interface Thing { readonly id: string; readonly icon: string; readonly line: string }

export const LIVING = [
  { id: 'frog', icon: '🐸', line: 'A frog is living.' },
  { id: 'tree', icon: '🌳', line: 'A tree is living.' },
  { id: 'flower', icon: '🌻', line: 'A flower is living.' },
  { id: 'dog', icon: '🐕', line: 'A dog is living.' },
  { id: 'bird', icon: '🐦', line: 'A bird is living.' },
  { id: 'fish', icon: '🐟', line: 'A fish is living.' },
  { id: 'cat', icon: '🐈', line: 'A cat is living.' },
  { id: 'butterfly', icon: '🦋', line: 'A butterfly is living.' },
  { id: 'child', icon: '🧒', line: 'A child is living.' },
  { id: 'cactus', icon: '🌵', line: 'A cactus is living.' },
  { id: 'horse', icon: '🐎', line: 'A horse is living.' },
  { id: 'ladybug', icon: '🐞', line: 'A ladybug is living.' },
] as const satisfies readonly Thing[];

export const NOT_LIVING = [
  { id: 'rock', icon: '🪨', line: 'A rock is not living.' },
  { id: 'ball', icon: '⚽', line: 'A ball is not living.' },
  { id: 'chair', icon: '🪑', line: 'A chair is not living.' },
  { id: 'spoon', icon: '🥄', line: 'A spoon is not living.' },
  { id: 'sock', icon: '🧦', line: 'A sock is not living.' },
  { id: 'book', icon: '📕', line: 'A book is not living.' },
  { id: 'shoe', icon: '👟', line: 'A shoe is not living.' },
  { id: 'teddy', icon: '🧸', line: 'A teddy bear is not living.' },
  { id: 'car', icon: '🚗', line: 'A car is not living.' },
  { id: 'bucket', icon: '🪣', line: 'A bucket is not living.' },
] as const satisfies readonly Thing[];

export const LIVING_WHY = 'Living things grow, and they need water and air.';
export const NOT_LIVING_WHY = 'It does not grow, and it does not need water or air.';

// ---------- needs ----------

export const NEEDS = {
  sun: { icon: '☀️', said: 'Sunlight.' },
  water: { icon: '💧', said: 'Water.' },
  air: { icon: '💨', said: 'Air.' },
  food: { icon: '🍎', said: 'Food.' },
  shelter: { icon: '🏠', said: 'Shelter.' },
  // never needed: the plainly wrong choices
  candy: { icon: '🍭', said: 'Candy.' },
  toys: { icon: '🧸', said: 'Toys.' },
  tv: { icon: '📺', said: 'TV.' },
  shoes: { icon: '👟', said: 'Shoes.' },
  sunglasses: { icon: '🕶️', said: 'Sunglasses.' },
} as const;
export type NeedId = keyof typeof NEEDS;
export type NeedLine = (typeof NEEDS)[NeedId]['said'];

/** Level 2: tap everything it needs, then Done. */
export const NEED_ASKS = {
  plant: { q: 'What does a plant need to live?', icon: '🌱', right: ['sun', 'water', 'air'], wrong: ['candy', 'toys', 'tv', 'shoes'], lesson: 'A plant needs sunlight, water and air.' },
  animal: { q: 'What does an animal need to live?', icon: '🐕', right: ['food', 'water', 'air', 'shelter'], wrong: ['toys', 'tv', 'shoes', 'sunglasses'], lesson: 'An animal needs food, water, air and shelter.' },
} as const;
export type NeedSubject = keyof typeof NEED_ASKS;

/** Level 3: something it needs is missing. The picture shows the other needs there, and each wrong choice is either one of those
 *  or something no living thing needs. */
export interface Scene {
  readonly id: string;
  readonly q: string;
  readonly subject: string;
  /** What the picture shows around it, so the other needs are plainly there. */
  readonly shows: readonly string[];
  readonly right: NeedId;
  readonly wrong: readonly [NeedId, NeedId];
  readonly lesson: string;
}

export const SCENES = [
  { id: 'fishbowl', q: 'This fish\'s bowl has no water. What does it need?', subject: '🐟', shows: ['emptybowl', 'fishfood'], right: 'water', wrong: ['food', 'toys'], lesson: 'A fish needs water to live.' },
  { id: 'darkplant', q: 'This plant is in a dark box. What does it need?', subject: '🪴', shows: ['darkbox', 'watering'], right: 'sun', wrong: ['water', 'shoes'], lesson: 'A plant needs sunlight to grow.' },
  { id: 'hungrydog', q: 'This dog\'s food bowl is empty. What does it need?', subject: '🐕', shows: ['emptyfoodbowl', 'waterbowl'], right: 'food', wrong: ['water', 'tv'], lesson: 'A dog needs food to live.' },
  { id: 'dryplant', q: 'This plant\'s soil is dry. What does it need?', subject: '🪴', shows: ['drypot', 'sun'], right: 'water', wrong: ['sun', 'candy'], lesson: 'A plant needs water to grow.' },
  { id: 'stormbird', q: 'This bird has no nest in the storm. What does it need?', subject: '🐦', shows: ['storm', 'worm'], right: 'shelter', wrong: ['food', 'sunglasses'], lesson: 'A bird needs shelter to stay safe.' },
  { id: 'snowrabbit', q: 'This rabbit has no burrow in the snow. What does it need?', subject: '🐇', shows: ['snow', 'carrot'], right: 'shelter', wrong: ['food', 'toys'], lesson: 'A rabbit needs shelter to stay warm and safe.' },
] as const satisfies readonly Scene[];
