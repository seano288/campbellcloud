// The single typed list of everything the game says. tools/make_voice.py records a clip for each entry,
// and the build fails if any is missing. say() accepts only these phrases (and amounts, joined from pieces).
import { PRESENTATION_PHRASES } from '../app/presentationPhrases';
import { GARAGE_PHRASES } from '../garage/phrases';
import { SUBJECT_PHRASES } from '../modes/phrases';
import { TROPHY_PHRASES } from '../trophies/phrases';
import { allAmountPieces } from './amount';

export { CHEERS, earnedBolts } from '../app/presentationPhrases';
export { MAX_PRICE, needBolts, numberLine } from '../garage/phrases';
export { LEARN_PHRASES, PAY_PHRASES, COUNT_PHRASES, LOCKED_HINTS, moneyIs } from '../modes/phrases';
export { trophyName, trophyHint, earnedTrophy, type TrophyName } from '../trophies/phrases';

export const PHRASES = [...new Set([...SUBJECT_PHRASES, ...PRESENTATION_PHRASES, ...GARAGE_PHRASES, ...TROPHY_PHRASES, ...allAmountPieces()])];
export type Phrase = (typeof PHRASES)[number];
