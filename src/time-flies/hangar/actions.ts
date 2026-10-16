// What tapping things in the Hangar does to the saved game, and what is said: fit a Mod or Colour he owns, buy one he can
// afford (it's fitted straight away), choose or buy an Aircraft, pick the Tail Number, and open the Time Lock vault.
import { buy, player, updateHangar } from '../game';
import { needBolts, type Phrase } from '../phrases';
import type { Commit } from '../../save/store';
import type { FliesState } from '../game';
import {
  BOUGHT_COLOURS, buyableName, colourItem, defaultFit, FREE_COLOUR, isStarter, JET_IDS, jetItem, LEGENDARY, modId, modName, BOLT_RUNGS,
  type BoughtColour, type Buyable, type ColourId, type Fit, type JetId, type LegendaryId, type Rung, type SlotId, TOP,
} from './catalog';
import { affordable, boltsNeeded, chooseJet, fitColour, fitMod, goalOf, isLocked, openVault, selectGoal, setTailNumber as numberJet, waitingOn } from './hangar';

const hangar = () => player.state.value.hangar;
const balance = () => player.state.value.currency.balance;

export const currentJet = (): JetId => hangar().jet ?? 'p51';
export const currentFit = (state: FliesState = player.state.value): Fit => state.hangar.fitted[state.hangar.jet ?? 'p51'] ?? defaultFit();
export const owns = (j: JetId) => hangar().ownedJets.includes(j);
export const ownsColour = (c: ColourId) => c === FREE_COLOUR || hangar().colours.includes(c);
export const isUnlocked = (slot: SlotId, rung: Rung) => rung === 0 || hangar().unlocked.includes(modId(slot, rung));
const canBuy = (x: Buyable) => affordable(hangar(), balance()).includes(x);
export const canAfford = (slot: SlotId, rung: Rung) => rung !== 0 && rung !== LEGENDARY && canBuy(modId(slot, rung as 1 | 2 | 3));
export const canAffordJet = (j: JetId) => !isStarter(j) && canBuy(jetItem(j));
export const canAffordColour = (c: ColourId) => c !== FREE_COLOUR && canBuy(colourItem(c));
export const slotHasAffordable = (slot: SlotId) => BOLT_RUNGS.some(r => canAfford(slot, r)) || (slot === 'paint' && BOUGHT_COLOURS.some(canAffordColour));
export const waitingFor = (slot: SlotId) => waitingOn(hangar(), modId(slot, LEGENDARY));
export const goal = () => goalOf(hangar());

/** "Missiles. You need 4 more Bolts." */
export const needLines = (x: Buyable): Phrase[] => [buyableName(x) as Phrase, needBolts(boltsNeeded(balance(), x))];
export const gotLine = (x: Buyable) => `You got ${buyableName(x)}!` as Phrase;

type Done<K extends string> = { kind: K; state: FliesState } | { kind: 'rejected' };
const done = <K extends string>(kind: K, r: Commit<FliesState>): Done<K> => (r.kind === 'accepted' ? { kind, state: r.state } : { kind: 'rejected' });

/** Picking a locked item he can't afford makes it his Goal. */
function aim(x: Buyable) { if (isLocked(hangar(), x)) updateHangar(h => selectGoal(h, x)); }

export type ModTap = Done<'fitted' | 'unlocked'> | { kind: 'vault' } | { kind: 'waiting' } | { kind: 'need' };
export function tapMod(slot: SlotId, rung: Rung): ModTap {
  if (isUnlocked(slot, rung)) return done('fitted', updateHangar(h => fitMod(h, slot, rung)));
  if (rung === LEGENDARY) return waitingFor(slot) ? { kind: 'waiting' } : { kind: 'vault' };
  const item = modId(slot, rung as 1 | 2 | 3);
  if (canBuy(item)) return done('unlocked', buy(item));
  aim(item);
  return { kind: 'need' };
}

export function tapColour(c: ColourId): Done<'fitted' | 'unlocked'> | { kind: 'need' } {
  if (ownsColour(c)) return done('fitted', updateHangar(h => fitColour(h, c)));
  const item = colourItem(c as BoughtColour);
  if (canBuy(item)) return done('unlocked', buy(item));
  aim(item);
  return { kind: 'need' };
}

export function tapJet(j: JetId): Done<'switched' | 'bought'> | { kind: 'need' } {
  if (owns(j)) return done('switched', updateHangar(h => (h.jet === j ? null : chooseJet(h, j))));
  if (isStarter(j)) return { kind: 'need' };
  const item = jetItem(j);
  if (canBuy(item)) return done('bought', buy(item));
  aim(item);
  return { kind: 'need' };
}

/** The ◀ ▶ arrows step through the Aircraft he owns. */
export function stepJet(d: 1 | -1) {
  const mine = JET_IDS.filter(owns), i = mine.indexOf(currentJet());
  const next = mine[(i + d + mine.length) % mine.length]!;
  updateHangar(h => chooseJet(h, next));
  return next;
}

export const setTailNumber = (n: number) => updateHangar(h => numberJet(h, n));

/** The vault opens once the clock is set right: the Legendary is his, and fitted. */
export const unlockLegendary = (slot: SlotId) => updateHangar(h => openVault(h, modId(slot, LEGENDARY) as LegendaryId));
export const waitLine = (slot: SlotId) => `Get ${modName(slot, TOP)} first!` as Phrase;
export const vaultLine = (slot: SlotId) => `You got ${modName(slot, LEGENDARY)}!` as Phrase;
