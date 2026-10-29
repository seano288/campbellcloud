// What tapping things in the Camp does to the saved game, and what is said: recruit a soldier, unlock a Squad, fit a Mod
// or Colour he owns, buy one he can afford (it's fitted straight away), and open the Password Lock.
import { buy, player, updateCamp, type SquadState } from '../game';
import { needLine } from '../../currency/kind';
import { SQUAD_CURRENCY } from '../branding';
import type { Phrase } from '../phrases';
import type { Commit } from '../../save/store';
import {
  BUY_RUNGS, BOUGHT_COLOURS, buyableName, colourById, colourItem, LEGENDARY, modId, modName, recruit, TOP, unitItem, UNITS,
  type BoughtColour, type BoughtUnit, type Buyable, type ColourId, type LegendaryId, type Purchase, type Rung, type SlotId, type UnitId,
} from './catalog';
import { affordable, priceOf, stillNeeded, canRecruit, fitColour, fitMod, goalOf, isFull, isLocked, openVault, ownsColour as owns, selectGoal, waitingOn, type CampState } from './camp';

const camp = () => player.state.value.camp;
const balance = () => player.state.value.currency.balance;

/** The army's plastic, as a colour. */
export const colourHex = (c: Pick<CampState, 'colour'>) => colourById(c.colour ?? 'green').hex;
export const ownsColour = (c: ColourId) => owns(camp(), c);
export const hasUnit = (u: UnitId) => camp().units.includes(u);
export const isUnlocked = (slot: SlotId, rung: Rung) => rung === 0 || camp().unlocked.includes(modId(slot, rung));
const canBuy = (x: Buyable) => affordable(camp(), balance()).includes(x);
export const canAfford = (slot: SlotId, rung: Rung) => rung !== 0 && rung !== LEGENDARY && canBuy(modId(slot, rung as 1 | 2 | 3));
export const canAffordUnit = (u: UnitId) => !hasUnit(u) && canBuy(unitItem(u as BoughtUnit));
export const canAffordRecruit = (u: UnitId) => canRecruit(camp(), u) && balance() >= UNITS[u].recruit;
export const canAffordColour = (c: ColourId) => !ownsColour(c) && canBuy(colourItem(c as BoughtColour));
export const slotHasAffordable = (slot: SlotId) => BUY_RUNGS.some(r => canAfford(slot, r));
export const coloursAffordable = () => BOUGHT_COLOURS.some(canAffordColour);
export const squadsAffordable = () => (Object.keys(UNITS) as UnitId[]).some(u => canAffordUnit(u) || canAffordRecruit(u));
export const waitingFor = (slot: SlotId) => waitingOn(camp(), modId(slot, LEGENDARY));
export const goal = () => goalOf(camp());

/** "Missiles. You need 4 more Ammo." */
export const needLines = (x: Purchase, name: Phrase): Phrase[] => [name, needLine(SQUAD_CURRENCY, stillNeeded(balance(), x))];
export const gotLine = (x: Buyable) => `You got ${buyableName(x)}!` as Phrase;

type Done<K extends string> = { kind: K; state: SquadState } | { kind: 'rejected' };
const done = <K extends string>(kind: K, r: Commit<SquadState>): Done<K> => (r.kind === 'accepted' ? { kind, state: r.state } : { kind: 'rejected' });

/** Picking a locked item he can't afford makes it his Goal. */
function aim(x: Buyable) { if (isLocked(camp(), x)) updateCamp(c => selectGoal(c, x)); }

export type ModTap = Done<'fitted' | 'unlocked'> | { kind: 'vault' } | { kind: 'waiting' } | { kind: 'need' };
export function tapMod(slot: SlotId, rung: Rung): ModTap {
  if (isUnlocked(slot, rung)) return done('fitted', updateCamp(c => fitMod(c, slot, rung)));
  if (rung === LEGENDARY) return waitingFor(slot) ? { kind: 'waiting' } : { kind: 'vault' };
  const item = modId(slot, rung as 1 | 2 | 3);
  if (canBuy(item)) return done('unlocked', buy(item));
  aim(item);
  return { kind: 'need' };
}

export function tapColour(c: ColourId): Done<'fitted' | 'unlocked'> | { kind: 'need' } {
  if (ownsColour(c)) return done('fitted', updateCamp(s => fitColour(s, c)));
  const item = colourItem(c as BoughtColour);
  if (canBuy(item)) return done('unlocked', buy(item));
  aim(item);
  return { kind: 'need' };
}

/** A Squad card: unlock it, or recruit one more of it. */
export type UnitTap = Done<'unlocked' | 'recruited'> | { kind: 'need'; item: Purchase } | { kind: 'full' };
export function tapUnit(u: UnitId): UnitTap {
  if (!hasUnit(u)) {
    const item = unitItem(u as BoughtUnit);
    if (canBuy(item)) return done('unlocked', buy(item));
    aim(item);
    return { kind: 'need', item };
  }
  if (isFull(camp(), u)) return { kind: 'full' };
  const item = recruit(u);
  if (balance() >= priceOf(item)) return done('recruited', buy(item));
  return { kind: 'need', item };
}

/** The Password Lock opens once the password is built: the Legendary is his, and fitted. */
export const unlockLegendary = (slot: SlotId) => updateCamp(c => openVault(c, modId(slot, LEGENDARY) as LegendaryId));
export const waitLine = (slot: SlotId) => `Get ${modName(slot, TOP)} first!` as Phrase;
export const vaultLine = (slot: SlotId) => `You got ${modName(slot, LEGENDARY)}!` as Phrase;
