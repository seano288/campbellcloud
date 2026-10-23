// The Helipad on the saved game: which Helicopter he flies, what he owns, what is fitted to each one, and the Goal. Prices
// and the Goal follow Time Flies' Hangar: Mods cost 5, 15 and 30 Bolts by Rung, a Helicopter 30 and a Colour 3. A
// Legendary is never bought with Bolts: it waits for the top Rung, then the Fuel Lock opens it.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  ALL_BUYABLES, ALL_MODS, BOUGHT_COLOURS, colourOf, defaultFit, FREE_COLOUR, isColourItem, isHeliItem, isLegendary, isModItem,
  isStarter, isTailNumber, HELI_IDS, heliOf, LEGENDARY, modId, parseMod, SLOTS, STARTER_HELIS, TOP,
  type BoughtColour, type Buyable, type ColourId, type Fit, type HeliId, type LegendaryId, type ModId, type Rung, type SlotId,
} from './catalog';

export interface HelipadState {
  heli: HeliId | null;
  ownedHelis: HeliId[];
  fitted: Record<HeliId, Fit>;
  unlocked: ModId[];
  colours: BoughtColour[];
  goal: Buyable | null;
}
export type HelipadInventory = Pick<HelipadState, 'unlocked' | 'ownedHelis' | 'colours' | 'goal'>;

export const freshHelipad = (): HelipadState => ({
  heli: null, ownedHelis: [...STARTER_HELIS],
  fitted: Object.fromEntries(HELI_IDS.map(j => [j, defaultFit()])) as Record<HeliId, Fit>,
  unlocked: [], colours: [], goal: null,
});

export const PRICES = { rungs: { 1: 5, 2: 15, 3: 30 }, heli: 30, colour: 3 } as const;

/** Bolts buy everything but a Legendary. */
export const forBolts = (x: Buyable) => !(isModItem(x) && isLegendary(x));
export function boltPrice(x: Buyable): number {
  if (isHeliItem(x)) return PRICES.heli;
  if (isColourItem(x)) return PRICES.colour;
  const { rung } = parseMod(x);
  if (rung === LEGENDARY) throw new Error(`${x} is in the Fuel Lock`);
  return PRICES.rungs[rung];
}
export function isLocked(w: HelipadInventory, x: Buyable) {
  if (isHeliItem(x)) return !w.ownedHelis.includes(heliOf(x));
  if (isColourItem(x)) return !w.colours.includes(colourOf(x));
  return !w.unlocked.includes(x);
}
/** The top-Rung Mod a Legendary is waiting on. */
export function waitingOn(w: HelipadInventory, mod: ModId): ModId | null {
  const { slot, rung } = parseMod(mod), top = modId(slot, TOP);
  return rung === LEGENDARY && isLocked(w, top) ? top : null;
}
const lockedForBolts = (w: HelipadInventory) => ALL_BUYABLES.filter(forBolts).filter(x => isLocked(w, x));
/** The one he chose while it's locked, otherwise the cheapest locked Mod or Helicopter; a Colour only once nothing else is left. */
export function goalOf(w: HelipadInventory): Buyable | null {
  if (w.goal && isLocked(w, w.goal) && forBolts(w.goal)) return w.goal;
  const locked = lockedForBolts(w), rest = locked.filter(x => !isColourItem(x));
  let best: Buyable | null = null;
  for (const x of rest.length ? rest : locked) if (!best || boltPrice(x) < boltPrice(best)) best = x;
  return best;
}
export const affordable = (w: HelipadInventory, balance: number) => (isAmount(balance) ? lockedForBolts(w).filter(x => boltPrice(x) <= balance) : []);
export const hasAffordable = (w: HelipadInventory, balance: number) => affordable(w, balance).length > 0;
export const becameAffordable = (w: HelipadInventory, before: number, after: number) =>
  isAmount(before) && isAmount(after) && affordable(w, after).length > affordable(w, before).length;
export const boltsNeeded = (balance: number, x: Buyable) => Math.max(0, boltPrice(x) - balance);
/** The next Legendary still in the vault, once everything bought with Bolts is his. */
export const nextLegendary = (w: HelipadInventory): SlotId | null => SLOTS.map(s => s.id).find(id => isLocked(w, modId(id, LEGENDARY))) ?? null;
export const builtEverything = (w: HelipadInventory) => ALL_BUYABLES.every(x => !isLocked(w, x));

// ---------- changes ----------

const current = (state: HelipadState): HeliId => state.heli ?? 'uh60';
function withFit(state: HelipadState, patch: Partial<Fit>): HelipadState {
  const heli = current(state);
  return { ...state, fitted: { ...state.fitted, [heli]: { ...state.fitted[heli], ...patch } } };
}
export function fitMod(state: HelipadState, slot: SlotId, rung: Rung): HelipadState {
  if (rung !== 0 && !state.unlocked.includes(modId(slot, rung))) throw new Error('Mod is not owned');
  return withFit(state, { [slot]: rung });
}
export function fitColour(state: HelipadState, colour: ColourId): HelipadState {
  if (colour !== FREE_COLOUR && !state.colours.includes(colour)) throw new Error('Colour is not owned');
  return withFit(state, { colour, paint: 0 }); // a Colour shows with Plain paint
}
export function chooseHeli(state: HelipadState, heli: HeliId): HelipadState {
  if (!state.ownedHelis.includes(heli)) throw new Error('Helicopter is not owned');
  return { ...state, heli };
}
export function setTailNumber(state: HelipadState, n: number): HelipadState {
  if (!isTailNumber(n)) throw new Error('Invalid Tail Number');
  return withFit(state, { tailNumber: n });
}
export function selectGoal(state: HelipadState, item: Buyable): HelipadState {
  if (!forBolts(item) || !isLocked(state, item)) throw new Error('Goal must be a locked Bolt item');
  return { ...state, goal: item };
}

function grantAndFit(state: HelipadState, item: Buyable): HelipadState {
  const next = { ...state, goal: state.goal === item ? null : state.goal };
  if (isHeliItem(item)) return chooseHeli({ ...next, ownedHelis: [...state.ownedHelis, heliOf(item)] }, heliOf(item));
  if (isColourItem(item)) return fitColour({ ...next, colours: [...state.colours, colourOf(item)] }, colourOf(item));
  const { slot, rung } = parseMod(item);
  return fitMod({ ...next, unlocked: [...state.unlocked, item] }, slot, rung);
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'vault';
export function proposePurchase(state: HelipadState, item: Buyable, balance: number): PurchaseProposal<HelipadState, PurchaseFailure> {
  if (!ALL_BUYABLES.includes(item)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isLocked(state, item)) return { kind: 'rejected', reason: 'already-owned' };
  if (!forBolts(item)) return { kind: 'rejected', reason: 'vault' };
  const cost = boltPrice(item);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: grantAndFit(state, item) };
}

/** Opening the Fuel Lock: the Legendary is his once its top Rung is, and he has filled the tank right. */
export function openVault(state: HelipadState, item: LegendaryId): HelipadState | null {
  if (!ALL_MODS.includes(item) || !isLegendary(item) || !isLocked(state, item) || waitingOn(state, item)) return null;
  return grantAndFit(state, item);
}

// ---------- reading a save ----------

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);

function readFit(raw: unknown, unlocked: readonly ModId[], colours: readonly BoughtColour[]): Fit {
  const f = defaultFit();
  if (!isRecord(raw)) return f;
  for (const { id } of SLOTS) {
    const r = raw[id];
    if (r === 0 || ((r === 1 || r === 2 || r === 3 || r === 4) && unlocked.includes(`${id}:${r}`))) f[id] = r as Rung;
  }
  if (isTailNumber(raw.tailNumber)) f.tailNumber = raw.tailNumber;
  if (colours.includes(raw.colour as BoughtColour)) f.colour = raw.colour as BoughtColour;
  return f;
}

export function readHelipad(raw: unknown): HelipadState {
  const data = isRecord(raw) ? raw : {};
  const unlocked = Array.isArray(data.unlocked) ? [...new Set(data.unlocked.filter((m): m is ModId => ALL_MODS.includes(m as ModId)))] : [];
  const colours = Array.isArray(data.colours) ? [...new Set(data.colours.filter((c): c is BoughtColour => BOUGHT_COLOURS.includes(c as BoughtColour)))] : [];
  const fitted = isRecord(data.fitted) ? data.fitted : {};
  const bought = Array.isArray(data.ownedHelis) ? data.ownedHelis.filter((j): j is HeliId => HELI_IDS.includes(j as HeliId)) : [];
  const ownedHelis = HELI_IDS.filter(j => isStarter(j) || bought.includes(j));
  const heli = HELI_IDS.find(j => j === data.heli) ?? null;
  const goal = ALL_BUYABLES.find(x => x === data.goal) ?? null;
  const state: HelipadState = {
    heli: heli && !ownedHelis.includes(heli) ? 'uh60' : heli, ownedHelis, unlocked, colours, goal,
    fitted: Object.fromEntries(HELI_IDS.map(j => [j, readFit(fitted[j], unlocked, colours)])) as Record<HeliId, Fit>,
  };
  return { ...state, goal: goal && forBolts(goal) && isLocked(state, goal) ? goal : null };
}
