// The Workshop on the saved game: the Mods he owns, what TORQUE has fitted, the Goal, and his fights. The Goal is the cheapest
// locked Mod unless he tapped another. His first fight is free and each one after costs FIGHT_COST Bolts. A fight he has paid for
// stays his until he sees it end (`ticket`), so a reload, a crash or leaving early never costs him Bolts for nothing.
import { isAmount } from '../../currency/amount';
import type { PurchaseProposal } from '../../rewards/purchase';
import { ALL_MODS, defaultGear, parseMod, RUNGS, SLOT_IDS, type BuyRung, type Gear, type ModId, type Rung, type SlotId, modId } from './catalog';

export interface WorkshopState {
  unlocked: ModId[];
  gear: Gear;
  goal: ModId | null;
  /** Fights he has seen to the end. */
  fights: number;
  /** A fight paid for and not finished yet. */
  ticket: boolean;
}

export const freshWorkshop = (): WorkshopState => ({ unlocked: [], gear: defaultGear(), goal: null, fights: 0, ticket: false });

type Raw = Record<string, unknown>;
const isRecord = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
/** Whatever is missing or doesn't read as the fresh value: saves from before the Workshop have nothing here. */
export function readWorkshop(raw: unknown): WorkshopState {
  if (!isRecord(raw)) return freshWorkshop();
  const unlocked = Array.isArray(raw.unlocked) ? ALL_MODS.filter(m => (raw.unlocked as unknown[]).includes(m)) : [];
  const worn = isRecord(raw.gear) ? raw.gear : {};
  const gear = Object.fromEntries(SLOT_IDS.map(s => {
    const rung = RUNGS.find(r => r === worn[s]) ?? 0;
    return [s, rung === 0 || unlocked.includes(modId(s, rung)) ? rung : 0];
  })) as Gear;
  return {
    unlocked, gear,
    goal: ALL_MODS.find(m => m === raw.goal) ?? null,
    fights: isAmount(raw.fights) ? raw.fights : 0,
    ticket: raw.ticket === true,
  };
}

export const PRICES = { rungs: { 1: 5, 2: 15, 3: 30 } } as const satisfies { rungs: Record<BuyRung, number> };
export const FIGHT_COST = 5;
export const priceOf = (m: ModId) => PRICES.rungs[parseMod(m).rung];
/** What tapping Fight costs him now. */
export const fightPrice = (w: Pick<WorkshopState, 'fights' | 'ticket'>) => (w.ticket || w.fights === 0 ? 0 : FIGHT_COST);

export const isLocked = (w: Pick<WorkshopState, 'unlocked'>, m: ModId) => !w.unlocked.includes(m);
export const isOwned = (w: Pick<WorkshopState, 'unlocked'>, slot: SlotId, rung: Rung) => rung === 0 || w.unlocked.includes(modId(slot, rung));
/** The one he chose while it's locked, otherwise the cheapest locked Mod. */
export function goalOf(w: Pick<WorkshopState, 'unlocked' | 'goal'>): ModId | null {
  if (w.goal && isLocked(w, w.goal)) return w.goal;
  let best: ModId | null = null;
  for (const m of ALL_MODS) if (isLocked(w, m) && (!best || priceOf(m) < priceOf(best))) best = m;
  return best;
}

export function fitMod(state: WorkshopState, slot: SlotId, rung: Rung): WorkshopState {
  if (!isOwned(state, slot, rung)) throw new Error('Mod is not owned');
  return { ...state, gear: { ...state.gear, [slot]: rung } };
}
export function selectGoal(state: WorkshopState, item: ModId): WorkshopState {
  if (!isLocked(state, item)) throw new Error('Goal must be a locked Mod');
  return { ...state, goal: item };
}

export type Purchase = ModId | 'fight';
export type PurchaseFailure = 'invalid-item' | 'invalid-balance' | 'insufficient-funds' | 'already-owned';
export function proposePurchase(state: WorkshopState, item: Purchase, balance: number): PurchaseProposal<WorkshopState, PurchaseFailure> {
  if (!isAmount(balance)) return { kind: 'rejected', reason: 'invalid-balance' };
  if (item === 'fight') {
    if (state.ticket) return { kind: 'rejected', reason: 'already-owned' };
    const cost = fightPrice(state);
    if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
    return { kind: 'ready', cost, state: { ...state, ticket: true } };
  }
  if (!ALL_MODS.includes(item)) return { kind: 'rejected', reason: 'invalid-item' };
  if (!isLocked(state, item)) return { kind: 'rejected', reason: 'already-owned' };
  const cost = priceOf(item);
  if (balance < cost) return { kind: 'rejected', reason: 'insufficient-funds' };
  const { slot, rung } = parseMod(item);
  return { kind: 'ready', cost, state: fitMod({ ...state, unlocked: [...state.unlocked, item], goal: state.goal === item ? null : state.goal }, slot, rung) };
}

/** He saw the fight end: the ticket is used. */
export const finishFight = (state: WorkshopState): WorkshopState | null => (state.ticket ? { ...state, ticket: false, fights: state.fights + 1 } : null);

/** Fight seeds the 200-seed soak ruled out: no hammer beat, no armour off, or a KO outside 15 to 24 s. TORQUE won all 200. */
const UNFIT = new Set([10, 11, 67, 76, 108, 117, 139, 140, 177, 190]);
const FIT = Array.from({ length: 200 }, (_, i) => i + 1).filter(s => !UNFIT.has(s));
/** A fresh fight each time, chosen from the vetted ones: seeds run in a scrambled order, so neighbouring fights differ. */
export const seedFor = (fights: number) => FIT[(fights * 37) % FIT.length]!;
