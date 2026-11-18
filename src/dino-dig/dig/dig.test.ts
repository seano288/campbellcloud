// A Dig can always be finished, however a child plays it: rubbing anywhere, tapping instead of dragging, or hardly doing anything at all.
// Every site, every tool, several seeds.
import { describe, expect, it } from 'vitest';
import { seeded, type Rng } from '../../game/rng';
import { DINOS, SITES } from '../museum/dinos';
import { TOOLS } from '../shop/shop';
import {
  blocked, createDig, drag, finished, grab, H, HELP_S, HINT_S, nextBuried, release, rocksFor, rub, step, tap, uncovered, W, type DigEvent, type DigWorld,
} from './dig';

const DT = 1 / 30;
const world = (tier: number, seed: number, bones = DINOS[tier * 2 - 1]!.bones.slice(0, 2), fossil = true) =>
  createDig({ bones, bolts: 2, fossil, ...rocksFor(tier) }, seeded(seed));

/** A child who rubs where something is buried, taps the rocks on it, and drags each loose bone to the crate. */
function playWell(w: DigWorld, radius: number, crack: number, rng: Rng, limit = 120): number {
  let t = 0;
  while (!finished(w) && t < limit) {
    const loose = w.things.find(x => x.state === 'loose');
    if (loose) {
      const held = grab(w, loose.px, loose.py)!, sx = held.px, sy = held.py;
      for (let k = 1; k <= 10; k++) { drag(w, held, sx + (w.crate.x + 60 - sx) * k / 10, sy + (w.crate.y + 50 - sy) * k / 10); step(w, DT); t += DT; }
      release(w, held, sx, sy);
    } else {
      const next = nextBuried(w);
      if (next && blocked(w, next)) {
        const rock = w.rocks.find(r => !r.gone && Math.abs(r.x - next.x) < r.r + next.hw && Math.abs(r.y - next.y) < r.r + next.hh)!;
        tap(w, rock.x, rock.y, crack);
      } else if (next) {
        const x = next.x + (rng() - .5) * next.hw * 2, y = next.y + (rng() - .5) * next.hh * 2;
        rub(w, x - 40, y, x + 40, y + (rng() - .5) * 20, radius);
      }
    }
    step(w, DT); t += DT;
  }
  return t;
}

describe('a Dig', () => {
  it('can be finished at every site with every tool, about thirty seconds\' play or less', () => {
    for (const s of SITES) for (const tool of TOOLS) for (const seed of [1, 2, 3]) {
      const w = world(s.tier, seed), t = playWell(w, tool.radius * 1.15, tool.crack, seeded(seed));
      expect(finished(w), `${s.id} ${tool.id} ${seed}`).toBe(true);
      expect(t).toBeLessThan(40);
    }
  });
  it('can be finished by a child who rubs all over and only taps the bones', () => {
    for (const seed of [1, 2, 3, 4]) {
      const w = world(3, seed), rng = seeded(seed);
      let t = 0;
      while (!finished(w) && t < 300) {
        const loose = w.things.find(x => x.state === 'loose');
        if (loose) tap(w, loose.px, loose.py, 1);
        else { const x = rng() * W, y = rng() * H; rub(w, x, y, x + (rng() - .5) * 300, y + (rng() - .5) * 200, 34); const r = w.rocks.find(k => !k.gone); if (r && rng() < .2) tap(w, r.x, r.y, 1); }
        step(w, DT); t += DT;
      }
      expect(finished(w), `seed ${seed}`).toBe(true);
    }
  });
  it('helps a child who stops: a hint, then the dirt over the next bone falls away by itself', () => {
    const w = world(5, 7), events: DigEvent[] = [];
    let t = 0, hintAt = -1;
    while (t < HELP_S + 30 && !w.things.some(x => x.state === 'loose')) {
      const e = step(w, DT); events.push(...e); t += DT;
      if (hintAt < 0 && e.some(x => x.kind === 'hint')) hintAt = t;
    }
    expect(hintAt).toBeGreaterThanOrEqual(HINT_S - .1);
    expect(hintAt).toBeLessThan(HELP_S);
    expect(w.things.some(x => x.state === 'loose')).toBe(true);
    // and a loose bone tapped three times goes to the crate by itself
    const loose = w.things.find(x => x.state === 'loose' && x.thing === 'bone');
    if (loose) { tap(w, loose.px, loose.py, 1); tap(w, loose.px, loose.py, 1); tap(w, loose.px, loose.py, 1); for (let i = 0; i < 40; i++) step(w, DT); expect(loose.state).toBe('crated'); }
  });
  it('is finished by a child who does nothing at all: the help uncovers each bone and sends it to the crate', () => {
    for (const seed of [1, 2, 3]) for (let tier = 1; tier <= SITES.length; tier++) {
      const w = world(tier, seed, DINOS[tier * 2 - 1]!.bones.slice(0, 2));
      let t = 0, dragHint = false;
      while (!finished(w) && t < 400) { const e = step(w, DT); dragHint ||= e.some(x => x.kind === 'hint' && !!x.drag); t += DT; }
      expect(finished(w), `seed ${seed} site ${tier}`).toBe(true);
      expect(dragHint, 'a hint points at a bone left loose').toBe(true);
    }
  });
  it('keeps a bone under a rock buried until the rock is cracked, and every tap cracks it', () => {
    const w = world(6, 3), bone = w.things.find(x => x.thing === 'bone')!;
    expect(blocked(w, bone)).toBe(true);
    for (let y = bone.y - bone.hh; y <= bone.y + bone.hh; y += 10) rub(w, bone.x - bone.hw, y, bone.x + bone.hw, y, 60);
    expect(uncovered(w, bone)).toBeGreaterThan(0);
    expect(bone.state).toBe('buried');
    const rock = w.rocks[0]!, hp = rock.hp;
    tap(w, rock.x, rock.y, 1);
    expect(rock.hp).toBe(hp - 1);
  });
  it('never loses a bone: let go away from the crate, it stays loose where it was put', () => {
    const w = world(1, 2);
    for (let y = 0; y < H; y += 20) rub(w, 0, y, W, y, 60);
    for (const r of w.rocks) while (!r.gone) tap(w, r.x, r.y, 9);
    rub(w, 0, 0, 1, 1, 10);
    const b = w.things.find(x => x.thing === 'bone' && x.state === 'loose')!;
    const held = grab(w, b.px, b.py)!;
    drag(w, held, 100, 100);
    release(w, held, 100, 100);
    expect(held.state).toBe('loose');
    expect([held.px, held.py]).toEqual([100, 100]);
  });
  it('puts the bones, Bolts and fossil where they fit, apart from each other and the crate', () => {
    for (const s of SITES) for (const seed of [1, 2, 3, 4, 5]) {
      const w = world(s.tier, seed);
      expect(w.things.filter(x => x.thing === 'bone')).toHaveLength(2);
      for (const x of w.things) {
        expect(x.x - x.hw).toBeGreaterThan(0); expect(x.x + x.hw).toBeLessThan(W); expect(x.y - x.hh).toBeGreaterThan(0); expect(x.y + x.hh).toBeLessThan(H);
      }
    }
  });
});
