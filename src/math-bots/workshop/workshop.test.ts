import { describe, expect, it } from 'vitest';
import { createRewardPurchases } from '../../app/purchaseCoordination';
import { mathSave, type MathState } from '../game';
import { PHRASES } from '../phrases';
import { ALL_MODS, defaultGear, lookOf, modId, SLOT_IDS } from './catalog';
import { finishFight, FIGHT_COST, fightPrice, fitMod, freshWorkshop, goalOf, priceOf, proposePurchase, readWorkshop, seedFor, selectGoal, type WorkshopState } from './workshop';

const store = (balance: number, workshop = freshWorkshop()) => {
  let state: MathState = { ...mathSave.fresh(), currency: { balance }, workshop };
  return {
    get state() { return state; },
    commit(change: (s: MathState) => MathState | null) {
      const next = change(state);
      if (!next) return { kind: 'unchanged' as const, state };
      state = next;
      return { kind: 'accepted' as const, state };
    },
  };
};
const buyer = (s: ReturnType<typeof store>) => createRewardPurchases(s as never, { proposePurchase }, { read: (x: MathState) => x.workshop, replace: (x: MathState, workshop: WorkshopState) => ({ ...x, workshop }) });

describe('Mods', () => {
  it('cost 5, 15 and 30 by Rung', () => expect([1, 2, 3].map(r => priceOf(modId('paint', r as 1)))).toEqual([5, 15, 30]));
  it('are bought with Bolts and fitted straight away', () => {
    const s = store(6);
    expect(buyer(s)('drum:1').kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(1);
    expect(s.state.workshop.unlocked).toEqual(['drum:1']);
    expect(s.state.workshop.gear.drum).toBe(1);
  });
  it('are refused without enough Bolts, and are bought once', () => {
    expect(proposePurchase(freshWorkshop(), 'paint:2', 14)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    const owned = { ...freshWorkshop(), unlocked: ['paint:1' as const] };
    expect(proposePurchase(owned, 'paint:1', 99)).toEqual({ kind: 'rejected', reason: 'already-owned' });
  });
  it('fit back to the free default', () => {
    const w = fitMod({ ...freshWorkshop(), unlocked: ['paint:1'], gear: { ...defaultGear(), paint: 1 } }, 'paint', 0);
    expect(w.gear.paint).toBe(0);
    expect(() => fitMod(freshWorkshop(), 'paint', 3)).toThrow();
  });
  it('each change how TORQUE looks', () => {
    for (const slot of SLOT_IDS) {
      const seen = new Set([0, 1, 2, 3].map(r => JSON.stringify(lookOf({ ...defaultGear(), [slot]: r }))));
      expect(seen.size).toBe(4);
    }
  });
});

describe('the Goal', () => {
  it('is the cheapest locked Mod unless he picked one', () => {
    expect(goalOf(freshWorkshop())).toBe('paint:1');
    expect(goalOf(selectGoal(freshWorkshop(), 'wheels:3'))).toBe('wheels:3');
    expect(goalOf({ unlocked: [...ALL_MODS], goal: null })).toBeNull();
  });
  it('moves on once bought', () => {
    const w = selectGoal(freshWorkshop(), 'drum:1'), done = proposePurchase(w, 'drum:1', 5);
    if (done.kind !== 'ready') throw 0;
    expect(done.state.goal).toBeNull();
  });
});

describe('fights', () => {
  it('the first is free, the rest cost 5', () => {
    const s = store(0);
    expect(buyer(s)('fight').kind).toBe('accepted');
    expect(s.state.workshop.ticket).toBe(true);
    const seen = finishFight(s.state.workshop)!;
    expect(seen).toMatchObject({ fights: 1, ticket: false });
    expect(fightPrice(seen)).toBe(FIGHT_COST);
    expect(proposePurchase(seen, 'fight', 4)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  });
  it('a paid fight he never saw end stays paid', () => {
    const s = store(5, { ...freshWorkshop(), fights: 2 });
    buyer(s)('fight');
    expect(s.state.currency.balance).toBe(0);
    const reloaded = mathSave.decode(JSON.parse(JSON.stringify(mathSave.encode(s.state))));
    expect(fightPrice(reloaded.workshop)).toBe(0);
    expect(proposePurchase(reloaded.workshop, 'fight', 0).kind).toBe('rejected'); // nothing to pay: he just goes
  });
  it('only a ticket can be finished', () => expect(finishFight(freshWorkshop())).toBeNull());
  it('uses a different vetted seed for each of many fights', () => {
    const seeds = Array.from({ length: 100 }, (_, i) => seedFor(i));
    expect(new Set(seeds).size).toBe(100);
  });
});

describe('the word rule', () => {
  it('holds in everything said', () => expect(PHRASES.filter(p => /kill|shoot|destroy|battlebots/i.test(p))).toEqual([]));
});

describe('reading a save', () => {
  it('drops what it does not know, and anything fitted but not owned', () => {
    const w = readWorkshop({ unlocked: ['paint:1', 'nonsense'], gear: { paint: 1, drum: 2, armour: 9 }, goal: 'x', fights: -1, ticket: 'yes' });
    expect(w).toEqual({ ...freshWorkshop(), unlocked: ['paint:1'], gear: { ...defaultGear(), paint: 1 } });
  });
});
