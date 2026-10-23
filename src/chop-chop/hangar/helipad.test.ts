import { describe, expect, it } from 'vitest';
import { ALL_BUYABLES, HELI_IDS, modId } from './catalog';
import { boltPrice, freshHelipad, goalOf, openVault, proposePurchase, readHelipad, selectGoal, waitingOn } from './helipad';
import { HELIS } from './helis';

describe('the Helipad', () => {
  it('starts with the three starter Helicopters and nothing unlocked', () => {
    const h = freshHelipad();
    expect(h.ownedHelis).toEqual(['uh60', 'mh6', 'ah1']);
    expect(h.heli).toBeNull();
    expect(h.unlocked).toEqual([]);
  });
  it('buys a Mod with Bolts and fits it straight away', () => {
    const h = { ...freshHelipad(), heli: 'mh6' as const };
    const p = proposePurchase(h, 'rotor:1', 6);
    expect(p).toMatchObject({ kind: 'ready', cost: 5 });
    if (p.kind === 'ready') { expect(p.state.unlocked).toContain('rotor:1'); expect(p.state.fitted.mh6.rotor).toBe(1); }
    expect(proposePurchase(h, 'rotor:2', 6)).toEqual({ kind: 'rejected', reason: 'insufficient-funds' });
  });
  it('buys a Helicopter for 30 Bolts and climbs into it', () => {
    const p = proposePurchase({ ...freshHelipad(), heli: 'uh60' }, 'heli:ah64', 30);
    expect(p.kind === 'ready' && p.state.heli).toBe('ah64');
  });
  it('keeps Legendaries in the Fuel Lock: never for Bolts, and only after the top Rung', () => {
    const h = { ...freshHelipad(), heli: 'uh60' as const };
    expect(proposePurchase(h, 'smoke:4', 999)).toEqual({ kind: 'rejected', reason: 'vault' });
    expect(waitingOn(h, 'smoke:4')).toBe('smoke:3');
    expect(openVault(h, 'smoke:4')).toBeNull();
    const opened = openVault({ ...h, unlocked: [modId('smoke', 3)] }, 'smoke:4');
    expect(opened?.unlocked).toContain('smoke:4');
    expect(opened?.fitted.uh60.smoke).toBe(4);
  });
  it('aims at the cheapest locked thing unless he picks a Goal', () => {
    const h = freshHelipad();
    expect(boltPrice(goalOf(h)!)).toBe(5);
    expect(goalOf(selectGoal(h, 'heli:mi26'))).toBe('heli:mi26');
  });
  it('reads a damaged save, keeping what is valid', () => {
    const h = readHelipad({ heli: 'airwolf', ownedHelis: ['airwolf', 'nonsense'], unlocked: ['rotor:2', 'engine:1'], fitted: { airwolf: { rotor: 2, paint: 9 } } });
    expect(h.heli).toBe('airwolf');
    expect(h.unlocked).toEqual(['rotor:2']);
    expect(h.fitted.airwolf).toMatchObject({ rotor: 2, paint: 0 });
    expect(readHelipad({ heli: 'airwolf' }).heli).toBe('uh60'); // not his
    expect(ALL_BUYABLES).toHaveLength(9 * 4 + 14 + 11);
  });
});

describe('the Helicopters', () => {
  it('are drawn to their published sizes', () => {
    for (const id of HELI_IDS) {
      const s = HELIS[id];
      expect(s.id).toBe(id);
      const main = s.rotors.filter(r => r.kind === 'main');
      expect(main.length, id).toBeGreaterThan(0);
      for (const r of main) expect(r.r * 2, `${id} rotor`).toBeCloseTo(s.rotorDiameter, 0);
      const xs = s.bodies.flatMap(b => b.sections.map(q => q.x));
      expect(Math.max(...xs) - Math.min(...xs), `${id} length`).toBeGreaterThan(s.length * 0.8);
      expect(Math.max(...xs) - Math.min(...xs), `${id} length`).toBeLessThan(s.length * 1.25);
      const top = Math.max(...main.map(r => r.at[1]));
      expect(top, `${id} rotor height`).toBeGreaterThan(s.height * 0.6); // the published height is sometimes to the top of a tall tail (the CH-53E)
      expect(top, `${id} rotor height`).toBeLessThan(s.height * 1.1);
      expect(s.skids || s.gear, `${id} lands on something`).toBeTruthy();
    }
  });
});
