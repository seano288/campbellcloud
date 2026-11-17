// The Call, as numbers: no drawing and no DOM, so a test can play it. He holds a finger on the scene and the hose aims at it: the
// water leaves the nozzle at the Pump's speed on the flattest arc that passes through his finger (or, if it can't reach, the arc
// that gets highest there). Drops are a fixed pool (MAX_DROPS), so however he sprays the frame does the same work. A drop that
// lands in a burning window puts some of it out; one that falls on the facade or the ground splashes. The Tank runs down while he
// sprays and refills by itself. Tapping someone at a window sends the Ladder up for them.
//
// It can't be failed: fires never spread, nothing is lost, there is no clock. What his parts can't reach yet doesn't hold him up:
// once everything he can reach is done, the helpers finish the rest while he's told which part would reach it.
import { LADDER_FLOORS, PUMP_FLOORS, TANK_SECONDS, type NozzleId, type TruckId } from '../station/parts';
import type { FireKind, SceneDef, Who } from './scenes';

export const G = 6;
export const NOZZLE = { x: 4.6, y: 1.55 } as const;
export const LADDER_BASE = { x: 3.1, y: 1.45 } as const;
export const MAX_DROPS = 220;
/** A fire takes this much water; the Hose puts more water on it each second, the Foam Nozzle and the crash truck more per drop. */
export const FIRE_HP = 34;
const WIN_W = 0.62, WIN_H = 0.62, BUSH_R = 0.6;
// a Rung's floor is reached across a whole building: at REF_DX from the nozzle (the far side of most of them), nearer is higher
const REFILL_S = 1.6, LADDER_SPEED = 3.2, REF_DX = 8, F = 6;

export interface Gear {
  readonly truck: TruckId;
  readonly pump: number;
  readonly hose: number;
  readonly ladder: number;
  readonly tank: number;
  readonly nozzle: NozzleId;
}

export interface Stats { speed: number; spread: number; rate: number; power: number; tank: number; ladderFloors: number; ladderSpeed: number; streams: number }
/** What his parts do at the Call. */
export function statsOf(g: Gear): Stats {
  const floors = PUMP_FLOORS[g.pump] ?? PUMP_FLOORS[0];
  // fast enough that the arc's highest point, at a building's middle, clears a fire on its top floor
  const h = floors - 0.2 - NOZZLE.y, speed = Math.sqrt(G * (h + Math.hypot(h, REF_DX)));
  const wide = g.nozzle === 'fan' ? 1.7 : 1;
  return {
    speed,
    spread: (0.022 + g.hose * 0.02) * wide,
    rate: 52 + g.hose * 13,
    power: (g.nozzle === 'foam' ? 1.35 : 1) * (g.truck === 'crash' ? 2 : 1),
    tank: g.truck === 'boat' ? Infinity : (TANK_SECONDS[g.tank] ?? 4) * (g.truck === 'tanker' ? 2 : 1),
    ladderFloors: g.truck === 'heli' ? 99 : (LADDER_FLOORS[g.ladder] ?? 2) + (g.truck === 'ladder' ? 2 : 0),
    ladderSpeed: LADDER_SPEED * (g.truck === 'rescue' ? 2.5 : 1),
    streams: g.nozzle === 'twin' ? 2 : 1,
  };
}

/** The highest the water gets above x at this speed (on its best arc), in world y. */
export function reachAt(speed: number, x: number) {
  const dx = Math.max(0.8, x - NOZZLE.x);
  return NOZZLE.y + speed * speed / (2 * G) - G * dx * dx / (2 * speed * speed);
}

/** The launch angle for an arc through (tx, ty), and whether it gets there. */
export function aimAt(speed: number, tx: number, ty: number): { angle: number; reaches: boolean } {
  const dx = Math.max(0.8, tx - NOZZLE.x), dy = ty - NOZZLE.y, v2 = speed * speed;
  const disc = v2 * v2 - G * (G * dx * dx + 2 * dy * v2);
  if (disc < 0) return { angle: Math.atan(v2 / (G * dx)), reaches: false };
  return { angle: Math.max(-0.35, Math.atan((v2 - Math.sqrt(disc)) / (G * dx))), reaches: true };
}

export interface Fire { readonly x: number; readonly y: number; readonly kind: FireKind; hp: number; readonly reach: boolean; out: boolean; hit: number }
export type RescueState = 'waiting' | 'climbing' | 'riding' | 'safe';
export interface Rescue { readonly x: number; readonly y: number; readonly floor: number; readonly who: Who; state: RescueState; readonly reach: boolean; t: number }
export interface Ladder { angle: number; len: number; to: { angle: number; len: number } | null; job: Rescue | null; phase: 'rest' | 'up' | 'load' | 'down' | 'tooHigh' }
export interface Splash { x: number; y: number; t: number; steam: boolean }

export type Phase = 'work' | 'help' | 'done';
export type CallEvent = 'out' | 'saved' | 'tooHighFire' | 'tooHighLadder' | 'refill' | 'empty' | 'help' | 'done' | 'drop' | 'splash';

export interface CallState {
  readonly scene: SceneDef;
  readonly stats: Stats;
  readonly gear: Gear;
  t: number;
  phase: Phase;
  fires: Fire[];
  rescues: Rescue[];
  /** The drop pool: x, y, vx, vy, life (0 = free) and the x it was aimed at. */
  readonly drops: Float32Array;
  live: number;
  aim: { x: number; y: number } | null;
  angle: number;
  reaches: boolean;
  /** Seconds of water left; Infinity with the Fireboat. */
  tank: number;
  refill: number;
  emitDebt: number;
  ladder: Ladder;
  splashes: Splash[];
  /** Seconds he has aimed at something too high, for the hint. */
  shortFor: number;
  helpT: number;
  dropCooldown: number;
  events: CallEvent[];
  seed: number;
}

const rand = (s: CallState) => { s.seed = (s.seed * 1103515245 + 12345) & 0x7fffffff; return s.seed / 0x7fffffff; };

export function startCall(scene: SceneDef, gear: Gear, seed = 1): CallState {
  const stats = statsOf(gear);
  return {
    scene, stats, gear, t: 0, phase: 'work',
    fires: scene.fires.map(f => ({ ...f, hp: FIRE_HP, reach: reachAt(stats.speed, f.x) >= f.y - 0.22, out: false, hit: 0 })),
    rescues: scene.rescues.map(r => ({ x: r.x, y: r.floor - 0.5, floor: r.floor, who: r.who, state: 'waiting', reach: r.floor <= stats.ladderFloors, t: 0 })),
    drops: new Float32Array(MAX_DROPS * F), live: 0, aim: null, angle: 0.6, reaches: true, tank: stats.tank, refill: 0, emitDebt: 0,
    ladder: { angle: 0, len: 2.4, to: null, job: null, phase: 'rest' }, splashes: [], shortFor: 0, helpT: 0, dropCooldown: 0, events: [], seed,
  };
}

const inFire = (f: Fire, x: number, y: number) => (f.kind === 'bush' ? Math.hypot(x - f.x, y - f.y) < BUSH_R : Math.abs(x - f.x) < WIN_W / 2 + 0.06 && Math.abs(y - f.y) < WIN_H / 2 + 0.06);
const inFacade = (s: SceneDef, x: number, y: number) => s.blocks.some(b => x > b.x && x < b.x + b.w && y > (b.base ?? 0) && y < (b.base ?? 0) + b.floors);

/** He puts his finger down, or moves it: aim there. */
export function aim(s: CallState, x: number, y: number) { s.aim = { x, y }; }
/** He lifts his finger. */
export function release(s: CallState) { s.aim = null; }

/** He taps the scene: someone waiting near the tap gets the Ladder. Returns whether the tap was for a rescue. */
export function tapRescue(s: CallState, x: number, y: number): boolean {
  if (s.phase !== 'work') return false;
  const r = s.rescues.find(r => r.state === 'waiting' && Math.hypot(r.x - x, r.y - y) < 0.85);
  if (!r) return false;
  if (s.ladder.phase !== 'rest') return true;
  const top = r.reach ? r.y - 0.15 : Math.min(r.y, s.stats.ladderFloors - 0.6);
  const dx = r.x - 0.45 - LADDER_BASE.x, dy = top - LADDER_BASE.y;
  s.ladder.to = { angle: Math.atan2(dy, dx), len: Math.hypot(dx, dy) };
  s.ladder.job = r;
  s.ladder.phase = r.reach ? 'up' : 'tooHigh';
  if (r.reach) r.state = 'climbing';
  else s.events.push('tooHighLadder');
  return true;
}

/** The Fire Helicopter's trick: water dropped from the sky on the highest fire still burning. */
export function dropWater(s: CallState): boolean {
  if (s.gear.truck !== 'heli' || s.dropCooldown > 0 || s.phase !== 'work') return false;
  const f = s.fires.filter(f => !f.out).sort((a, b) => b.y - a.y)[0];
  if (!f) return false;
  f.hp = 0; f.out = true; s.dropCooldown = 4;
  s.splashes.push({ x: f.x, y: f.y, t: 0, steam: true });
  s.events.push('drop', 'out');
  return true;
}

function emit(s: CallState, dt: number) {
  if (!s.aim || s.refill > 0 || s.phase !== 'work') { s.emitDebt = 0; return; }
  const { angle, reaches } = aimAt(s.stats.speed, s.aim.x, s.aim.y);
  s.angle = angle; s.reaches = reaches;
  s.emitDebt += s.stats.rate * dt;
  const d = s.drops;
  for (; s.emitDebt >= 1; s.emitDebt--) {
    for (let k = 0; k < s.stats.streams; k++) {
      let i = -1;
      for (let j = 0; j < MAX_DROPS; j++) if (d[j * F + 4]! <= 0) { i = j; break; }
      if (i < 0) return;
      const o = i * F;
      const a = angle + (rand(s) - 0.5) * 2 * s.stats.spread + (s.stats.streams > 1 ? (k ? 0.06 : -0.06) : 0);
      const v = s.stats.speed * (0.975 + rand(s) * 0.05);
      d[o] = NOZZLE.x + Math.cos(angle) * 0.35; d[o + 1] = NOZZLE.y + Math.sin(angle) * 0.35;
      d[o + 2] = Math.cos(a) * v; d[o + 3] = Math.sin(a) * v; d[o + 4] = 4; d[o + 5] = s.aim.x;
    }
  }
  if (s.stats.tank !== Infinity) {
    s.tank -= dt;
    if (s.tank <= 0) { s.tank = 0; s.refill = REFILL_S; s.events.push('empty'); }
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
        f.hp -= s.stats.power * (f.kind === 'bush' && s.gear.truck === 'brush' ? 4 : 1);
        f.hit = 0.15;
        dead = true;
        if (rand(s) < 0.12 && s.splashes.length < 40) s.splashes.push({ x, y, t: 0, steam: true });
        if (f.hp <= 0) { f.out = true; s.events.push('out'); }
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
  const rest = { angle: 0, len: 2.4 };
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

/** Everything his parts reach is done: the fires out and the people down. */
export const ownWorkDone = (s: CallState) => s.fires.every(f => f.out || !f.reach) && s.rescues.every(r => r.state === 'safe' || !r.reach) && (s.ladder.phase === 'rest' || s.ladder.phase === 'tooHigh' || (s.ladder.phase === 'down' && !s.ladder.job?.reach));

export function step(s: CallState, dt: number) {
  dt = Math.min(dt, 1 / 20);
  s.t += dt;
  s.dropCooldown = Math.max(0, s.dropCooldown - dt);
  if (s.refill > 0) { s.refill -= dt; if (s.refill <= 0) { s.refill = 0; s.tank = s.stats.tank; s.events.push('refill'); } }
  emit(s, dt);
  moveDrops(s, dt);
  moveLadder(s, dt);
  for (const f of s.fires) f.hit = Math.max(0, f.hit - dt);
  for (const r of s.rescues) r.t += dt;
  for (const p of s.splashes) p.t += dt;
  if (s.splashes.length) s.splashes = s.splashes.filter(p => p.t < (p.steam ? 1.1 : 0.4));
  // aiming at a fire the water can't reach: tell him which part would
  const short = s.aim && !s.reaches && s.fires.some(f => !f.out && !f.reach && Math.abs(f.x - s.aim!.x) < 1.2 && s.aim!.y > reachAt(s.stats.speed, f.x) - 0.3);
  s.shortFor = short ? s.shortFor + dt : 0;
  if (s.shortFor > 1.1) { s.shortFor = -99; s.events.push('tooHighFire'); }
  if (s.phase === 'work' && ownWorkDone(s)) {
    const left = s.fires.some(f => !f.out) || s.rescues.some(r => r.state !== 'safe');
    s.phase = left ? 'help' : 'done';
    s.events.push(left ? 'help' : 'done');
  } else if (s.phase === 'help') {
    // the helpers: a fire a second goes out, then the people are lifted down
    s.helpT += dt;
    if (s.helpT > 1.2) {
      s.helpT = 0;
      const f = s.fires.find(f => !f.out), r = s.rescues.find(r => r.state !== 'safe');
      if (f) { f.out = true; s.splashes.push({ x: f.x, y: f.y, t: 0, steam: true }); s.events.push('out'); }
      else if (r) { r.state = 'safe'; r.t = 0; s.events.push('saved'); }
      else { s.phase = 'done'; s.events.push('done'); }
    }
  }
}

/** Takes what happened since the last frame. */
export const takeEvents = (s: CallState) => s.events.splice(0);
export const firesLeft = (s: CallState) => s.fires.filter(f => !f.out).length;
