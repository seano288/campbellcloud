// What a passage is: plain data, free of game code. Each kind's passages are in their own file (ask.ts, order.ts, main.ts, infer.ts,
// fact.ts) and index.ts puts them together. The rules every passage keeps are tested in mail.test.ts.

export const KINDS = ['ask', 'order', 'main', 'infer', 'fact'] as const;
export type Kind = (typeof KINDS)[number];
export type Level = 1 | 2 | 3;

/** Who writes it: a crew member, or the base itself (the Fact File's reports). */
export const WRITERS = ['Ava', 'Sam', 'Kit', 'Ben', 'Jo', 'Dot', 'Base'] as const;
export type Writer = (typeof WRITERS)[number];

/**
 * How a question is answered:
 * - pic: tap a picture (choices are picture keys, mail/pictures.ts); never read out.
 * - words: tap a short written answer (each has its own speaker button).
 * - order: tap the pictures (Level 1) or the sentences (Levels 2 and 3) in the order they happened.
 * - line: tap a sentence of the passage (right and wrong are sentence numbers, as strings).
 * - label: tap a labelled part of the report's picture (choices are part names).
 * - yn: "Does the report say this?" yes, no, or not in the report.
 */
export type Form = 'pic' | 'words' | 'order' | 'line' | 'label' | 'yn';

export interface Question {
  /** Said, and shown, after he taps "I read it". */
  readonly ask: string;
  readonly form: Form;
  readonly right: string;
  readonly wrong: readonly string[];
  /** The sentence or sentences that hold the answer (from 0). */
  readonly at: readonly number[];
  /** Said after the answer's sentence when a miss is taught: "So the box is in the dome." */
  readonly so?: string;
  /** Clue Finder: the words in the passage that tell him, lit one at a time when a miss is taught. */
  readonly clues?: readonly string[];
  /** Clue Finder: the thinking, said after the clues ("You need those to go outside."). */
  readonly think?: string;
  /** yn: the sentence he is asked about, shown and said. */
  readonly says?: string;
}

export interface Passage {
  readonly id: string;
  readonly kind: Kind;
  readonly level: Level;
  readonly from: Writer;
  /** A story that runs across several letters (the lost mitten, the seeds, the dust storm ...). */
  readonly story?: string;
  readonly lines: readonly string[];
  /** What Came Next Level 1: a picture for each sentence. */
  readonly pics?: readonly string[];
  /** Big Idea: what the letter is about, as the lesson says it ("the plants"), and its picture at Level 1. */
  readonly topic?: string;
  /** Big Idea Level 3: the sentence that does not belong. */
  readonly odd?: number;
  /** Fact File Level 2: the labelled picture (art/diagrams.tsx). */
  readonly diagram?: string;
  readonly qs: readonly Question[];
}

/** Sentences a passage of each kind and Level may have (the brief's counts; tested). */
export const SENTENCES: Record<Kind, Record<Level, readonly [number, number]>> = {
  ask: { 1: [3, 3], 2: [4, 5], 3: [4, 5] },
  order: { 1: [3, 3], 2: [3, 3], 3: [4, 4] },
  main: { 1: [3, 3], 2: [3, 4], 3: [4, 5] },
  infer: { 1: [2, 3], 2: [3, 4], 3: [2, 4] },
  fact: { 1: [3, 3], 2: [3, 4], 3: [4, 5] },
};
export const MOST_WORDS = 12;

// ---------- writing helpers ----------

type More = Partial<Pick<Question, 'so' | 'clues' | 'think' | 'says'>>;
/** A question: what is asked, the form, the right answer, the wrong ones, and the sentence(s) that hold it. */
export const q = (ask: string, form: Form, right: string, wrong: readonly string[], at: number | readonly number[], more: More = {}): Question =>
  ({ ask, form, right, wrong, at: typeof at === 'number' ? [at] : at, ...more });

type Extra = Partial<Pick<Passage, 'story' | 'pics' | 'topic' | 'odd' | 'diagram'>>;
/** A passage as written; index.ts gives it its id (its kind, Level and place among them: "ask1-04"), so new passages go at the end. */
export type Draft = Omit<Passage, 'id'>;
export const P = (kind: Kind, level: Level, from: Writer, lines: readonly string[], qs: readonly Question[], extra: Extra = {}): Draft =>
  ({ kind, level, from, lines, qs, ...extra });
