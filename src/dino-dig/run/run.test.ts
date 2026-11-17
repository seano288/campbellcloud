// The Alive run can always be finished, by every dinosaur in every land, with or without Gear: by a child who walks and jumps, and by
// one who only holds walk and never jumps (anything bumped three times gets out of the way). It can't be failed or lost.
import { describe, expect, it } from 'vitest';
import { seeded } from '../../game/rng';
import { DINOS } from '../museum/dinos';
import { GEAR, LANDS, type GearId } from '../shop/shop';
import { abilities, createRun, HIGH, LENGTH, stepRun, type Input } from './run';

const DT = 1 / 60;
const size = (s: number) => ({ height: Math.max(130, Math.min(330, s * .85)), length: Math.max(130, Math.min(330, s * .85)) * 1.6 });

function play(dinoIx: number, land: (typeof LANDS)[number]['id'], gear: GearId[], jumping: boolean, seed: number, limit = 120) {
  const d = DINOS[dinoIx]!, a = abilities(d, new Set(gear)), w = createRun(size(d.size), land, seeded(seed));
  let t = 0, bumps = 0;
  while (!w.done && t < limit) {
    const tick = Math.floor(t * 60);
    const input: Input = { walk: true, jumpHeld: jumping && tick % 50 < 20, jumpPressed: jumping && tick % 50 === 0, roar: tick % 200 === 0 };
    const ev = stepRun(w, DT, a, input);
    bumps += ev.filter(e => e.kind === 'bonk').length;
    expect(w.x).toBeGreaterThanOrEqual(60);
    t += DT;
  }
  return { w, t, bumps };
}

describe('the Alive run', () => {
  it('is finished by every dinosaur in every land, walking and jumping, in well under a minute', () => {
    for (let i = 0; i < DINOS.length; i++) for (const land of LANDS) {
      const { w, t } = play(i, land.id, [], true, i + 1);
      expect(w.done, `${DINOS[i]!.id} ${land.id}`).toBe(true);
      expect(t).toBeLessThan(45);
    }
  });
  it('is finished by a child who only holds walk and never jumps', () => {
    for (let i = 0; i < DINOS.length; i++) {
      const { w } = play(i, 'forest', [], false, 3);
      expect(w.done, DINOS[i]!.id).toBe(true);
    }
  });
  it('is finished with every piece of Gear on', () => {
    const all = GEAR.map(g => g.id as GearId);
    for (let i = 0; i < DINOS.length; i++) expect(play(i, 'volcano', all, true, 5).w.done).toBe(true);
  });
  it('lets the big dinosaurs smash through rocks, and the long neck reach the high leaves', () => {
    const rex = DINOS.findIndex(d => d.id === 'rex'), compy = 0, brachio = DINOS.findIndex(d => d.id === 'brachio');
    expect(play(rex, 'forest', [], false, 2).bumps).toBeLessThan(play(compy, 'forest', [], false, 2).bumps);
    const tall = play(brachio, 'forest', [], false, 2).w;
    expect(tall.snacks.filter(s => s.kind === 'high' && s.eaten).length).toBeGreaterThan(0);
    const small = play(compy, 'forest', [], false, 2).w;
    expect(small.snacks.filter(s => s.kind === 'high' && s.eaten)).toHaveLength(0);
    expect(HIGH).toBeGreaterThan(size(120).height);
  });
  it('makes the Gear do what it says', () => {
    const d = DINOS[0]!;
    expect(abilities(d, new Set(['turbo'])).speed).toBeGreaterThan(abilities(d, new Set()).speed);
    expect(abilities(d, new Set(['springs'])).jump).toBeGreaterThan(abilities(d, new Set()).jump);
    expect(abilities(d, new Set(['cape'])).glide).toBe(true);
    expect(LENGTH).toBeGreaterThan(3000);
  });
});
