// What Bolts buy: ten trucks, each with its own food and its own way of making it, and the parts that go on whichever truck he drives.
// Parts are his once bought and fit any truck. Some change how the Service plays: the Grill (more orders at once), the Awning (more
// customers can wait), the Speaker (its jingle brings customers sooner), the Lights (open the night Spots) and the Helpers. The rest
// are looks: Paint, Sign, Mascot (on the roof) and Wheels. Prices are Bolts, never dollars, and never over 100 (the voice's numbers).

export type CookKind = 'grill' | 'oven' | 'freezer' | 'pot' | 'fryer' | 'griddle' | 'blender' | 'popper';
/** What goes down first, drawn in code (the finished food is its emoji). */
export type BaseShape = 'tortilla' | 'dough' | 'patty' | 'cone' | 'bowl' | 'ring' | 'sausage' | 'batter' | 'cup' | 'kernels';
export interface Topping { readonly id: string; readonly emoji: string; readonly name: string }
export interface TruckKind {
  readonly id: string;
  readonly name: string;
  readonly food: string;
  /** "a taco", said in a Regular's favourite. */
  readonly foodName: string;
  readonly base: BaseShape;
  readonly baseName: string;
  readonly toppings: readonly Topping[];
  readonly cook: CookKind;
  /** Cooked before the toppings go on (a burger's patty), or after (a pizza in the oven). */
  readonly cookFirst: boolean;
  readonly price: number;
}
const CHEESE = { id: 'cheese', emoji: '🧀', name: 'cheese' } as const, TOMATO = { id: 'tomato', emoji: '🍅', name: 'tomato' } as const, LETTUCE = { id: 'lettuce', emoji: '🥬', name: 'lettuce' } as const, PEPPER = { id: 'pepper', emoji: '🌶️', name: 'hot pepper' } as const;
const STRAWBERRY = { id: 'strawberry', emoji: '🍓', name: 'strawberry' } as const, BANANA = { id: 'banana', emoji: '🍌', name: 'banana' } as const, CHOCOLATE = { id: 'chocolate', emoji: '🍫', name: 'chocolate' } as const, BLUEBERRY = { id: 'blueberry', emoji: '🫐', name: 'blueberries' } as const;
const BUTTER = { id: 'butter', emoji: '🧈', name: 'butter' } as const, HONEY = { id: 'honey', emoji: '🍯', name: 'honey' } as const, CANDY = { id: 'candy', emoji: '🍬', name: 'candy' } as const, ONION = { id: 'onion', emoji: '🧅', name: 'onion' } as const, PICKLE = { id: 'pickle', emoji: '🥒', name: 'pickle' } as const;

export const TRUCKS = [
  { id: 'taco', name: 'Taco Truck', food: '🌮', foodName: 'a taco', base: 'tortilla', baseName: 'tortilla', cook: 'grill', cookFirst: false, price: 0,
    toppings: [CHEESE, LETTUCE, TOMATO, { id: 'avocado', emoji: '🥑', name: 'avocado' }, PEPPER] },
  { id: 'pizza', name: 'Pizza Truck', food: '🍕', foodName: 'a pizza', base: 'dough', baseName: 'dough', cook: 'oven', cookFirst: false, price: 15,
    toppings: [CHEESE, TOMATO, { id: 'mushroom', emoji: '🍄', name: 'mushroom' }, { id: 'olive', emoji: '🫒', name: 'olives' }, { id: 'pineapple', emoji: '🍍', name: 'pineapple' }] },
  { id: 'burger', name: 'Burger Truck', food: '🍔', foodName: 'a burger', base: 'patty', baseName: 'patty', cook: 'grill', cookFirst: true, price: 25,
    toppings: [CHEESE, LETTUCE, TOMATO, PICKLE, ONION] },
  { id: 'icecream', name: 'Ice Cream Truck', food: '🍦', foodName: 'an ice cream', base: 'cone', baseName: 'cone', cook: 'freezer', cookFirst: true, price: 35,
    toppings: [STRAWBERRY, CHOCOLATE, { id: 'cherry', emoji: '🍒', name: 'cherry' }, BANANA, CANDY] },
  { id: 'hotdog', name: 'Hot Dog Truck', food: '🌭', foodName: 'a hot dog', base: 'sausage', baseName: 'sausage', cook: 'grill', cookFirst: true, price: 40,
    toppings: [ONION, PICKLE, CHEESE, PEPPER, { id: 'bacon', emoji: '🥓', name: 'bacon' }] },
  { id: 'noodles', name: 'Noodle Truck', food: '🍜', foodName: 'noodles', base: 'bowl', baseName: 'noodles', cook: 'pot', cookFirst: true, price: 50,
    toppings: [{ id: 'egg', emoji: '🥚', name: 'egg' }, { id: 'carrot', emoji: '🥕', name: 'carrot' }, { id: 'shrimp', emoji: '🍤', name: 'shrimp' }, { id: 'broccoli', emoji: '🥦', name: 'broccoli' }, { id: 'corn', emoji: '🌽', name: 'corn' }] },
  { id: 'donut', name: 'Donut Truck', food: '🍩', foodName: 'a donut', base: 'ring', baseName: 'dough', cook: 'fryer', cookFirst: true, price: 60,
    toppings: [CHOCOLATE, STRAWBERRY, CANDY, HONEY, { id: 'coconut', emoji: '🥥', name: 'coconut' }] },
  { id: 'pancake', name: 'Pancake Truck', food: '🥞', foodName: 'pancakes', base: 'batter', baseName: 'batter', cook: 'griddle', cookFirst: true, price: 70,
    toppings: [BUTTER, HONEY, BLUEBERRY, STRAWBERRY, BANANA] },
  { id: 'smoothie', name: 'Smoothie Truck', food: '🥤', foodName: 'a smoothie', base: 'cup', baseName: 'cup', cook: 'blender', cookFirst: false, price: 85,
    toppings: [STRAWBERRY, BANANA, BLUEBERRY, { id: 'mango', emoji: '🥭', name: 'mango' }, { id: 'kiwi', emoji: '🥝', name: 'kiwi fruit' }] },
  { id: 'popcorn', name: 'Popcorn Truck', food: '🍿', foodName: 'popcorn', base: 'kernels', baseName: 'corn', cook: 'popper', cookFirst: true, price: 100,
    toppings: [BUTTER, { id: 'salt', emoji: '🧂', name: 'salt' }, CHOCOLATE, CANDY, CHEESE] },
] as const satisfies readonly TruckKind[];
export type TruckId = (typeof TRUCKS)[number]['id'];
export const truckOf = (id: TruckId) => TRUCKS.find(k => k.id === id)!;
export const isTruckId = (x: unknown): x is TruckId => TRUCKS.some(k => k.id === x);
export const ALL_TOPPINGS: readonly Topping[] = [...new Map(TRUCKS.flatMap((k): readonly Topping[] => k.toppings).map(x => [x.id, x])).values()];
/** "Hold to cook!" and its kin, by how the truck makes its food. */
export const COOK_LINES = {
  grill: 'Hold to cook!', oven: 'Hold to bake!', freezer: 'Hold to freeze!', pot: 'Hold to boil!', fryer: 'Hold to fry!',
  griddle: 'Hold to cook!', blender: 'Hold to blend!', popper: 'Hold to pop!',
} as const satisfies Record<CookKind, string>;

// ---------- parts ----------

export const SLOTS = ['grill', 'awning', 'speaker', 'lights', 'paint', 'sign', 'mascot', 'wheels'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_NAMES = { grill: 'Grill', awning: 'Awning', speaker: 'Speaker', lights: 'Lights', paint: 'Paint', sign: 'Sign', mascot: 'Mascot', wheels: 'Wheels' } as const satisfies Record<Slot, string>;

export interface Part {
  readonly slot: Slot | 'helper';
  readonly id: string;
  readonly name: string;
  readonly price: number;
  /** Paint: body colour and trim, or a pattern over the colour. Awning: two stripe colours. Lights: bulb colours. Sign and mascot: an
   *  emoji. Wheels: rim colour. */
  readonly look: readonly string[];
  /** Grill: orders at once. Awning: more customers who can wait. Speaker: seconds between customers. */
  readonly power?: number;
}

export const GRILLS = [
  { slot: 'grill', id: 'small', name: 'Small Grill', price: 0, look: ['#6b7280'], power: 1 }, { slot: 'grill', id: 'big', name: 'Big Grill', price: 25, look: ['#e63946'], power: 2 }, { slot: 'grill', id: 'mega', name: 'Mega Grill', price: 60, look: ['#ffb000'], power: 3 },
] as const satisfies readonly Part[];
export const AWNINGS = [
  { slot: 'awning', id: 'plain', name: 'Plain Awning', price: 0, look: ['#f4f1e8', '#d9d4c5'], power: 0 },
  { slot: 'awning', id: 'red', name: 'Ketchup Stripes', price: 8, look: ['#e63946', '#fff'], power: 1 }, { slot: 'awning', id: 'mint', name: 'Mint Stripes', price: 12, look: ['#3ccf9a', '#fff'], power: 1 },
  { slot: 'awning', id: 'dots', name: 'Polka Dot Awning', price: 18, look: ['#ff7ac8', '#fff'], power: 1 }, { slot: 'awning', id: 'rainbow', name: 'Rainbow Awning', price: 35, look: ['#e63946', '#ff8a1f', '#ffd23f', '#2fa84f', '#2f6fd6', '#8e5bd8'], power: 2 },
  { slot: 'awning', id: 'bigtop', name: 'Big Top Awning', price: 50, look: ['#e63946', '#ffd23f'], power: 2 },
] as const satisfies readonly Part[];
export const SPEAKERS = [
  { slot: 'speaker', id: 'none', name: 'No Speaker', price: 0, look: [''], power: 7 }, { slot: 'speaker', id: 'tin', name: 'Tiny Speaker', price: 10, look: ['📢'], power: 6 }, { slot: 'speaker', id: 'bell', name: 'Bell Speaker', price: 20, look: ['🔔'], power: 5.5 },
  { slot: 'speaker', id: 'disco', name: 'Disco Speaker', price: 35, look: ['🪩'], power: 5 }, { slot: 'speaker', id: 'party', name: 'Party Speaker', price: 55, look: ['🎉'], power: 4.5 }, { slot: 'speaker', id: 'mega', name: 'Mega Speaker', price: 80, look: ['🔊'], power: 4 },
] as const satisfies readonly Part[];
export const LIGHTS = [
  { slot: 'lights', id: 'none', name: 'No Lights', price: 0, look: [] }, { slot: 'lights', id: 'bulbs', name: 'Light Bulbs', price: 15, look: ['#ffd23f'] }, { slot: 'lights', id: 'fairy', name: 'Fairy Lights', price: 25, look: ['#fff6c2', '#ffd1f0'] },
  { slot: 'lights', id: 'lanterns', name: 'Lanterns', price: 35, look: ['#ff8a1f', '#e63946'] }, { slot: 'lights', id: 'neon', name: 'Neon Lights', price: 50, look: ['#00e5ff', '#ff3ddc'] },
  { slot: 'lights', id: 'disco', name: 'Disco Lights', price: 70, look: ['#e63946', '#ffd23f', '#2fa84f', '#2f6fd6', '#8e5bd8'] },
] as const satisfies readonly Part[];
export const PAINTS = [
  { slot: 'paint', id: 'red', name: 'Ketchup Red', price: 0, look: ['#e63946', '#fff'] }, { slot: 'paint', id: 'yellow', name: 'Mustard Yellow', price: 3, look: ['#ffc93c', '#1d1d1f'] }, { slot: 'paint', id: 'mint', name: 'Mint', price: 3, look: ['#3ccf9a', '#fff'] },
  { slot: 'paint', id: 'sky', name: 'Sky Blue', price: 4, look: ['#4cb3ff', '#fff'] }, { slot: 'paint', id: 'grape', name: 'Grape Purple', price: 5, look: ['#8e5bd8', '#fff'] }, { slot: 'paint', id: 'bubblegum', name: 'Bubblegum', price: 5, look: ['#ff7ac8', '#fff'] },
  { slot: 'paint', id: 'orange', name: 'Orange', price: 6, look: ['#ff8a1f', '#fff'] }, { slot: 'paint', id: 'lime', name: 'Lime', price: 6, look: ['#9ad93c', '#1d1d1f'] }, { slot: 'paint', id: 'teal', name: 'Teal', price: 8, look: ['#14a3a3', '#fff'] },
  { slot: 'paint', id: 'navy', name: 'Navy', price: 8, look: ['#22346b', '#ffd23f'] }, { slot: 'paint', id: 'white', name: 'Snow White', price: 8, look: ['#f4f6fa', '#e63946'] }, { slot: 'paint', id: 'black', name: 'Midnight Black', price: 10, look: ['#22252c', '#ffd23f'] },
  { slot: 'paint', id: 'chrome', name: 'Chrome', price: 15, look: ['#c9d1dc', '#1d1d1f'] }, { slot: 'paint', id: 'stripes', name: 'Racing Stripes', price: 20, look: ['#2f6fd6', '#fff', 'stripes'] },
  { slot: 'paint', id: 'polka', name: 'Polka Dots', price: 22, look: ['#ffc93c', '#e63946', 'dots'] }, { slot: 'paint', id: 'checker', name: 'Checkers', price: 24, look: ['#f4f6fa', '#22252c', 'checks'] },
  { slot: 'paint', id: 'gold', name: 'Gold', price: 25, look: ['#e8b923', '#1d1d1f'] }, { slot: 'paint', id: 'flames', name: 'Flames', price: 30, look: ['#22252c', '#ff8a1f', 'flames'] },
  { slot: 'paint', id: 'stars', name: 'Star Paint', price: 30, look: ['#22346b', '#ffd23f', 'stars'] }, { slot: 'paint', id: 'rainbow', name: 'Rainbow Paint', price: 40, look: ['#e63946', '#fff', 'rainbow'] },
] as const satisfies readonly Part[];
export const SIGNS = [
  { slot: 'sign', id: 'plain', name: 'Plain Sign', price: 0, look: ['▭'] }, { slot: 'sign', id: 'star', name: 'Star Sign', price: 5, look: ['⭐'] }, { slot: 'sign', id: 'heart', name: 'Heart Sign', price: 5, look: ['❤️'] },
  { slot: 'sign', id: 'arrow', name: 'Arrow Sign', price: 8, look: ['➡️'] }, { slot: 'sign', id: 'bolt', name: 'Lightning Sign', price: 10, look: ['⚡'] }, { slot: 'sign', id: 'cloud', name: 'Cloud Sign', price: 12, look: ['☁️'] },
  { slot: 'sign', id: 'crown', name: 'Crown Sign', price: 12, look: ['👑'] }, { slot: 'sign', id: 'rocket', name: 'Rocket Sign', price: 15, look: ['🚀'] }, { slot: 'sign', id: 'bubble', name: 'Bubble Sign', price: 15, look: ['🫧'] },
  { slot: 'sign', id: 'diamond', name: 'Diamond Sign', price: 18, look: ['💎'] }, { slot: 'sign', id: 'banner', name: 'Banner Sign', price: 20, look: ['🎏'] }, { slot: 'sign', id: 'neon', name: 'Neon Sign', price: 25, look: ['🌈'] },
  { slot: 'sign', id: 'gold', name: 'Gold Sign', price: 30, look: ['🏆'] }, { slot: 'sign', id: 'lightup', name: 'Light-Up Sign', price: 35, look: ['💡'] },
] as const satisfies readonly Part[];
export const MASCOTS = [
  { slot: 'mascot', id: 'none', name: 'No Mascot', price: 0, look: [''] }, { slot: 'mascot', id: 'cat', name: 'Kitty Cat', price: 10, look: ['🐱'] }, { slot: 'mascot', id: 'dog', name: 'Dog', price: 10, look: ['🐶'] }, { slot: 'mascot', id: 'duck', name: 'Rubber Duck', price: 12, look: ['🦆'] },
  { slot: 'mascot', id: 'star', name: 'Big Star', price: 15, look: ['⭐'] }, { slot: 'mascot', id: 'bear', name: 'Big Bear', price: 15, look: ['🐻'] }, { slot: 'mascot', id: 'frog', name: 'Frog', price: 15, look: ['🐸'] },
  { slot: 'mascot', id: 'penguin', name: 'Penguin', price: 20, look: ['🐧'] }, { slot: 'mascot', id: 'donut', name: 'Giant Donut', price: 20, look: ['🍩'] }, { slot: 'mascot', id: 'taco', name: 'Giant Taco', price: 20, look: ['🌮'] },
  { slot: 'mascot', id: 'cone', name: 'Giant Ice Cream', price: 25, look: ['🍦'] }, { slot: 'mascot', id: 'unicorn', name: 'Unicorn', price: 25, look: ['🦄'] }, { slot: 'mascot', id: 'octopus', name: 'Octopus', price: 25, look: ['🐙'] },
  { slot: 'mascot', id: 'dino', name: 'Dinosaur', price: 30, look: ['🦖'] }, { slot: 'mascot', id: 'robot', name: 'Robot', price: 30, look: ['🤖'] }, { slot: 'mascot', id: 'lion', name: 'Roaring Lion', price: 30, look: ['🦁'] },
  { slot: 'mascot', id: 'rocket', name: 'Rocket', price: 35, look: ['🚀'] }, { slot: 'mascot', id: 'shark', name: 'Shark', price: 35, look: ['🦈'] }, { slot: 'mascot', id: 'alien', name: 'Alien', price: 40, look: ['👽'] },
  { slot: 'mascot', id: 'crown', name: 'Crown', price: 45, look: ['👑'] }, { slot: 'mascot', id: 'dragon', name: 'Dragon', price: 50, look: ['🐉'] }, { slot: 'mascot', id: 'trophy', name: 'Trophy', price: 60, look: ['🏆'] },
] as const satisfies readonly Part[];
export const WHEELS = [
  { slot: 'wheels', id: 'black', name: 'Black Wheels', price: 0, look: ['#9aa3ad'] }, { slot: 'wheels', id: 'white', name: 'Whitewall Wheels', price: 6, look: ['#f4f6fa'] }, { slot: 'wheels', id: 'red', name: 'Red Rims', price: 8, look: ['#e63946'] },
  { slot: 'wheels', id: 'chrome', name: 'Chrome Rims', price: 15, look: ['#dfe6ee'] }, { slot: 'wheels', id: 'gold', name: 'Gold Rims', price: 20, look: ['#ffc93c'] }, { slot: 'wheels', id: 'flame', name: 'Flame Rims', price: 25, look: ['#ff8a1f'] },
  { slot: 'wheels', id: 'rainbow', name: 'Rainbow Rims', price: 30, look: ['rainbow'] }, { slot: 'wheels', id: 'glow', name: 'Glow Wheels', price: 40, look: ['#00e5ff'] }, { slot: 'wheels', id: 'monster', name: 'Monster Wheels', price: 45, look: ['#ffd23f'] },
] as const satisfies readonly Part[];
/** Helpers change how the Service plays. Each can be switched off again in the shop. */
export const HELPERS = [
  { slot: 'helper', id: 'bubbles', name: 'Bubble Machine', price: 15, look: ['🫧'] },
  { slot: 'helper', id: 'spatula', name: 'Magic Spatula', price: 20, look: ['🪄'] },
  { slot: 'helper', id: 'burner', name: 'Turbo Burner', price: 30, look: ['🔥'] },
  { slot: 'helper', id: 'robot', name: 'Robot Helper', price: 45, look: ['🤖'] },
  { slot: 'helper', id: 'conveyor', name: 'Conveyor Belt', price: 60, look: ['🛤️'] },
] as const satisfies readonly Part[];
export type HelperId = 'bubbles' | 'spatula' | 'burner' | 'robot' | 'conveyor';
/** What each Helper does, said when he tries it. */
export const HELPER_LINES = {
  bubbles: 'Bubbles make the customers dance!',
  spatula: 'Toppings jump on from far away!',
  burner: 'Food cooks twice as fast!',
  robot: 'A robot puts the food down for you!',
  conveyor: 'Food rides to the customer by itself!',
} as const satisfies Record<HelperId, string>;

export type PartKey = `${Slot | 'helper'}:${string}`;
export const ALL_PARTS = [...GRILLS, ...AWNINGS, ...SPEAKERS, ...LIGHTS, ...PAINTS, ...SIGNS, ...MASCOTS, ...WHEELS, ...HELPERS];
export const keyOf = (p: Part) => `${p.slot}:${p.id}` as PartKey;
const BY_KEY = new Map(ALL_PARTS.map(p => [keyOf(p), p]));
export const isPartKey = (x: unknown): x is PartKey => typeof x === 'string' && BY_KEY.has(x as PartKey);
export const partOf = (k: PartKey): Part => BY_KEY.get(k)!;
export const keysIn = (slot: Slot | 'helper') => ALL_PARTS.filter(p => p.slot === slot).map(keyOf);
/** The free part in each slot: on every truck from the start. */
export const STARTERS: readonly PartKey[] = ALL_PARTS.filter(p => p.price === 0).map(keyOf);
export const ALL_NAMES = [...new Set([...ALL_PARTS.map(p => p.name), ...TRUCKS.map(k => k.name)])];

export type Fitted = Record<Slot, PartKey>;
export const starterFit = (): Fitted => Object.fromEntries(SLOTS.map(s => [s, keysIn(s).find(k => partOf(k).price === 0)!])) as Fitted;
