// The drive out to the animal, seen from the side, as a little simulation (drawn by draw.ts). He holds anywhere on the picture to
// drive and taps ⤴ to jump. Mud and soft sand slow the truck, a stream splashes it down to a crawl, and a log or a rock bounces it,
// but nothing stops it: while he holds, the truck always moves. Four Bolts hang over the road, two low and two that need a jump.
//
// Heights are measured up from the road's baseline; the world is VIEW_H tall.
import type { HabitatId } from '../facts/habitats';

export const START_X = 220, END_X = 2600, VIEW_H = 600, GROUND_Y = 470;
export const GRAVITY = 2100, JUMP_V = 900, TOP = 300, PER_RUNG = 22;
/** While he holds, the truck never goes slower than this, whatever it's driving through. */
export const CRAWL = 95;

export type ObstacleKind = 'mud' | 'sand' | 'snow' | 'stream' | 'log' | 'rock';
export interface Obstacle { kind: ObstacleKind; x: number; w: number }
export interface Bolt { x: number; y: number; got: boolean }
export type DriveEvent = 'jump' | 'land' | 'bump' | 'splash' | 'bolt' | 'arrive';

export interface Drive {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  top: number;
  hills: number;
  obstacles: Obstacle[];
  bolts: Bolt[];
  got: number;
  bumped: Set<number>;
  splashing: boolean;
  arrived: boolean;
  events: DriveEvent[];
}

/** What each place puts in the road. Every course has one of each slowing kind it uses and one bump, so it plays the same length. */
const COURSES: Record<HabitatId, readonly ObstacleKind[]> = {
  farm: ['mud', 'log', 'stream'],
  grassland: ['rock', 'stream', 'rock'],
  forest: ['log', 'mud', 'log'],
  rainforest: ['mud', 'stream', 'log'],
  pond: ['stream', 'mud', 'stream'],
  desert: ['sand', 'rock', 'sand'],
  ocean: ['sand', 'rock', 'stream'],
  polar: ['snow', 'stream', 'snow'],
};
const HILLS: Record<HabitatId, number> = { farm: 18, grassland: 14, forest: 26, rainforest: 30, pond: 12, desert: 42, ocean: 10, polar: 22 };
const WIDTH: Record<ObstacleKind, number> = { mud: 220, sand: 260, snow: 240, stream: 150, log: 34, rock: 40 };

export function createDrive(home: HabitatId, tiresRung: number): Drive {
  const obstacles = COURSES[home].map((kind, i) => ({ kind, x: 760 + i * 600, w: WIDTH[kind] }));
  const bolts = [{ x: 560, y: 70 }, { x: 1130, y: 220 }, { x: 1720, y: 70 }, { x: 2280, y: 220 }].map(b => ({ ...b, got: false }));
  return {
    t: 0, x: START_X, y: 0, vx: 0, vy: 0, grounded: true, top: TOP + tiresRung * PER_RUNG, hills: HILLS[home],
    obstacles, bolts, got: 0, bumped: new Set(), splashing: false, arrived: false, events: [],
  };
}

/** The road's height at x: gentle hills, flat at the start and where the animal waits, dipping into a stream. */
export function groundAt(d: Pick<Drive, 'hills' | 'obstacles'>, x: number) {
  const edge = Math.min(1, Math.max(0, (x - START_X - 120) / 240), Math.max(0, (END_X - 260 - x) / 240));
  let h = (Math.sin(x / 210) * 1 + Math.sin(x / 83 + 2) * .35) * d.hills * edge;
  for (const o of d.obstacles) if (o.kind === 'stream' && x > o.x && x < o.x + o.w) h -= 26 * Math.sin(((x - o.x) / o.w) * Math.PI);
  return h;
}

const inside = (o: Obstacle, x: number) => x > o.x && x < o.x + o.w;

/** `holding`: he's holding on the picture; `jump`: he tapped jump this step. */
export function stepDrive(d: Drive, dt: number, holding: boolean, jump: boolean) {
  d.events = [];
  d.t += dt;
  if (d.arrived) { d.vx = 0; return; }
  const under = d.grounded ? d.obstacles.find(o => inside(o, d.x)) : undefined;
  const slow = under?.kind === 'stream' ? .35 : under && ['mud', 'sand', 'snow'].includes(under.kind) ? .5 : 1;
  const want = holding ? Math.max(CRAWL, d.top * slow) : 0;
  d.vx += (want - d.vx) * Math.min(1, dt * (holding ? 3 : 2));
  if (holding && d.vx < CRAWL * .6) d.vx = Math.max(d.vx, CRAWL * .6); // pressing always moves it, even out of a bump
  const splashing = under?.kind === 'stream';
  if (splashing && !d.splashing) d.events.push('splash');
  d.splashing = splashing;
  if (jump && d.grounded) { d.vy = JUMP_V; d.grounded = false; d.events.push('jump'); }
  d.x = Math.min(END_X, d.x + d.vx * dt);
  if (!d.grounded) {
    d.vy -= GRAVITY * dt;
    d.y += d.vy * dt;
    const g = groundAt(d, d.x);
    if (d.y <= g) { d.y = g; d.vy = 0; d.grounded = true; d.events.push('land'); }
  } else d.y = groundAt(d, d.x);
  // a log or a rock bounces the truck up and slows it: never a stop
  for (const [i, o] of d.obstacles.entries()) {
    if ((o.kind !== 'log' && o.kind !== 'rock') || d.bumped.has(i)) continue;
    if (d.x > o.x - 30 && d.x < o.x + o.w) {
      d.bumped.add(i);
      if (d.y - groundAt(d, d.x) < 30) { d.vy = 420; d.grounded = false; d.vx *= .55; d.events.push('bump'); }
    }
  }
  for (const b of d.bolts) {
    if (b.got || Math.abs(b.x - d.x) > 70) continue;
    if (Math.abs(b.y - (d.y - groundAt(d, d.x) + 60)) < 90) { b.got = true; d.got++; d.events.push('bolt'); }
  }
  if (d.x >= END_X - 2 && d.grounded) { d.x = END_X; d.vx = 0; d.arrived = true; d.events.push('arrive'); }
}

/** How far along the road he is, 0 to 1. */
export const progress = (d: Pick<Drive, 'x'>) => Math.max(0, Math.min(1, (d.x - START_X) / (END_X - START_X)));
