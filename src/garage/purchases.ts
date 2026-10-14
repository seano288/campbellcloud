import { isAmount } from '../currency/amount';
import type { PurchaseProposal } from '../rewards/purchase';
import { ALL_BUYABLES, ALL_MODS, bodyOf, colourOf, isBodyItem, isColourItem, isLegendary, parseMod, type Buyable } from './catalog';
import { forBolts, isLocked, priceOf, waitingOn, type GaragePricingContext, type LegendaryId } from './economy';
import { chooseBody, fitColour, fitMod, type GarageState } from './state';

export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned' | 'cash-required';

export function proposePurchase(state: GarageState, item: Buyable, balance: number): PurchaseProposal<GarageState, PurchaseFailure> {
  if (!ALL_BUYABLES.includes(item)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (!isLocked(state, item)) return { kind: 'rejected', reason: 'already-owned' };
  if (!forBolts(item)) return { kind: 'rejected', reason: 'cash-required' };
  const cost = priceOf(item).bolts;
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  return { kind: 'ready', cost, state: grantAndFit(state, item) };
}

export type LegendaryFailure = 'invalid-item' | 'already-owned' | 'waiting' | 'invalid-context' | 'invalid-payment';
type LegendaryRejection = { kind: 'rejected'; reason: LegendaryFailure };

export function requestLegendary(state: GarageState, item: LegendaryId, context: GaragePricingContext):
  { kind: 'ready'; item: LegendaryId; cents: number } | LegendaryRejection {
  if (!ALL_MODS.includes(item) || !isLegendary(item)) return { kind: 'rejected', reason: 'invalid-item' };
  if (context !== 1 && context !== 2 && context !== 3) return { kind: 'rejected', reason: 'invalid-context' };
  if (!isLocked(state, item)) return { kind: 'rejected', reason: 'already-owned' };
  if (waitingOn(state, item)) return { kind: 'rejected', reason: 'waiting' };
  return { kind: 'ready', item, cents: priceOf(item, context).cents };
}

export function proposeLegendary(state: GarageState, item: LegendaryId, context: GaragePricingContext, paid: number):
  { kind: 'ready'; state: GarageState } | LegendaryRejection {
  const request = requestLegendary(state, item, context);
  if (request.kind === 'rejected') return request;
  if (!isAmount(paid) || paid !== request.cents) return { kind: 'rejected', reason: 'invalid-payment' };
  return { kind: 'ready', state: grantAndFit(state, item) };
}

function grantAndFit(state: GarageState, item: Buyable): GarageState {
  const next = { ...state, goal: state.goal === item ? null : state.goal };
  if (isBodyItem(item)) return chooseBody({ ...next, ownedBodies: [...state.ownedBodies, bodyOf(item)] }, bodyOf(item));
  if (isColourItem(item)) return fitColour({ ...next, colours: [...state.colours, colourOf(item)] }, colourOf(item));
  const { slot, rung } = parseMod(item);
  return fitMod({ ...next, unlocked: [...state.unlocked, item] }, slot, rung);
}
