// The shared interface every Game Mode plugs into. Home tiles and the unlock chain are built from MODES,
// so adding a mode means adding a module and a list entry.
import type { ComponentType } from 'preact';
import type { ProblemViewProps } from '../learning/session';
import type { Rng } from '../game/rng';
import type { MoneyKey } from '../money/money';
import type { Phrase } from '../voice/phrases';
import type { Level, ModeId, ModeName } from './ids';

/** What a mode's screen can tell the Round. */
export interface RoundApi {
  /** He got this problem right. */
  correct(): void;
  /**
   * A wrong answer. `explain` says what went wrong and returns once it's said; when `teach` is set it also shows
   * him the answer (help steps in). Taps are held until then, and a moment longer.
   */
  miss(explain: (teach: boolean) => Promise<unknown>): void;
  /** He used help (or help ran by itself), so this problem doesn't count toward Mastery. */
  helped(): void;
  /** Taps are ignored while the Round moves on. */
  busy: boolean;
}

export interface GameMode<P = unknown, A = unknown> {
  id: ModeId;
  name: ModeName;
  icon: string;
  /** Opens when this mode reaches Level 2; null means open from the start. */
  opensAfter: ModeId | null;
  /** Spoken when he taps the tile while it's locked. */
  lockedHint: Phrase | null;
  /** The money each Level uses. */
  levels: Record<Level, readonly MoneyKey[]>;
  /** The new money shown on the introduction card when the mode reaches that Level. */
  introMoney: Record<2 | 3, readonly MoneyKey[]>;
  /** Everything the mode says (all listed in phrases.ts). */
  phrases: readonly Phrase[];
  makeProblem(level: Level, rng: Rng): P;
  /** The same problem again, shuffled, for when it comes back after a miss. */
  replay(problem: P, rng: Rng): P;
  checkAnswer(problem: P, answer: A): boolean;
  View: ComponentType<ProblemViewProps<P, A> & { level: Level }>;
}
