// The Camp on the saved game: his army (how many of each Squad), which Squads, Mods and Colours he owns, the Gear it wears,
// its Team Colour, and the Goal. The Goal is the cheapest locked Squad or Mod unless he tapped another; a Colour only once
// nothing else bought with Ammo is left. A Legendary is never bought with Ammo: it waits for the top Rung, then the
// Password Lock opens it. Recruits are bought one at a time, as often as he likes, up to each Squad's maximum.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  ALL_BUYABLES, ALL_MODS, BOUGHT_COLOURS, BOUGHT_UNITS, colourOf, defaultGear, isColourItem, isLegendary, isModItem, isRecruit, isStarterColour,
  isUnitItem, LEGENDARY, modId, parseMod, recruitOf, SLOTS, STARTER_UNIT, STARTING_ARMY, TOP, UNIT_IDS, UNITS, unitOf, COLOURS,
  type BoughtColour, type Buyable, type ColourId, type Gear, type LegendaryId, type ModId, type Purchase, type Rung, type SlotId, type UnitId,
} from './catalog';

export interface CampState {
  /** His Team Colour; null until he picks his first one. */
  colour: ColourId | null;
  /** How many soldiers of each Squad are in his army. */
  army: Record<UnitId, number>;
  /** The Squads he has unlocked (the Riflemen always). */
  units: UnitId[];
  unlocked: ModId[];
  colours: BoughtColour[];
  gear: Gear;
  goal: Buyable | null;
}
export type CampInventory = Pick<CampState, 'units' | 'unlocked' | 'colours' | 'goal'>;

const noArmy = () => Object.fromEntries(UNIT_IDS.map(u => [u, 0])) as Record<UnitId, number>;
export const freshCamp = (): CampState => ({
  colour: null, army: { ...noArmy(), [STARTER_UNIT]: STARTING_ARMY }, units: [STARTER_UNIT], unlocked: [], colours: [], gear: defaultGear(), goal: null,
});

export const PRICES = { rungs: { 1: 5, 2: 15, 3: 30 }, colour: 3 } as const;

export const armySize = (c: Pick<CampState, 'army'>) => UNIT_IDS.reduce((n, u) => n + c.army[u], 0);
export const isFull = (c: Pick<CampState, 'army'>, u: UnitId) => c.army[u] >= UNITS[u].max;

/** Ammo buy everything but a Legendary. */
export const forCurrency = (x: Buyable) => !(isModItem(x) && isLegendary(x));
export function priceOf(x: Purchase): number {
  if (isRecruit(x)) return UNITS[recruitOf(x)].recruit;
  if (isUnitItem(x)) return UNITS[unitOf(x)].unlock;
  if (isColourItem(x)) return PRICES.colour;
  const { rung } = parseMod(x);
  if (rung === LEGENDARY) throw new Error(`${x} is in the Password Lock`);
  return PRICES.rungs[rung];
}
export function isLocked(c: CampInventory, x: Buyable) {
  if (isUnitItem(x)) return !c.units.includes(unitOf(x));
  if (isColourItem(x)) return !c.colours.includes(colourOf(x));
  return !c.unlocked.includes(x);
}
export const ownsColour = (c: Pick<CampState, 'colours'>, id: ColourId) => isStarterColour(id) || c.colours.includes(id as BoughtColour);
/** The top-Rung Mod a Legendary is waiting on. */
export function waitingOn(c: CampInventory, mod: ModId): ModId | null {
  const { slot, rung } = parseMod(mod), top = modId(slot, TOP);
  return rung === LEGENDARY && isLocked(c, top) ? top : null;
}
const lockedForCurrency = (c: CampInventory) => ALL_BUYABLES.filter(forCurrency).filter(x => isLocked(c, x));
/** The one he chose while it's locked, otherwise the cheapest locked Squad or Mod; a Colour only once nothing else is left. */
export function goalOf(c: CampInventory): Buyable | null {
  if (c.goal && isLocked(c, c.goal) && forCurrency(c.goal)) return c.goal;
  const locked = lockedForCurrency(c), rest = locked.filter(x => !isColourItem(x));
  let best: Buyable | null = null;
  for (const x of rest.length ? rest : locked) if (!best || priceOf(x) < priceOf(best)) best = x;
  return best;
}
/** New things he could buy now (not counting more Recruits). */
export const affordable = (c: CampInventory, balance: number) => (isAmount(balance) ? lockedForCurrency(c).filter(x => priceOf(x) <= balance) : []);
export const hasAffordable = (c: CampInventory, balance: number) => affordable(c, balance).length > 0;
export const becameAffordable = (c: CampInventory, before: number, after: number) =>
  isAmount(before) && isAmount(after) && affordable(c, after).length > affordable(c, before).length;
export const canRecruit = (c: Pick<CampState, 'army' | 'units'>, u: UnitId) => c.units.includes(u) && !isFull(c, u);
export const stillNeeded = (balance: number, x: Purchase) => Math.max(0, priceOf(x) - balance);
/** The next Legendary still in the Password Lock, once everything bought with Ammo is his. */
export const nextLegendary = (c: CampInventory): SlotId | null => SLOTS.map(s => s.id).find(id => isLocked(c, modId(id, LEGENDARY))) ?? null;
export const builtEverything = (c: CampInventory) => ALL_BUYABLES.every(x => !isLocked(c, x));

// ---------- changes ----------

export function fitMod(state: CampState, slot: SlotId, rung: Rung): CampState {
  if (rung !== 0 && !state.unlocked.includes(modId(slot, rung))) throw new Error('Mod is not owned');
  return { ...state, gear: { ...state.gear, [slot]: rung } };
}
export function fitColour(state: CampState, colour: ColourId): CampState {
  if (!ownsColour(state, colour)) throw new Error('Colour is not owned');
  return { ...state, colour };
}
/** First launch: his first Team Colour, one of the starters. */
export const chooseFirstColour = (state: CampState, colour: ColourId): CampState | null =>
  (state.colour === null && isStarterColour(colour) ? { ...state, colour } : null);
export function selectGoal(state: CampState, item: Buyable): CampState {
  if (!forCurrency(item) || !isLocked(state, item)) throw new Error('Goal must be a locked item bought with Ammo');
  return { ...state, goal: item };
}

function grant(state: CampState, item: Purchase): CampState {
  if (isRecruit(item)) { const u = recruitOf(item); return { ...state, army: { ...state.army, [u]: state.army[u] + 1 } }; }
  const next = { ...state, goal: state.goal === item ? null : state.goal };
  if (isUnitItem(item)) { const u = unitOf(item); return { ...next, units: [...state.units, u], army: { ...state.army, [u]: Math.max(1, state.army[u]) } }; }
  if (isColourItem(item)) return fitColour({ ...next, colours: [...state.colours, colourOf(item)] }, colourOf(item));
  const { slot, rung } = parseMod(item);
  return fitMod({ ...next, unlocked: [...state.unlocked, item] }, slot, rung);
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'vault' | 'locked-unit' | 'full';
export function proposePurchase(state: CampState, item: Purchase, balance: number): PurchaseProposal<CampState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (isRecruit(item)) {
    const u = recruitOf(item);
    if (!UNIT_IDS.includes(u)) return { kind: 'rejected', reason: 'invalid-item' };
    if (!state.units.includes(u)) return { kind: 'rejected', reason: 'locked-unit' };
    if (isFull(state, u)) return { kind: 'rejected', reason: 'full' };
  } else {
    if (!ALL_BUYABLES.includes(item)) return { kind: 'rejected', reason: 'invalid-item' };
    if (!isLocked(state, item)) return { kind: 'rejected', reason: 'already-owned' };
    if (!forCurrency(item)) return { kind: 'rejected', reason: 'vault' };
  }
  const cost = priceOf(item);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: grant(state, item) };
}

/** Opening the Password Lock: the Legendary is his once its top Rung is, and he has built the password. */
export function openVault(state: CampState, item: LegendaryId): CampState | null {
  if (!ALL_MODS.includes(item) || !isLegendary(item) || !isLocked(state, item) || waitingOn(state, item)) return null;
  return grant(state, item);
}

// ---------- reading a save ----------

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

export function readCamp(raw: unknown): CampState {
  const data = isRecord(raw) ? raw : {}, f = freshCamp();
  const unlocked = Array.isArray(data.unlocked) ? [...new Set(data.unlocked.filter((m): m is ModId => ALL_MODS.includes(m as ModId)))] : [];
  const colours = Array.isArray(data.colours) ? [...new Set(data.colours.filter((c): c is BoughtColour => BOUGHT_COLOURS.includes(c as BoughtColour)))] : [];
  const bought = Array.isArray(data.units) ? data.units.filter((u): u is UnitId => BOUGHT_UNITS.includes(u as never)) : [];
  const units = UNIT_IDS.filter(u => u === STARTER_UNIT || bought.includes(u));
  const rawArmy = isRecord(data.army) ? data.army : {};
  const army = Object.fromEntries(UNIT_IDS.map(u => {
    const n = rawArmy[u];
    if (!units.includes(u)) return [u, 0];
    const fallback = u === STARTER_UNIT ? STARTING_ARMY : 1;
    return [u, typeof n === 'number' && Number.isInteger(n) ? Math.min(Math.max(n, u === STARTER_UNIT ? 0 : 1), UNITS[u].max) : fallback];
  })) as Record<UnitId, number>;
  const rawGear = isRecord(data.gear) ? data.gear : {}, gear = defaultGear();
  for (const { id } of SLOTS) {
    const r = rawGear[id];
    if ((r === 1 || r === 2 || r === 3 || r === 4) && unlocked.includes(`${id}:${r}`)) gear[id] = r;
  }
  const colourId = COLOURS.find(c => c.id === data.colour)?.id ?? null;
  const colour = colourId && (isStarterColour(colourId) || colours.includes(colourId as BoughtColour)) ? colourId : colourId ? 'green' : null;
  const goal = ALL_BUYABLES.find(x => x === data.goal) ?? null;
  const state: CampState = { ...f, colour, army, units, unlocked, colours, gear, goal };
  return { ...state, goal: goal && forCurrency(goal) && isLocked(state, goal) ? goal : null };
}
