import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { f16 } from '../jets/f16';
import { a10 } from '../jets/a10';
import { loadout } from './stores';
import { Weapons } from './weapons';

/** The stores a Weapons Rung hangs on an Aircraft that Take Off can fire (as BuiltJet.firable() finds them). */
function firable(group: THREE.Group) {
  const out: THREE.Object3D[] = [];
  group.traverse(o => { if (o.userData.store && o.userData.store.kind !== 'tank') out.push(o); });
  return out;
}

describe('Take Off weapons', () => {
  it('fires from the wingtips in, alternating sides, then waits to reload', () => {
    const stores = firable(loadout(f16.hardpoints, 1, false, f16.loads));
    const w = new Weapons(), order: string[] = [];
    for (let k = 0; k < stores.length; k++) {
      expect(w.fire(stores)).toBe('missile');
      const gone = stores.find(s => !s.visible && !order.includes(s.uuid))!;
      order.push(gone.uuid);
      const { point } = gone.userData.store;
      expect(point).toBe(['tip', 'tip', 'outer', 'outer', 'inner', 'inner'][k]);
      if (k % 2) expect(Math.sign(gone.position.z)).toBe(-Math.sign(stores.find(s => s.uuid === order[k - 1])!.position.z));
    }
    expect(w.fire(stores)).toBe('reloading');
    w.clear(); // landing puts every store back
    expect(stores.every(s => s.visible)).toBe(true);
  });

  it('says what was fired: bombs, Legendary fireworks, or nothing fitted', () => {
    const w = new Weapons();
    const bombs = firable(loadout(f16.hardpoints, 2, false, f16.loads)).filter(s => s.userData.store.point !== 'tip');
    expect(w.fire(bombs)).toBe('bomb');
    expect(w.fire(firable(loadout(f16.hardpoints, 4, false, f16.loads)))).toBe('firework');
    expect(w.fire([])).toBe('none');
  });

  it('keeps a rocket pod on its pylon while it fires', () => {
    const pods = firable(loadout(a10.hardpoints, 1, false, a10.loads)).filter(s => s.userData.store.kind === 'pod');
    expect(pods.length).toBeGreaterThan(0);
    const w = new Weapons();
    pods.forEach(() => w.fire(pods));
    expect(w.fire(pods)).toBe('missile');
    expect(pods.every(p => p.visible)).toBe(true);
  });
});
