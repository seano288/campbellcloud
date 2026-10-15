import { MONEY_NAMES, MONEY_VALUES, type MoneyName, type MoneyValue } from '../money/money';
import type { NameValue } from '../money/phrases';
import { MODE_NAMES, type ModeName } from './ids';
import { SHOP_ITEMS, type ShopItem } from './pay/pay';
import { PAYMENT_PHRASES } from './pay/phrases';

// ---------- Learn the Coins ----------
const LEARN = [
  'What is this called?', 'How much is this worth?', 'Which is worth more?', 'Which is worth less?',
  'Try again!', 'The dime is small, but it is worth more!', 'Tap a coin to hear its name.',
] as const;

type MoneyPhrase = `Tap the ${MoneyName}!` | `${MoneyName}?` | `${MoneyValue}?` | `That's a ${MoneyName}.` | `Find the ${MoneyName}!` | NameValue;
const moneyPhrases = (): MoneyPhrase[] =>
  MONEY_NAMES.flatMap((m, i) => {
    const v = MONEY_VALUES[i]!;
    return [`Tap the ${m}!`, `${m}?`, `${v}?`, `That's a ${m}.`, `Find the ${m}!`, `${m} is ${v}.` as NameValue] as const;
  });

// ---------- Rounds ----------
const ROUNDS = [
  'How much money is this?', 'Not quite!', "Let's count together.", ...PAYMENT_PHRASES,
] as const;

type BuyPhrase = `Buy the ${ShopItem['name']}!`;
const buyPhrases = (): BuyPhrase[] => SHOP_ITEMS.map(i => `Buy the ${i.name}!` as const);

// ---------- introduction card ----------
const INTRO = ['Look!', 'New money!'] as const;
type IntroPhrase = (typeof INTRO)[number] | `This is a ${MoneyName}.` | `It is worth ${MoneyValue}.`;
const introPhrases = (): IntroPhrase[] => [...INTRO, ...MONEY_NAMES.map(m => `This is a ${m}.` as const), ...MONEY_VALUES.map(v => `It is worth ${v}.` as const)];

// ---------- progress and end of Round ----------
const PROGRESS = ['Level up!', 'Now you get quarters!', 'Now you get dollar bills!'] as const;
type ModePhrase = `You are a ${ModeName} star!` | `You opened ${ModeName}!`;
const modePhrases = (): ModePhrase[] => MODE_NAMES.flatMap(m => [`You are a ${m} star!`, `You opened ${m}!`] as const);
/** Tapping a locked mode's tile. */
export const LOCKED_HINTS = ['Learn more coins to open this!', 'Count more cash to open this!'] as const;

export const LEARN_PHRASES = [...LEARN, ...moneyPhrases()];
export const PAY_PHRASES = [...buyPhrases(), ...PAYMENT_PHRASES, 'Count more cash to open this!'] as const;
export const COUNT_PHRASES = ['How much money is this?', 'Not quite!', "Let's count together.", 'Tap a coin to hear its name.', 'Learn more coins to open this!'] as const;
export const SUBJECT_PHRASES = [...LEARN_PHRASES, ...ROUNDS, ...buyPhrases(), ...introPhrases(), ...PROGRESS, ...modePhrases(), ...LOCKED_HINTS] as const;
