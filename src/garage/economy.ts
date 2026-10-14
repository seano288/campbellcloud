import { isAmount } from '../currency/amount';
import type { GarageInventory } from './state';
import { ALL_BUYABLES, bodyOf, colourOf, isBodyItem, isColourItem, isLegendary, isModItem, LEGENDARY, modId, parseMod, SLOTS, TOP, type Buyable, type ModId, type SlotId } from './catalog';

export const PRICES = {
  rungs: { 1: 5, 2: 15, 3: 30 },
  body: 30,
  colour: 3,
} as const;
/**
 * Legendary Mods, in cents, by his Pay the Shop Level, each paid with that Level's money: Level 1 under $1 in
 * pennies, nickels and dimes, Level 2 $1.10 to $2.90 with quarters, Level 3 $3.35 to $8.80 with bills.
 */
export const CASH_PRICES = {
  1: { tires: 35, number: 42, paint: 50, grille: 56, decals: 63, exhaust: 70, lights: 75, engine: 81, topper: 88, horn: 95 },
  2: { tires: 110, number: 135, paint: 150, grille: 165, decals: 185, exhaust: 210, lights: 230, engine: 245, topper: 260, horn: 290 },
  3: { tires: 335, number: 385, paint: 450, grille: 515, decals: 575, exhaust: 620, lights: 690, engine: 745, topper: 815, horn: 880 },
} as const satisfies Record<number, Record<SlotId, number>>;

export type GaragePricingContext = keyof typeof CASH_PRICES;
export type Price = { bolts: number; cents?: never } | { cents: number; bolts?: never };

/** A Legendary, the Mod on the top of a Slot's Rungs, bought with money. */
export type LegendaryId = `${SlotId}:${typeof LEGENDARY}`;
/** Anything bought with Bolts. */
export type BoltItem = Exclude<Buyable, LegendaryId>;

/** Bolts buy everything but a Legendary. */
export const forBolts = <X extends Buyable>(x: X): x is Exclude<X, LegendaryId> => !(isModItem(x) && isLegendary(x));

/** A Legendary's price follows his Pay the Shop Level, so it needs one; Bolt prices never change. */
export function priceOf(x: LegendaryId, context: GaragePricingContext): { cents: number };
export function priceOf(x: BoltItem): { bolts: number };
export function priceOf(x: Buyable, context: GaragePricingContext): Price;
export function priceOf(x: Buyable, context?: GaragePricingContext): Price {
  if (isBodyItem(x)) return { bolts: PRICES.body };
  if (isColourItem(x)) return { bolts: PRICES.colour };
  const { slot, rung } = parseMod(x);
  if (rung !== LEGENDARY) return { bolts: PRICES.rungs[rung] };
  if (context !== 1 && context !== 2 && context !== 3) throw new Error(`${x} needs a pricing context`);
  return { cents: CASH_PRICES[context][slot] };
}

export function isLocked(w: GarageInventory, x: Buyable) {
  if (isBodyItem(x)) return !w.ownedBodies.includes(bodyOf(x));
  if (isColourItem(x)) return !w.colours.includes(colourOf(x));
  return !w.unlocked.includes(x);
}

/** The top-Rung Mod a Legendary is waiting on: it opens for purchase only once that one is unlocked. */
export function waitingOn(w: GarageInventory, mod: ModId): ModId | null {
  const { slot, rung } = parseMod(mod), top = modId(slot, TOP);
  return rung === LEGENDARY && isLocked(w, top) ? top : null;
}

/** Locked things bought with Bolts: every Mod but the Legendaries, every Body he doesn't own and every Colour he hasn't bought. */
const lockedForBolts = (w: GarageInventory) => ALL_BUYABLES.filter(forBolts).filter(x => isLocked(w, x));

/**
 * What he's saving Bolts toward: the one he chose while it's locked, otherwise the cheapest locked Mod or Body (on a tie,
 * the first in the catalogue, so the Mods come before the Bodies).
 * A Colour is the Goal only when he chose it or it's all that's left, so the cheap ones don't take over the Goal bar.
 */
export function goalOf(w: GarageInventory): BoltItem | null {
  if (w.goal && isLocked(w, w.goal) && forBolts(w.goal)) return w.goal;
  const locked = lockedForBolts(w), rest = locked.filter(x => !isColourItem(x));
  let best: BoltItem | null = null;
  for (const x of rest.length ? rest : locked) if (!best || priceOf(x).bolts < priceOf(best).bolts) best = x;
  return best;
}

export const affordable = (w: GarageInventory, balance: number) => isAmount(balance) ? lockedForBolts(w).filter(x => priceOf(x).bolts <= balance) : [];
export const boltsNeeded = (balance: number, x: BoltItem) => Math.max(0, priceOf(x).bolts - balance);
export const hasAffordable = (state: GarageInventory, balance: number) => affordable(state, balance).length > 0;
export const becameAffordable = (state: GarageInventory, before: number, after: number) => isAmount(before) && isAmount(after) && affordable(state, after).length > affordable(state, before).length;
export const builtEverything = (w: GarageInventory) => ALL_BUYABLES.every(x => !isLocked(w, x));

/** The cheapest Legendary still to buy at his Level, for once everything bought with Bolts is his. */
export function nextLegendary(w: GarageInventory, context: GaragePricingContext): SlotId | null {
  const left = SLOTS.map(s => s.id).filter(id => isLocked(w, modId(id, LEGENDARY))), prices = CASH_PRICES[context];
  return left.length ? left.reduce((a, b) => (prices[b] < prices[a] ? b : a)) : null;
}
