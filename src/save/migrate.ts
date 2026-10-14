// Save migrations are pure: raw JSON in, a current Save out. Anything that isn't a save starts fresh,
// and a save's missing or broken fields fall back to their fresh values.
import { STARTER_BODIES, type BodyId, type BoughtColour, type Buyable, type Fit, type ModId } from '../garage/catalog';
import { freshGarage, readGarage } from '../garage/state';
import { readCurrency } from '../currency/currency';
import type { ModeId } from '../modes/ids';
import { freshLearning, readLearning, type ModeProgress } from '../modes/state';
import { backfill, readTrophyFields, trophyFields } from '../app/trophies';
import { freshTrophies } from '../trophies/rules';
import { dayOf, type Earned } from '../trophies/trophies';

export type { Outcome } from '../learning/session';
export type { ModeProgress as ModeSave } from '../modes/state';

export const SAVE_VERSION = 4;

export interface Save {
  version: typeof SAVE_VERSION;
  bolts: number;
  /** The Body he's driving: chosen from the starters on first launch (null until then). */
  body: BodyId | null;
  /** The starter Bodies and the ones he bought with Bolts. */
  ownedBodies: BodyId[];
  /** The Mods fitted on each Body, the number on its door and its Colour. */
  fitted: Record<BodyId, Fit>;
  /** Unlocked Mods, shared across Bodies. */
  unlocked: ModId[];
  /** The Colours he bought, shared across Bodies. Red is always his. */
  colours: BoughtColour[];
  /** The locked Mod, Body or Colour he chose to save toward; null means the cheapest one. */
  goal: Buyable | null;
  modes: Record<ModeId, ModeProgress>;
  lastMode: ModeId;
  /** The trophy steps he has earned, and the day each was earned. */
  trophies: Earned;
  roundsFinished: number;
  /** First-try answers without help in a row, across Rounds. */
  currentStreak: number;
  bestStreak: number;
  /** Different days he finished a Round on. */
  daysPlayed: number;
  /** The last day he finished a Round ("2026-09-30"). */
  lastDay: string | null;
}

export const freshSave = (): Save => ({
  version: SAVE_VERSION,
  bolts: 0,
  ...freshGarage(),
  ...freshLearning(),
  ...trophyFields(freshTrophies()),
});

type Raw = Record<string, unknown>;
// MIGRATIONS[n] turns a version-n save into a version-(n+1) save
const MIGRATIONS: Record<number, (old: Raw) => Raw> = {
  // Bodies can be bought: the 3 starters count as owned
  1: old => ({ ...old, version: 2, ownedBodies: [...STARTER_BODIES] }),
  // Trophies: the ones the Levels and stars already prove are backfilled once the modes are read, below
  2: old => ({ ...old, version: 3 }),
  // Colours: none bought, so every Body reads as Red, below
  3: old => ({ ...old, version: 4 }),
};

const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

/** `today` dates the trophies an older save is backfilled with. */
export function migrate(raw: unknown, today = dayOf(new Date())): Save {
  if (!isRecord(raw) || typeof raw.version !== 'number') return freshSave();
  let data = raw;
  for (let v = raw.version; v < SAVE_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) return freshSave();
    data = step(data);
  }
  const learning = readLearning({ modes: data.modes, lastMode: data.lastMode });
  const garage = readGarage(data);
  const trophyState = readTrophyFields(data);
  const trophies = raw.version < 3 ? { ...backfill(learning.modes, today), ...trophyState.trophies } : trophyState.trophies;
  return {
    version: SAVE_VERSION,
    bolts: readCurrency(data.bolts).balance,
    ...garage,
    ...learning,
    ...trophyState,
    trophies,
  };
}
