// Where the truck parks (the Spots) and who comes back for more (the Regulars). Stars from happy customers open Spots; the night ones
// also need Lights on the truck. Each truck has four Regulars, each with a name and a favourite order; a new one comes to every Service
// while the truck he drives has one he hasn't met, and goes in the sticker book.
import type { TruckId } from './parts';

export interface Spot {
  readonly id: string;
  readonly name: string;
  /** Stars he needs, in all, to park here. */
  readonly stars: number;
  readonly night: boolean;
  /** Sky top and bottom, then the ground. */
  readonly sky: readonly [string, string];
  readonly ground: string;
  /** Things in the background, left to right. */
  readonly props: readonly string[];
  /** Customers this Spot adds to the usual crowd. */
  readonly visitors: readonly string[];
}
export const SPOTS = [
  { id: 'park', name: 'The Park', stars: 0, sky: ['#7cc7ff', '#d6f0ff'], ground: '#5bbf4f', props: ['🌳', '🌷', '🌳', '🦆'], visitors: [], night: false },
  { id: 'beach', name: 'The Beach', stars: 4, sky: ['#55b8ff', '#c9ecff'], ground: '#f2d38a', props: ['🌴', '⛱️', '🌊', '🦀'], visitors: ['🏄'], night: false },
  { id: 'fair', name: 'The School Fair', stars: 10, sky: ['#8fd3ff', '#e2f5ff'], ground: '#7ccf63', props: ['🎡', '🎪', '🎈', '🏫'], visitors: ['🤹'], night: false },
  { id: 'farm', name: 'The Farm', stars: 18, sky: ['#9ad8ff', '#fff1c9'], ground: '#9bd16a', props: ['🌻', '🐄', '🚜', '🐔'], visitors: ['🧑‍🌾'], night: false },
  { id: 'zoo', name: 'The Zoo', stars: 28, sky: ['#7fd0ff', '#e7f8ff'], ground: '#8fcf5a', props: ['🦒', '🌴', '🐘', '🦓'], visitors: ['🐵'], night: false },
  { id: 'stadium', name: 'The Stadium', stars: 40, sky: ['#4aa8ff', '#bfe3ff'], ground: '#3fae4f', props: ['🏟️', '⚽', '🥅', '🎉'], visitors: ['⛹️'], night: false },
  { id: 'market', name: 'The Night Market', stars: 54, sky: ['#14163a', '#3b2a6b'], ground: '#4a4458', props: ['🏮', '🌙', '🏮', '🎐'], visitors: [], night: true },
  { id: 'city', name: 'The City', stars: 70, sky: ['#8ec9ff', '#e6f3ff'], ground: '#9aa3ad', props: ['🏙️', '🚕', '🏢', '🚦'], visitors: ['🧑‍💼'], night: false },
  { id: 'snow', name: 'The Snowy Mountain', stars: 88, sky: ['#a9d6ff', '#f2f8ff'], ground: '#f4f8ff', props: ['🏔️', '⛷️', '🌲', '☃️'], visitors: ['⛄'], night: false },
  { id: 'airport', name: 'The Airport', stars: 108, sky: ['#6fbaff', '#dff0ff'], ground: '#8a929c', props: ['✈️', '🛫', '🧳', '🗼'], visitors: ['🧑‍✈️'], night: false },
  { id: 'station', name: 'The Fire Station', stars: 130, sky: ['#7cc4ff', '#ffe9d6'], ground: '#a7a7a7', props: ['🚒', '🧯', '🚒', '🐕'], visitors: ['🧑‍🚒'], night: false },
  { id: 'camp', name: 'The Starry Camp', stars: 155, sky: ['#0b1030', '#25305e'], ground: '#2f4a35', props: ['⛺', '🔥', '🌲', '🌌'], visitors: ['🦉'], night: true },
  { id: 'dock', name: 'The Pirate Dock', stars: 182, sky: ['#5fb6ff', '#d4efff'], ground: '#b98a55', props: ['🏴‍☠️', '⚓', '🚢', '🦜'], visitors: ['🦜'], night: false },
  { id: 'race', name: 'The Race Track', stars: 210, sky: ['#6ab8ff', '#dff1ff'], ground: '#5b6170', props: ['🏁', '🏎️', '🏆', '🏁'], visitors: ['🏎️'], night: false },
  { id: 'castle', name: 'The Castle', stars: 240, sky: ['#8ac6ff', '#f0e6ff'], ground: '#7fbf6a', props: ['🏰', '🐉', '👑', '🏰'], visitors: ['🤴', '👸'], night: false },
  { id: 'moon', name: 'The Moon Base', stars: 272, sky: ['#05060f', '#1a1d3a'], ground: '#8a8f9c', props: ['🌍', '🚀', '🛸', '🌕'], visitors: ['👽', '🧑‍🚀'], night: true },
] as const satisfies readonly Spot[];
export type SpotId = (typeof SPOTS)[number]['id'];
export const spotOf = (id: SpotId) => SPOTS.find(s => s.id === id)!;
export const isSpotId = (x: unknown): x is SpotId => SPOTS.some(s => s.id === x);
export const SPOT_NAMES = SPOTS.map(s => s.name);

export interface Regular {
  readonly id: string;
  readonly name: string;
  readonly face: string;
  readonly truck: TruckId;
  /** Topping ids from the truck's own. */
  readonly fav: readonly string[];
}
export const REGULARS = [
  { id: 'rosa', truck: 'taco', name: 'Rosa', face: '👩🏽', fav: ['cheese', 'tomato'] }, { id: 'omar', truck: 'taco', name: 'Omar', face: '👨🏾', fav: ['avocado', 'lettuce', 'cheese'] }, { id: 'mia', truck: 'taco', name: 'Mia', face: '👧🏻', fav: ['cheese'] }, { id: 'robo', truck: 'taco', name: 'Robo', face: '🤖', fav: ['pepper', 'avocado'] },
  { id: 'leo', truck: 'pizza', name: 'Leo', face: '👦🏽', fav: ['cheese', 'pineapple'] }, { id: 'priya', truck: 'pizza', name: 'Priya', face: '👩🏾', fav: ['mushroom', 'olive'] }, { id: 'grandpa-ben', truck: 'pizza', name: 'Grandpa Ben', face: '👴🏻', fav: ['cheese', 'tomato', 'olive'] }, { id: 'zib', truck: 'pizza', name: 'Zib', face: '👽', fav: ['pineapple', 'mushroom', 'olive'] },
  { id: 'sam', truck: 'burger', name: 'Sam', face: '🧑🏿', fav: ['cheese', 'pickle'] }, { id: 'hana', truck: 'burger', name: 'Hana', face: '👩🏻', fav: ['lettuce', 'tomato'] }, { id: 'malik', truck: 'burger', name: 'Malik', face: '👦🏿', fav: ['cheese', 'onion', 'pickle'] }, { id: 'rex', truck: 'burger', name: 'Rex', face: '🦖', fav: ['onion', 'cheese'] },
  { id: 'lily', truck: 'icecream', name: 'Lily', face: '👧🏼', fav: ['strawberry', 'cherry'] }, { id: 'kenji', truck: 'icecream', name: 'Kenji', face: '👨🏻', fav: ['chocolate'] }, { id: 'nana-jo', truck: 'icecream', name: 'Nana Jo', face: '👵🏾', fav: ['banana', 'cherry', 'chocolate'] }, { id: 'bruno', truck: 'icecream', name: 'Bruno', face: '🐻', fav: ['candy', 'chocolate'] },
  { id: 'jack', truck: 'hotdog', name: 'Jack', face: '👦🏼', fav: ['cheese', 'bacon'] }, { id: 'amara', truck: 'hotdog', name: 'Amara', face: '👩🏿', fav: ['onion', 'pickle'] }, { id: 'diego', truck: 'hotdog', name: 'Diego', face: '👨🏽', fav: ['pepper', 'onion', 'cheese'] }, { id: 'pip', truck: 'hotdog', name: 'Pip', face: '🐧', fav: ['bacon'] },
  { id: 'mei', truck: 'noodles', name: 'Mei', face: '👧🏻', fav: ['egg', 'corn'] }, { id: 'ravi', truck: 'noodles', name: 'Ravi', face: '👨🏾', fav: ['shrimp', 'broccoli'] }, { id: 'ruby', truck: 'noodles', name: 'Ruby', face: '👩🏼', fav: ['egg', 'carrot', 'broccoli'] }, { id: 'inky', truck: 'noodles', name: 'Inky', face: '🐙', fav: ['shrimp', 'egg'] },
  { id: 'max', truck: 'donut', name: 'Max', face: '👦🏻', fav: ['chocolate', 'candy'] }, { id: 'zoe', truck: 'donut', name: 'Zoe', face: '👧🏾', fav: ['strawberry'] }, { id: 'pops', truck: 'donut', name: 'Pops', face: '👴🏿', fav: ['honey', 'coconut'] }, { id: 'sparky', truck: 'donut', name: 'Sparky', face: '🐲', fav: ['candy', 'chocolate', 'strawberry'] },
  { id: 'ella', truck: 'pancake', name: 'Ella', face: '👧🏽', fav: ['butter', 'honey'] }, { id: 'felix', truck: 'pancake', name: 'Felix', face: '👨🏼', fav: ['blueberry', 'banana'] }, { id: 'aisha', truck: 'pancake', name: 'Aisha', face: '👩🏽', fav: ['strawberry', 'butter'] }, { id: 'hoot', truck: 'pancake', name: 'Hoot', face: '🦉', fav: ['honey', 'blueberry', 'banana'] },
  { id: 'danny', truck: 'smoothie', name: 'Danny', face: '🧑🏽', fav: ['mango', 'banana'] }, { id: 'lucy', truck: 'smoothie', name: 'Lucy', face: '👩🏻', fav: ['strawberry', 'kiwi'] }, { id: 'tariq', truck: 'smoothie', name: 'Tariq', face: '👦🏾', fav: ['blueberry', 'banana', 'strawberry'] }, { id: 'cosmo', truck: 'smoothie', name: 'Cosmo', face: '🧑🏼‍🚀', fav: ['kiwi', 'mango'] },
  { id: 'nora', truck: 'popcorn', name: 'Nora', face: '👧🏿', fav: ['butter', 'salt'] }, { id: 'theo', truck: 'popcorn', name: 'Theo', face: '👦🏼', fav: ['chocolate', 'candy'] }, { id: 'grandma-lu', truck: 'popcorn', name: 'Grandma Lu', face: '👵🏻', fav: ['cheese', 'butter'] }, { id: 'captain-fin', truck: 'popcorn', name: 'Captain Fin', face: '🦈', fav: ['salt', 'candy', 'chocolate'] },
] as const satisfies readonly Regular[];
export type RegularId = (typeof REGULARS)[number]['id'];
export const regularOf = (id: string) => REGULARS.find(r => r.id === id);
export const REGULAR_NAMES = REGULARS.map(r => r.name);

/** The everyday crowd's faces: every skin tone, young and old. */
export const FACES = ['🧑🏻', '🧑🏽', '🧑🏿', '👩🏼', '👩🏾', '👨🏻', '👨🏿', '👧🏽', '👦🏻', '👦🏾', '👧🏿', '👵🏼', '👴🏾', '👱🏽', '👩🏻‍🦰', '🧔🏽', '👲🏻', '🧕🏾', '👳🏽', '🧒🏼'];
