import { ALL_BUYABLES, ALL_MODS, BODY_IDS, BOUGHT_COLOURS, defaultFit, FREE_COLOUR, isDoorNumber, isStarter, modId, paintShowsColour, SLOTS, STARTER_BODIES, type BodyId, type BoughtColour, type Buyable, type ColourId, type Fit, type ModId, type Rung, type SlotId } from './catalog';
import { forBolts, isLocked } from './economy';

export interface GarageInventory {
  readonly unlocked: readonly ModId[];
  readonly ownedBodies: readonly BodyId[];
  readonly colours: readonly BoughtColour[];
  readonly goal: Buyable | null;
}

export interface GarageState {
  body: BodyId | null;
  ownedBodies: BodyId[];
  fitted: Record<BodyId, Fit>;
  unlocked: ModId[];
  colours: BoughtColour[];
  goal: Buyable | null;
}

export const freshGarage = (): GarageState => ({
  body: null, ownedBodies: [...STARTER_BODIES],
  fitted: Object.fromEntries(BODY_IDS.map(b => [b, defaultFit()])) as Record<BodyId, Fit>,
  unlocked: [], colours: [], goal: null,
});

function withFit(state: GarageState, patch: Partial<Fit>): GarageState {
  const body = state.body ?? 'pickup';
  return { ...state, fitted: { ...state.fitted, [body]: { ...state.fitted[body], ...patch } } };
}

export function fitMod(state: GarageState, slot: SlotId, rung: Rung): GarageState {
  if (rung !== 0 && !state.unlocked.includes(modId(slot, rung))) throw new Error('Mod is not owned');
  return withFit(state, { [slot]: rung });
}

export function fitColour(state: GarageState, colour: ColourId): GarageState {
  if (colour !== FREE_COLOUR && !state.colours.includes(colour)) throw new Error('Colour is not owned');
  const fit = state.fitted[state.body ?? 'pickup'];
  return withFit(state, { colour, paint: paintShowsColour(fit.paint) ? fit.paint : 0 });
}

export function chooseBody(state: GarageState, body: BodyId): GarageState {
  if (!state.ownedBodies.includes(body)) throw new Error('Body is not owned');
  return { ...state, body };
}

export function setDoorNumber(state: GarageState, doorNumber: number): GarageState {
  if (!isDoorNumber(doorNumber)) throw new Error('Invalid Door Number');
  return withFit(state, { doorNumber });
}

export function selectGoal(state: GarageState, item: Buyable): GarageState {
  if (!forBolts(item) || !isLocked(state, item)) throw new Error('Goal must be a locked Bolt item');
  return { ...state, goal: item };
}

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
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

export function readGarage(raw: unknown): GarageState {
  const data = isRecord(raw) ? raw : {};
  const unlocked = Array.isArray(data.unlocked) ? [...new Set(data.unlocked.filter((m): m is ModId => ALL_MODS.includes(m as ModId)))] : [];
  const colours = Array.isArray(data.colours) ? [...new Set(data.colours.filter((c): c is BoughtColour => BOUGHT_COLOURS.includes(c as BoughtColour)))] : [];
  const fitted = isRecord(data.fitted) ? data.fitted : {};
  const bought = Array.isArray(data.ownedBodies) ? data.ownedBodies.filter((b): b is BodyId => BODY_IDS.includes(b as BodyId)) : [];
  const ownedBodies = BODY_IDS.filter(b => isStarter(b) || bought.includes(b));
  const body = oneOf(BODY_IDS, data.body, null), goal = oneOf(ALL_BUYABLES, data.goal, null);
  const state: GarageState = {
    body: body && !ownedBodies.includes(body) ? 'pickup' : body, ownedBodies, unlocked, colours, goal,
    fitted: Object.fromEntries(BODY_IDS.map(b => [b, readFit(fitted[b], unlocked, colours)])) as Record<BodyId, Fit>,
  };
  return { ...state, goal: goal && forBolts(goal) && isLocked(state, goal) ? goal : null };
}
