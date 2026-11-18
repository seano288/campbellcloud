// The one small piece of ray code that both decides the answers and draws every beam on screen, so a picture can never disagree
// with what is marked right (the brief's rule). Three parts:
//
// - The beam lab: a grid of cells. A lamp shines from a cell in one of eight directions (0 is east, counting a quarter turn as 2,
//   so 2 is south and 6 is north: screen coordinates). The beam steps from cell centre to cell centre. A mirror sits in a cell and
//   turns in fixed steps of 45° (0 —, 1 \, 2 |, 3 /, in screen coordinates); it bounces the beam (the angle in equals the angle out),
//   and a beam that meets a mirror edge-on stops at its edge. A rock stops the beam; the gem is hit when the beam reaches it.
// - A beam meeting a thing: it carries on bright (lets all the light through), carries on dim (lets some through) or stops (blocks
//   it), and the wall behind shows a bright spot, a dim glow or a shadow.
// - Shadows: a lamp, a thing standing on the floor and the floor. The shadow is where the lamp's light can't reach, found by the
//   straight lines from the lamp past the thing's edges.

export type Dir = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** A mirror's turn: 0 —, 1 \, 2 |, 3 / (on screen, y down). */
export type Turn = 0 | 1 | 2 | 3;
export const TURNS: readonly Turn[] = [0, 1, 2, 3];
export const STEP: Record<Dir, readonly [number, number]> = { 0: [1, 0], 1: [1, 1], 2: [0, 1], 3: [-1, 1], 4: [-1, 0], 5: [-1, -1], 6: [0, -1], 7: [1, -1] };

export interface Cell { readonly x: number; readonly y: number }
export interface Lab {
  readonly w: number;
  readonly h: number;
  readonly lamp: Cell & { readonly dir: Dir };
  readonly gem: Cell;
  readonly mirrors: readonly (Cell & { readonly turn: Turn })[];
  readonly rocks: readonly Cell[];
}

/** Where a beam ends: on the gem, on a rock, edge-on against a mirror, off the edge of the lab, or going round in a loop. */
export type BeamEnd = 'gem' | 'rock' | 'edge' | 'out' | 'loop';
export interface Beam { readonly points: readonly Cell[]; readonly end: BeamEnd; readonly bounces: number }

/** The direction a beam leaves a mirror in, or null if it meets the mirror edge-on. A mirror's line runs at turn × 45°. */
export function bounce(dir: Dir, turn: Turn): Dir | null {
  // the mirror's line runs at turn eighths of a full turn; a beam along it (either way) meets it edge-on
  if (dir % 4 === turn) return null;
  return ((((2 * turn - dir) % 8) + 8) % 8) as Dir;
}

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;

/** Traces the beam from the lamp: every point it passes through (the lamp first), and where it ends. */
export function trace(lab: Lab): Beam {
  let { x, y } = lab.lamp, dir: Dir = lab.lamp.dir, bounces = 0;
  const points: Cell[] = [{ x, y }], seen = new Set<string>();
  for (let steps = 0; steps < 200; steps++) {
    const [dx, dy] = STEP[dir];
    x += dx; y += dy;
    if (x < 0 || y < 0 || x >= lab.w || y >= lab.h) {
      // the beam runs on to the edge of the lab: end it halfway out of the last cell
      points.push({ x: x - dx / 2, y: y - dy / 2 });
      return { points, end: 'out', bounces };
    }
    const here = { x, y };
    if (same(here, lab.gem)) { points.push(here); return { points, end: 'gem', bounces }; }
    if (lab.rocks.some(r => same(r, here))) { points.push(here); return { points, end: 'rock', bounces }; }
    const m = lab.mirrors.find(mm => same(mm, here));
    if (m) {
      points.push(here);
      const out = bounce(dir, m.turn);
      if (out === null) return { points, end: 'edge', bounces };
      const key = `${x},${y},${out}`;
      if (seen.has(key)) return { points, end: 'loop', bounces };
      seen.add(key);
      dir = out; bounces++;
    }
  }
  return { points, end: 'loop', bounces };
}

export const hitsGem = (lab: Lab) => trace(lab).end === 'gem';
/** The lab with its mirrors turned (or moved) as given. */
export const withMirrors = (lab: Lab, mirrors: Lab['mirrors']): Lab => ({ ...lab, mirrors });

// ---------- a beam meeting a thing ----------

/** How much light a material lets through: all of it, some of it, none (it blocks it). A mirror bounces it back. */
export type Pass = 'all' | 'some' | 'none';
/** How bright the beam is after the thing, 0 to 1 (the beam on screen is drawn at this strength). */
export const PASS_LIGHT: Record<Pass, number> = { all: 1, some: 0.38, none: 0 };
/** What the wall behind looks like: a bright spot, a dim glow, a shadow. */
export type WallLook = 'bright' | 'dim' | 'shadow';
export const wallLook = (p: Pass): WallLook => (p === 'all' ? 'bright' : p === 'some' ? 'dim' : 'shadow');
/** The beam from the lamp to the thing at full strength, then on to the wall at what the thing lets through. */
export function beamPast(pass: Pass, lampX: number, thingX: number, wallX: number) {
  return [{ from: lampX, to: thingX, light: 1 }, ...(PASS_LIGHT[pass] > 0 ? [{ from: thingX, to: wallX, light: PASS_LIGHT[pass] }] : [])];
}

// ---------- shadows ----------

export interface Lamp { readonly x: number; readonly y: number }
/** A thing standing on the floor (y = 0 is the floor, y goes up), `x` its middle. */
export interface Stand { readonly x: number; readonly w: number; readonly h: number }
export type ShadowSide = 'left' | 'right' | 'under';

/** The shadow on the floor: where the lamp's light is blocked by the thing, from `from` to `to` along the floor. */
export function shadowOf(lamp: Lamp, t: Stand): { from: number; to: number; side: ShadowSide } {
  const left = t.x - t.w / 2, right = t.x + t.w / 2;
  // the line from the lamp past a top corner of the thing meets the floor here (a lamp above the top never casts to infinity)
  const reach = (cx: number) => lamp.x + (cx - lamp.x) * (lamp.y / Math.max(0.001, lamp.y - t.h));
  let from: number, to: number;
  if (lamp.x < left) { from = left; to = reach(right); }
  else if (lamp.x > right) { from = reach(left); to = right; }
  else { from = Math.min(left, reach(left)); to = Math.max(right, reach(right)); }
  const mid = (from + to) / 2, side: ShadowSide = Math.abs(mid - t.x) < t.w * 0.35 ? 'under' : mid > t.x ? 'right' : 'left';
  return { from, to, side };
}
