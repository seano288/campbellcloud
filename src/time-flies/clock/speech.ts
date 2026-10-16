// How times are said, as the clock reads: "three o'clock", "three fifteen", "three oh five". Every phrase here is
// recorded once (tools/make_voice.py), and teaching joins them: "The short hand points to the" + "three".
import { timesAt, type ClockTime } from './time';

export const HOUR_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'] as const;
export type HourWord = (typeof HOUR_WORDS)[number];
const MINUTE_WORDS = {
  5: 'oh five', 10: 'ten', 15: 'fifteen', 20: 'twenty', 25: 'twenty-five', 30: 'thirty',
  35: 'thirty-five', 40: 'forty', 45: 'forty-five', 50: 'fifty', 55: 'fifty-five',
} as const;
type MinuteWord = (typeof MINUTE_WORDS)[keyof typeof MINUTE_WORDS];
export type TimePhrase = `${HourWord} o'clock` | `${HourWord} ${MinuteWord}`;

export const hourWord = (h: number): HourWord => HOUR_WORDS[(((h - 1) % 12) + 12) % 12]!;
export function timePhrase(t: ClockTime): TimePhrase {
  if (t.minute === 0) return `${hourWord(t.hour)} o'clock`;
  const m = MINUTE_WORDS[t.minute as keyof typeof MINUTE_WORDS];
  if (!m) throw new Error(`No recording for ${t.hour}:${t.minute}`);
  return `${hourWord(t.hour)} ${m}`;
}

/** Counting round the dial by fives, one number at a time. */
export const FIVES = ['five', 'ten', 'fifteen', 'twenty', 'twenty-five', 'thirty', 'thirty-five', 'forty', 'forty-five', 'fifty', 'fifty-five'] as const;
export type FivesWord = (typeof FIVES)[number];

/** Everything the clock lessons say. */
export const CLOCK_LINES = [
  'Find this time!', 'What time is it?', 'Make the clock say', 'Move the hands!', 'Tap the check when you are done.',
  'Not quite!', 'Try again!', "Let's look together.",
  'The short hand shows the hour.', 'The long hand shows the minutes.',
  'The short hand points to the', 'The long hand points to the', 'The long hand points to the twelve.',
  "That means o'clock.", 'Count by fives!', 'So it is', 'That clock says', 'This clock says', 'Your clock says',
  'The short hand is between the', 'and the', 'So the hour is',
  'Move the short hand.', 'Move the long hand.',
] as const;
export type ClockLine = (typeof CLOCK_LINES)[number];

export type ClockPhrase = ClockLine | TimePhrase | HourWord | FivesWord;
export const CLOCK_PHRASES: readonly ClockPhrase[] = [
  ...CLOCK_LINES, ...HOUR_WORDS, ...FIVES, ...timesAt(3).map(timePhrase),
];
