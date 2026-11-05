// The single typed list of everything Math Bots says. tools/make_voice.py records a clip for each entry, the build fails if
// one is missing, and say() accepts only these. Numbers are one clip each, chained into the lines around them, so a line
// with a number in it is a piece before, the number, and a piece after: far fewer clips than a whole sentence per number,
// and numbers keep one sound everywhere.
import { earnedLine, type EarnedLine } from '../currency/kind';
import { MAX_BOLTS } from '../round/rules';
import { MATH_CURRENCY } from './branding';
import { LOCKED_HINTS, MODE_IDS, MODE_NAMES, type ModeName } from './learning';
import { BOARD_ROWS, type BoardRow } from './numbers/problems';

export const NUMBERS_TO = 200;

const GAME = [
  'Math Bots!', "Let's go!", 'Round done!', 'Level up!', 'You kept trying!', 'Tap again to go home.',
  'Workshop!', 'Your robot is waiting in the workshop.', 'You have', 'You have 1 Bolt.', 'Bolts.', 'Look at all your Bolts!',
] as const;
export const CHEERS = ['Great job!', 'You got it!', 'Super math!', 'Awesome!', 'Way to go!', 'You can do it!'] as const;

type EarnedPhrase = EarnedLine<typeof MATH_CURRENCY>;
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
] as const;
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
] as const;
const MEETING = [
  'This is a ten frame.', 'Five on top.', 'Five below.', 'Ten.', 'Tap the ten frame!', 'This is a number path.', 'Each hop goes one square.',
  'Tap to hop three times!', 'This is a number bond.', 'The whole splits into two parts.', 'The two parts make the whole.', 'Tap the bond!',
  'Ten ones.', 'Tap the ten!', 'This sign means the same as.', 'Tap the sign!',
] as const;

export const numberPhrases = () => Array.from({ length: NUMBERS_TO + 1 }, (_, n) => `${n}` as `${number}`);

export type Phrase = (typeof GAME)[number] | (typeof CHEERS)[number] | EarnedPhrase | ModePhrase | (typeof LOCKED_HINTS)[keyof typeof LOCKED_HINTS]
  | `${number}` | (typeof JOINS)[number] | (typeof QUESTIONS)[number] | BoardPhrase | (typeof STORY)[number] | (typeof TEACHING)[number] | (typeof MEETING)[number];

export const PHRASES = [
  ...GAME, ...CHEERS, ...Array.from({ length: MAX_BOLTS }, (_, i) => earnedLine(MATH_CURRENCY, i + 1)), ...modePhrases(), ...Object.values(LOCKED_HINTS),
  ...numberPhrases(), ...JOINS, ...QUESTIONS, 'How many hits in all?', ...boardPhrases(), ...STORY, ...TEACHING, ...MEETING,
] as const satisfies readonly Phrase[];
