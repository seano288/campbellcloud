// The money app's Garage economy views. Bolt and Legendary prices belong to the Garage.
// App purchase commits combine Garage proposals and currency debits. Legendary checkout takes exact practice money.
// Level and Game Mode never lock anything.
import { affordable as affordableItems, becameAffordable, boltsNeeded as needed, hasAffordable, type BoltItem } from '../garage/economy';
import type { GarageInventory, GarageState } from '../garage/state';
import type { RewardCues } from '../rewards/presentation';

export { builtEverything, forBolts, goalOf, isLocked, nextLegendary, priceOf, waitingOn } from '../garage/economy';
export const garageCues = { hasAffordable, becameAffordable } satisfies RewardCues<GarageInventory>;
export interface Wallet extends GarageInventory, Partial<Pick<GarageState, 'body' | 'fitted'>> { bolts: number }

/** The app supplies his Bolt balance separately from Garage inventory. */
export const affordable = (w: Wallet) => affordableItems(w, w.bolts);
/** Read how many Bolts remain before the app can commit this purchase. */
export const boltsNeeded = (w: Wallet, x: BoltItem) => needed(w.bolts, x);
