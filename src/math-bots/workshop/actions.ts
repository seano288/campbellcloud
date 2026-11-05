// What tapping things in the Workshop does to the saved game: fit a Mod he owns, buy one he can afford (it's fitted straight away),
// or make one he can't afford his Goal, and pay for a fight.
import type { Commit } from '../../save/store';
import { buy, player, updateWorkshop, type MathState } from '../game';
import { modId, type Rung, type SlotId } from './catalog';
import { finishFight, fightPrice, fitMod, isLocked, isOwned, priceOf, selectGoal } from './workshop';

const workshop = () => player.state.value.workshop;
const balance = () => player.state.value.currency.balance;

type Done<K extends string> = { kind: K; state: MathState } | { kind: 'rejected' };
const done = <K extends string>(kind: K, r: Commit<MathState>): Done<K> => (r.kind === 'accepted' ? { kind, state: r.state } : { kind: 'rejected' });

export type ModTap = Done<'fitted' | 'unlocked'> | { kind: 'need'; more: number };
export function tapMod(slot: SlotId, rung: Rung): ModTap {
  if (rung === 0 || isOwned(workshop(), slot, rung)) return done('fitted', updateWorkshop(w => fitMod(w, slot, rung)));
  const item = modId(slot, rung), price = priceOf(item);
  if (balance() >= price) return done('unlocked', buy(item));
  if (isLocked(workshop(), item)) updateWorkshop(w => selectGoal(w, item));
  return { kind: 'need', more: price - balance() };
}

/** He paid, or it's free, and a ticket waits for him; or he's this many Bolts short. */
export function payForFight(): { kind: 'go' } | { kind: 'need'; more: number } {
  const w = workshop(), price = fightPrice(w);
  if (w.ticket) return { kind: 'go' };
  if (balance() < price) return { kind: 'need', more: price - balance() };
  return buy('fight').kind === 'accepted' ? { kind: 'go' } : { kind: 'need', more: Math.max(1, price - balance()) };
}

/** He saw it to the end. */
export const fightSeen = () => updateWorkshop(finishFight);
