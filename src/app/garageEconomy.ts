// The Garage economy. Bolt prices (Mods on Rungs 1-3, every Body bought and the Colours) live in one table and Legendary cash
// prices, one per Pay the Shop Level, in another. Buying goes only through unlock(): Bolts for everything except a
// Legendary, which takes an exact payment in money at his Level's price. Level and Game Mode never lock anything.
import { debit } from '../currency/currency';
import { type Buyable } from '../garage/catalog';
import { affordable as affordableItems, becameAffordable, boltsNeeded as needed, forBolts, hasAffordable, type BoltItem, type GaragePricingContext } from '../garage/economy';
import { proposeLegendary, proposePurchase } from '../garage/purchases';
import { freshGarage, type GarageInventory, type GarageState } from '../garage/state';
import type { RewardCues } from '../rewards/presentation';

export { builtEverything, forBolts, goalOf, isLocked, nextLegendary, priceOf, waitingOn } from '../garage/economy';
export const garageCues = { hasAffordable, becameAffordable } satisfies RewardCues<GarageInventory>;
export interface Wallet extends GarageInventory, Partial<Pick<GarageState, 'body' | 'fitted'>> { bolts: number }

/** How he pays: Bolts, or money tapped into the Pay the Shop tray (its total, in cents) at his Pay the Shop Level. */
export type Payment = { kind: 'bolts' } | { kind: 'cash'; cents: number; level: GaragePricingContext };

/** Pay for it and unlock it, a Legendary at the price for the Level he paid at. Final: no refunds. */
export function unlock<W extends Wallet>(w: W, x: Buyable, pay: Payment): W {
  const fresh = freshGarage();
  const state: GarageState = {
    body: w.body ?? null, fitted: w.fitted ?? fresh.fitted,
    unlocked: [...w.unlocked], ownedBodies: [...w.ownedBodies], colours: [...w.colours], goal: w.goal,
  };
  if (forBolts(x)) {
    if (pay.kind !== 'bolts') throw new Error(`${x} costs Bolts`);
    const proposal = proposePurchase(state, x, w.bolts);
    if (proposal.kind === 'rejected') throw new Error(proposal.reason);
    const payment = debit({ balance: w.bolts }, proposal.cost);
    if (payment.kind === 'rejected') throw new Error(payment.reason);
    return { ...w, bolts: payment.state.balance, unlocked: proposal.state.unlocked, ownedBodies: proposal.state.ownedBodies, colours: proposal.state.colours, goal: proposal.state.goal };
  }
  if (pay.kind !== 'cash') throw new Error(`${x} costs its exact price in money`);
  const proposal = proposeLegendary(state, x, pay.level, pay.cents);
  if (proposal.kind === 'rejected') throw new Error(proposal.reason);
  return { ...w, unlocked: proposal.state.unlocked, goal: proposal.state.goal };
}

export const affordable = (w: Wallet) => affordableItems(w, w.bolts);
export const boltsNeeded = (w: Wallet, x: BoltItem) => needed(w.bolts, x);
