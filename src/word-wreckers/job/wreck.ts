// The demolition, seen from the side, as a little simulation (drawn by draw.ts). The old building is a stack of bricks in columns; a
// brick knocked loose tumbles with simple hand-rolled falling (gravity, a bounce, a slide to rest on the rubble), and every brick above
// it in its column falls too. No physics library, and never more than MAX_BRICKS bricks, for the iPad 9.
//
// His machine does one of three things, and none can go wrong:
//   swing  a wrecking ball on a rope. Drag it back and let go; a tap swings it for him.
//   push   a blade. Hold (the arrow, or anywhere on the picture) to drive into the building; it rams, bounces back and rams again.
//   bite   a bucket on an arm. Tap the building: the machine drives close enough and bites there.
// Every hit knocks at least one brick loose. Once only a few bricks still stand, the rest crumble on their own, so he never has to hunt
// for the last one. Three Bolts hide in the bricks; all three come out by the end.
//
// World units: y grows downward; the ground is at GROUND_Y.
import { MACHINE_W, RIGS } from '../art/machines';
import type { MachineId, Tier } from '../yard/shop';

export const VIEW_H = 640, GROUND_Y = 540, WORLD_W = 1300;
export const BW = 44, BH = 22, MAX_BRICKS = 72;
export const GRAVITY = 1900;
/** The machine is drawn at this scale on the Job's canvas. */
export const M_SCALE = 1.25;
export const BUILDING_X = 640;
export const BOLTS_HIDDEN = 3;

/** The old buildings for each material, as column heights in bricks. */
export const OLD_SHAPES: Record<Tier, readonly (readonly number[])[]> = {
  1: [[3, 4, 5, 4, 3], [4, 5, 5, 4], [3, 3, 4, 4, 3, 3]],
  2: [[4, 5, 6, 7, 6, 5, 4], [5, 5, 6, 6, 5, 5], [6, 6, 4, 6, 6]],
  3: [[7, 8, 9, 9, 8, 7], [9, 9, 6, 9, 9], [6, 7, 8, 9, 8, 7, 6]],
  4: [[10, 11, 12, 12, 11, 10], [12, 12, 10, 12, 12], [9, 11, 12, 11, 9, 8]],
};

export type BrickState = 'stand' | 'fall' | 'rest';
export interface Brick { col: number; row: number; x: number; y: number; vx: number; vy: number; a: number; va: number; state: BrickState; bolt: boolean; found: boolean }
export type WreckEvent = 'hit' | 'crash' | 'bolt' | 'bump' | 'crumble' | 'done' | 'swing';

export interface Ball { theta: number; omega: number; held: boolean; len: number; r: number }
export interface Arm { x: number; y: number; tx: number; ty: number; t: number; biting: boolean; queued: { x: number; y: number } | null }

export interface Wreck {
  t: number;
  machine: MachineId;
  action: 'swing' | 'push' | 'bite';
  /** The machine's left edge, and its speed. */
  mx: number;
  vx: number;
  /** How big a hit is (1 and up) and how fast it drives. */
  size: number;
  speed: number;
  bricks: Brick[];
  total: number;
  ball: Ball;
  arm: Arm;
  /** Bolts found so far. */
  bolts: number;
  crumbled: boolean;
  done: boolean;
  /** Seconds since the building came down, for the rubble to settle. */
  settle: number;
  /** Seconds since he last did anything, for a hint. */
  idle: number;
  events: WreckEvent[];
}

const rigOf = (m: MachineId) => RIGS[m];

/** The old building: tier `tier`, shape number `shape` (any number; it wraps). Three bricks low down hold a Bolt each. */
export function createWreck(tier: Tier, shape: number, machine: MachineId, opts: { power: number; size: number; speed: number; ball?: { len: number; r: number } }): Wreck {
  const shapes = OLD_SHAPES[tier], cols = shapes[((shape % shapes.length) + shapes.length) % shapes.length]!, bricks: Brick[] = [];
  cols.forEach((h, col) => { for (let row = 0; row < h && bricks.length < MAX_BRICKS; row++) bricks.push({ col, row, x: BUILDING_X + col * BW + BW / 2, y: GROUND_Y - row * BH - BH / 2, vx: 0, vy: 0, a: 0, va: 0, state: 'stand', bolt: false, found: false }); });
  // the Bolts: in three different columns, in the lower half
  const picks = [0, Math.floor(cols.length / 2), cols.length - 1];
  for (const col of picks) { const b = bricks.find(x => x.col === col && x.row === Math.min(2, cols[col]! - 1) && !x.bolt); if (b) b.bolt = true; }
  const rig = rigOf(machine), action = rig.kind === 'swing' || rig.kind === 'push' || rig.kind === 'bite' ? rig.kind : 'push';
  const size = opts.size + Math.max(0, opts.power - tier) * .4;
  const ball = { theta: 0, omega: 0, held: false, len: (opts.ball?.len ?? 116) * M_SCALE, r: (opts.ball?.r ?? 17) * M_SCALE };
  return {
    t: 0, machine, action, mx: action === 'swing' ? 300 : 120, vx: 0, size, speed: opts.speed, bricks, total: bricks.length, ball,
    arm: { x: 0, y: 0, tx: 0, ty: 0, t: 1, biting: false, queued: null }, bolts: 0, crumbled: false, done: false, settle: 0, idle: 0, events: [],
  };
}

export const standing = (w: Pick<Wreck, 'bricks'>) => w.bricks.filter(b => b.state === 'stand');
const frontOfBuilding = (w: Wreck) => Math.min(...standing(w).map(b => b.x - BW / 2), WORLD_W);

// ---------- where the machine's parts are ----------

/** Where the crane's rope hangs from. */
export function tipOf(w: Pick<Wreck, 'mx' | 'machine'>) {
  const rig = rigOf(w.machine) as { tip?: { x: number; y: number } };
  const tip = rig.tip ?? { x: 206, y: 14 };
  return { x: w.mx + tip.x * M_SCALE, y: GROUND_Y - (150 - tip.y) * M_SCALE };
}
export function ballPos(w: Pick<Wreck, 'mx' | 'machine' | 'ball'>) {
  const t = tipOf(w);
  return { x: t.x + Math.sin(w.ball.theta) * w.ball.len, y: t.y + Math.cos(w.ball.theta) * w.ball.len };
}
export function armBase(w: Pick<Wreck, 'mx' | 'machine'>) {
  const rig = rigOf(w.machine) as { base?: { x: number; y: number } };
  const b = rig.base ?? { x: 118, y: 84 };
  return { x: w.mx + b.x * M_SCALE, y: GROUND_Y - (150 - b.y) * M_SCALE };
}
export const armReach = (w: Pick<Wreck, 'machine' | 'size'>) => ((rigOf(w.machine) as { reach?: number }).reach ?? 150) * M_SCALE * (1 + (w.size - 1) * .15);
export const bladeFront = (w: Pick<Wreck, 'mx' | 'machine'>) => w.mx + ((rigOf(w.machine) as { front?: number }).front ?? 220) * M_SCALE;
export const machineFront = (w: Pick<Wreck, 'mx'>) => w.mx + MACHINE_W * M_SCALE * .92;

// ---------- knocking bricks loose ----------

function loosen(w: Wreck, b: Brick, from: { x: number; y: number }, power: number) {
  if (b.state !== 'stand') return;
  const dx = b.x - from.x, dy = b.y - from.y, d = Math.max(1, Math.hypot(dx, dy));
  b.state = 'fall';
  b.vx = (dx / d) * 260 * power + (Math.random() - .3) * 120;
  b.vy = Math.min(-80, (dy / d) * 200 * power) - 120 * power;
  b.va = (Math.random() - .5) * 10;
  if (b.bolt && !b.found) { b.found = true; w.bolts++; w.events.push('bolt'); }
}

/** Knocks loose every standing brick within `radius` of the point, and at least the nearest one. True if any came loose. */
export function knock(w: Wreck, at: { x: number; y: number }, radius: number, power = 1): boolean {
  const stand = standing(w);
  if (!stand.length) return false;
  let hit = stand.filter(b => Math.hypot(b.x - at.x, b.y - at.y) <= radius);
  if (!hit.length) hit = [stand.reduce((a, b) => (Math.hypot(b.x - at.x, b.y - at.y) < Math.hypot(a.x - at.x, a.y - at.y) ? b : a))];
  for (const b of hit) loosen(w, b, at, power);
  collapse(w);
  w.events.push(hit.length >= 4 ? 'crash' : 'hit');
  return true;
}

/** A brick with nothing under it in its column falls, and so does everything above it. */
function collapse(w: Wreck) {
  const cols = new Map<number, Brick[]>();
  for (const b of w.bricks) { const c = cols.get(b.col) ?? []; c.push(b); cols.set(b.col, c); }
  for (const col of cols.values()) {
    col.sort((a, b) => a.row - b.row);
    let broken = false;
    for (const b of col) {
      if (b.state !== 'stand') { broken = true; continue; }
      if (broken) { b.state = 'fall'; b.vx = (Math.random() - .5) * 90 + 30; b.vy = -Math.random() * 60; b.va = (Math.random() - .5) * 4; if (b.bolt && !b.found) { b.found = true; w.bolts++; w.events.push('bolt'); } }
    }
  }
}

// ---------- the rubble ----------

const BUCKET = 22, BUCKETS = Math.ceil(WORLD_W / BUCKET);
/** How high the resting rubble is at each place along the ground. */
function rubble(w: Wreck): Float32Array {
  const h = new Float32Array(BUCKETS);
  for (const b of w.bricks) {
    if (b.state !== 'rest') continue;
    const top = GROUND_Y - (b.y - BH / 2);
    for (let i = Math.max(0, Math.floor((b.x - BW / 2) / BUCKET)); i <= Math.min(BUCKETS - 1, Math.floor((b.x + BW / 2) / BUCKET)); i++) h[i] = Math.max(h[i]!, top);
  }
  return h;
}
const heightAt = (h: Float32Array, x: number) => h[Math.max(0, Math.min(BUCKETS - 1, Math.floor(x / BUCKET)))]!;

// ---------- one step ----------

export interface Input {
  /** swing: where he's holding the ball (null: let go). */
  hold?: { x: number; y: number } | null;
  /** push: driving forward or back (-1, 0, 1). bite and swing can drive too. */
  drive?: -1 | 0 | 1;
  /** bite: where he tapped. swing: a tap swings the ball for him. */
  tap?: { x: number; y: number } | null;
}

const MIN_X = 20;
export function stepWreck(w: Wreck, dt: number, input: Input = {}) {
  w.events = [];
  w.t += dt;
  const acted = !!(input.hold || input.drive || input.tap);
  w.idle = acted ? 0 : w.idle + dt;
  if (!w.crumbled) {
    if (w.action === 'swing') stepSwing(w, dt, input);
    else if (w.action === 'push') stepPush(w, dt, input);
    else stepBite(w, dt, input);
  }
  // the last few crumble on their own
  const left = standing(w).length;
  if (!w.crumbled && left <= Math.max(2, Math.round(w.total * .12))) {
    w.crumbled = true;
    for (const b of standing(w)) loosen(w, b, { x: b.x - 30, y: GROUND_Y + 40 }, .4);
    w.events.push('crumble');
  }
  stepBricks(w, dt);
  if (w.crumbled && !w.done) {
    w.settle += dt;
    if (w.settle > 3 || (w.settle > .6 && w.bricks.every(b => b.state === 'rest'))) {
      for (const b of w.bricks) if (b.bolt && !b.found) { b.found = true; w.bolts++; w.events.push('bolt'); }
      w.done = true;
      w.events.push('done');
    }
  }
}

function stepBricks(w: Wreck, dt: number) {
  const h = rubble(w);
  for (const b of w.bricks) {
    if (b.state !== 'fall') continue;
    b.vy += GRAVITY * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.a += b.va * dt;
    if (b.x < BW / 2) { b.x = BW / 2; b.vx = Math.abs(b.vx) * .4; }
    if (b.x > WORLD_W - BW / 2) { b.x = WORLD_W - BW / 2; b.vx = -Math.abs(b.vx) * .4; }
    const floor = GROUND_Y - Math.min(BH * 5, heightAt(h, b.x));
    if (b.y + BH / 2 >= floor && b.vy > 0) {
      b.y = floor - BH / 2;
      if (b.vy > 420) { b.vy *= -.28; b.vx *= .55; b.va *= .5; }
      else { b.state = 'rest'; b.vx = 0; b.vy = 0; b.va = 0; b.a = Math.round(b.a / (Math.PI / 2)) * (Math.PI / 2) * .1; }
    }
  }
}

function stepSwing(w: Wreck, dt: number, input: Input) {
  const ball = w.ball, front = frontOfBuilding(w), offset = tipOf(w).x - w.mx;
  // never so close that the ball hanging still touches the building
  const closest = front - ball.r - 14 - offset;
  if (input.drive) w.mx = Math.max(MIN_X, Math.min(closest, w.mx + input.drive * 170 * w.speed * dt));
  // between swings the crane creeps up on its own until the ball hangs just short of what's left, so even a little pull reaches it
  else if (!ball.held && Math.abs(ball.omega) < .6) w.mx = Math.min(closest, w.mx + 140 * dt);
  w.mx = Math.min(w.mx, Math.max(MIN_X, closest));
  const tip = tipOf(w);
  if (input.tap && !input.hold && !ball.held) {
    // a tap swings it for him: pulled back to the left, then let go
    ball.theta = -1.05; ball.omega = 0;
    w.events.push('swing');
  }
  if (input.hold) {
    const dx = input.hold.x - tip.x, dy = Math.max(10, input.hold.y - tip.y);
    ball.theta = Math.max(-1.35, Math.min(.5, Math.atan2(dx, dy)));
    ball.omega = 0;
    ball.held = true;
  } else {
    if (ball.held) w.events.push('swing');
    ball.held = false;
    const g = 1600 / ball.len;
    ball.omega += -g * Math.sin(ball.theta) * dt;
    ball.omega *= 1 - .25 * dt;
    ball.theta += ball.omega * dt;
  }
  // the ball meets the building
  const p = ballPos(w), speed = Math.abs(ball.omega) * ball.len;
  const near = standing(w).filter(b => Math.abs(b.x - p.x) < BW / 2 + ball.r && Math.abs(b.y - p.y) < BH / 2 + ball.r);
  if (near.length && !ball.held) {
    if (ball.omega > 0 && speed > 50) {
      knock(w, { x: p.x + ball.r * .5, y: p.y }, ball.r + BW * .55 * w.size, .6 + Math.min(1.2, speed / 500));
      ball.omega = -Math.abs(ball.omega) * .35;
    } else if (ball.omega > 0) ball.omega = -Math.abs(ball.omega) * .3;
  }
}

function stepPush(w: Wreck, dt: number, input: Input) {
  const want = (input.drive ?? 0) * 210 * w.speed;
  w.vx += (want - w.vx) * Math.min(1, dt * 4);
  if (!input.drive && Math.abs(w.vx) < 4) w.vx = 0;
  w.mx = Math.max(MIN_X, w.mx + w.vx * dt);
  const front = bladeFront(w), wall = frontOfBuilding(w);
  if (front >= wall - 2 && w.vx > 0) {
    // a ram: the bottom of the column it meets comes loose (so the column above falls), and the machine bounces back
    const rows = 1 + Math.round(w.size);
    const hit = standing(w).filter(b => b.x - BW / 2 <= wall + 2 && b.row < rows);
    const at = { x: wall, y: GROUND_Y - BH };
    if (w.vx > 30) knock(w, at, BW * .6 * w.size, .5 + Math.min(1, w.vx / 260));
    else if (hit.length) knock(w, at, 1, .4);
    w.mx -= front - (wall - 2);
    w.vx = -110;
    w.events.push('bump');
  }
  // the blade pushes the rubble along in front of it
  const f2 = bladeFront(w);
  for (const b of w.bricks) if (b.state === 'rest' && b.x - BW / 2 < f2 && b.x > f2 - BW * 1.5) { b.x = Math.min(WORLD_W - BW / 2, f2 + BW / 2); }
}

function stepBite(w: Wreck, dt: number, input: Input) {
  const arm = w.arm;
  if (input.drive) w.mx = Math.max(MIN_X, Math.min(frontOfBuilding(w) - MACHINE_W * M_SCALE * .8, w.mx + input.drive * 170 * w.speed * dt));
  if (input.tap) {
    // a tap near the building snaps to the nearest standing brick, so a clumsy tap still bites something
    const stand = standing(w), t = input.tap;
    const nearest = stand.length ? stand.reduce((a, b) => (Math.hypot(b.x - t.x, b.y - t.y) < Math.hypot(a.x - t.x, a.y - t.y) ? b : a)) : null;
    arm.queued = nearest ? { x: nearest.x, y: nearest.y } : null;
  }
  const base = armBase(w), reach = armReach(w);
  if (arm.queued && !arm.biting) {
    const q = arm.queued, d = Math.hypot(q.x - base.x, q.y - base.y);
    if (d > reach * .95) {
      // drive closer first, but never into the building
      const stop = frontOfBuilding(w) - MACHINE_W * M_SCALE * .8;
      const before = w.mx;
      w.mx = Math.min(stop, w.mx + 200 * w.speed * dt);
      if (w.mx === before) arm.queued = { x: base.x + (q.x - base.x) * (reach * .9) / d, y: base.y + (q.y - base.y) * (reach * .9) / d };
    } else {
      arm.tx = q.x; arm.ty = q.y; arm.t = 0; arm.biting = true; arm.queued = null;
    }
  }
  if (arm.biting) {
    arm.t += dt / .28;
    if (arm.t >= 1) { arm.biting = false; arm.t = 1; knock(w, { x: arm.tx, y: arm.ty }, BW * .7 * w.size + (rigOf(w.machine) as { bucket?: number }).bucket! * .6, .7); }
  }
  // the bucket's place: on its way to the bite, or resting in front
  const restX = base.x + reach * .6, restY = GROUND_Y - 30;
  const goalX = arm.biting ? arm.tx : restX, goalY = arm.biting ? arm.ty : restY;
  arm.x = arm.x ? arm.x + (goalX - arm.x) * Math.min(1, dt * (arm.biting ? 14 : 6)) : restX;
  arm.y = arm.y ? arm.y + (goalY - arm.y) * Math.min(1, dt * (arm.biting ? 14 : 6)) : restY;
}

/** How much of the building is down, 0 to 1. */
export const progress = (w: Pick<Wreck, 'bricks' | 'total'>) => 1 - standing(w).length / Math.max(1, w.total);
