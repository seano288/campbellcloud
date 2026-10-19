// The word lists the original game shipped with: 2,315 possible answers, plus 10,657 more words it accepts as guesses.
import answersText from './words/answers.txt?raw';
import allowedText from './words/allowed.txt?raw';

const lines = (text: string) => text.split('\n').map(word => word.trim()).filter(Boolean);

export const ANSWERS: readonly string[] = lines(answersText);
const ALLOWED = new Set([...ANSWERS, ...lines(allowedText)]);

export const isAllowed = (word: string) => ALLOWED.has(word);
