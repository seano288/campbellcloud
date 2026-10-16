// The Hangar on the saved game: which Aircraft he flies, what he owns, what is fitted to each Aircraft, and the Goal.
// Prices and the Goal follow the Garage in Monster Truck Money: Mods cost 5, 15 and 30 Bolts by Rung, an Aircraft
// 30 and a Colour 3. A Legendary is never bought with Bolts: it waits for the top Rung, then the Time Lock opens it.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import {
  ALL_BUYABLES, ALL_MODS, BOUGHT_COLOURS, colourOf, defaultFit, FREE_COLOUR, isColourItem, isJetItem, isLegendary, isModItem,
  isStarter, isTailNumber, JET_IDS, jetOf, LEGENDARY, modId, parseMod, SLOTS, STARTER_JETS, TOP,
  type BoughtColour, type Buyable, type ColourId, type Fit, type JetId, type LegendaryId, type ModId, type Rung, type SlotId,
} from './catalog';

export interface HangarState {
  jet: JetId | null;
  ownedJets: JetId[];
  fitted: Record<JetId, Fit>;
  unlocked: ModId[];
  colours: BoughtColour[];
  goal: Buyable | null;
}
export type HangarInventory = Pick<HangarState, 'unlocked' | 'ownedJets' | 'colours' | 'goal'>;

export const freshHangar = (): HangarState => ({
  jet: null, ownedJets: [...STARTER_JETS],
  fitted: Object.fromEntries(JET_IDS.map(j => [j, defaultFit()])) as Record<JetId, Fit>,
  unlocked: [], colours: [], goal: null,
});

export const PRICES = { rungs: { 1: 5, 2: 15, 3: 30 }, jet: 30, colour: 3 } as const;

/** Bolts buy everything but a Legendary. */
export const forBolts = (x: Buyable) => !(isModItem(x) && isLegendary(x));
export function boltPrice(x: Buyable): number {
  if (isJetItem(x)) return PRICES.jet;
  if (isColourItem(x)) return PRICES.colour;
  const { rung } = parseMod(x);
  if (rung === LEGENDARY) throw new Error(`${x} is in the Time Lock vault`);
  return PRICES.rungs[rung];
}
export function isLocked(w: HangarInventory, x: Buyable) {
  if (isJetItem(x)) return !w.ownedJets.includes(jetOf(x));
  if (isColourItem(x)) return !w.colours.includes(colourOf(x));
  return !w.unlocked.includes(x);
}
/** The top-Rung Mod a Legendary is waiting on. */
export function waitingOn(w: HangarInventory, mod: ModId): ModId | null {
  const { slot, rung } = parseMod(mod), top = modId(slot, TOP);
  return rung === LEGENDARY && isLocked(w, top) ? top : null;
}
const lockedForBolts = (w: HangarInventory) => ALL_BUYABLES.filter(forBolts).filter(x => isLocked(w, x));
/** The one he chose while it's locked, otherwise the cheapest locked Mod or Aircraft; a Colour only once nothing else is left. */
export function goalOf(w: HangarInventory): Buyable | null {
  if (w.goal && isLocked(w, w.goal) && forBolts(w.goal)) return w.goal;
  const locked = lockedForBolts(w), rest = locked.filter(x => !isColourItem(x));
  let best: Buyable | null = null;
  for (const x of rest.length ? rest : locked) if (!best || boltPrice(x) < boltPrice(best)) best = x;
  return best;
}
export const affordable = (w: HangarInventory, balance: number) => (isAmount(balance) ? lockedForBolts(w).filter(x => boltPrice(x) <= balance) : []);
export const hasAffordable = (w: HangarInventory, balance: number) => affordable(w, balance).length > 0;
export const becameAffordable = (w: HangarInventory, before: number, after: number) =>
  isAmount(before) && isAmount(after) && affordable(w, after).length > affordable(w, before).length;
export const boltsNeeded = (balance: number, x: Buyable) => Math.max(0, boltPrice(x) - balance);
/** The next Legendary still in the vault, once everything bought with Bolts is his. */
export const nextLegendary = (w: HangarInventory): SlotId | null => SLOTS.map(s => s.id).find(id => isLocked(w, modId(id, LEGENDARY))) ?? null;
export const builtEverything = (w: HangarInventory) => ALL_BUYABLES.every(x => !isLocked(w, x));

// ---------- changes ----------

const current = (state: HangarState): JetId => state.jet ?? 'p51';
function withFit(state: HangarState, patch: Partial<Fit>): HangarState {
  const jet = current(state);
  return { ...state, fitted: { ...state.fitted, [jet]: { ...state.fitted[jet], ...patch } } };
}
export function fitMod(state: HangarState, slot: SlotId, rung: Rung): HangarState {
  if (rung !== 0 && !state.unlocked.includes(modId(slot, rung))) throw new Error('Mod is not owned');
  return withFit(state, { [slot]: rung });
}
export function fitColour(state: HangarState, colour: ColourId): HangarState {
  if (colour !== FREE_COLOUR && !state.colours.includes(colour)) throw new Error('Colour is not owned');
  return withFit(state, { colour, paint: 0 }); // a Colour shows with Plain paint
}
export function chooseJet(state: HangarState, jet: JetId): HangarState {
  if (!state.ownedJets.includes(jet)) throw new Error('Aircraft is not owned');
  return { ...state, jet };
}
export function setTailNumber(state: HangarState, n: number): HangarState {
  if (!isTailNumber(n)) throw new Error('Invalid Tail Number');
  return withFit(state, { tailNumber: n });
}
export function selectGoal(state: HangarState, item: Buyable): HangarState {
  if (!forBolts(item) || !isLocked(state, item)) throw new Error('Goal must be a locked Bolt item');
  return { ...state, goal: item };
}

function grantAndFit(state: HangarState, item: Buyable): HangarState {
  const next = { ...state, goal: state.goal === item ? null : state.goal };
  if (isJetItem(item)) return chooseJet({ ...next, ownedJets: [...state.ownedJets, jetOf(item)] }, jetOf(item));
  if (isColourItem(item)) return fitColour({ ...next, colours: [...state.colours, colourOf(item)] }, colourOf(item));
  const { slot, rung } = parseMod(item);
  return fitMod({ ...next, unlocked: [...state.unlocked, item] }, slot, rung);
}

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'vault';
export function proposePurchase(state: HangarState, item: Buyable, balance: number): PurchaseProposal<HangarState, PurchaseFailure> {
  if (!ALL_BUYABLES.includes(item)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isLocked(state, item)) return { kind: 'rejected', reason: 'already-owned' };
  if (!forBolts(item)) return { kind: 'rejected', reason: 'vault' };
  const cost = boltPrice(item);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: grantAndFit(state, item) };
}

/** Opening the Time Lock: the Legendary is his once its top Rung is, and he has set the clock right. */
export function openVault(state: HangarState, item: LegendaryId): HangarState | null {
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

export function readHangar(raw: unknown): HangarState {
  const data = isRecord(raw) ? raw : {};
  const unlocked = Array.isArray(data.unlocked) ? [...new Set(data.unlocked.filter((m): m is ModId => ALL_MODS.includes(m as ModId)))] : [];
  const colours = Array.isArray(data.colours) ? [...new Set(data.colours.filter((c): c is BoughtColour => BOUGHT_COLOURS.includes(c as BoughtColour)))] : [];
  const fitted = isRecord(data.fitted) ? data.fitted : {};
  const bought = Array.isArray(data.ownedJets) ? data.ownedJets.filter((j): j is JetId => JET_IDS.includes(j as JetId)) : [];
  const ownedJets = JET_IDS.filter(j => isStarter(j) || bought.includes(j));
  const jet = JET_IDS.find(j => j === data.jet) ?? null;
  const goal = ALL_BUYABLES.find(x => x === data.goal) ?? null;
  const state: HangarState = {
    jet: jet && !ownedJets.includes(jet) ? 'p51' : jet, ownedJets, unlocked, colours, goal,
    fitted: Object.fromEntries(JET_IDS.map(j => [j, readFit(fitted[j], unlocked, colours)])) as Record<JetId, Fit>,
  };
  return { ...state, goal: goal && forBolts(goal) && isLocked(state, goal) ? goal : null };
}
