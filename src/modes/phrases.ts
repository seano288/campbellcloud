import { MONEY_NAMES, MONEY_VALUES, type MoneyName, type MoneyValue } from '../money/money';
import type { NameValue } from '../money/phrases';
import { MODE_IDS, MODE_NAMES, type ModeId, type ModeName, type RaisedLevel } from './ids';
import { SHOP_ITEMS, type ShopItem } from './pay/pay';
import { PAYMENT_PHRASES } from './pay/phrases';

// ---------- Learn the Coins ----------
const LEARN = [
  'What is this called?', 'How much is this worth?', 'Which is worth more?', 'Which is worth less?',
  'Try again!', 'The dime is small, but it is worth more!', 'Tap a coin to hear its name.',
  'Which one is worth the same?', 'All together they make',
] as const;

type MoneyPhrase = `Tap the ${MoneyName}!` | `${MoneyName}?` | `${MoneyValue}?` | `That's a ${MoneyName}.` | `Find the ${MoneyName}!` | NameValue;
const moneyPhrases = (): MoneyPhrase[] =>
  MONEY_NAMES.flatMap((m, i) => {
    const v = MONEY_VALUES[i]!;
    return [`Tap the ${m}!`, `${m}?`, `${v}?`, `That's a ${m}.`, `Find the ${m}!`, `${m} is ${v}.` as NameValue] as const;
  });

// ---------- Rounds ----------
const CHANGE = ['How much change do you get?', 'You pay with this.', 'Your change is'] as const;
const FEWEST = 'Use as few coins as you can!';
const ROUNDS = [
  'How much money is this?', 'Not quite!', "Let's count together.", ...CHANGE, FEWEST, ...PAYMENT_PHRASES,
] as const;

type BuyPhrase = `Buy the ${ShopItem['name']}!`;
const buyPhrases = (): BuyPhrase[] => SHOP_ITEMS.map(i => `Buy the ${i.name}!` as const);

// ---------- introduction card ----------
const INTRO = ['Look!', 'New money!'] as const;
type IntroPhrase = (typeof INTRO)[number] | `This is a ${MoneyName}.` | `It is worth ${MoneyValue}.`;
const introPhrases = (): IntroPhrase[] => [...INTRO, ...MONEY_NAMES.map(m => `This is a ${m}.` as const), ...MONEY_VALUES.map(v => `It is worth ${v}.` as const)];

// ---------- progress and end of Round ----------
/** What a Level brings, said as he reaches it: new money at Levels 2 and 3, a new kind of problem at 4 and 5. */
export const LEVEL_LINES = {
  2: 'Now you get quarters!', 3: 'Now you get dollar bills!',
  learn: { 4: 'Now find coins worth the same!', 5: 'Now the piles get trickier!' },
  count: { 4: 'Now count bigger, mixed-up piles!', 5: 'Now count your change!' },
  pay: { 4: 'Now pay bigger prices!', 5: 'Now use the fewest coins!' },
} as const;
export const levelLine = (mode: ModeId, level: RaisedLevel) => (level === 2 || level === 3 ? LEVEL_LINES[level] : LEVEL_LINES[mode][level]);
const PROGRESS = ['Level up!', LEVEL_LINES[2], LEVEL_LINES[3], ...MODE_IDS.flatMap(m => [LEVEL_LINES[m][4], LEVEL_LINES[m][5]])] as const;
type ModePhrase = `You are a ${ModeName} star!` | `You opened ${ModeName}!`;
const modePhrases = (): ModePhrase[] => MODE_NAMES.flatMap(m => [`You are a ${m} star!`, `You opened ${m}!`] as const);
/** Tapping a locked mode's tile. */
export const LOCKED_HINTS = ['Learn more coins to open this!', 'Count more cash to open this!'] as const;

export const LEARN_PHRASES = [...LEARN, ...moneyPhrases()];
export const PAY_PHRASES = [...buyPhrases(), ...PAYMENT_PHRASES, FEWEST, 'Count more cash to open this!'] as const;
export const COUNT_PHRASES = ['How much money is this?', 'Not quite!', "Let's count together.", ...CHANGE, 'It costs', 'Tap a coin to hear its name.', 'Learn more coins to open this!'] as const;
export const SUBJECT_PHRASES = [...LEARN_PHRASES, ...ROUNDS, ...buyPhrases(), ...introPhrases(), ...PROGRESS, ...modePhrases(), ...LOCKED_HINTS] as const;
