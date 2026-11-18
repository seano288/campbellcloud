// The hand-checked tables every question is drawn from. The parent should read every row (the spec repeats them): a question can only
// be as clear as the cases it uses, so each table holds only cases nobody in a family would argue about.
//
// - Needs are food, water, a home, clothes and medicine. Wants are toys, games and sweets. Nothing a family could argue about: no phone,
//   car, bike, pet, book, glasses, bed, soap or toothbrush (some families call them needs, some wants).
// - Goods are things you can hold. Services are jobs someone does for you, drawn being done. Nothing that is both: no restaurant meal,
//   no pizza or taco from a truck, no house a builder builds.
// - Workers are drawn as the profession emoji, each time with a gender and skin tone picked at random and independently of the job, so
//   no picture suggests who can do a job (econ.test.ts checks every job can come up with every look).

// ---------- Need or Want ----------

export type NeedCategory = 'food' | 'water' | 'home' | 'clothes' | 'medicine';
export type WantCategory = 'toy' | 'game' | 'sweet';
export interface Thing<C extends string = string> {
  readonly id: string;
  readonly emoji: string;
  /** Said in a lesson: "a kite is fun, but you can live without it." */
  readonly name: string;
  readonly cat: C;
}

export const NEEDS = [
  { id: 'water', emoji: '💧', name: 'water', cat: 'water' },
  { id: 'bread', emoji: '🍞', name: 'bread', cat: 'food' },
  { id: 'apple', emoji: '🍎', name: 'an apple', cat: 'food' },
  { id: 'carrot', emoji: '🥕', name: 'a carrot', cat: 'food' },
  { id: 'rice', emoji: '🍚', name: 'rice', cat: 'food' },
  { id: 'milk', emoji: '🥛', name: 'milk', cat: 'food' },
  { id: 'eggs', emoji: '🥚', name: 'eggs', cat: 'food' },
  { id: 'banana', emoji: '🍌', name: 'a banana', cat: 'food' },
  { id: 'broccoli', emoji: '🥦', name: 'broccoli', cat: 'food' },
  { id: 'home', emoji: '🏠', name: 'a home', cat: 'home' },
  { id: 'coat', emoji: '🧥', name: 'a coat', cat: 'clothes' },
  { id: 'shoes', emoji: '👟', name: 'shoes', cat: 'clothes' },
  { id: 'socks', emoji: '🧦', name: 'socks', cat: 'clothes' },
  { id: 'shirt', emoji: '👕', name: 'a shirt', cat: 'clothes' },
  { id: 'pants', emoji: '👖', name: 'pants', cat: 'clothes' },
  { id: 'medicine', emoji: '💊', name: 'medicine', cat: 'medicine' },
  { id: 'bandage', emoji: '🩹', name: 'a bandage', cat: 'medicine' },
] as const satisfies readonly Thing<NeedCategory>[];

export const WANTS = [
  { id: 'teddy', emoji: '🧸', name: 'a teddy bear', cat: 'toy' },
  { id: 'ball', emoji: '⚽', name: 'a ball', cat: 'toy' },
  { id: 'kite', emoji: '🪁', name: 'a kite', cat: 'toy' },
  { id: 'yoyo', emoji: '🪀', name: 'a yo-yo', cat: 'toy' },
  { id: 'balloon', emoji: '🎈', name: 'a balloon', cat: 'toy' },
  { id: 'drum', emoji: '🥁', name: 'a toy drum', cat: 'toy' },
  { id: 'wand', emoji: '🪄', name: 'a magic wand', cat: 'toy' },
  { id: 'robot', emoji: '🤖', name: 'a toy robot', cat: 'toy' },
  { id: 'videogame', emoji: '🎮', name: 'a video game', cat: 'game' },
  { id: 'puzzle', emoji: '🧩', name: 'a puzzle', cat: 'game' },
  { id: 'candy', emoji: '🍬', name: 'candy', cat: 'sweet' },
  { id: 'lollipop', emoji: '🍭', name: 'a lollipop', cat: 'sweet' },
  { id: 'chocolate', emoji: '🍫', name: 'chocolate', cat: 'sweet' },
  { id: 'cupcake', emoji: '🧁', name: 'a cupcake', cat: 'sweet' },
  { id: 'cookie', emoji: '🍪', name: 'a cookie', cat: 'sweet' },
  { id: 'cake', emoji: '🎂', name: 'a birthday cake', cat: 'sweet' },
] as const satisfies readonly Thing<WantCategory>[];

export type NeedId = (typeof NEEDS)[number]['id'];
export type WantId = (typeof WANTS)[number]['id'];
/** Why a need is a need, said in its lesson. */
export const NEED_REASONS = {
  food: 'You need food to live and grow.',
  water: 'You need water to live.',
  home: 'You need a home to stay safe and warm.',
  clothes: 'You need clothes to stay warm.',
  medicine: 'You need medicine to get well.',
} as const satisfies Record<NeedCategory, string>;
export type NeedReason = (typeof NEED_REASONS)[NeedCategory];
export const WANT_LINE = 'is fun, but you can live without it.';

/** Level 3 ("You need lunch and you want a toy"): needs he buys, said after "You need". */
export const BUY_NEEDS = [
  { id: 'lunch', emoji: '🥪', name: 'lunch', cat: 'food' },
  { id: 'coat', emoji: '🧥', name: 'a coat', cat: 'clothes' },
  { id: 'shoes', emoji: '👟', name: 'shoes', cat: 'clothes' },
  { id: 'medicine', emoji: '💊', name: 'medicine', cat: 'medicine' },
  { id: 'water', emoji: '💧', name: 'water', cat: 'water' },
  { id: 'bread', emoji: '🍞', name: 'bread', cat: 'food' },
  { id: 'socks', emoji: '🧦', name: 'socks', cat: 'clothes' },
] as const satisfies readonly Thing<NeedCategory>[];

/** Words that must never appear in Need or Want (a family could call any of them a need or a want). */
export const ARGUABLE = ['phone', 'car', 'bike', 'bicycle', 'pet', 'dog', 'cat', 'puppy', 'tablet', 'computer', 'tv', 'television', 'book', 'glasses', 'bed', 'soap', 'toothbrush', 'juice', 'internet', 'bus'];

// ---------- Goods and Services ----------

export interface Good { readonly id: string; readonly emoji: string; readonly name: string }
/** A service is drawn being done: a worker and what they work on. `who` is a job id (its look is picked at random). */
export interface Service { readonly id: string; readonly who: JobId | 'stylist' | 'walker' | 'cleaner'; readonly on: string; readonly name: string }

export const GOODS = [
  { id: 'ball', emoji: '⚽', name: 'a ball' },
  { id: 'book', emoji: '📕', name: 'a book' },
  { id: 'apple', emoji: '🍎', name: 'an apple' },
  { id: 'hat', emoji: '🧢', name: 'a hat' },
  { id: 'pencil', emoji: '✏️', name: 'a pencil' },
  { id: 'teddy', emoji: '🧸', name: 'a teddy bear' },
  { id: 'kite', emoji: '🪁', name: 'a kite' },
  { id: 'banana', emoji: '🍌', name: 'a banana' },
  { id: 'bread', emoji: '🍞', name: 'bread' },
  { id: 'backpack', emoji: '🎒', name: 'a backpack' },
  { id: 'guitar', emoji: '🎸', name: 'a guitar' },
  { id: 'shirt', emoji: '👕', name: 'a shirt' },
  { id: 'umbrella', emoji: '☂️', name: 'an umbrella' },
  { id: 'crayon', emoji: '🖍️', name: 'a crayon' },
] as const satisfies readonly Good[];

export const SERVICES = [
  { id: 'haircut', who: 'stylist', on: '💈', name: 'a haircut' },
  { id: 'checkup', who: 'doctor', on: '🤒', name: 'a check-up at the doctor' },
  { id: 'dentist', who: 'doctor', on: '🦷', name: 'a check-up at the dentist' },
  { id: 'carfix', who: 'mechanic', on: '🚗', name: 'fixing a car' },
  { id: 'fire', who: 'firefighter', on: '🔥', name: 'putting out a fire' },
  { id: 'teach', who: 'teacher', on: '🧮', name: 'teaching a class' },
  { id: 'dogwalk', who: 'walker', on: '🐕', name: 'walking a dog' },
  { id: 'windows', who: 'cleaner', on: '🪟', name: 'washing windows' },
] as const satisfies readonly Service[];
export type GoodId = (typeof GOODS)[number]['id'];
export type ServiceId = (typeof SERVICES)[number]['id'];
/** Never a good or a service here: each is both (a meal made and served for you) or a family could argue it. */
export const BOTH = ['meal', 'dinner', 'lunch', 'breakfast', 'restaurant', 'pizza', 'taco', 'burger', 'house', 'delivery'];

// ---------- workers ----------

export type Role = 'service' | 'good' | 'none';
export interface Job {
  readonly id: string;
  /** "the doctor" */
  readonly name: string;
  /** The emoji after the person and a zero-width joiner (🧑‍⚕️), or the whole emoji for one that is its own person (👷). */
  readonly zwj?: string;
  readonly own?: string;
  /** Jobs Level 1: "Who helps when you are sick?" and its answer, "The doctor helps when you are sick." */
  readonly ask: string;
  readonly does: string;
  /** Jobs Level 2: the tool, drawn beside the worker in a lesson; never the thing the emoji already holds. */
  readonly tool: string;
  readonly toolName: string;
  /** Goods and Services Level 3: gives a service, makes a good, or neither (left out there). */
  readonly role: Role;
}
export const JOBS = [
  { id: 'doctor', name: 'the doctor', zwj: '⚕️', ask: 'Who helps when you are sick?', does: 'The doctor helps when you are sick.', tool: '🩺', toolName: 'a stethoscope', role: 'service' },
  { id: 'firefighter', name: 'the firefighter', zwj: '🚒', ask: 'Who puts out fires?', does: 'The firefighter puts out fires.', tool: '🧯', toolName: 'a fire extinguisher', role: 'service' },
  { id: 'teacher', name: 'the teacher', zwj: '🏫', ask: 'Who teaches you to read?', does: 'The teacher teaches you to read.', tool: '📚', toolName: 'books', role: 'service' },
  { id: 'mechanic', name: 'the mechanic', zwj: '🔧', ask: 'Who fixes cars?', does: 'The mechanic fixes cars.', tool: '🪛', toolName: 'a screwdriver', role: 'service' },
  { id: 'pilot', name: 'the pilot', zwj: '✈️', ask: 'Who flies a plane?', does: 'The pilot flies a plane.', tool: '🎧', toolName: 'a headset', role: 'service' },
  { id: 'farmer', name: 'the farmer', zwj: '🌾', ask: 'Who grows food?', does: 'The farmer grows food.', tool: '🚜', toolName: 'a tractor', role: 'good' },
  { id: 'baker', name: 'the baker', zwj: '🍳', ask: 'Who bakes the bread?', does: 'The baker bakes the bread.', tool: '🥣', toolName: 'a mixing bowl', role: 'good' },
  { id: 'artist', name: 'the artist', zwj: '🎨', ask: 'Who paints pictures?', does: 'The artist paints pictures.', tool: '🖌️', toolName: 'a paintbrush', role: 'good' },
  { id: 'builder', own: '👷', ask: 'Who builds houses?', does: 'The builder builds houses.', name: 'the builder', tool: '🔨', toolName: 'a hammer', role: 'none' },
  { id: 'astronaut', name: 'the astronaut', zwj: '🚀', ask: 'Who flies to space?', does: 'The astronaut flies to space.', tool: '🔭', toolName: 'a telescope', role: 'none' },
] as const satisfies readonly Job[];
export type JobId = (typeof JOBS)[number]['id'];
export const jobOf = (id: JobId) => JOBS.find(j => j.id === id)!;

/** Jobs Level 3: a maker and a buyer with the good between them. */
export const MADE = [
  { id: 'bread', emoji: '🍞', maker: 'baker', ask: 'Who baked the bread?', bought: 'Who bought the bread?', madeLine: 'The baker baked the bread.', boughtLine: 'The shopper bought the bread.' },
  { id: 'cake', emoji: '🎂', maker: 'baker', ask: 'Who baked the cake?', bought: 'Who bought the cake?', madeLine: 'The baker baked the cake.', boughtLine: 'The shopper bought the cake.' },
  { id: 'carrots', emoji: '🥕', maker: 'farmer', ask: 'Who grew the carrots?', bought: 'Who bought the carrots?', madeLine: 'The farmer grew the carrots.', boughtLine: 'The shopper bought the carrots.' },
  { id: 'apples', emoji: '🍎', maker: 'farmer', ask: 'Who grew the apples?', bought: 'Who bought the apples?', madeLine: 'The farmer grew the apples.', boughtLine: 'The shopper bought the apples.' },
  { id: 'painting', emoji: '🖼️', maker: 'artist', ask: 'Who painted the picture?', bought: 'Who bought the picture?', madeLine: 'The artist painted the picture.', boughtLine: 'The shopper bought the picture.' },
] as const satisfies readonly { id: string; emoji: string; maker: JobId; ask: string; bought: string; madeLine: string; boughtLine: string }[];
export type MadeId = (typeof MADE)[number]['id'];

// ---------- how a person is drawn ----------

export const GENDERS = ['woman', 'man', 'person'] as const;
export type Gender = (typeof GENDERS)[number];
export const TONES = ['🏻', '🏼', '🏽', '🏾', '🏿'] as const;
export type Tone = 0 | 1 | 2 | 3 | 4;
export interface Look { readonly gender: Gender; readonly tone: Tone }
const BASE: Record<Gender, string> = { woman: '👩', man: '👨', person: '🧑' };
const ZWJ = '‍';
/** A worker of this job with this look: 👩🏾‍⚕️, 👷🏻‍♂️. The look never depends on the job. */
export function workerEmoji(id: JobId | 'stylist' | 'walker' | 'cleaner' | 'shopper', look: Look): string {
  const tone = TONES[look.tone];
  if (id === 'stylist') return `💇${tone}${look.gender === 'person' ? '' : ZWJ + (look.gender === 'woman' ? '♀️' : '♂️')}`;
  if (id === 'walker' || id === 'cleaner' || id === 'shopper') return BASE[look.gender] + tone;
  const j: Job = jobOf(id);
  if (j.own) return `${j.own}${tone}${look.gender === 'person' ? '' : ZWJ + (look.gender === 'woman' ? '♀️' : '♂️')}`;
  return BASE[look.gender] + tone + ZWJ + j.zwj!;
}

// ---------- prices: menus, things to save for ----------

export interface Priced { readonly id: string; readonly emoji: string; readonly costs: string }
/** On the truck's menu board (Add It Up, Enough?). Every one is one thing, so "costs" fits. */
export const MENU = [
  { id: 'taco', emoji: '🌮', costs: 'The taco costs' }, { id: 'pizza', emoji: '🍕', costs: 'The pizza costs' }, { id: 'burger', emoji: '🍔', costs: 'The burger costs' }, { id: 'hotdog', emoji: '🌭', costs: 'The hot dog costs' },
  { id: 'juice', emoji: '🧃', costs: 'The juice costs' }, { id: 'icecream', emoji: '🍦', costs: 'The ice cream costs' }, { id: 'cookie', emoji: '🍪', costs: 'The cookie costs' }, { id: 'donut', emoji: '🍩', costs: 'The donut costs' },
  { id: 'smoothie', emoji: '🥤', costs: 'The smoothie costs' }, { id: 'salad', emoji: '🥗', costs: 'The salad costs' }, { id: 'sandwich', emoji: '🥪', costs: 'The sandwich costs' }, { id: 'pretzel', emoji: '🥨', costs: 'The pretzel costs' },
  { id: 'corn', emoji: '🌽', costs: 'The corn costs' }, { id: 'muffin', emoji: '🧁', costs: 'The muffin costs' },
] as const satisfies readonly Priced[];
/** Things he saves up for (Save Up, Enough?). */
export const TOYS = [
  { id: 'kite', emoji: '🪁', costs: 'The kite costs' }, { id: 'ball', emoji: '⚽', costs: 'The ball costs' }, { id: 'teddy', emoji: '🧸', costs: 'The teddy bear costs' }, { id: 'yoyo', emoji: '🪀', costs: 'The yo-yo costs' },
  { id: 'robot', emoji: '🤖', costs: 'The toy robot costs' }, { id: 'drum', emoji: '🥁', costs: 'The drum costs' }, { id: 'puzzle', emoji: '🧩', costs: 'The puzzle costs' }, { id: 'horn', emoji: '📯', costs: 'The horn costs' },
  { id: 'balloon', emoji: '🎈', costs: 'The balloon costs' }, { id: 'game', emoji: '🎮', costs: 'The video game costs' },
] as const satisfies readonly Priced[];
export const ALL_PRICED: readonly Priced[] = [...MENU, ...TOYS];
export const pricedOf = (id: string) => ALL_PRICED.find(p => p.id === id)!;
