// What tapping things does to the saved game.
import type { Commit } from '../../save/store';
import type { Build } from '../bot/build';
import type { LockSlot, Mount, PartKey } from '../bot/parts';
import { buy, player, updateWorkshop, type MathState } from '../game';
import type { Rival } from '../league/rivals';
import { credit } from '../../currency/currency';
import { allowed, applyBuild, finishFight, openVault, payoutFor, priceOf, selectGoal, type Outcome, type Payout } from './workshop';

const workshop = () => player.state.value.workshop;
const balance = () => player.state.value.currency.balance;
const ok = (r: Commit<MathState>) => r.kind === 'accepted';

export const saveBuild = (b: Build) => (allowed(workshop(), b) ? ok(updateWorkshop(w => applyBuild(w, b))) : false);
export type BuyTap = { kind: 'bought' } | { kind: 'need'; more: number } | { kind: 'rejected' };
export function buyPart(key: PartKey, mount?: Mount): BuyTap {
  const price = priceOf(key);
  if (price === null) return { kind: 'rejected' };
  if (balance() < price) { updateWorkshop(w => selectGoal(w, key)); return { kind: 'need', more: price - balance() }; }
  return ok(buy({ key, ...(mount && { mount }) })) ? { kind: 'bought' } : { kind: 'rejected' };
}
export const unlockLegendary = (slot: LockSlot) => updateWorkshop(w => openVault(w, slot));

export function settleFight(r: Rival, o: Outcome): Payout {
  const pay = payoutFor(workshop(), r, o);
  player.commit(s => {
    const paid = credit(s.currency, pay.bolts);
    return { ...s, workshop: finishFight(s.workshop, r, o, pay), currency: paid.kind === 'accepted' ? paid.state : s.currency };
  });
  return pay;
}
