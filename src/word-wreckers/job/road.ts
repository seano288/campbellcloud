// A Road Job, seen from the side, as a little simulation (drawn by draw.ts): the old road in front of the lot is bumpy (the Steamroller
// rolls the bumps flat) or full of holes (the Cement Mixer pours concrete in as its chute passes over). He holds the arrow, or anywhere
// on the picture, to drive; let go and it rolls on a little; ◀ backs up, and a bump or hole is fixed whichever way he passes it. When
// they're all fixed, a line painter paints the middle line by itself. Nothing can go wrong, and nothing has to be aimed.
//
// World units: y grows downward; the ground is at GROUND_Y (the same world as the demolition).
import { RIGS } from '../art/machines';
import type { MachineId } from '../yard/shop';
import { GROUND_Y, M_SCALE } from './wreck';

export const SPOTS = 6, SPOT_X0 = 470, SPOT_GAP = 130, ROAD_END = SPOT_X0 + SPOT_GAP * (SPOTS - 1) + 160;
export type RoadKind = 'bump' | 'hole';
export interface Spot { x: number; fixed: boolean; t: number }
export type RoadEvent = 'fix' | 'paint' | 'done';

export interface Road {
  kind: RoadKind;
  machine: MachineId;
  spots: Spot[];
  /** The machine's left edge, and its speed. */
  mx: number;
  vx: number;
  speed: number;
  /** How wide the drum or the pour is (1 and up). */
  size: number;
  /** The line painter: 0 to 1 along the road, once every spot is fixed. */
  paint: number;
  done: boolean;
  t: number;
  idle: number;
  events: RoadEvent[];
}

export const kindOf = (m: MachineId): RoadKind => (m === 'mixer' ? 'hole' : 'bump');
export function createRoad(machine: MachineId, opts: { speed: number; size: number }): Road {
  return {
    kind: kindOf(machine), machine, spots: Array.from({ length: SPOTS }, (_, i) => ({ x: SPOT_X0 + i * SPOT_GAP, fixed: false, t: 0 })),
    mx: 40, vx: 0, speed: opts.speed, size: opts.size, paint: 0, done: false, t: 0, idle: 0, events: [],
  };
}
/** Where the machine fixes the road: under the roller's drum, or under the mixer's chute. */
export const fixAt = (r: Pick<Road, 'mx' | 'machine'>) => r.mx + ((RIGS[r.machine] as { at?: number }).at ?? 186) * M_SCALE;
export const fixedCount = (r: Pick<Road, 'spots'>) => r.spots.filter(s => s.fixed).length;

export function stepRoad(r: Road, dt: number, input: { drive?: -1 | 0 | 1 } = {}) {
  r.events = [];
  r.t += dt;
  if (r.done) return;
  const drive = input.drive ?? 0;
  r.idle = drive ? 0 : r.idle + dt;
  for (const s of r.spots) if (s.fixed) s.t += dt;
  if (fixedCount(r) < SPOTS) {
    // held: speed up to full; let go: roll on and slow down, so even a tap moves it along
    const top = 230 * r.speed;
    if (drive) r.vx += (drive * top - r.vx) * Math.min(1, dt * 5);
    else r.vx *= Math.max(0, 1 - dt * 1.4);
    if (Math.abs(r.vx) < 3) r.vx = 0;
    // it can drive until its drum (or chute) is past the last spot
    r.mx = Math.max(10, Math.min(SPOT_X0 + SPOT_GAP * (SPOTS - 1) + 60 - (fixAt(r) - r.mx), r.mx + r.vx * dt));
    const at = fixAt(r), reach = 26 * r.size;
    for (const s of r.spots) if (!s.fixed && Math.abs(s.x - at) <= reach) { s.fixed = true; s.t = 0; r.events.push('fix'); }
    if (fixedCount(r) === SPOTS) r.events.push('paint');
    return;
  }
  // every spot fixed: the machine rolls off and the line gets painted
  r.vx += (200 - r.vx) * Math.min(1, dt * 3);
  r.mx += r.vx * dt;
  r.paint = Math.min(1, r.paint + dt / 1.6);
  if (r.paint >= 1) { r.done = true; r.events.push('done'); }
}
export { GROUND_Y };
