// The single typed list of everything Food Truck says. tools/make_voice.py records a clip for each entry, the build fails if one is
// missing, and say() accepts only these. Numbers, names and things are one clip each, chained into the lines around them ("You have",
// "8", "dollars."), as Monster Truck Money chains prices and Math Bots chains numbers.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { TRUCK_CURRENCY } from './branding';
import { BUY_NEEDS, GOODS, JOBS, MADE, MENU, NEED_REASONS, NEEDS, SERVICES, TOYS, WANT_LINE, WANTS } from './econ/things';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { ALL_PARTS, COOK_LINES, HELPER_LINES, SLOT_NAMES, TRUCKS } from './truck/parts';
import { REGULARS, SPOTS } from './truck/world';

export const NUMBERS_TO = 100;
/** The most Bolts said in one "You earned" line: a perfect Round pays 6. */
export const MOST_EARNED = 6;

const GAME = ['Food Truck!', "Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.', 'Truck', 'Sticker Book', 'Play'] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Super shopper!', 'Nice thinking!'] as const;

// ---------- money ----------
const MONEY = ['dollar.', 'dollars.', 'dollars', 'You have', 'That makes', 'in all.', 'left.', 'Each coin is one dollar.'] as const;

// ---------- the questions ----------
const QUESTIONS = [
  // Need or Want
  'Tap the one you need.', 'Tap the one you want.', 'Put the needs on the heart shelf and the wants on the star shelf.', 'You need', 'and you want', 'Which do you buy first?',
  // Goods and Services
  'A good is a thing you can hold. Tap the good.', 'A service is a job someone does for you. Tap the service.',
  'Put the goods in the basket and the services by the helping hands.', 'Who gives a service?', 'Who makes a good?',
  // Add It Up, Enough?, Save Up
  'How much for both?', 'How much for all three?', 'Do you have enough?', 'Which one can you buy?', 'How much is left?',
  'How many more do you need?', 'You earn', 'dollar a day.', 'dollars a day.', 'How many days until you have', 'dollars?', 'Can you buy both?',
] as const;
type Job = (typeof JOBS)[number];
type ToolQ = `What does ${Job['name']} use?`;
type UserQ = `Who uses ${Job['toolName']}?`;
type UsesLine = { [K in Job['id']]: `${Capitalize<Extract<Job, { id: K }>['name']>} uses ${Extract<Job, { id: K }>['toolName']}.` }[Job['id']];
type JobName = Capitalize<Job['name']>;
const cap = <S extends string>(s: S) => (s[0]!.toUpperCase() + s.slice(1)) as Capitalize<S>;
export const toolQ = (j: Job) => `What does ${j.name} use?` as ToolQ;
export const userQ = (j: Job) => `Who uses ${j.toolName}?` as UserQ;
export const usesLine = (j: Job) => `${cap(j.name)} uses ${j.toolName}.` as UsesLine;
export const jobName = (j: Job) => cap(j.name) as JobName;

// ---------- teaching a miss ----------
const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!',
  // Need or Want
  WANT_LINE, 'Needs come first.', 'Needs go on the heart shelf.', 'Wants go on the star shelf.', 'Could you live without it?',
  // Goods and Services
  'is a good.', 'You can hold it.', 'is a service.', 'Someone does it for you.', 'gives a service.', 'makes a good.', 'Look at what each one does.',
  // Jobs
  'The shopper', 'The maker made it. The shopper paid for it.',
  // money
  'Count on from the bigger number.', 'Line up the coins.', 'You have enough!', 'Not enough.', 'Count the empty spots.', 'Count the days.', 'days.', 'You need more.',
  'Both together cost', 'You can buy both!', 'You can not buy both.',
] as const;

const MEETING = [
  'Needs are things you must have to live.', 'Wants are things that are nice to have.',
  'Goods are things you can hold.', 'Services are jobs people do for you.',
  'This is a one-dollar coin.', 'This is a five-dollar bill.', 'This is a ten-dollar bill.', 'Tap Go!',
] as const;

// ---------- the Truck ----------
const TRUCK = [
  'Your truck!', 'It costs', 'Bolts.', 'You need', 'more Bolts.', 'Play a Round to earn Bolts!', 'You have 1 Service ready!', 'Services are ready!', 'Tap Open!',
  'Play a Round to earn a Service!', 'You earned a Service!', 'You bought everything!', 'Trucks', 'Helpers', 'On!', 'Off!',
  'More orders at once!', 'More customers can wait!', 'Customers come faster!', 'Lights open the night spots!',
] as const;
type PartName = (typeof ALL_PARTS)[number]['name'] | (typeof TRUCKS)[number]['name'];
type GotLine = `You got ${PartName}!`;
export const gotLine = (name: PartName) => `You got ${name}!` as GotLine;

// ---------- the Service ----------
const SERVICE = [
  'Where to?', 'Open!', 'Add the', 'Give it to the customer!', 'Look at the order!', 'Cook it first!', 'Add the toppings first!',
  'A new Regular!', 'You met', 'Yum!', 'Thank you!', 'Delicious!', 'Closing time!', 'You fed', 'people!', 'You fed 1 person!',
  'A new spot is open!', 'Great service!', 'Tap again to leave.', 'Stars!', 'more stars to open it!', 'Get Lights to open it!',
  'Drive the', 'to meet them!', 'Regulars', 'Spots',
] as const;
type Truck = (typeof TRUCKS)[number];
type DragLine = `Drag the ${Truck['baseName']} over!`;
export const dragLine = (k: Truck) => `Drag the ${k.baseName} over!` as DragLine;
const LOVES = { taco: 'loves tacos!', pizza: 'loves pizza!', burger: 'loves burgers!', icecream: 'loves ice cream!', hotdog: 'loves hot dogs!', noodles: 'loves noodles!', donut: 'loves donuts!', pancake: 'loves pancakes!', smoothie: 'loves smoothies!', popcorn: 'loves popcorn!' } as const;
export const lovesLine = (k: Truck['id']) => LOVES[k];

type EarnedPhrase = EarnedLine<typeof TRUCK_CURRENCY>;
type StarLine = `You are a star at ${ModeName}!`;
type ModePhrase = ModeName | StarLine | `You opened ${ModeName}!`;
export const starLine = (name: ModeName) => `You are a star at ${name}!` as StarLine;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], starLine(MODE_NAMES[m]), `You opened ${MODE_NAMES[m]}!`] as const);
export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

type Things = (typeof NEEDS)[number]['name'] | (typeof WANTS)[number]['name'] | (typeof BUY_NEEDS)[number]['name'] | (typeof GOODS)[number]['name'] | (typeof SERVICES)[number]['name'];
type Made = (typeof MADE)[number];
type Topping = Truck['toppings'][number]['name'];

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof MONEY)[number] | (typeof QUESTIONS)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number] | (typeof TRUCK)[number] | (typeof SERVICE)[number]
  | Things | (typeof NEED_REASONS)[keyof typeof NEED_REASONS]
  | Job['ask'] | Job['does'] | ToolQ | UserQ | UsesLine | JobName | Made['ask'] | Made['bought'] | Made['madeLine'] | Made['boughtLine']
  | (typeof MENU)[number]['costs'] | (typeof TOYS)[number]['costs']
  | PartName | GotLine | (typeof SLOT_NAMES)[keyof typeof SLOT_NAMES] | (typeof HELPER_LINES)[keyof typeof HELPER_LINES] | (typeof COOK_LINES)[keyof typeof COOK_LINES]
  | DragLine | Topping | (typeof SPOTS)[number]['name'] | (typeof REGULARS)[number]['name'] | (typeof LOVES)[keyof typeof LOVES];

const each = <T, R>(xs: readonly T[], f: (x: T) => R) => xs.map(f);
export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MOST_EARNED }, (_, i) => earnedLine(TRUCK_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...MONEY, ...QUESTIONS, ...TEACHING, ...MEETING, ...TRUCK, ...SERVICE,
  ...NEEDS.map(t => t.name), ...WANTS.map(t => t.name), ...BUY_NEEDS.map(t => t.name), ...GOODS.map(t => t.name), ...SERVICES.map(t => t.name), ...Object.values(NEED_REASONS),
  ...JOBS.map(j => j.ask), ...JOBS.map(j => j.does), ...each(JOBS, toolQ), ...each(JOBS, userQ), ...each(JOBS, usesLine), ...each(JOBS, jobName),
  ...MADE.flatMap(m => [m.ask, m.bought, m.madeLine, m.boughtLine]), ...MENU.map(m => m.costs), ...TOYS.map(m => m.costs),
  ...ALL_PARTS.map(p => p.name), ...TRUCKS.map(k => k.name), ...ALL_PARTS.map(p => gotLine(p.name)), ...TRUCKS.map(k => gotLine(k.name)),
  ...Object.values(SLOT_NAMES), ...Object.values(HELPER_LINES), ...Object.values(COOK_LINES), ...each(TRUCKS, dragLine),
  ...TRUCKS.flatMap(k => k.toppings.map(t => t.name)), ...SPOTS.map(s => s.name), ...REGULARS.map(r => r.name), ...Object.values(LOVES),
] as const satisfies readonly Phrase[];
