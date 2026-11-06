import { describe, expect, it } from 'vitest';
import { createRewardPurchases } from '../../app/purchaseCoordination';
import { seeded } from '../../game/rng';
import { powerOf, starterBuild, statsOf } from '../bot/build';
import { ALL_PARTS, BODIES, catOf, LEGENDARIES, LOCK_NEEDS, LOCK_SLOTS, nameOf, part, type PartKey } from '../bot/parts';
import { mathSave, type MathState } from '../game';
import { CROWN, RIVALS, prizeFrom, rival } from '../league/rivals';
import { PHRASES } from '../phrases';
import { lockTotal, makeLock } from './lock';
import { allowed, canFight, earnFight, finishFight, fitted, freshWorkshop, goalOf, isOwned, lockWaitsOn, mercy, nextRival, openVault, payoutFor, priceOf, proposePurchase, readWorkshop, refundOf, selectGoal, stripped, type WorkshopState } from './workshop';

const store = (balance: number, workshop = freshWorkshop()) => {
  let state: MathState = { ...mathSave.fresh(), currency: { balance }, workshop };
  return {
    get state() { return state; },
    commit(change: (s: MathState) => MathState | null) { const next = change(state); if (!next) return { kind: 'unchanged' as const, state }; state = next; return { kind: 'accepted' as const, state }; },
  };
};
const buyer = (s: ReturnType<typeof store>) => createRewardPurchases(s as never, { proposePurchase }, { read: (x: MathState) => x.workshop, replace: (x: MathState, workshop: WorkshopState) => ({ ...x, workshop }) });
const allParts = (): WorkshopState => ({ ...freshWorkshop(), owned: [...ALL_PARTS] });

describe('parts', () => {
  it('every way of getting one really exists: every prize has a rival, every lock a Legendary', () => {
    for (const k of ALL_PARTS) {
      const how = part(k).how;
      if (how === 'prize') expect(k === CROWN || prizeFrom(k), k).toBeTruthy();
      if (how === 'lock') expect(Object.values(LEGENDARIES)).toContain(k);
    }
    for (const r of RIVALS) expect(part(r.prize).how, r.name).toBe('prize');
  });
  it('he starts with one of each thing a robot needs, and they are all free', () => {
    expect(allowed(freshWorkshop(), starterBuild())).toBe(true);
    expect(new Set(freshWorkshop().owned.map(catOf)).size).toBe(5);
  });
  it('are bought with Bolts and fitted to the spot he picked', () => {
    const s = store(30);
    expect(buyer(s)({ key: 'add:spike', mount: 'back' }).kind).toBe('accepted');
    expect(s.state.currency.balance).toBe(22);
    expect(s.state.workshop.build.adds.back).toBe('spike');
    expect(isOwned(s.state.workshop, 'add:spike')).toBe(true);
  });
  it('are refused without enough Bolts, are bought once, and prizes and Legendaries are not for sale at any price', () => {
    expect(proposePurchase(freshWorkshop(), { key: 'add:saw' }, 5)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
    expect(proposePurchase(allParts(), { key: 'add:saw' }, 999)).toEqual({ kind: 'rejected', reason: 'already-owned' });
    expect(proposePurchase(freshWorkshop(), { key: 'add:rusty' }, 9999)).toEqual({ kind: 'rejected', reason: 'not-for-sale' });
    for (const k of Object.values(LEGENDARIES)) expect(proposePurchase(freshWorkshop(), { key: k }, 9999)).toEqual({ kind: 'rejected', reason: 'not-for-sale' });
  });
  it('change the robot: each costs real speed or gives real strength', () => {
    const base = starterBuild(), heavy = fitted(fitted(base, 'add:gianth', 'front'), 'add:gianth', 'back');
    expect(statsOf(heavy).speed).toBeLessThan(statsOf(base).speed);
    expect(statsOf(fitted(base, 'wheels:race')).speed).toBeGreaterThan(statsOf(base).speed);
    expect(statsOf(fitted(base, 'body:tank')).hp).toBeGreaterThan(statsOf(base).hp);
    expect(powerOf(heavy)).toBeGreaterThan(powerOf(base));
  });
  it('a part with no Mount on a smaller Body stops counting, and comes back with the bigger Body', () => {
    const big = fitted(fitted(starterBuild(), 'body:shell'), 'add:saw', 'left'), small = fitted(big, 'body:box');
    expect(powerOf(small)).toBeLessThan(powerOf(fitted(small, 'body:shell')));
    expect(fitted(small, 'body:shell').adds.left).toBe('saw');
    expect(stripped(big, 'left').adds.left).toBeUndefined();
  });
  it('bigger Bodies have more Mounts as they cost more', () => expect(BODIES.at(-1)!.mounts.length).toBeGreaterThan(BODIES[0].mounts.length));
  it('allowed refuses a part he does not own', () => expect(allowed(freshWorkshop(), fitted(starterBuild(), 'wheels:race'))).toBe(false));
});

describe('the Goal', () => {
  it('is the cheapest useful part unless he picked one, and is never a prize or a Legendary', () => {
    expect(goalOf(freshWorkshop())).toBe('add:spike');
    expect(goalOf(selectGoal(freshWorkshop(), 'wheels:race'))).toBe('wheels:race');
    expect(() => selectGoal(freshWorkshop(), 'add:rusty')).toThrow();
    expect(goalOf({ owned: ALL_PARTS.filter(k => typeof part(k).how === 'number'), goal: null })).toBeNull();
  });
  it('moves on once bought', () => {
    const done = proposePurchase(selectGoal(freshWorkshop(), 'add:spike'), { key: 'add:spike', mount: 'front' }, 8);
    if (done.kind !== 'ready') throw 0;
    expect(done.state.goal).toBeNull();
  });
});

describe('the Balance Lock and Legendaries', () => {
  it('wait for the dearest part of their sort, cost nothing, and open once', () => {
    for (const s of LOCK_SLOTS) {
      expect(openVault(freshWorkshop(), s)).toBeNull();
      expect(lockWaitsOn(freshWorkshop(), s)).toBe(LOCK_NEEDS[s]);
      const w = openVault({ ...freshWorkshop(), owned: [...freshWorkshop().owned, LOCK_NEEDS[s]] }, s)!;
      expect(isOwned(w, LEGENDARIES[s])).toBe(true);
      expect(openVault(w, s)).toBeNull();
    }
  });
  it('are said', () => { for (const s of LOCK_SLOTS) { expect(PHRASES).toContain(nameOf(LEGENDARIES[s])); expect(PHRASES).toContain(`Get ${nameOf(LOCK_NEEDS[s])} first!`); } });
  it('the puzzle always has one right number among three, and it balances', () => {
    const rng = seeded(4);
    for (const level of [null, 1, 2, 3] as const) for (let i = 0; i < 2000; i++) {
      const p = makeLock(level, rng);
      expect(p.c + p.x).toBe(lockTotal(p));
      expect(new Set(p.choices).size).toBe(3);
      expect(p.choices).toContain(p.x);
    }
  }, 30_000);
});

describe('fights and the League', () => {
  const won = { won: true, stars: 2, picked: 3 }, lost = { won: false, stars: 0, picked: 2 };
  it('a Round earns a fight, and he starts with one', () => {
    expect(freshWorkshop().charges).toBe(1);
    expect(earnFight(freshWorkshop()).charges).toBe(2);
  });
  it('a win pays Bolts and the rival\'s prize, uses the fight, and opens the next rival', () => {
    const r = rival('rusty'), w = freshWorkshop(), pay = payoutFor(w, r, won);
    expect(pay).toMatchObject({ prize: 'add:rusty', firstWin: true, spent: true, newStars: 2 });
    expect(pay.bolts).toBe(3 + 5 + 6);
    const after = finishFight(w, r, won, pay);
    expect(after.charges).toBe(0);
    expect(isOwned(after, 'add:rusty')).toBe(true);
    expect(nextRival(after)?.id).toBe('anvil');
    expect(canFight(after, rival('pancake'))).toBe(false);
    expect(canFight(after, r)).toBe(true);
  });
  it('a first loss leaves one more go on the same fight; a second uses it', () => {
    const r = rival('anvil'), w0 = { ...freshWorkshop(), charges: 1 };
    const p1 = payoutFor(w0, r, lost), w1 = finishFight(w0, r, lost, p1);
    expect(p1.spent).toBe(false); expect(w1.charges).toBe(1); expect(w1.tries).toBe(1);
    const p2 = payoutFor(w1, r, lost), w2 = finishFight(w1, r, lost, p2);
    expect(p2.spent).toBe(true); expect(w2.charges).toBe(0); expect(w2.tries).toBe(0);
    expect(p1.bolts).toBe(3); // a loss still pays something
    expect(w2.rivals.anvil).toEqual({ stars: 0, losses: 2 });
  });
  it('losing softens the rival, and winning resets it', () => {
    expect(mercy(3).hp).toBeLessThan(mercy(0).hp);
    expect(mercy(99).hp).toBeGreaterThanOrEqual(.4);
    const r = rival('anvil'), w = { ...freshWorkshop(), rivals: { anvil: { stars: 0, losses: 4 } } };
    expect(finishFight(w, r, won, payoutFor(w, r, won)).rivals.anvil).toEqual({ stars: 2, losses: 0 });
  });
  it('a rematch pays a little, and a prize is won once', () => {
    const r = rival('rusty'), w = { ...freshWorkshop(), rivals: { rusty: { stars: 3, losses: 0 } }, owned: [...freshWorkshop().owned, 'add:rusty' as PartKey] };
    expect(payoutFor(w, r, { won: true, stars: 3, picked: 0 })).toMatchObject({ bolts: 2, prize: null, firstWin: false });
  });
  it('three stars on the last rival wins the Crown', () => {
    const r = rival('king');
    expect(payoutFor(freshWorkshop(), r, { won: true, stars: 3, picked: 0 }).crown).toBe(true);
    expect(payoutFor(freshWorkshop(), r, { won: true, stars: 2, picked: 0 }).crown).toBe(false);
  });
  it('every rival is built from real parts and is said', () => {
    for (const r of RIVALS) {
      expect(() => statsOf(r.build), r.name).not.toThrow();
      for (const p of [r.name, `${r.name} is knocked out!`, r.tip, `Beat ${r.name} to win this!`]) expect(PHRASES).toContain(p);
    }
  });
  it('every part has a price he can say and a name he can hear', () => {
    for (const k of ALL_PARTS) { expect(PHRASES).toContain(nameOf(k)); expect(PHRASES).toContain(`You got ${nameOf(k)}!`); if (priceOf(k)) expect(priceOf(k)!).toBeLessThanOrEqual(200); }
  });
});

describe('the word rule', () => {
  it('holds in everything said', () => expect(PHRASES.filter(p => /kill|shoot|destroy|battlebots/i.test(p))).toEqual([]));
});

describe('reading a save', () => {
  it('drops what it does not know, and anything fitted but not owned', () => {
    const w = readWorkshop({ owned: ['paint:red', 'nonsense'], build: { body: 'titan', paint: 'red', wheels: 'small', face: 'happy', adds: { front: 'mega', back: 'bumper' } }, goal: 'x', charges: -1, tries: 'y', rivals: { rusty: { stars: 9, losses: 1 }, nobody: {} } });
    expect(w.owned).toContain('paint:red');
    expect(w.build).toEqual({ ...starterBuild(), paint: 'red', adds: { back: 'bumper' } });
    expect(w.goal).toBeNull();
    expect(w.charges).toBe(0);
    expect(w.rivals).toEqual({ rusty: { stars: 3, losses: 1 } });
  });
  it('turns a save from the look-only Workshop into Bolts and keeps his Legendaries', () => {
    const old = { unlocked: ['paint:1', 'paint:2', 'paint:3', 'paint:4', 'drum:4', 'wheels:1'], gear: { paint: 4 }, goal: 'wheels:2', fights: 7, ticket: false };
    expect(refundOf(old)).toBe(5 + 15 + 30 + 5);
    const w = readWorkshop(old);
    expect(w.owned).toEqual(expect.arrayContaining(['paint:rainbow', 'add:lightning']));
    expect(w).toMatchObject({ fights: 7, charges: 2 });
    expect(refundOf(JSON.parse(JSON.stringify(w)))).toBe(0);
  });
});
