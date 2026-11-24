// The endless layer: generated photo missions and Station modules. Thousands of each, made twice: the same every time, each mission
// flown to its end by the scripted children (nothing, clumsy, skilled), its places far enough apart to come round one at a time, and the
// Station always with somewhere new to put a module.
import { describe, expect, it } from 'vitest';
import { arc } from '../map/geo';
import { orbitWith, freeFor, TUNING as ORBIT } from '../orbit/sim';
import { FIXED_COUNT, FIXED_TARGETS, isTargetId, mission, patchFor, APART, PATCH_EVERY, targetOf } from './missions';
import { canPlace, freeSpots, MODULE_LOOKS, place, suggestModule, isLook, type Placed } from './station';
import { CONTINENTS } from '../world/continents';
import { OCEANS } from '../world/oceans';
import { FAMOUS, PHOTO_PLACES } from '../world/places';

const N = 3000;
const gen = Array.from({ length: N }, (_, i) => mission(FIXED_COUNT + 1 + i));

describe('the hand-made photo missions', () => {
  it('start with every continent and ocean, then every place in the world tables once', () => {
    expect(FIXED_TARGETS.slice(0, 12).filter(t => t.startsWith('c:')).length).toBe(7);
    expect(FIXED_TARGETS.slice(0, 12).filter(t => t.startsWith('o:')).length).toBe(5);
    expect(new Set(FIXED_TARGETS).size).toBe(FIXED_TARGETS.length);
    expect(FIXED_COUNT).toBe(CONTINENTS.length + OCEANS.length + FAMOUS.length + PHOTO_PLACES.length);
    expect(FIXED_COUNT).toBeGreaterThanOrEqual(150);
    for (const t of FIXED_TARGETS) expect(isTargetId(t), t).toBe(true);
  });
  it('can each be flown to the end by a child who does nothing', () => {
    for (let n = 1; n <= FIXED_COUNT; n++) {
      const m = mission(n), s = orbitWith({ targets: m.targets, free: 0, seed: n }, 'nothing', n);
      expect(s.phase, `${n} ${m.targets[0]!.id}`).toBe('done');
      expect(s.caught).toEqual(m.targets.map(t => t.id));
    }
  }, 120_000);
});

describe('generated photo missions', () => {
  it('are the same every time for the same number', () => {
    for (const m of gen.slice(0, 500)) expect(mission(m.n)).toEqual(m);
  });
  it('have two or three places, all different and far enough apart to come round one at a time', () => {
    for (const m of gen) {
      expect(m.targets.length).toBeGreaterThanOrEqual(2);
      expect(m.targets.length).toBeLessThanOrEqual(3);
      expect(new Set(m.targets.map(t => t.id)).size).toBe(m.targets.length);
      for (let i = 0; i < m.targets.length; i++) for (let j = i + 1; j < m.targets.length; j++) expect(arc(m.targets[i]!, m.targets[j]!)).toBeGreaterThanOrEqual(APART);
    }
  });
  it('get a little harder, then hold: three places more often later, never more than three', () => {
    const three = (ms: typeof gen) => ms.filter(m => m.targets.length === 3).length / ms.length;
    expect(three(gen.slice(-500))).toBeGreaterThan(three(gen.slice(0, 200)));
  });
  it('can all be flown to the end: each one by the child who does nothing, every tenth by the clumsy child and the skilled child', () => {
    for (const m of gen) {
      const s = orbitWith({ targets: m.targets, free: 0, seed: m.n }, 'nothing', m.n);
      expect(s.phase, String(m.n)).toBe('done');
      expect(new Set(s.caught)).toEqual(new Set(m.targets.map(t => t.id)));
      if (m.n % 10 === 0) for (const child of ['clumsy', 'skilled'] as const) expect(orbitWith({ targets: m.targets, free: freeFor(m.n % 5, m.n % 2 === 0), seed: m.n }, child, m.n).phase, `${m.n} ${child}`).toBe('done');
    }
  }, 300_000);
  it('the skilled child photographs each place the first time it comes round, and finishes quicker than the child who does nothing', () => {
    for (const m of gen.slice(0, 200)) {
      const quick = orbitWith({ targets: m.targets, free: 0, seed: m.n }, 'skilled', m.n), slow = orbitWith({ targets: m.targets, free: 0, seed: m.n }, 'nothing', m.n);
      expect(quick.t).toBeLessThan(slow.t);
      expect(quick.t).toBeLessThan(ORBIT.autoDeploy + m.targets.length * 30);
    }
  });
  it('every fifth earns a patch, numbered, without end', () => {
    for (let n = 1; n <= 5000; n++) expect(!!patchFor(n)).toBe(n % PATCH_EVERY === 0);
    expect(patchFor(4000)).toEqual(patchFor(4000));
  });
  it('find every target where the world tables put it', () => {
    for (const id of FIXED_TARGETS) { const t = targetOf(id); expect(Math.abs(t.lat)).toBeLessThanOrEqual(90); expect(Math.abs(t.lon)).toBeLessThanOrEqual(180); }
  });
});

describe('the Station', () => {
  it('always has a free spot next to what is there, and modules join it one by one without end', () => {
    let s: Placed[] = [];
    for (let k = 0; k < 2000; k++) {
      const spots = freeSpots(s);
      expect(spots.length).toBeGreaterThan(0);
      const at = spots[k % spots.length]!;
      expect(canPlace(s, at.x, at.y)).toBe(true);
      s = place(s, `m:${k}`, at.x, at.y)!;
    }
    expect(new Set(s.map(p => `${p.x},${p.y}`)).size).toBe(2000);
    expect(place(s, 'm:x', s[0]!.x, s[0]!.y)).toBeNull();
  }, 60_000);
  it('suggests a module from its number, the same each time, and the parts make hundreds of different ones', () => {
    for (let n = 1; n <= 500; n++) { expect(suggestModule(n)).toEqual(suggestModule(n)); expect(isLook(suggestModule(n))).toBe(true); }
    expect(new Set(Array.from({ length: 500 }, (_, n) => JSON.stringify(suggestModule(n)))).size).toBeGreaterThan(300);
    expect(MODULE_LOOKS).toBeGreaterThanOrEqual(1000);
  });
});
