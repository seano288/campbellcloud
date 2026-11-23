// The Job as a simulation, with no drawing in it: his vehicle, the stops in order, and a little traffic. It steps at a fixed rate,
// so the test can drive thousands of Jobs to the end with a scripted finger.
//
// Driving a grid of right-angle streets with a held finger was the brief's worry: steering straight at the finger would put him
// against a kerb at every corner. So the finger says where to go and the vehicle finds the way there along the streets
// (grid.ts, routeBetween): it follows the street he is on to the right crossing, turns, and carries on, rounding each corner by
// easing its velocity toward the next bend. A finger held on a building leads him to the street in front of it. A quick tap sends
// him to that spot. Nothing can be failed: there is no clock, a kerb or another car only bounces him, and every stop he reaches
// is counted. A helicopter flies straight over the roofs.
import type { Rng } from '../../game/rng';
import { BLOCK_H, BLOCK_W, PITCH_X, PITCH_Y, ROWS, routeBetween, snapToStreet, STREET, streetX, streetY, worldSize, type Bounds, type Pt } from '../city/grid';

export const STEP = 1 / 60;
/** How close he must come to a stop for it to count. Generous: it's a bus stop, not a parking test. */
export const STOP_REACH = 46;
/** How long a stop takes: people get on (or off) while the count is said. */
export const DWELL_S = 1.4;
/** The most cars on the road at once: enough to make it a city, few enough for 60 fps on the iPad 9. */
export const MAX_TRAFFIC = 6;

export interface VehicleStats {
  /** Top speed, world units a second. */
  speed: number;
  /** How quickly it reaches the speed and direction it wants (per second): lower feels heavier. */
  grip: number;
  radius: number;
  fly: boolean;
}

export interface Stop { at: Pt; /** the plot it serves, for drawing who is waiting there */ plot: string | null }
export interface JobPlan {
  stops: Stop[];
  /** How many get on (or how many parcels go) at each stop: the same at every stop, so the count goes up in equal groups. */
  group: number;
  start: Pt;
  bounds: Bounds;
  /** Some Jobs pick people up (bus, taxi), others drop things off (parcels): only the words change. */
  traffic: boolean;
}

export interface Car { x: number; y: number; vx: number; vy: number; angle: number; wobble: number }
export interface TrafficCar { x: number; y: number; /** 0 east, 1 south, 2 west, 3 north */ dir: number; speed: number; wait: number; hue: number }
export type JobEvent =
  | { t: 'arrive'; index: number }
  | { t: 'stop'; index: number; count: number; total: number }
  | { t: 'bump'; x: number; y: number; hard: boolean }
  | { t: 'done' };

export interface JobSim {
  t: number;
  plan: JobPlan;
  stats: VehicleStats;
  car: Car;
  next: number;
  /** Seconds left at the stop he's at, or 0 while driving. */
  dwell: number;
  collected: number;
  traffic: TrafficCar[];
  events: JobEvent[];
  done: boolean;
  bumps: number;
  route: Pt[];
  routeFor: Pt | null;
  lastBump: number;
}

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;
const LANE = 14;

export function createJob(plan: JobPlan, stats: VehicleStats, rng: Rng): JobSim {
  const start = stats.fly ? plan.start : snapToStreet(plan.start, plan.bounds);
  const traffic: TrafficCar[] = [];
  if (plan.traffic && !stats.fly) {
    const { cols } = plan.bounds;
    for (let i = 0; i < MAX_TRAFFIC; i++) {
      const vertical = rng() < .5, dir = vertical ? (rng() < .5 ? 1 : 3) : (rng() < .5 ? 0 : 2);
      const line = vertical ? streetX(Math.floor(rng() * (cols + 1))) : streetY(Math.floor(rng() * (ROWS + 1)));
      const along = vertical ? STREET + rng() * (ROWS * PITCH_Y - STREET) : STREET + rng() * (cols * PITCH_X - STREET);
      const [dx, dy] = DIRS[dir]!, side = LANE;
      const x = vertical ? line - dy * side : along, y = vertical ? along : line + dx * side;
      if (Math.hypot(x - start.x, y - start.y) < 160) continue;
      traffic.push({ x, y, dir, speed: 60 + rng() * 40, wait: 0, hue: Math.floor(rng() * 360) });
    }
  }
  return {
    t: 0, plan, stats, car: { x: start.x, y: start.y, vx: 0, vy: 0, angle: 0, wobble: 0 }, next: 0, dwell: 0, collected: 0, traffic,
    events: [], done: false, bumps: 0, route: [], routeFor: null, lastBump: -9,
  };
}

/** Where the vehicle is heading now: the next corner on its way to the finger, or the finger itself when flying. */
export function waypoint(s: JobSim, target: Pt): Pt {
  if (s.stats.fly) return target;
  const b = s.plan.bounds, goal = snapToStreet(target, b);
  if (!s.routeFor || Math.hypot(goal.x - s.routeFor.x, goal.y - s.routeFor.y) > 24 || !s.route.length) {
    s.route = routeBetween(snapToStreet(s.car, b), goal);
    s.routeFor = goal;
  }
  while (s.route.length > 1 && Math.hypot(s.route[0]!.x - s.car.x, s.route[0]!.y - s.car.y) < 22) s.route.shift();
  return s.route[0]!;
}

/** One fixed step. `target` is where his finger is (world units), or null when it's lifted. */
export function stepJob(s: JobSim, target: Pt | null, dt = STEP) {
  s.events = [];
  if (s.done) { brake(s.car, dt); return; }
  s.t += dt;
  const car = s.car, st = s.stats;
  const stop = s.plan.stops[s.next];
  if (s.dwell > 0) {
    brake(car, dt);
    s.dwell -= dt;
    if (s.dwell <= 0) {
      s.dwell = 0;
      s.collected += s.plan.group;
      s.events.push({ t: 'stop', index: s.next, count: s.plan.group, total: s.collected });
      s.next++;
      if (s.next >= s.plan.stops.length) { s.done = true; s.events.push({ t: 'done' }); }
    }
  } else if (stop && Math.hypot(stop.at.x - car.x, stop.at.y - car.y) < STOP_REACH) {
    s.dwell = DWELL_S;
    s.events.push({ t: 'arrive', index: s.next });
  } else if (target) {
    const w = waypoint(s, target), dx = w.x - car.x, dy = w.y - car.y, d = Math.hypot(dx, dy);
    // how far is left to go: the rest of the route, so he only slows for the end, not for every corner
    let left = d;
    for (let i = 1; i < s.route.length && !st.fly; i++) left += Math.hypot(s.route[i]!.x - s.route[i - 1]!.x, s.route[i]!.y - s.route[i - 1]!.y);
    const want = d < 2 ? 0 : st.speed * Math.min(1, left / 90);
    const tx = d ? (dx / d) * want : 0, ty = d ? (dy / d) * want : 0, k = Math.min(1, st.grip * dt);
    car.vx += (tx - car.vx) * k; car.vy += (ty - car.vy) * k;
  } else brake(car, dt);

  car.x += car.vx * dt; car.y += car.vy * dt;
  if (Math.hypot(car.vx, car.vy) > 8) {
    const a = Math.atan2(car.vy, car.vx);
    let da = a - car.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    car.angle += da * Math.min(1, 12 * dt);
  }
  car.wobble = Math.max(0, car.wobble - dt * 3);
  if (!st.fly) { kerbs(s); traffic(s, dt); }
  const { w, h } = worldSize(s.plan.bounds);
  car.x = Math.max(st.radius, Math.min(w - st.radius, car.x)); car.y = Math.max(st.radius, Math.min(h - st.radius, car.y));
}

function brake(car: Car, dt: number) { const k = Math.max(0, 1 - 7 * dt); car.vx *= k; car.vy *= k; }

function bump(s: JobSim, x: number, y: number, hard: boolean) {
  s.car.wobble = Math.min(1, s.car.wobble + (hard ? .8 : .4));
  if (s.t - s.lastBump < .6) return;
  s.lastBump = s.t; s.bumps++;
  s.events.push({ t: 'bump', x, y, hard });
}

/** The kerbs: every Block is solid, its corners rounded so he slides round them rather than catching. */
function kerbs(s: JobSim) {
  const car = s.car, r = s.stats.radius, { cols } = s.plan.bounds;
  const bx = Math.floor((car.x - STREET) / PITCH_X), by = Math.floor((car.y - STREET) / PITCH_Y);
  for (let i = bx - 1; i <= bx + 1; i++) for (let j = by - 1; j <= by + 1; j++) {
    if (i < 0 || j < 0 || i >= cols || j >= ROWS) continue;
    const x0 = STREET + i * PITCH_X, y0 = STREET + j * PITCH_Y, round = 18;
    const cx = Math.max(x0 + round, Math.min(x0 + BLOCK_W - round, car.x)), cy = Math.max(y0 + round, Math.min(y0 + BLOCK_H - round, car.y));
    const dx = car.x - cx, dy = car.y - cy, d = Math.hypot(dx, dy), gap = r + round - d;
    if (gap <= 0) continue;
    const nx = d ? dx / d : 0, ny = d ? dy / d : -1;
    car.x += nx * gap; car.y += ny * gap;
    const into = car.vx * nx + car.vy * ny;
    if (into < 0) {
      car.vx -= nx * into * 1.5; car.vy -= ny * into * 1.5; // a little bounce off the kerb
      if (-into > 50) bump(s, car.x - nx * r, car.y - ny * r, -into > 140);
    }
  }
}

/** The other cars: along the right-hand lane, a random turn at each crossing. They wait for him rather than push into him, and if
 *  he drives into one he bounces off it. */
function traffic(s: JobSim, dt: number) {
  const car = s.car, r = s.stats.radius, { cols } = s.plan.bounds, { w, h } = worldSize(s.plan.bounds);
  for (const c of s.traffic) {
    const [dx, dy] = DIRS[c.dir]!;
    const ahead = (car.x - c.x) * dx + (car.y - c.y) * dy, beside = Math.abs((car.x - c.x) * dy - (car.y - c.y) * dx);
    if (ahead > 0 && ahead < 70 && beside < 30) c.wait = Math.max(c.wait, .3);
    if (c.wait > 0) { c.wait -= dt; } else {
      const before = { x: c.x, y: c.y };
      c.x += dx * c.speed * dt; c.y += dy * c.speed * dt;
      // at a crossing (the lane's centre passes a street line), sometimes turn
      const along = dx ? c.x : c.y, was = dx ? before.x : before.y, pitch = dx ? PITCH_X : PITCH_Y;
      const k = Math.floor((along - STREET / 2) / pitch), kw = Math.floor((was - STREET / 2) / pitch);
      if (k !== kw) {
        const line = STREET / 2 + (dx > 0 || dy > 0 ? k : kw) * pitch;
        const turn = Math.sin(c.x * 12.9898 + c.y * 78.233 + s.t) > .3 ? 1 : Math.sin(c.x * 3.1 + s.t * 7) > .6 ? 3 : 0;
        if (turn) {
          // the crossing's centre, then the right-hand lane of the new way
          const cx = dx ? line : c.x + dy * LANE, cy = dy ? line : c.y - dx * LANE;
          c.dir = (c.dir + turn) % 4;
          const [ndx, ndy] = DIRS[c.dir]!;
          c.x = cx - ndy * LANE; c.y = cy + ndx * LANE;
        }
      }
      // turn back at the edge of the city
      if (c.x < STREET / 2 || c.x > w - STREET / 2 || c.y < STREET / 2 || c.y > h - STREET / 2 || cols < 1) {
        c.dir = (c.dir + 2) % 4;
        c.x = Math.max(STREET / 2, Math.min(w - STREET / 2, c.x)); c.y = Math.max(STREET / 2, Math.min(h - STREET / 2, c.y));
        const [ndx, ndy] = DIRS[c.dir]!;
        if (ndx) c.y = streetY(Math.round((c.y - STREET / 2) / PITCH_Y)) + ndx * LANE; else c.x = streetX(Math.round((c.x - STREET / 2) / PITCH_X)) - ndy * LANE;
      }
    }
    if (c.wait <= 0) { // drift back into its lane after being nudged
      if (dx) { const lane = streetY(Math.round((c.y - dx * LANE - STREET / 2) / PITCH_Y)) + dx * LANE; c.y += (lane - c.y) * Math.min(1, 3 * dt); }
      else { const lane = streetX(Math.round((c.x + dy * LANE - STREET / 2) / PITCH_X)) - dy * LANE; c.x += (lane - c.x) * Math.min(1, 3 * dt); }
    }
    // he bumps it: it is nudged out of his way and waits, and he wobbles and slows a little (so he can never be held up for good)
    const ddx = car.x - c.x, ddy = car.y - c.y, d = Math.hypot(ddx, ddy), gap = r + 13 - d;
    if (gap > 0) {
      const nx = d ? ddx / d : 1, ny = d ? ddy / d : 0;
      car.x += nx * gap * .25; car.y += ny * gap * .25;
      c.x -= nx * gap * .75; c.y -= ny * gap * .75;
      const into = car.vx * nx + car.vy * ny;
      if (into < 0) { car.vx -= nx * into * .6; car.vy -= ny * into * .6; }
      c.wait = 1;
      bump(s, c.x + nx * 13, c.y + ny * 13, false);
    }
  }
}

/** The scripted finger the tests (and the tour) use: held on the next stop. */
export const scriptedTarget = (s: JobSim): Pt | null => s.plan.stops[s.next]?.at ?? null;
