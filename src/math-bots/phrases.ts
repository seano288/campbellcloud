// The single typed list of everything Math Bots says. tools/make_voice.py records a clip for each entry, the build fails if
// one is missing, and say() accepts only these. Numbers are one clip each, chained into the lines around them, so a line
// with a number in it is a piece before, the number, and a piece after: far fewer clips than a whole sentence per number,
// and numbers keep one sound everywhere.
import { earnedLine, needLine, type EarnedLine, type NeedLine } from '../currency/kind';
import { MAX_BOLTS } from '../round/rules';
import { MATH_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { BOARD_ROWS, type BoardRow } from './numbers/problems';
import { FILLS, SHAPE_NAMES, type Fill, type ShapeName } from './numbers/shapes';
import { ALL_MOD_NAMES, modName, SLOT_IDS, SLOTS, TOP, type ModName, type SlotName, type TopName } from './workshop/catalog';

export const NUMBERS_TO = 200;
/** The dearest thing in the Workshop costs this, so this is the most Bolts he can be short of. */
const MOST_NEEDED = 30;

const GAME = [
  'Math Bots!', "Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.',
  'Workshop!', 'Your robot is waiting in the workshop.', 'You have', 'You have 1 Bolt.', 'Bolts.', 'Look at all your Bolts!',
] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super math!', 'Awesome!', 'Way to go!', 'You can do it!'] as const;

// ---------- the Workshop and the fight ----------
const WORKSHOP = [
  'Your first fight is free!', 'Your fight is ready!', 'Tap Fight!', 'A fight costs 5 Bolts.', 'Play a Round to earn more Bolts!', 'Fight!',
] as const;
/** A commentator's short lines. The word rule holds: knocked out, stopped, sent spinning. */
const FIGHT = [
  'Warming up the arena.', 'Tap again to leave.', 'Welcome to robot combat!', 'Torque and Anvil are in the arena!', 'Go!', 'The drum is spinning up!',
  'What a hit!', 'Big hit!', 'Anvil is sent spinning!', 'Anvil swings the hammer!', 'Torque is still going!', 'A plate came off!', 'A wheel came off!',
  'Anvil is knocked out!', 'Anvil is stopped!', 'Torque wins!', "Here's the replay!", 'Great fight!', 'Charge!',
  'The arena lights are off today.', 'Torque won anyway!',
] as const;
export const needFight = (more: number) => needLine(MATH_CURRENCY, more);
type GotPhrase = `You got ${ModName}!`;
export const gotLine = (name: ModName): GotPhrase => `You got ${name}!`;
/** The Balance Lock: a Legendary is never bought, so these are the only lines it needs beyond the Weigh-In's. */
const LOCK = ['This one is in the Balance Lock!', 'Make both sides the same!', 'The lock is open!', 'You built everything!'] as const;
type WaitLine = `Get ${TopName} first!`;
export const waitLine = (name: TopName): WaitLine => `Get ${name} first!`;
const waitLines = (): WaitLine[] => SLOT_IDS.map(s => waitLine(modName(s, TOP) as TopName));
const workshopPhrases = (): (SlotName | ModName | GotPhrase)[] => [...SLOT_IDS.map(s => SLOTS[s].name), ...ALL_MOD_NAMES, ...ALL_MOD_NAMES.map(gotLine)];

type EarnedPhrase = EarnedLine<typeof MATH_CURRENCY>;
type NeedPhrase = NeedLine<typeof MATH_CURRENCY>;
type ModePhrase = ModeName | `You are a ${ModeName} star!` | `You opened ${ModeName}!`;
const modePhrases = (): ModePhrase[] => MODE_IDS.flatMap(m => [MODE_NAMES[m], `You are a ${MODE_NAMES[m]} star!`, `You opened ${MODE_NAMES[m]}!`] as const);

// ---------- the questions ----------
const JOINS = ['plus', 'take away', 'and', 'is', 'make', 'So', 'in all.', 'more.', 'here.', 'is here.', 'are here.'] as const;
const QUESTIONS = [
  'How many?', 'How many more to make ten?', 'How many are hiding?', 'in the box.', 'How many in all?', 'Tap the number to start from.',
  'Start at', 'Count up to', 'How many hops?', 'What number is the same as', 'and what make', 'is the same as what?', 'Fill the ten.',
  'How many under the plate?', 'and how many make', 'take away what number is the same as', 'What number and',
  'is the same as what number take away', 'One side is', 'The other side is', 'Is it the same on both sides?', 'Tap the true one.',
  'is the same as', 'is the same as what number plus', 'plus what number?', 'What number?', 'ten and', 'tens and', 'one.', 'ones.',
  'Make', 'Ten and', 'How many tens in', 'Tap the sign.', 'Count by', 'What comes next?', 'what number?', 'groups of',
  'Which one matches?', 'Fix it! Make both sides the same.', 'is less than', 'is more than',
  // the four kinds added after the first release
  'Tap', 'Ten more than', 'Ten less than', 'One more than', 'One less than', 'Tap the longest.', 'Tap the shortest.',
  'The rope is as long as the top bar.', 'Which bar is longer?', 'Lay wrenches to the end.', 'How many wrenches long?',
  'Which one is measured right?', 'Big wrenches or small wrenches?', 'Which takes fewer?', 'Which takes more?',
  'Tap the shape with', 'sides, all joined.', 'How many sides?', 'Fill the shape.', 'Tap the pieces that fit.',
] as const;
type ShapeWord = Capitalize<ShapeName>;
type ShapePhrase = `Tap every ${ShapeName}.` | `Which one is not a ${ShapeName}?` | `It is not a ${ShapeName}.` | `That one is a ${ShapeName}.` | `${ShapeWord}.` | Fill['says'];
const shapeWord = (n: ShapeName) => `${n[0]!.toUpperCase()}${n.slice(1)}.` as `${ShapeWord}.`;
export const shapeSaid = shapeWord;
const shapePhrases = (): ShapePhrase[] => [
  ...SHAPE_NAMES.flatMap(n => [`Tap every ${n}.`, `Which one is not a ${n}?`, `It is not a ${n}.`, `That one is a ${n}.`, shapeWord(n)] as const),
  ...Object.values(FILLS).map(f => f.says),
];
type BoardMore = { [R in BoardRow]: `How many more did the ${R} get than the ${Exclude<BoardRow, R>}?` }[BoardRow];
type BoardPhrase = 'How many hits in all?' | `How many did the ${BoardRow} get?` | BoardMore | `The ${BoardRow} row has`;
const boardPhrases = (): BoardPhrase[] => BOARD_ROWS.flatMap(r => [
  `How many did the ${r} get?` as const, `The ${r} row has` as const,
  ...BOARD_ROWS.filter(o => o !== r).map(o => `How many more did the ${r} get than the ${o}?` as BoardMore),
]);

/** Each story sentence split round its numbers (numbers/say.ts, storyParts). say.test.ts checks every story is covered. */
const STORY = [
  'Torque has', 'bolts.', 'The crew gives it', 'How many bolts now?', 'The bin has', 'Torque uses', 'How many are left?',
  'red wheels and', 'blue wheels are on the bench.', 'How many wheels in all?', 'It gets some more.', 'Now it has',
  'How many more did it get?', 'Torque uses some.', 'Now', 'are left.', 'How many did it use?', 'wheels are on the bench.',
  'are red.', 'The rest are blue.', 'How many are blue?', 'There are', 'bots and', 'batteries.', 'Each bot gets one.',
  "How many bots won't get a battery?", 'Anvil has', 'How many more does Torque have?', 'How many fewer does Anvil have?',
  'more than Anvil.', 'How many does Torque have?', 'fewer.', 'How many does Anvil have?', 'Torque had some bolts.', 'It got',
  'How many did it have at first?', 'The bin had some bolts.', 'Torque used', 'How many were in it at first?', 'fewer than Torque.',
  'The crew finds', 'bolts, then', 'then',
] as const;

// ---------- teaching ----------
const TEACHING = [
  'Not quite!', "Let's look together.", 'Try again!', 'Look again.', 'Count the bottom frame.', 'Listen again.', 'Count the squares.',
  'The wide side faces the bigger number.', 'tens is', 'ten is', 'Too big!', 'Every jump is', 'This side has', 'Five and', 'make ten.',
  'hop.', 'hops.', 'We are already on', 'Double', 'One more is', 'So the missing part is', 'The same.', 'Not the same.',
  'The equal sign does not mean the answer is next.', 'It means both sides are the same.', 'Look at the numbers.', 'These',
  'have no partner.', 'Go backwards.', 'Torque has more.', 'Anvil has fewer.', 'Tens first.', 'tens is less than', 'tens is more than',
  'tens.', 'The tens are the same.', 'The ones are the same.', 'One ten.', 'The 1 is the ten.', 'Ten ones make one ten.',
  // Number Chart
  'That is', 'Here is', 'One hundred and', 'After', 'comes', 'A new ten.', 'Count along the row.', 'Same ones.', 'One more ten.', 'One less ten.',
  'Ten more goes down one row.', 'Ten less goes up one row.', 'One more goes along one square.', 'One less goes back one square.',
  // Big Jumps
  'Tens go with tens.', 'Ones go with ones.', 'tens are', 'ten are', 'ten.', 'tens take away', 'ten is',
  // Measure It
  'Look at both ends of each bar.', 'Look at the rope on each bar.', 'It does not reach the end.', 'It goes past the end.', 'Count each wrench.',
  'That one has gaps.', 'That one has overlaps.', 'That one starts too late.', 'Big ones cover more, so it takes fewer of them.', 'Small ones cover less, so it takes more of them.', 'Line them up.', 'This one is the longest.',
  'This one is the shortest.', 'Put the rope on the bottom bar.', 'The bottom bar is shorter than the rope.', 'The bottom bar is longer than the rope.',
  'So the top bar is longer.', 'So the bottom bar is longer.', 'No gaps. No overlaps. Now count.', 'wrenches long.', 'big wrenches.', 'small wrenches.',
  'Bigger wrenches, fewer of them.', 'This one is right.',
  // Shapes
  'That one has a gap.', 'That one has a curved side.', 'That one is stretched.', 'That one has no sides.', 'That one has', 'sides.', 'Count the sides.',
  'That piece does not fit.', 'Its sides are not all the same long.', 'Its corners lean.', 'All joined.', 'All round.', 'No sides. No corners.', 'All the same long.', 'Two long, two short.',
  'Half circle.',
] as const;
const MEETING = [
  'This is a ten frame.', 'Five on top.', 'Five below.', 'Ten.', 'Tap the ten frame!', 'This is a number path.', 'Each hop goes one square.',
  'Tap to hop three times!', 'This is a number bond.', 'The whole splits into two parts.', 'The two parts make the whole.', 'Tap the bond!',
  'Ten ones.', 'Tap the ten!', 'This sign means the same as.', 'Tap the sign!',
  'This is a number chart.', 'Each row has ten numbers.', 'One row down is ten more.', 'Tap the chart!',
  'This is a wrench.', 'Lay it end to end.', 'Tap the wrenches!', 'This shape has sides.', 'Tap the shape!', 'Shapes fit together.', 'Tap the square!',
] as const;

export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof JOINS)[number] | (typeof QUESTIONS)[number] | BoardPhrase | (typeof STORY)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number]
  | (typeof WORKSHOP)[number] | (typeof FIGHT)[number] | SlotName | ModName | GotPhrase | NeedPhrase | ShapePhrase | (typeof LOCK)[number] | WaitLine;

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MAX_BOLTS }, (_, i) => earnedLine(MATH_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...JOINS, ...QUESTIONS, 'How many hits in all?', ...boardPhrases(), ...STORY, ...TEACHING, ...MEETING, ...shapePhrases(),
  ...WORKSHOP, ...FIGHT, ...workshopPhrases(), ...LOCK, ...waitLines(), ...Array.from({ length: MOST_NEEDED }, (_, i) => needLine(MATH_CURRENCY, i + 1)),
] as const satisfies readonly Phrase[];
