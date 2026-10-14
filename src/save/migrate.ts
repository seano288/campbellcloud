// Save migrations are pure: raw JSON in, a current Save out. Anything that isn't a save starts fresh,
// and a save's missing or broken fields fall back to their fresh values.
import {
  ALL_BUYABLES, ALL_MODS, BODY_IDS, bodyOf, BOUGHT_COLOURS, colourOf, defaultFit, isBodyItem, isColourItem, isDoorNumber, isLegendary, isStarter, SLOTS, STARTER_BODIES,
  type BodyId, type BoughtColour, type Buyable, type Fit, type ModId, type Rung,
} from '../garage/catalog';
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

const freshFitted = () => Object.fromEntries(BODY_IDS.map(b => [b, defaultFit()])) as Record<BodyId, Fit>;

export const freshSave = (): Save => ({
  version: SAVE_VERSION,
  bolts: 0,
  body: null,
  ownedBodies: [...STARTER_BODIES],
  fitted: freshFitted(),
  unlocked: [],
  colours: [],
  goal: null,
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
const count = (x: unknown) => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : 0);
const oneOf = <T extends string, F>(xs: readonly T[], x: unknown, fallback: F): T | F => (xs.includes(x as T) ? (x as T) : fallback);

function readFit(raw: unknown, unlocked: readonly ModId[], colours: readonly BoughtColour[]): Fit {
  const f = defaultFit();
  if (!isRecord(raw)) return f;
  for (const { id } of SLOTS) {
    const r = raw[id];
    if (r === 0 || ((r === 1 || r === 2 || r === 3 || r === 4) && unlocked.includes(`${id}:${r}`))) f[id] = r as Rung;
  }
  if (isDoorNumber(raw.doorNumber)) f.doorNumber = raw.doorNumber; // a save from before the Door Number reads as 1
  if (colours.includes(raw.colour as BoughtColour)) f.colour = raw.colour as BoughtColour;
  return f;
}

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
  const unlocked = Array.isArray(data.unlocked) ? [...new Set(data.unlocked.filter((m): m is ModId => ALL_MODS.includes(m as ModId)))] : [];
  const colours = Array.isArray(data.colours) ? [...new Set(data.colours.filter((c): c is BoughtColour => BOUGHT_COLOURS.includes(c as BoughtColour)))] : [];
  const fitted = isRecord(data.fitted) ? data.fitted : {};
  const bought = Array.isArray(data.ownedBodies) ? data.ownedBodies.filter((b): b is BodyId => BODY_IDS.includes(b as BodyId)) : [];
  const ownedBodies = BODY_IDS.filter(b => isStarter(b) || bought.includes(b));
  const body = oneOf(BODY_IDS, data.body, null);
  const goal = oneOf(ALL_BUYABLES, data.goal, null);
  const trophyState = readTrophyFields(data);
  const trophies = raw.version < 3 ? { ...backfill(learning.modes, today), ...trophyState.trophies } : trophyState.trophies;
  const goalLocked = goal && (isBodyItem(goal) ? !ownedBodies.includes(bodyOf(goal)) : isColourItem(goal) ? !colours.includes(colourOf(goal)) : !unlocked.includes(goal) && !isLegendary(goal));
  return {
    version: SAVE_VERSION,
    bolts: count(data.bolts),
    body: body && !ownedBodies.includes(body) ? 'pickup' : body,
    ownedBodies,
    fitted: Object.fromEntries(BODY_IDS.map(b => [b, readFit(fitted[b], unlocked, colours)])) as Record<BodyId, Fit>,
    unlocked,
    colours,
    goal: goalLocked ? goal : null,
    ...learning,
    ...trophyState,
    trophies,
  };
}
