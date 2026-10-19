import { describe, expect, it } from 'vitest';
import { ALL_BUYABLES, JET_IDS, modId } from './catalog';
import { boltPrice, freshHangar, goalOf, openVault, proposePurchase, readHangar, selectGoal, waitingOn } from './hangar';
import { JETS } from './jets';

describe('the Hangar', () => {
  it('starts with the three starter Aircraft and nothing unlocked', () => {
    const h = freshHangar();
    expect(h.ownedJets).toEqual(['p51', 'f16', 'f18']);
    expect(h.jet).toBeNull();
    expect(h.unlocked).toEqual([]);
  });
  it('buys a Mod with Bolts and fits it straight away', () => {
    const h = { ...freshHangar(), jet: 'f16' as const };
    const p = proposePurchase(h, 'weapons:1', 6);
    expect(p).toMatchObject({ kind: 'ready', cost: 5 });
    if (p.kind === 'ready') { expect(p.state.unlocked).toContain('weapons:1'); expect(p.state.fitted.f16.weapons).toBe(1); }
    expect(proposePurchase(h, 'weapons:2', 6)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  });
  it('buys an Aircraft for 30 Bolts and climbs into it', () => {
    const p = proposePurchase({ ...freshHangar(), jet: 'p51' }, 'jet:f14', 30);
    expect(p.kind === 'ready' && p.state.jet).toBe('f14');
  });
  it('keeps Legendaries in the vault: never for Bolts, and only after the top Rung', () => {
    const h = { ...freshHangar(), jet: 'f16' as const };
    expect(proposePurchase(h, 'smoke:4', 999)).toEqual({ kind: 'rejected', reason: 'vault' });
    expect(waitingOn(h, 'smoke:4')).toBe('smoke:3');
    expect(openVault(h, 'smoke:4')).toBeNull();
    const ready = { ...h, unlocked: [modId('smoke', 3)] };
    const opened = openVault(ready, 'smoke:4');
    expect(opened?.unlocked).toContain('smoke:4');
    expect(opened?.fitted.f16.smoke).toBe(4);
    expect(openVault(opened!, 'smoke:4')).toBeNull();
  });
  it('saves toward the cheapest locked thing unless he picks a Goal', () => {
    const h = freshHangar();
    expect(boltPrice(goalOf(h)!)).toBe(5);
    expect(goalOf(selectGoal(h, 'jet:sr71'))).toBe('jet:sr71');
    expect(() => selectGoal(h, 'smoke:4')).toThrow();
  });
  it('reads a save, dropping anything unknown or not owned', () => {
    const h = readHangar({ jet: 'sr71', ownedJets: ['f14', 'bogus'], unlocked: ['paint:1', 'nope'], fitted: { f14: { paint: 1, weapons: 2 } }, goal: 'paint:1' });
    expect(h.jet).toBe('p51'); // the SR-71 isn't his
    expect(h.ownedJets).toEqual(['p51', 'f16', 'f18', 'f14']);
    expect(h.unlocked).toEqual(['paint:1']);
    expect(h.fitted.f14).toMatchObject({ paint: 1, weapons: 0 });
    expect(h.goal).toBeNull(); // it's already his
  });
  it('has a spec for every Aircraft, with real dimensions and a buyable item for each one not given', () => {
    for (const j of JET_IDS) {
      const s = JETS[j];
      expect(s.id).toBe(j);
      expect(s.length).toBeGreaterThan(9);
      expect(s.bodies.length).toBeGreaterThan(0);
      expect(s.surfaces.some(x => x.kind === 'wing')).toBe(true);
    }
    expect(ALL_BUYABLES.filter(x => x.startsWith('jet:'))).toHaveLength(15);
  });
});
