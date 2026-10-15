// Garage actions on the saved game: choosing and buying Bodies, fitting and unlocking Mods and Colours, and the Goal.
import { game, player } from '../game/store';
import { needBolts } from '../garage/phrases';
import type { Phrase } from '../voice/phrases';
import type { Item } from '../voice/say';
import {
  bodyItem, BODY_IDS, BOUGHT_COLOURS, buyableName, colourItem, defaultFit, FREE_COLOUR, isLegendary, isModItem, isStarter, LEGENDARY, modId, modName, parseMod,
  BOLT_RUNGS, type BodyId, type BoughtColour, type Buyable, type BuyRung, type ColourId, type Fit, type ModId, type Rung, type SlotId,
} from '../garage/catalog';
import type { Level } from '../modes/ids';
import { affordable, boltsNeeded, forBolts, goalOf, priceOf, waitingOn } from './garageEconomy';
import { affordable as affordableItems, type BoltItem } from '../garage/economy';
import { chooseBody as selectBody, fitColour as applyColour, fitMod, selectGoal, setDoorNumber as numberBody, type GarageState } from '../garage/state';
import type { Save } from '../save/migrate';
import { garageFromSave, type MoneyState } from './save';
import { proposePurchase } from '../garage/purchases';
import type { Commit } from '../save/store';
import { createGaragePurchases } from './purchases';
import { moneyApp } from './money';
import { truckColor as colorOfFit } from '../garage/BodyArt';

export { garageFromSave } from './save';
export const withGarage = (save: Save, state: GarageState): Save => ({
  ...save, body: state.body, ownedBodies: state.ownedBodies, fitted: state.fitted, unlocked: state.unlocked, colours: state.colours, goal: state.goal,
});

const updateGarage = (change: (state: GarageState) => GarageState) => player.commit(state => ({ ...state, garage: change(state.garage) }));

export const currentBody = (): BodyId => game.value.body ?? 'pickup';
export const currentFit = (state = player.state.value): Fit => state.garage.fitted[state.garage.body ?? 'pickup'] ?? defaultFit();

/** His Pay the Shop Level, which sets what a Legendary costs. */
export const payLevel = (): Level => game.value.modes.pay.level;
/** A Legendary's price in cents at his Pay the Shop Level. */
export const legendaryPrice = (slot: SlotId, level = payLevel()) => priceOf(modId(slot, LEGENDARY), level).cents!;

/** His Truck's paint as one flat colour, for the 2D Truck on Home and the celebration road: Plain shows his Colour. */
export function truckColor() {
  return colorOfFit(currentFit());
}

export const owns = (b: BodyId) => game.value.ownedBodies.includes(b);

export function chooseBody(body: BodyId) {
  return updateGarage(state => selectBody(state, body));
}

/** The ◀ ▶ arrows step through the Bodies he owns. */
export function stepBody(d: 1 | -1) {
  const mine = BODY_IDS.filter(owns), i = mine.indexOf(currentBody());
  chooseBody(mine[(i + d + mine.length) % mine.length]!);
}

function fit(slot: SlotId, rung: Rung) {
  return updateGarage(state => fitMod(state, slot, rung));
}

/** The number on this Body's door. Changing it is always free. */
export function setDoorNumber(n: number) {
  return updateGarage(state => numberBody(state, n));
}

export const isUnlocked = (slot: SlotId, rung: Rung) => rung === 0 || game.value.unlocked.includes(modId(slot, rung));
/** A Bolt item he has enough Bolts for. */
const canBuyWithBolts = (x: Buyable) => forBolts(x) && affordableItems(garageFromSave(game.value), game.value.bolts).includes(x);
export const canAfford = (slot: SlotId, rung: Rung) => rung !== 0 && canBuyWithBolts(modId(slot, rung));
export const canAffordBody = (b: BodyId) => !isStarter(b) && canBuyWithBolts(bodyItem(b));
/** The Paint hotspot also rings for a Colour he can buy. */
export const slotHasAffordable = (slot: SlotId) => BOLT_RUNGS.some(r => canAfford(slot, r)) || (slot === 'paint' && BOUGHT_COLOURS.some(canAffordColour));
/** The top-Rung Mod this Legendary is still waiting on. */
export const waitingFor = (slot: SlotId) => waitingOn(garageFromSave(game.value), modId(slot, LEGENDARY));
export const affordableCount = () => affordable(game.value).length;
export const goal = () => goalOf(garageFromSave(game.value));

export const buyWithBolts = createGaragePurchases(player, { proposePurchase });

type TapCommit<K extends string> =
  | { kind: K; state: MoneyState; saved: Promise<boolean> }
  | Extract<Commit<MoneyState>, { kind: 'rejected' }>;

const tapResult = <K extends string>(kind: K, result: Commit<MoneyState>): TapCommit<K> =>
  result.kind === 'accepted' ? { ...result, kind } : result;

export type TapResult = TapCommit<'fitted' | 'unlocked' | 'goal'> | { kind: 'checkout' } | { kind: 'waiting' };

/**
 * Tapping a Mod tile: an owned Mod is fitted; an affordable one is unlocked and fitted in one tap; a locked one
 * becomes the Goal. A locked Legendary opens the checkout, or waits until the top Rung in its Slot is unlocked.
 */
export function tapMod(slot: SlotId, rung: Rung): TapResult {
  if (isUnlocked(slot, rung)) return tapResult('fitted', fit(slot, rung));
  const mod = modId(slot, rung as BuyRung);
  if (isLegendary(mod)) return { kind: waitingFor(slot) ? 'waiting' : 'checkout' };
  if (canAfford(slot, rung)) return tapResult('unlocked', buyWithBolts(mod));
  return tapResult('goal', updateGarage(state => selectGoal(state, mod)));
}

export const ownsColour = (c: ColourId) => c === FREE_COLOUR || game.value.colours.includes(c);
export const canAffordColour = (c: ColourId) => c !== FREE_COLOUR && canBuyWithBolts(colourItem(c));

/** Fit a Colour on this Body. If the fitted Paint covers it, the Paint goes back to Plain so he sees it. */
function fitColour(c: ColourId) {
  return updateGarage(state => applyColour(state, c));
}

/** Tapping a Colour swatch: an owned one is fitted; an affordable one is bought and fitted; a locked one becomes the Goal. */
export function tapColour(c: ColourId): TapCommit<'fitted' | 'unlocked' | 'goal'> {
  if (ownsColour(c)) return tapResult('fitted', fitColour(c));
  const item = colourItem(c as BoughtColour);
  if (canBuyWithBolts(item)) return tapResult('unlocked', buyWithBolts(item));
  return tapResult('goal', updateGarage(state => selectGoal(state, item)));
}

/** He paid exactly for a Legendary at the checkout, at the Level its price was set for: it's his, and fitted. */
export const legendaryCheckout = moneyApp.checkout;

export type BodyTapResult = TapCommit<'switched' | 'bought' | 'goal'>;

/** Tapping a Body in the switcher: an owned one is driven; an affordable one is bought and driven; a locked one becomes the Goal. */
export function tapBody(b: BodyId): BodyTapResult {
  if (owns(b) || isStarter(b)) return tapResult('switched', chooseBody(b));
  const item = bodyItem(b);
  if (canBuyWithBolts(item)) return tapResult('bought', buyWithBolts(item));
  return tapResult('goal', updateGarage(state => selectGoal(state, item)));
}

/** "Chunky. You need 2 more Bolts." */
export const needLines = (x: BoltItem): Phrase[] => [buyableName(x), needBolts(boltsNeeded(game.value, x))];

/** "You got Chunky!", or "You bought Gold Flake!" for a Legendary. */
export function gotLine(x: Buyable): Phrase {
  if (isModItem(x) && isLegendary(x)) return `You bought ${buyableName(x)}!` as Phrase;
  return `You got ${buyableName(x)}!` as Phrase;
}

/** "Gold Flake costs $1.50." */
export const costLines = (slot: SlotId, level = payLevel()): Item[] => [`${modName(slot, LEGENDARY)} costs` as Phrase, { cents: legendaryPrice(slot, level) }];

/** "Laser Show. Get Glow Under first!" */
export function waitLines(slot: SlotId, top: ModId): Phrase[] {
  const { rung } = parseMod(top);
  return [modName(slot, LEGENDARY), `Get ${modName(slot, rung)} first!` as Phrase];
}
