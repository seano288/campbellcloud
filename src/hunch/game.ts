// Hunch: guess the five-letter word in six tries. Pure rules, no DOM, so they can be tested on their own.
export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export type Mark = 'correct' | 'present' | 'absent';

// Marks a guess the way the original does: greens first, then yellows only while unmatched copies of that letter remain
// in the answer, so a guess with a doubled letter never shows more yellows than the answer has spare.
export function score(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(WORD_LENGTH).fill('absent');
  const spare = new Map<string, number>();
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) marks[i] = 'correct';
    else spare.set(answer[i]!, (spare.get(answer[i]!) ?? 0) + 1);
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    const left = spare.get(guess[i]!) ?? 0;
    if (marks[i] !== 'correct' && left > 0) {
      marks[i] = 'present';
      spare.set(guess[i]!, left - 1);
    }
  }
  return marks;
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, correct: 2 };

// The best mark each letter has earned so far, for colouring the keyboard.
export function keyMarks(guesses: readonly string[], answer: string): Map<string, Mark> {
  const keys = new Map<string, Mark>();
  for (const guess of guesses) score(guess, answer).forEach((mark, i) => {
    const letter = guess[i]!, before = keys.get(letter);
    if (!before || RANK[mark] > RANK[before]) keys.set(letter, mark);
  });
  return keys;
}

// Hard mode: every revealed hint has to be used in later guesses. Returns why a guess breaks that, or null if it's fine.
export function hardModeProblem(guess: string, guesses: readonly string[], answer: string): string | null {
  const ordinal = ['1st', '2nd', '3rd', '4th', '5th'];
  for (const previous of guesses) {
    const marks = score(previous, answer);
    for (let i = 0; i < WORD_LENGTH; i++)
      if (marks[i] === 'correct' && guess[i] !== previous[i]) return `${ordinal[i]} letter must be ${previous[i]!.toUpperCase()}`;
    const needed = new Map<string, number>();
    marks.forEach((mark, i) => { if (mark !== 'absent') needed.set(previous[i]!, (needed.get(previous[i]!) ?? 0) + 1); });
    for (const [letter, count] of needed)
      if ([...guess].filter(l => l === letter).length < count) return `Guess must contain ${letter.toUpperCase()}`;
  }
  return null;
}

export type Status = 'playing' | 'won' | 'lost';

export function status(guesses: readonly string[], answer: string): Status {
  if (guesses.at(-1) === answer) return 'won';
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
}

// A new answer at random, avoiding the ones played most recently so the same word doesn't come straight back.
export function pickAnswer(answers: readonly string[], recent: readonly string[], random = Math.random): string {
  const avoid = new Set(recent);
  const fresh = answers.filter(word => !avoid.has(word));
  const pool = fresh.length ? fresh : answers;
  return pool[Math.floor(random() * pool.length)]!;
}

export interface Stats {
  played: number;
  won: number;
  streak: number;
  bestStreak: number;
  // distribution[n] counts wins in n + 1 guesses
  distribution: number[];
}

export const emptyStats = (): Stats => ({ played: 0, won: 0, streak: 0, bestStreak: 0, distribution: Array(MAX_GUESSES).fill(0) });

export function recordResult(stats: Stats, won: boolean, guessCount: number): Stats {
  const streak = won ? stats.streak + 1 : 0;
  const distribution = [...stats.distribution];
  if (won) distribution[guessCount - 1] = (distribution[guessCount - 1] ?? 0) + 1;
  return { played: stats.played + 1, won: stats.won + (won ? 1 : 0), streak, bestStreak: Math.max(stats.bestStreak, streak), distribution };
}

const EMOJI: Record<Mark, string> = { correct: '🟩', present: '🟨', absent: '⬛' };

export function shareText(guesses: readonly string[], answer: string, hard: boolean): string {
  const result = status(guesses, answer) === 'won' ? `${guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const grid = guesses.map(guess => score(guess, answer).map(mark => EMOJI[mark]).join('')).join('\n');
  return `Hunch ${result}${hard ? '*' : ''}\n\n${grid}`;
}
