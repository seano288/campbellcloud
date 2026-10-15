import { MAX_BOLTS } from '../round/rules';

// ---------- cheers after a correct first try, in every mode ----------
export const CHEERS = ['VROOM! Great job!', 'Monster move!', 'You got it!', 'Truck-tastic!', 'Crushing it!', 'Awesome counting!'] as const;

type EarnedPhrase = 'You earned 1 Bolt!' | `You earned ${number} Bolts!`;
/** "You earned 4 Bolts!" */
export const earnedBolts = (n: number): EarnedPhrase => (n === 1 ? 'You earned 1 Bolt!' : `You earned ${n} Bolts!`);
const earnedPhrases = () => Array.from({ length: MAX_BOLTS }, (_, i) => earnedBolts(i + 1));

export const PRESENTATION_PHRASES = ["Let's go!", ...CHEERS, ...earnedPhrases()] as const;
