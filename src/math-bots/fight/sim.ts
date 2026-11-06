// The fight's rules: two robots in a square arena, seen from above, stepped sixty times a second. No drawing and no sound here. It
// reports what happened as `events`, and render.ts and FightScreen.tsx turn those into sparks, numbers and voice, so a whole fight can
// run in a test. Everything a part does in a fight is here, because a part has to matter: a shield only guards the side it's bolted to,
// heavy parts slow him down, and so on.
import { fittedAdds, statsOf, type Build, type Stats } from '../bot/build';
import { body, edge, MOUNT_ANGLE, wheels, type AddPart, type Mount, type WheelArt } from '../bot/parts';
import type { ArenaId } from '../league/rivals';

/** A smaller world than the screen makes bigger robots: the parts he picked should be easy to see. */
export const ARENA = 760;
const at = (n: number) => n * (ARENA / 1000);
export const WALL = 34;
export const FIGHT_SECONDS = 90;
/** He steers, so the sim steps a fixed slice and render time never changes what happens. */
export const STEP = 1 / 60;
const OVER_FOR = 1.8;
/** Health in a fight, against the number on the part: sets how long a fight lasts. */
const HP_SCALE = 2.4;
/** Driving to a touched spot: this close counts as there, and it slows down over the last EASE of the way. */
const SPOT_REACHED = 16, SPOT_EASE = 90;

export interface Input { x: number; y: number; hit: boolean; boost: boolean }
export const IDLE: Input = { x: 0, y: 0, hit: false, boost: false };

export type Hazard =
  | { kind: 'saw'; cx: number; cy: number; orbit: number; speed: number; phase: number; r: number }
  | { kind: 'vent'; x: number; y: number; r: number; phase: number }
  | { kind: 'pit'; x: number; y: number; r: number };
export interface ArenaDef { floor: string; line: string; hazards: Hazard[]; spikes: boolean }
const orbiting = (cx: number, cy: number, phase: number): Hazard => ({ kind: 'saw', cx, cy, orbit: at(95), speed: .9, phase, r: 32 });
const vent = (x: number, y: number, phase: number): Hazard => ({ kind: 'vent', x, y, r: 62, phase });
export const ARENAS: Record<ArenaId, ArenaDef> = {
  yard: { floor: '#5b6875', line: '#6c7a88', hazards: [], spikes: false },
  saws: { floor: '#4b5a68', line: '#5d6d7d', hazards: [orbiting(at(230), at(500), 0), orbiting(at(770), at(500), Math.PI)], spikes: false },
  vents: { floor: '#514a4a', line: '#655b58', hazards: [vent(at(250), at(250), 0), vent(at(750), at(250), 1), vent(at(250), at(750), 2), vent(at(750), at(750), 3)], spikes: true },
  pit: { floor: '#3e4656', line: '#515b6e', hazards: [{ kind: 'pit', x: at(500), y: at(500), r: 100 }], spikes: true },
};
/** Vents take turns: each burns for VENT_ON out of a cycle of 4 × VENT_STEP. */
const VENT_STEP = 1.6, VENT_ON = 1.3, VENT_WARN = .7;
export function ventState(v: Extract<Hazard, { kind: 'vent' }>, t: number) {
  const at = (t + (4 - v.phase) * VENT_STEP) % (4 * VENT_STEP);
  return at < VENT_ON ? 'on' : at > 4 * VENT_STEP - VENT_WARN ? 'warn' : 'off';
}
export const sawAt = (h: Extract<Hazard, { kind: 'saw' }>, t: number) => ({ x: h.cx + Math.cos(t * h.speed + h.phase) * h.orbit, y: h.cy + Math.sin(t * h.speed + h.phase) * h.orbit * 2.4 });

export interface Fitted { mount: Mount; part: AddPart; cd: number; swing: number }
export interface Fighter {
  side: 0 | 1; build: Build; stats: Stats; fitted: Fitted[];
  x: number; y: number; vx: number; vy: number; a: number;
  hp: number; maxHp: number; hitScale: number;
  stun: number; air: number; airSpin: number; safe: number; flash: number;
  boost: number; boostCd: number; power: number; powerCd: number; held: number; hoverOver: boolean;
  drove: number;
}
export type Ev =
  | { t: 'hit'; x: number; y: number; dmg: number; on: 0 | 1; big: boolean; blocked: boolean; by: AddPart['kind'] | 'ram' | 'hazard' | 'wall' }
  | { t: 'swing'; x: number; y: number; kind: AddPart['kind'] }
  | { t: 'flip'; on: 0 | 1 } | { t: 'land'; x: number; y: number } | { t: 'pit'; on: 0 | 1 }
  | { t: 'bolt'; x: number; y: number } | { t: 'heal'; x: number; y: number } | { t: 'boost'; on: 0 | 1 }
  | { t: 'grab'; on: 0 | 1 } | { t: 'ko'; on: 0 | 1 };
export interface Pickup { kind: 'bolt' | 'crate'; x: number; y: number; born: number }
export interface Fight {
  t: number; arena: ArenaDef; bots: [Fighter, Fighter]; pickups: Pickup[]; events: Ev[]; rng: () => number;
  /** Frozen for a moment on a big hit, so it lands. */
  freeze: number; bolts: number; crateUsed: boolean; nextBolt: number; hazardCd: [number, number];
  over: { winner: 0 | 1; ko: boolean } | null; overFor: number; assist: boolean;
}
export interface Side { build: Build; hp?: number; speed?: number; hit?: number }

function fighter(side: 0 | 1, s: Side): Fighter {
  const stats = statsOf(s.build), hp = Math.round(stats.hp * HP_SCALE * (s.hp ?? 1));
  stats.speed *= s.speed ?? 1;
  return {
    side, build: s.build, stats, fitted: fittedAdds(s.build).map(f => ({ ...f, cd: 0, swing: 0 })),
    x: side ? ARENA - at(220) : at(220), y: side ? at(240) : ARENA - at(240), vx: 0, vy: 0, a: side ? Math.PI * .75 : -Math.PI * .25,
    hp, maxHp: hp, hitScale: s.hit ?? 1, stun: 0, air: 0, airSpin: 0, safe: 0, flash: 0, boost: 0, boostCd: 0, power: 0, powerCd: 0, held: 0, hoverOver: wheels(s.build.wheels).art === ('hover' satisfies WheelArt), drove: 0,
  };
}
export function createFight(you: Side, foe: Side, arena: ArenaId, rng: () => number, assist = true): Fight {
  return { t: 0, arena: ARENAS[arena], bots: [fighter(0, you), fighter(1, foe)], pickups: [], events: [], rng, freeze: 0, bolts: 0, crateUsed: false, nextBolt: 3, hazardCd: [0, 0], over: null, overFor: 0, assist };
}

const angleTo = (from: number, to: number) => { let d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);
const massOf = (f: Fighter) => f.stats.weight;
const alive = (f: Fighter) => f.hp > 0;

export function tipOf(f: Fighter, a: Fitted) {
  const shell = body(f.build.body), r = edge(shell, a.mount) + a.part.reach, ang = f.a + MOUNT_ANGLE[a.mount];
  return { x: f.x + Math.cos(ang) * r, y: f.y + Math.sin(ang) * r };
}
/** Which of its own sides a point is on. */
function sideFacing(f: Fighter, x: number, y: number): Mount {
  const d = angleTo(f.a, Math.atan2(y - f.y, x - f.x));
  return Math.abs(d) < Math.PI / 4 ? 'front' : Math.abs(d) > Math.PI * .75 ? 'back' : d > 0 ? 'right' : 'left';
}

function hurt(s: Fight, on: Fighter, from: Fighter | null, raw: number, x: number, y: number, by: Extract<Ev, { t: 'hit' }>['by'], knock: number) {
  if (on.safe > 0 || !alive(on)) return;
  let dmg = raw;
  let blocked = false;
  const guard = by === 'hazard' || by === 'wall' ? null : on.fitted.find(a => a.mount === sideFacing(on, x, y) && a.part.block);
  if (guard) { dmg *= 1 - guard.part.block!; blocked = guard.part.block! >= .5; }
  // Spikes and rubber answer back: a touch on them costs the one who touched.
  if (from && guard?.part.kind === 'thorns' && guard.cd <= 0) { guard.cd = .4; hurt(s, from, null, guard.part.dmg, x, y, 'ram', 240); }
  const bump = from && on.fitted.find(a => a.part.kind === 'bumper' && a.mount === sideFacing(on, x, y));
  if (bump) { dmg *= .8; knock *= 1.3; }
  if (body(on.build.body).shape === 'wedge' && sideFacing(on, x, y) === 'front') dmg *= .85;
  dmg = Math.max(1, Math.round(dmg));
  on.hp = Math.max(0, on.hp - dmg);
  on.flash = .16;
  const nx = on.x - x, ny = on.y - y, n = Math.hypot(nx, ny) || 1, push = knock * Math.sqrt(16 / massOf(on));
  on.vx += nx / n * push; on.vy += ny / n * push;
  const big = dmg >= 12;
  if (big) s.freeze = Math.max(s.freeze, Math.min(.1, .04 + dmg * .001));
  s.events.push({ t: 'hit', x, y, dmg, on: on.side, big, blocked, by });
  if (on.hp <= 0 && !s.over) {
    s.over = { winner: on.side === 0 ? 1 : 0, ko: true };
    s.events.push({ t: 'ko', on: on.side });
  }
}

function fire(s: Fight, f: Fighter, foe: Fighter, a: Fitted) {
  const k = a.part.kind;
  if (k === 'hammer' || k === 'flip' || k === 'claw' || k === 'prod') {
    if (a.cd > 0) return false;
    a.cd = { hammer: 1.35, flip: 2.3, claw: 3, prod: 1.7 }[k];
    a.swing = 1;
    const tip = tipOf(f, a);
    s.events.push({ t: 'swing', x: tip.x, y: tip.y, kind: k });
    if (foe.air > 0 || foe.safe > 0 || dist(tip.x, tip.y, foe.x, foe.y) > foe.stats.radius + 34 * a.part.size) return true;
    const dmg = a.part.dmg * f.hitScale;
    if (k === 'hammer') { hurt(s, foe, f, dmg, tip.x, tip.y, 'hammer', 240); foe.stun = Math.max(foe.stun, .28); }
    if (k === 'prod') { hurt(s, foe, f, dmg, tip.x, tip.y, 'prod', 90); foe.stun = Math.max(foe.stun, .9); }
    if (k === 'claw') { hurt(s, foe, f, dmg, tip.x, tip.y, 'claw', 0); foe.held = 1.3; s.events.push({ t: 'grab', on: foe.side }); }
    if (k === 'flip') {
      hurt(s, foe, f, dmg, tip.x, tip.y, 'flip', 460);
      if (alive(foe)) { foe.air = Math.max(.55, .95 * Math.sqrt(16 / massOf(foe))); foe.airSpin = s.rng() < .5 ? -1 : 1; foe.held = 0; s.events.push({ t: 'flip', on: foe.side }); }
    }
    return true;
  }
  return false;
}

function touchWeapons(s: Fight, f: Fighter, foe: Fighter, dt: number) {
  for (const a of f.fitted) {
    a.cd = Math.max(0, a.cd - dt); a.swing = Math.max(0, a.swing - dt * 3.5);
    const k = a.part.kind;
    if (k !== 'saw' && k !== 'spin' && k !== 'lance' && k !== 'bumper') continue;
    if (a.cd > 0 || foe.air > 0 || f.air > 0) continue;
    const tip = tipOf(f, a);
    if (dist(tip.x, tip.y, foe.x, foe.y) > foe.stats.radius + 8 * a.part.size) continue;
    const over = f.power > 0 ? 2 : 1, dmg = a.part.dmg * over * f.hitScale;
    if (k === 'saw') { a.cd = .22; hurt(s, foe, f, dmg, tip.x, tip.y, 'saw', 22); }
    if (k === 'spin') { a.cd = .95; a.swing = 1; hurt(s, foe, f, dmg, tip.x, tip.y, 'spin', 420); }
    if (k === 'lance') {
      const closing = Math.hypot(f.vx - foe.vx, f.vy - foe.vy);
      a.cd = .6; hurt(s, foe, f, dmg * (closing > 110 ? 1 : .5), tip.x, tip.y, 'lance', 180);
    }
    if (k === 'bumper') {
      const closing = Math.hypot(f.vx - foe.vx, f.vy - foe.vy);
      if (closing > 90) { a.cd = .55; hurt(s, foe, f, dmg + closing * .006, tip.x, tip.y, 'ram', 260); }
    }
  }
}

function drive(s: Fight, f: Fighter, foe: Fighter, input: Input, dt: number) {
  f.boostCd = Math.max(0, f.boostCd - dt); f.boost = Math.max(0, f.boost - dt);
  f.powerCd = Math.max(0, f.powerCd - dt); f.power = Math.max(0, f.power - dt);
  f.safe = Math.max(0, f.safe - dt); f.flash = Math.max(0, f.flash - dt); f.stun = Math.max(0, f.stun - dt);
  f.fitted.forEach(a => { if (a.part.kind === 'repair' && alive(f)) f.hp = Math.min(f.maxHp, f.hp + 1.6 * dt); });

  const grip = f.stats.grip, top = f.stats.speed * (f.boost > 0 ? 2 : 1);
  const free = alive(f) && f.stun <= 0 && f.air <= 0 && f.held <= 0 && !s.over;
  if (free) {
    const size = Math.min(1, Math.hypot(input.x, input.y));
    if (input.hit) {
      if (s.assist && f.side === 0) { // a small hand on the wheel: the nearest weapon swings round to a rival he's nearly aimed at
        const to = Math.atan2(foe.y - f.y, foe.x - f.x), near = dist(f.x, f.y, foe.x, foe.y) < 240;
        const best = f.fitted.filter(a => a.part.dmg > 0).map(a => angleTo(f.a + MOUNT_ANGLE[a.mount], to)).sort((p, q) => Math.abs(p) - Math.abs(q))[0];
        if (near && best !== undefined && Math.abs(best) < .9) f.a += best;
      }
      const any = f.fitted.map(a => fire(s, f, foe, a)).some(Boolean);
      if (!any && f.powerCd <= 0 && f.fitted.some(a => ['saw', 'spin', 'lance', 'bumper'].includes(a.part.kind))) { f.power = 1.3; f.powerCd = 3.5; s.events.push({ t: 'swing', x: f.x, y: f.y, kind: 'spin' }); }
    }
    if (input.boost && f.boostCd <= 0) { f.boost = .42; f.boostCd = 2.6; s.events.push({ t: 'boost', on: f.side }); }
    if (size > .12) {
      const want = Math.atan2(input.y, input.x), d = angleTo(f.a, want), turn = f.stats.turn * dt;
      f.a += Math.max(-turn, Math.min(turn, d));
      const thrust = top * size * Math.max(0, Math.cos(Math.min(Math.PI / 2, Math.abs(d) * 1.1))) * 6 * dt;
      f.vx += Math.cos(f.a) * thrust; f.vy += Math.sin(f.a) * thrust;
    } else if (f.boost > 0) { f.vx += Math.cos(f.a) * top * 6 * dt; f.vy += Math.sin(f.a) * top * 6 * dt; }
  }
  // Drag keeps top speed where the stat says, and grip scrubs off sliding sideways, so better tyres corner harder and shove harder.
  const fx = Math.cos(f.a), fy = Math.sin(f.a), along = f.vx * fx + f.vy * fy, sx = f.vx - fx * along, sy = f.vy - fy * along;
  const dragF = Math.exp(-6 * dt), dragS = f.air > 0 ? 1 : Math.exp(-6 * grip * dt);
  f.vx = fx * along * dragF + sx * dragS; f.vy = fy * along * dragF + sy * dragS;
  f.x += f.vx * dt; f.y += f.vy * dt;
  f.drove += Math.hypot(f.vx, f.vy) * dt;

  if (f.air > 0) {
    f.air -= dt; f.a += f.airSpin * 7 * dt;
    if (f.air <= 0) { f.air = 0; f.stun = Math.max(f.stun, .4); s.events.push({ t: 'land', x: f.x, y: f.y }); hurt(s, f, null, 4, f.x, f.y, 'wall', 0); }
  }
  // the walls
  const r = f.stats.radius, lo = WALL + r, hi = ARENA - WALL - r;
  const hitWall = (speed: number, x: number, y: number) => {
    if (s.arena.spikes && speed > 150) hurt(s, f, null, 8, x, y, 'wall', 330);
    else if (speed > 380) hurt(s, f, null, 5, x, y, 'wall', 0);
  };
  if (f.x < lo) { f.x = lo; const v = -f.vx; f.vx = Math.abs(f.vx) * .5; hitWall(v, WALL, f.y); }
  if (f.x > hi) { f.x = hi; const v = f.vx; f.vx = -Math.abs(f.vx) * .5; hitWall(v, ARENA - WALL, f.y); }
  if (f.y < lo) { f.y = lo; const v = -f.vy; f.vy = Math.abs(f.vy) * .5; hitWall(v, f.x, WALL); }
  if (f.y > hi) { f.y = hi; const v = f.vy; f.vy = -Math.abs(f.vy) * .5; hitWall(v, f.x, ARENA - WALL); }
}

/** Steering for "go where I touched": flat out, easing off over the last stretch so it stops rather than circling the spot, and null once it's
 *  there. A spot in the wall counts as the nearest place the robot fits, so a finger on the edge can't grind it into the spikes. */
export function headFor(f: Fighter, x: number, y: number): { x: number; y: number } | null {
  const lo = WALL + f.stats.radius, hi = ARENA - lo;
  const dx = Math.max(lo, Math.min(hi, x)) - f.x, dy = Math.max(lo, Math.min(hi, y)) - f.y, d = Math.hypot(dx, dy);
  if (d < SPOT_REACHED) return null;
  const k = Math.min(1, d / SPOT_EASE);
  return { x: (dx / d) * k, y: (dy / d) * k };
}

function clash(s: Fight, a: Fighter, b: Fighter) {
  if (a.air > 0 || b.air > 0) return;
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, gap = a.stats.radius + b.stats.radius - d;
  if (gap <= 0) return;
  const nx = dx / d, ny = dy / d, ma = massOf(a) * a.stats.grip, mb = massOf(b) * b.stats.grip, total = ma + mb;
  a.x -= nx * gap * mb / total; a.y -= ny * gap * mb / total;
  b.x += nx * gap * ma / total; b.y += ny * gap * ma / total;
  const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (closing <= 0) return;
  const j = closing * 1.35;
  a.vx -= nx * j * mb / total; a.vy -= ny * j * mb / total;
  b.vx += nx * j * ma / total; b.vy += ny * j * ma / total;
  if (a.boost > 0 && closing > 180) hurt(s, b, a, 4 + massOf(a) * .3, a.x + nx * a.stats.radius, a.y + ny * a.stats.radius, 'ram', 200);
  if (b.boost > 0 && closing > 180) hurt(s, a, b, 4 + massOf(b) * .3, b.x - nx * b.stats.radius, b.y - ny * b.stats.radius, 'ram', 200);
}

function hazards(s: Fight, dt: number) {
  s.hazardCd = [Math.max(0, s.hazardCd[0] - dt), Math.max(0, s.hazardCd[1] - dt)];
  for (const f of s.bots) {
    if (f.air > 0 || f.safe > 0 || !alive(f)) continue;
    for (const h of s.arena.hazards) {
      if (h.kind === 'pit') {
        if (!f.hoverOver && dist(f.x, f.y, h.x, h.y) < h.r - f.stats.radius * .25) {
          s.events.push({ t: 'pit', on: f.side });
          hurt(s, f, null, Math.ceil(f.maxHp * .3), f.x, f.y, 'hazard', 0);
          if (alive(f)) { // back in from the corner furthest from the other robot, safe for a moment
            const other = s.bots[f.side ? 0 : 1], c = [[140, 140], [860, 140], [140, 860], [860, 860]].sort((p, q) => dist(q[0]!, q[1]!, other.x, other.y) - dist(p[0]!, p[1]!, other.x, other.y))[0]!;
            f.x = c[0]!; f.y = c[1]!; f.vx = f.vy = 0; f.safe = 1.6; f.held = 0;
          }
        }
        continue;
      }
      if (s.hazardCd[f.side] > 0) continue;
      if (h.kind === 'saw') {
        const p = sawAt(h, s.t);
        if (dist(f.x, f.y, p.x, p.y) < h.r + f.stats.radius) { s.hazardCd[f.side] = .5; hurt(s, f, null, 7, p.x, p.y, 'hazard', 300); }
      } else if (ventState(h, s.t) === 'on' && dist(f.x, f.y, h.x, h.y) < h.r + f.stats.radius * .5) { s.hazardCd[f.side] = .4; hurt(s, f, null, 5, h.x, h.y, 'hazard', 0); }
    }
  }
}

function pickups(s: Fight, dt: number) {
  const you = s.bots[0];
  if (s.t >= s.nextBolt && s.pickups.filter(p => p.kind === 'bolt').length < 3 && s.bolts < 8) {
    s.nextBolt = s.t + 5 + s.rng() * 3;
    s.pickups.push({ kind: 'bolt', x: at(150) + s.rng() * at(700), y: at(150) + s.rng() * at(700), born: s.t });
    const p = s.pickups.at(-1)!, pit = s.arena.hazards.find(h => h.kind === 'pit');
    if (pit && dist(p.x, p.y, pit.x, pit.y) < pit.r + 60) { p.x = at(150); }
  }
  if (!s.crateUsed && you.hp < you.maxHp * .4 && !s.pickups.some(p => p.kind === 'crate')) {
    s.crateUsed = true;
    s.pickups.push({ kind: 'crate', x: you.x < ARENA / 2 ? at(770) : at(230), y: you.y < ARENA / 2 ? at(770) : at(230), born: s.t });
  }
  const reach = you.stats.radius + (you.fitted.some(a => a.part.kind === 'magnet') ? 130 : 22);
  s.pickups = s.pickups.filter(p => {
    if (you.fitted.some(a => a.part.kind === 'magnet') && p.kind === 'bolt' && dist(p.x, p.y, you.x, you.y) < 280) { const d = dist(p.x, p.y, you.x, you.y) || 1; p.x += (you.x - p.x) / d * 260 * dt; p.y += (you.y - p.y) / d * 260 * dt; }
    if (dist(p.x, p.y, you.x, you.y) > reach || !alive(you)) return true;
    if (p.kind === 'bolt') { s.bolts++; s.events.push({ t: 'bolt', x: p.x, y: p.y }); }
    else { you.hp = Math.min(you.maxHp, you.hp + you.maxHp * .3); s.events.push({ t: 'heal', x: you.x, y: you.y }); }
    return false;
  });
}

/** One STEP. `events` builds up until the caller clears it. */
export function stepFight(s: Fight, inputs: [Input, Input]) {
  if (s.freeze > 0) { s.freeze -= STEP; return; }
  const [a, b] = s.bots, dt = STEP;
  s.t += dt;
  if (s.over) s.overFor += dt;
  for (const f of s.bots) {
    if (f.held > 0) { // a claw has it: it goes where the claw goes, then gets thrown
      const other = s.bots[f.side ? 0 : 1], claw = other.fitted.find(x => x.part.kind === 'claw');
      f.held -= dt;
      if (claw && alive(other)) {
        const tip = tipOf(other, claw), ang = other.a + MOUNT_ANGLE[claw.mount];
        f.x = tip.x + Math.cos(ang) * f.stats.radius * .7; f.y = tip.y + Math.sin(ang) * f.stats.radius * .7;
        f.vx = other.vx; f.vy = other.vy;
        if (f.held <= 0) { f.vx += Math.cos(ang) * 520; f.vy += Math.sin(ang) * 520; }
      } else f.held = 0;
    }
  }
  drive(s, a, b, inputs[0], dt); drive(s, b, a, inputs[1], dt);
  clash(s, a, b);
  touchWeapons(s, a, b, dt); touchWeapons(s, b, a, dt);
  hazards(s, dt);
  pickups(s, dt);
  if (!s.over && s.t >= FIGHT_SECONDS) s.over = { winner: a.hp / a.maxHp >= b.hp / b.maxHp ? 0 : 1, ko: false };
}
export const finished = (s: Fight) => !!s.over && s.overFor >= OVER_FOR;

/** Stars for a win: one for winning, two with half his health left, three with most of it. */
export const starsFor = (s: Fight) => {
  if (!s.over || s.over.winner !== 0) return 0;
  const left = s.bots[0].hp / s.bots[0].maxHp;
  return !s.over.ko ? 1 : left >= .7 ? 3 : left >= .35 ? 2 : 1;
};
