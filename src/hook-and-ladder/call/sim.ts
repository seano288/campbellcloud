// The Call, as numbers: no drawing and no DOM, so a test can play it. He holds a finger on the scene and the hose aims at it: the
// water leaves the nozzle at the Pump's speed on the flattest arc that passes through his finger (or, if it can't reach, the arc
// that gets highest there). Drops are a fixed pool (MAX_DROPS), so however he sprays the frame does the same work. A drop that
// lands in a burning window puts some of it out; one that falls on the facade or the ground splashes. The Tank runs down while he
// sprays and refills by itself. Tapping someone at a window sends the Ladder up for them.
//
// What he takes changes how it goes (TRICKS). A truck parks on the street (the Tower Truck sprays from the top of its boom). A
// helicopter, the drone, the jet pack and the blimp hover beside the scene and spray from up there, with a rope ladder that reaches
// any floor. A plane flies wherever his finger is and drops the water from above, and tapping someone sends them a parachute.
// Gadgets add to whichever he takes: the Rescue Drone flies down people the ladder can't reach, the Robot Truck sprays by itself.
//
// It can't be failed: fires never spread, nothing is lost, there is no clock. A fire that flares comes back once, smaller. What his
// parts can't reach yet doesn't hold him up: once everything he can reach is done, the helpers finish the rest while he's told
// which part would reach it.
import { kindOf, LADDER_FLOORS, PUMP_FLOORS, TANK_SECONDS, TOWER_NOZZLE, type GadgetId, type NozzleId, type TruckId, type VehicleKind } from '../station/parts';
import type { FireKind, SceneDef, Who } from './scenes';

export const G = 6;
export const NOZZLE = { x: 4.6, y: 1.55 } as const;
export const LADDER_BASE = { x: 3.1, y: 1.45 } as const;
/** Where a plane's water leaves it, in its own units (art/truck.ts's PLANE_DROP). */
const PLANE_DROP = { x: 2.6, y: 0.35 } as const;
export const MAX_DROPS = 220;
/** A fire takes this much water; the Hose puts more water on it each second, the Foam Nozzle and the crash truck more per drop. */
export const FIRE_HP = 34;
const WIN_W = 0.62, WIN_H = 0.62, BUSH_R = 0.6;
// a Rung's floor is reached across a whole building: at REF_DX from the nozzle (the far side of most of them), nearer is higher
const REFILL_S = 1.6, LADDER_SPEED = 3.2, REF_DX = 8, F = 6;
/** Seconds before a flaring fire comes back. */
export const FLARE_S = 2.5;
/** Where the people he saves stand cheering. */
export const CROWD_X = 6.4;

export interface Gear {
  readonly truck: TruckId;
  readonly engine: number;
  readonly pump: number;
  readonly hose: number;
  readonly ladder: number;
  readonly tank: number;
  readonly nozzle: NozzleId;
  readonly gadgets: readonly GadgetId[];
}

/** What each vehicle does differently. Missing numbers are 1 (times) or 0 (plus). */
interface Trick {
  ladderPlus?: number; tankTimes?: number; power?: number; bush?: number; streams?: number; ladderSpeed?: number; spread?: number; rate?: number;
  refill?: number; endless?: true; auto?: true; tower?: true;
  /** Hovering: how far right of a truck it hangs, and how much higher than the others. */
  dx?: number; lift?: number;
  /** The 🪣 Drop button: how many of the highest fires it puts out, and the seconds before the next. */
  drop?: { n: number; cd: number };
  /** A plane: how fast it flies. */
  fly?: number;
}
export const TRICKS: Readonly<Record<TruckId, Trick>> = {
  pumper: {}, mini: { refill: 0.4 }, ladder: { ladderPlus: 2 }, tanker: { tankTimes: 2 }, quint: { ladderPlus: 1, tankTimes: 1.5 },
  rescue: { ladderSpeed: 2.5 }, steam: { power: 1.6 }, brush: { bush: 4 }, tower: { tower: true }, monster: { streams: 1 }, crash: { power: 2 },
  robot: { auto: true }, boat: { endless: true }, jet: { spread: 2.2, rate: 1.4 }, train: { tankTimes: 3 },
  gold: { ladderPlus: 2, tankTimes: 2, power: 1.5, streams: 1, ladderSpeed: 1.5 },
  drone: { dx: 1.4 }, blimp: { tankTimes: 2.5, lift: 0.8 }, jetpack: { dx: 1, ladderSpeed: 3 }, scooper: { fly: 5 },
  twin: { drop: { n: 2, cd: 4 } }, skycrane: { drop: { n: 3, cd: 5 }, tankTimes: 1.5 }, airtanker: { fly: 4, rate: 1.8, spread: 2 },
  heli: { drop: { n: 1, cd: 4 } }, superjet: { fly: 9, rate: 1.5, power: 1.5 },
};

export interface Stats {
  speed: number; spread: number; rate: number; power: number; bush: number; tank: number; refill: number; ladderFloors: number; ladderSpeed: number;
  streams: number; kind: VehicleKind; auto: boolean; drone: boolean; drop: { n: number; cd: number } | null; fly: number;
}
const has = (g: Gear, id: GadgetId) => g.gadgets.includes(id);
/** What his parts do at the Call. */
export function statsOf(g: Gear): Stats {
  const floors = PUMP_FLOORS[g.pump] ?? PUMP_FLOORS[0], k = TRICKS[g.truck] ?? {}, kind = kindOf(g.truck);
  // fast enough that the arc's highest point, at a building's middle, clears a fire on its top floor
  const h = floors - 0.2 - NOZZLE.y, speed = Math.sqrt(G * (h + Math.hypot(h, REF_DX)));
  const nz = g.nozzle;
  const wide = (nz === 'fan' ? 1.7 : nz === 'sprinkler' ? 2.6 : 1) * (k.spread ?? 1);
  const streams = 1 + (nz === 'twin' ? 1 : nz === 'triple' ? 2 : 0) + (k.streams ?? 0) + (has(g, 'cannon') ? 1 : 0);
  const rope = kind === 'hover' || has(g, 'cape');
  return {
    speed,
    spread: (0.022 + g.hose * 0.02) * wide,
    rate: (52 + g.hose * 13) * (k.rate ?? 1) * (nz === 'sprinkler' ? 1.1 : 1),
    power: (nz === 'foam' ? 1.35 : nz === 'cannon' ? 1.7 : nz === 'golden' ? 1.3 : 1) * (k.power ?? 1),
    bush: k.bush ?? 1,
    tank: k.endless || has(g, 'hydrant') ? Infinity : (TANK_SECONDS[g.tank] ?? 4) * (k.tankTimes ?? 1) * (has(g, 'trailer') ? 1.5 : 1),
    refill: k.refill ?? REFILL_S,
    ladderFloors: rope ? 99 : (LADDER_FLOORS[g.ladder] ?? 2) + (k.ladderPlus ?? 0),
    ladderSpeed: LADDER_SPEED * (k.ladderSpeed ?? 1) * (1 + 0.12 * g.engine) * (has(g, 'turbo') ? 2 : 1),
    streams, kind, auto: !!k.auto, drone: has(g, 'drone'), drop: k.drop ?? null, fly: k.fly ?? 0,
  };
}

/** Where his vehicle is at this scene: a truck on the street, an aircraft up in the air, a plane over the top. */
export interface Place {
  /** The vehicle's own frame: its back wheel at x, its ground at y (art/truck.ts draws it there). */
  readonly x: number; readonly y: number;
  /** Where the water leaves it and where the ladder turns. */
  readonly origin: { x: number; y: number };
  readonly ladderBase: { x: number; y: number };
}
export function placeOf(g: Gear, scene: SceneDef): Place {
  const kind = kindOf(g.truck), k = TRICKS[g.truck] ?? {};
  if (kind === 'truck') return { x: 0, y: 0, origin: k.tower ? { ...TOWER_NOZZLE } : { ...NOZZLE }, ladderBase: { ...LADDER_BASE } };
  if (kind === 'plane') {
    const y = Math.max(1.6, scene.top - 0.4);
    return { x: 0, y, origin: { x: PLANE_DROP.x, y: y + PLANE_DROP.y }, ladderBase: { x: PLANE_DROP.x, y } };
  }
  // up in the air beside the scene, as high as it fits on the screen (a short scene leaves less sky)
  const x = k.dx ?? 0, y = Math.max(1, Math.min(4 + (k.lift ?? 0), scene.top * 0.45 + (k.lift ?? 0), scene.top - 1.7));
  return { x, y, origin: { x: NOZZLE.x + x, y: NOZZLE.y + y }, ladderBase: { x: LADDER_BASE.x + x, y: LADDER_BASE.y + y } };
}

/** The highest the water gets above x at this speed (on its best arc), in world y. */
export function reachAt(speed: number, x: number, from: { x: number; y: number } = NOZZLE) {
  const dx = Math.max(0.8, x - from.x);
  return from.y + speed * speed / (2 * G) - G * dx * dx / (2 * speed * speed);
}

/** The launch angle for an arc through (tx, ty), and whether it gets there. */
export function aimAt(speed: number, tx: number, ty: number, from: { x: number; y: number } = NOZZLE): { angle: number; reaches: boolean } {
  const dx = Math.max(0.8, tx - from.x), dy = ty - from.y, v2 = speed * speed;
  const disc = v2 * v2 - G * (G * dx * dx + 2 * dy * v2);
  if (disc < 0) return { angle: Math.atan(v2 / (G * dx)), reaches: false };
  return { angle: Math.max(-1.3, Math.atan((v2 - Math.sqrt(disc)) / (G * dx))), reaches: true };
}

export interface Fire {
  readonly x: number; readonly y: number; readonly kind: FireKind; hp: number; readonly reach: boolean; out: boolean; hit: number;
  /** It comes back once after it's put out; `back` counts down to it. */
  readonly flare: boolean; flared: boolean; back: number;
}
/** waiting at a window, the ladder on its way, riding it down, under a parachute, carried by the drone, or safe in the crowd */
export type RescueState = 'waiting' | 'climbing' | 'riding' | 'chute' | 'flying' | 'safe';
export interface Rescue { x: number; y: number; readonly floor: number; readonly who: Who; state: RescueState; readonly reach: boolean; t: number }
export interface Ladder { angle: number; len: number; to: { angle: number; len: number } | null; job: Rescue | null; phase: 'rest' | 'up' | 'load' | 'down' | 'tooHigh' }
export interface Drone { x: number; y: number; phase: 'home' | 'out' | 'back'; job: Rescue | null }
export interface Plane { x: number; vx: number; facing: 1 | -1 }
export interface Splash { x: number; y: number; t: number; steam: boolean }

export type Phase = 'work' | 'help' | 'done';
export type CallEvent = 'out' | 'saved' | 'tooHighFire' | 'tooHighLadder' | 'refill' | 'empty' | 'help' | 'done' | 'drop' | 'splash' | 'flare' | 'chute' | 'drone';

export interface CallState {
  readonly scene: SceneDef;
  readonly stats: Stats;
  readonly gear: Gear;
  readonly place: Place;
  t: number;
  phase: Phase;
  fires: Fire[];
  rescues: Rescue[];
  /** The drop pool: x, y, vx, vy, life (0 = free) and the x it was aimed at (past which it splashes on a wall). */
  readonly drops: Float32Array;
  live: number;
  aim: { x: number; y: number } | null;
  /** The Robot Truck aiming by itself while he isn't. */
  auto: { x: number; y: number } | null;
  angle: number;
  reaches: boolean;
  /** Seconds of water left; Infinity with the Fireboat or the Hydrant Hookup. */
  tank: number;
  refill: number;
  emitDebt: number;
  ladder: Ladder;
  drone: Drone | null;
  plane: Plane | null;
  splashes: Splash[];
  /** Seconds he has aimed at something too high, for the hint. */
  shortFor: number;
  helpT: number;
  dropCooldown: number;
  events: CallEvent[];
  seed: number;
}

const rand = (s: CallState) => { s.seed = (s.seed * 1103515245 + 12345) & 0x7fffffff; return s.seed / 0x7fffffff; };
const ropeRest = (s: Pick<CallState, 'stats'>) => (s.stats.kind === 'hover' ? { angle: -Math.PI / 2, len: 0.3 } : { angle: 0, len: 2.4 });

export function startCall(scene: SceneDef, gear: Gear, seed = 1): CallState {
  const stats = statsOf(gear), place = placeOf(gear, scene), plane = stats.kind === 'plane';
  const home = { x: place.ladderBase.x - 1.3, y: place.ladderBase.y + 1.3 };
  const s: CallState = {
    scene, stats, gear, place, t: 0, phase: 'work',
    fires: scene.fires.map(f => ({ x: f.x, y: f.y, kind: f.kind, hp: FIRE_HP, reach: plane || reachAt(stats.speed, f.x, place.origin) >= f.y - 0.22, out: false, hit: 0, flare: !!f.flare, flared: false, back: 0 })),
    rescues: scene.rescues.map(r => ({ x: r.x, y: r.floor - 0.5, floor: r.floor, who: r.who, state: 'waiting', reach: plane || stats.drone || r.floor <= stats.ladderFloors, t: 0 })),
    drops: new Float32Array(MAX_DROPS * F), live: 0, aim: null, auto: null, angle: 0.6, reaches: true, tank: stats.tank, refill: 0, emitDebt: 0,
    ladder: { angle: 0, len: 2.4, to: null, job: null, phase: 'rest' }, drone: stats.drone ? { ...home, phase: 'home', job: null } : null,
    plane: plane ? { x: place.origin.x, vx: 0, facing: 1 } : null,
    splashes: [], shortFor: 0, helpT: 0, dropCooldown: 0, events: [], seed,
  };
  Object.assign(s.ladder, ropeRest(s));
  return s;
}

const inFire = (f: Fire, x: number, y: number) => (f.kind === 'bush' ? Math.hypot(x - f.x, y - f.y) < BUSH_R : Math.abs(x - f.x) < WIN_W / 2 + 0.06 && Math.abs(y - f.y) < WIN_H / 2 + 0.06);
const inFacade = (s: SceneDef, x: number, y: number) => s.blocks.some(b => x > b.x && x < b.x + b.w && y > (b.base ?? 0) && y < (b.base ?? 0) + b.floors);
const burning = (f: Fire) => !f.out;
/** A fire goes out; one that flares will be back. */
function douse(s: CallState, f: Fire, flare = true) {
  f.out = true; f.hp = 0;
  if (flare && f.flare && !f.flared) f.back = FLARE_S;
  s.events.push('out');
}

/** He puts his finger down, or moves it: aim there. */
export function aim(s: CallState, x: number, y: number) { s.aim = { x, y }; }
/** He lifts his finger. */
export function release(s: CallState) { s.aim = null; }

/** He taps the scene: someone waiting near the tap gets the Ladder (or a parachute from a plane, or the Rescue Drone for someone the
 *  ladder can't reach). Returns whether the tap was for a rescue. */
export function tapRescue(s: CallState, x: number, y: number): boolean {
  if (s.phase !== 'work') return false;
  const r = s.rescues.find(r => r.state === 'waiting' && Math.hypot(r.x - x, r.y - y) < 0.85);
  if (!r) return false;
  if (s.stats.kind === 'plane') { r.state = 'chute'; r.t = 0; s.events.push('chute'); return true; }
  const ladderReaches = r.floor <= s.stats.ladderFloors;
  // the drone takes someone the ladder can't reach, or anyone while the ladder is busy
  if (s.drone && s.drone.phase === 'home' && (!ladderReaches || s.ladder.phase !== 'rest')) {
    s.drone.phase = 'out'; s.drone.job = r; r.state = 'climbing'; s.events.push('drone');
    return true;
  }
  if (s.ladder.phase !== 'rest') return true;
  const base = s.place.ladderBase, top = ladderReaches ? r.y - 0.15 : Math.min(r.y, s.stats.ladderFloors - 0.6);
  const dx = r.x - 0.45 - base.x, dy = top - base.y;
  s.ladder.to = { angle: Math.atan2(dy, dx), len: Math.hypot(dx, dy) };
  s.ladder.job = r;
  s.ladder.phase = ladderReaches ? 'up' : 'tooHigh';
  if (ladderReaches) r.state = 'climbing';
  else s.events.push('tooHighLadder');
  return true;
}

/** The 🪣 Drop: water dropped from the sky on the highest fires still burning (helicopters). */
export function dropWater(s: CallState): boolean {
  const d = s.stats.drop;
  if (!d || s.dropCooldown > 0 || s.phase !== 'work') return false;
  const fs = s.fires.filter(burning).sort((a, b) => b.y - a.y).slice(0, d.n);
  if (!fs.length) return false;
  // a fire his water can't reach doesn't come back after a Drop: nothing he has could put it out again
  for (const f of fs) { douse(s, f, f.reach); s.splashes.push({ x: f.x, y: f.y, t: 0, steam: true }); }
  s.dropCooldown = d.cd;
  s.events.push('drop');
  return true;
}
export const canDrop = (s: CallState) => !!s.stats.drop && s.dropCooldown <= 0 && s.phase === 'work' && s.fires.some(burning);

/** Where the water is going this frame: his finger, or the Robot Truck's own aim at the lowest fire it reaches. */
function target(s: CallState) {
  if (s.aim) return s.aim;
  if (!s.stats.auto) return (s.auto = null);
  const f = s.fires.filter(f => burning(f) && f.reach).sort((a, b) => a.y - b.y || a.x - b.x)[0];
  return (s.auto = f ? { x: f.x, y: f.y } : null);
}

function freeDrop(d: Float32Array) { for (let j = 0; j < MAX_DROPS; j++) if (d[j * F + 4]! <= 0) return j * F; return -1; }

function emit(s: CallState, dt: number) {
  const to = s.phase === 'work' ? target(s) : null;
  if (!to || s.refill > 0) { s.emitDebt = 0; return; }
  const d = s.drops;
  if (s.plane) {
    // a plane drops the water below it as it flies; it falls straight past the walls (down their front), so any fire under it gets wet
    s.emitDebt += s.stats.rate * dt;
    const sx = 0.25 + s.gear.hose * 0.07 * (s.stats.spread / Math.max(0.001, 0.022 + s.gear.hose * 0.02));
    for (; s.emitDebt >= 1; s.emitDebt--) for (let k = 0; k < s.stats.streams; k++) {
      const o = freeDrop(d);
      if (o < 0) break;
      d[o] = s.plane.x + (rand(s) - 0.5) * 2 * sx; d[o + 1] = s.place.origin.y;
      d[o + 2] = s.plane.vx * 0.4 + (rand(s) - 0.5) * 0.6; d[o + 3] = -0.6 - rand(s) * 0.6; d[o + 4] = 4; d[o + 5] = Infinity;
    }
    s.reaches = true;
  } else {
    const from = s.place.origin, { angle, reaches } = aimAt(s.stats.speed, to.x, to.y, from);
    s.angle = angle; s.reaches = reaches;
    s.emitDebt += s.stats.rate * dt;
    const n = s.stats.streams;
    for (; s.emitDebt >= 1; s.emitDebt--) {
      for (let k = 0; k < n; k++) {
        const o = freeDrop(d);
        if (o < 0) return;
        const a = angle + (rand(s) - 0.5) * 2 * s.stats.spread + (n > 1 ? (k - (n - 1) / 2) * 0.1 : 0);
        const v = s.stats.speed * (0.975 + rand(s) * 0.05);
        d[o] = from.x + Math.cos(angle) * 0.35; d[o + 1] = from.y + Math.sin(angle) * 0.35;
        d[o + 2] = Math.cos(a) * v; d[o + 3] = Math.sin(a) * v; d[o + 4] = 4; d[o + 5] = to.x;
      }
    }
  }
  if (s.stats.tank !== Infinity) {
    s.tank -= dt;
    if (s.tank <= 0) { s.tank = 0; s.refill = s.stats.refill; s.events.push('empty'); }
  }
}

function moveDrops(s: CallState, dt: number) {
  const d = s.drops;
  let live = 0;
  for (let i = 0; i < MAX_DROPS; i++) {
    const o = i * F;
    if (d[o + 4]! <= 0) continue;
    d[o + 3] = d[o + 3]! - G * dt;
    const x = (d[o] = d[o]! + d[o + 2]! * dt), y = (d[o + 1] = d[o + 1]! + d[o + 3]! * dt);
    d[o + 4] = d[o + 4]! - dt;
    let dead = d[o + 4]! <= 0 || y < 0 || x > s.scene.right + 2;
    if (!dead) {
      for (const f of s.fires) {
        if (f.out || !inFire(f, x, y)) continue;
        f.hp -= s.stats.power * (f.kind === 'bush' ? s.stats.bush : 1);
        f.hit = 0.15;
        dead = true;
        if (rand(s) < 0.12 && s.splashes.length < 40) s.splashes.push({ x, y, t: 0, steam: true });
        if (f.hp <= 0) douse(s, f);
        break;
      }
      // water coming down onto the front of a building splashes there, once it's past where he aimed (so it can still reach a low
      // window in front of the wall)
      if (!dead && d[o + 3]! < 0 && x > d[o + 5]! - 0.1 && inFacade(s.scene, x, y)) dead = true;
      if (dead && rand(s) < 0.08 && s.splashes.length < 40) s.splashes.push({ x, y: Math.max(0, y), t: 0, steam: false });
    } else if (y < 0 && rand(s) < 0.06 && s.splashes.length < 40) s.splashes.push({ x, y: 0, t: 0, steam: false });
    if (dead) d[o + 4] = 0; else live++;
  }
  s.live = live;
}

function moveLadder(s: CallState, dt: number) {
  const l = s.ladder, step = s.stats.ladderSpeed * dt;
  const toward = (a: number, b: number, k: number) => (Math.abs(b - a) <= k ? b : a + Math.sign(b - a) * k);
  const rest = ropeRest(s);
  const go = (to: { angle: number; len: number }) => {
    l.angle = toward(l.angle, to.angle, step * 0.55);
    if (Math.abs(l.angle - to.angle) < 0.3) l.len = toward(l.len, to.len, step);
    return l.angle === to.angle && l.len === to.len;
  };
  const job = l.job;
  if (l.phase === 'up' && l.to && go(l.to)) { l.phase = 'load'; if (job) { job.state = 'riding'; job.t = 0; } }
  else if (l.phase === 'load') { if (job && (job.t += dt) > 0.45) l.phase = 'down'; }
  else if (l.phase === 'tooHigh' && l.to && go(l.to)) { l.phase = 'down'; }
  else if (l.phase === 'down') {
    // a short ladder brings its rider down: lowered, then off at the truck
    if (go(rest)) {
      if (job && job.state === 'riding') { job.state = 'safe'; job.t = 0; s.events.push('saved'); }
      l.phase = 'rest'; l.job = null; l.to = null;
    }
  }
}

const DRONE_SPEED = 3.4;
function moveDrone(s: CallState, dt: number) {
  const dr = s.drone;
  if (!dr || dr.phase === 'home') return;
  const home = { x: s.place.ladderBase.x - 1.3, y: s.place.ladderBase.y + 1.3 }, job = dr.job;
  const to = dr.phase === 'out' && job ? { x: job.x, y: job.y + 0.55 } : dr.phase === 'back' && job ? { x: CROWD_X, y: 0.9 } : home;
  const dx = to.x - dr.x, dy = to.y - dr.y, dist = Math.hypot(dx, dy), stepLen = DRONE_SPEED * dt;
  if (dist > stepLen) { dr.x += (dx / dist) * stepLen; dr.y += (dy / dist) * stepLen; }
  else {
    dr.x = to.x; dr.y = to.y;
    if (dr.phase === 'out' && job) { dr.phase = 'back'; job.state = 'flying'; }
    else if (dr.phase === 'back' && job) { job.state = 'safe'; job.t = 0; s.events.push('saved'); dr.job = null; }
    else if (dr.phase === 'back') dr.phase = 'home';
  }
  if (job && job.state === 'flying') { job.x = dr.x; job.y = dr.y - 0.55; }
}

const PLANE_ACCEL = 9;
function movePlane(s: CallState, dt: number) {
  const p = s.plane;
  if (!p) return;
  // kept on screen (the plane reaches about 2.6 behind where it drops and 2.4 in front), except that it can always fly over the last fire
  const lo = 2.8, hi = Math.max(lo + 1, Math.min(s.scene.right - 1, Math.max(s.scene.right + 0.4, 13) - 2.5), ...s.fires.map(f => f.x + 0.2));
  // with no finger down it circles gently where it was
  const goal = s.aim ? Math.min(hi, Math.max(lo, s.aim.x)) : p.x + Math.sin(s.t * 0.8) * 0.6;
  const want = Math.max(-s.stats.fly, Math.min(s.stats.fly, (goal - p.x) * 3));
  p.vx += Math.max(-PLANE_ACCEL * dt, Math.min(PLANE_ACCEL * dt, want - p.vx));
  p.x = Math.min(hi, Math.max(lo, p.x + p.vx * dt));
  if (p.vx > 0.3) p.facing = 1; else if (p.vx < -0.3) p.facing = -1;
}

function moveChutes(s: CallState, dt: number) {
  for (const r of s.rescues) {
    if (r.state !== 'chute') continue;
    r.y = Math.max(0.3, r.y - 1.4 * dt);
    r.x += Math.sign(CROWD_X - r.x) * Math.min(Math.abs(CROWD_X - r.x), 0.9 * dt);
    if (r.y <= 0.3) { r.state = 'safe'; r.t = 0; s.events.push('saved'); }
  }
}

/** Everything his parts reach is done: the fires out (and not about to come back) and the people down. */
export const ownWorkDone = (s: CallState) => s.fires.every(f => f.back <= 0 && (f.out || !f.reach)) && s.rescues.every(r => r.state === 'safe' || !r.reach)
  && (s.ladder.phase === 'rest' || s.ladder.phase === 'tooHigh' || (s.ladder.phase === 'down' && !s.ladder.job?.reach)) && (!s.drone || s.drone.phase === 'home' || !s.drone.job);

export function step(s: CallState, dt: number) {
  dt = Math.min(dt, 1 / 20);
  s.t += dt;
  s.dropCooldown = Math.max(0, s.dropCooldown - dt);
  if (s.refill > 0) { s.refill -= dt; if (s.refill <= 0) { s.refill = 0; s.tank = s.stats.tank; s.events.push('refill'); } }
  movePlane(s, dt);
  emit(s, dt);
  moveDrops(s, dt);
  moveLadder(s, dt);
  moveDrone(s, dt);
  moveChutes(s, dt);
  for (const f of s.fires) {
    f.hit = Math.max(0, f.hit - dt);
    if (f.back > 0 && (f.back -= dt) <= 0) { f.back = 0; f.out = false; f.flared = true; f.hp = FIRE_HP * 0.6; s.events.push('flare'); }
  }
  for (const r of s.rescues) r.t += dt;
  for (const p of s.splashes) p.t += dt;
  if (s.splashes.length) s.splashes = s.splashes.filter(p => p.t < (p.steam ? 1.1 : 0.4));
  // aiming at a fire the water can't reach: tell him which part would
  const short = s.aim && !s.reaches && s.fires.some(f => burning(f) && !f.reach && Math.abs(f.x - s.aim!.x) < 1.2 && s.aim!.y > reachAt(s.stats.speed, f.x, s.place.origin) - 0.3);
  s.shortFor = short ? s.shortFor + dt : 0;
  if (s.shortFor > 1.1) { s.shortFor = -99; s.events.push('tooHighFire'); }
  if (s.phase === 'work' && ownWorkDone(s)) {
    const left = s.fires.some(f => burning(f) || f.back > 0) || s.rescues.some(r => r.state !== 'safe');
    s.phase = left ? 'help' : 'done';
    s.events.push(left ? 'help' : 'done');
  } else if (s.phase === 'help') {
    // the helpers: a fire a second goes out (for good), then the people are lifted down
    s.helpT += dt;
    if (s.helpT > 1.2) {
      s.helpT = 0;
      const f = s.fires.find(f => burning(f) || f.back > 0), r = s.rescues.find(r => r.state !== 'safe');
      if (f) { f.back = 0; f.flared = true; douse(s, f, false); s.splashes.push({ x: f.x, y: f.y, t: 0, steam: true }); }
      else if (r) { r.state = 'safe'; r.t = 0; s.events.push('saved'); }
      else { s.phase = 'done'; s.events.push('done'); }
    }
  }
}

/** Takes what happened since the last frame. */
export const takeEvents = (s: CallState) => s.events.splice(0);
export const firesLeft = (s: CallState) => s.fires.filter(burning).length;
/** Whether water is coming out this frame (for the hose's hiss). */
export const spraying = (s: CallState) => s.phase === 'work' && s.refill <= 0 && !!(s.aim ?? s.auto);
