// What tapping things on the Helipad does to the saved game, and what is said: fit a Mod or Colour he owns, buy one he can
// afford (it's fitted straight away), choose or buy a Helicopter, pick the Tail Number, and open the Fuel Lock.
import { buy, player, updateHelipad } from '../game';
import { needBolts, type Phrase } from '../phrases';
import type { Commit } from '../../save/store';
import type { ChopState } from '../game';
import {
  BOUGHT_COLOURS, buyableName, colourItem, defaultFit, FREE_COLOUR, isStarter, HELI_IDS, heliItem, LEGENDARY, modId, modName, BOLT_RUNGS,
  type BoughtColour, type Buyable, type ColourId, type Fit, type HeliId, type LegendaryId, type Rung, type SlotId, TOP,
} from './catalog';
import { affordable, boltsNeeded, chooseHeli, fitColour, fitMod, goalOf, isLocked, openVault, selectGoal, setTailNumber as numberHeli, waitingOn } from './helipad';

const helipad = () => player.state.value.helipad;
const balance = () => player.state.value.currency.balance;

export const currentHeli = (): HeliId => helipad().heli ?? 'uh60';
export const currentFit = (state: ChopState = player.state.value): Fit => state.helipad.fitted[state.helipad.heli ?? 'uh60'] ?? defaultFit();
export const owns = (h: HeliId) => helipad().ownedHelis.includes(h);
export const ownsColour = (c: ColourId) => c === FREE_COLOUR || helipad().colours.includes(c);
export const isUnlocked = (slot: SlotId, rung: Rung) => rung === 0 || helipad().unlocked.includes(modId(slot, rung));
const canBuy = (x: Buyable) => affordable(helipad(), balance()).includes(x);
export const canAfford = (slot: SlotId, rung: Rung) => rung !== 0 && rung !== LEGENDARY && canBuy(modId(slot, rung as 1 | 2 | 3));
export const canAffordHeli = (h: HeliId) => !isStarter(h) && canBuy(heliItem(h));
export const canAffordColour = (c: ColourId) => c !== FREE_COLOUR && canBuy(colourItem(c));
export const slotHasAffordable = (slot: SlotId) => BOLT_RUNGS.some(r => canAfford(slot, r)) || (slot === 'paint' && BOUGHT_COLOURS.some(canAffordColour));
export const waitingFor = (slot: SlotId) => waitingOn(helipad(), modId(slot, LEGENDARY));
export const goal = () => goalOf(helipad());

/** "Missiles. You need 4 more Bolts." */
export const needLines = (x: Buyable): Phrase[] => [buyableName(x) as Phrase, needBolts(boltsNeeded(balance(), x))];
export const gotLine = (x: Buyable) => `You got ${buyableName(x)}!` as Phrase;

type Done<K extends string> = { kind: K; state: ChopState } | { kind: 'rejected' };
const done = <K extends string>(kind: K, r: Commit<ChopState>): Done<K> => (r.kind === 'accepted' ? { kind, state: r.state } : { kind: 'rejected' });

/** Picking a locked item he can't afford makes it his Goal. */
function aim(x: Buyable) { if (isLocked(helipad(), x)) updateHelipad(h => selectGoal(h, x)); }

export type ModTap = Done<'fitted' | 'unlocked'> | { kind: 'vault' } | { kind: 'waiting' } | { kind: 'need' };
export function tapMod(slot: SlotId, rung: Rung): ModTap {
  if (isUnlocked(slot, rung)) return done('fitted', updateHelipad(h => fitMod(h, slot, rung)));
  if (rung === LEGENDARY) return waitingFor(slot) ? { kind: 'waiting' } : { kind: 'vault' };
  const item = modId(slot, rung as 1 | 2 | 3);
  if (canBuy(item)) return done('unlocked', buy(item));
  aim(item);
  return { kind: 'need' };
}

export function tapColour(c: ColourId): Done<'fitted' | 'unlocked'> | { kind: 'need' } {
  if (ownsColour(c)) return done('fitted', updateHelipad(h => fitColour(h, c)));
  const item = colourItem(c as BoughtColour);
  if (canBuy(item)) return done('unlocked', buy(item));
  aim(item);
  return { kind: 'need' };
}

export function tapHeli(id: HeliId): Done<'switched' | 'bought'> | { kind: 'need' } {
  if (owns(id)) return done('switched', updateHelipad(h => (h.heli === id ? null : chooseHeli(h, id))));
  if (isStarter(id)) return { kind: 'need' };
  const item = heliItem(id);
  if (canBuy(item)) return done('bought', buy(item));
  aim(item);
  return { kind: 'need' };
}

/** The ◀ ▶ arrows step through the Helicopters he owns. */
export function stepHeli(d: 1 | -1) {
  const mine = HELI_IDS.filter(owns), i = mine.indexOf(currentHeli());
  const next = mine[(i + d + mine.length) % mine.length]!;
  updateHelipad(h => chooseHeli(h, next));
  return next;
}

export const setTailNumber = (n: number) => updateHelipad(h => numberHeli(h, n));

/** The Fuel Lock opens once the tank is filled right: the Legendary is his, and fitted. */
export const unlockLegendary = (slot: SlotId) => updateHelipad(h => openVault(h, modId(slot, LEGENDARY) as LegendaryId));
export const waitLine = (slot: SlotId) => `Get ${modName(slot, TOP)} first!` as Phrase;
export const vaultLine = (slot: SlotId) => `You got ${modName(slot, LEGENDARY)}!` as Phrase;
