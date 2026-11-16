// The demolition, seen from the side, as a little simulation (drawn by draw.ts). The old building is a stack of bricks in columns; a
// brick knocked loose tumbles with simple hand-rolled falling (gravity, a bounce, a slide to rest on the rubble), and every brick above
// it in its column falls too. No physics library, and never more than MAX_BRICKS bricks, for the iPad 9.
//
// His machine does one of six things, and none can go wrong:
//   swing   a wrecking ball on a rope. Drag it back and let go; a tap swings it for him.
//   push    a blade. Hold (the arrow, or anywhere on the picture) to drive into the building; it rams, bounces back and rams again.
//   bite    a bucket on an arm. Tap the building: the machine drives close enough and bites there.
//   hammer  a jackhammer. It drives up to the building by itself; every tap (or holding the 🔨) is one hit on the bottom brick of the
//           nearest column, and a few hits crack it out, so the column above comes down.
//   blast   dynamite. Tap the building to stick up to three sticks on it, then press the plunger: they go off together. The plunger
//           with no sticks on puts them on for him.
//   magnet  a magnet on a crane's cable. Tap a column: the magnet goes over, down onto its top, lifts the top bricks off and drops
//           them in a pile beside the building.
// Every hit knocks at least one brick loose. Once only a few bricks still stand, the rest crumble on their own, so he never has to hunt
// for the last one. Three Bolts hide in the bricks; all three come out by the end. Some old buildings also hide a treasure chest.
//
// World units: y grows downward; the ground is at GROUND_Y.
import { MACHINE_W, RIGS } from '../art/machines';
import type { MachineId, Tier, WreckAction } from '../yard/shop';

export const VIEW_H = 640, GROUND_Y = 540, WORLD_W = 1300;
export const BW = 44, BH = 22, MAX_BRICKS = 72;
export const GRAVITY = 1900;
/** The machine is drawn at this scale on the Job's canvas. */
export const M_SCALE = 1.25;
export const BUILDING_X = 640;
export const BOLTS_HIDDEN = 3;

/** The old buildings for each material, as column heights in bricks. */
export const OLD_SHAPES: Record<Tier, readonly (readonly number[])[]> = {
  1: [[3, 4, 5, 4, 3], [4, 5, 5, 4], [3, 3, 4, 4, 3, 3], [2, 4, 4, 4, 2], [3, 6, 3, 6, 3], [4, 3, 2, 2, 3, 4]],
  2: [[4, 5, 6, 7, 6, 5, 4], [5, 5, 6, 6, 5, 5], [6, 6, 4, 6, 6], [4, 6, 4, 6, 4, 6], [7, 5, 5, 5, 7], [2, 4, 6, 8, 6, 4]],
  3: [[7, 8, 9, 9, 8, 7], [9, 9, 6, 9, 9], [6, 7, 8, 9, 8, 7, 6], [8, 8, 8, 8, 8, 8], [5, 9, 5, 9, 5, 9], [10, 8, 6, 6, 8, 10]],
  4: [[10, 11, 12, 12, 11, 10], [12, 12, 10, 12, 12], [9, 11, 12, 11, 9, 8], [6, 9, 12, 12, 9, 6], [12, 6, 12, 6, 12, 6], [8, 10, 12, 14, 12, 10]],
};

export type BrickState = 'stand' | 'fall' | 'rest' | 'lift';
export interface Brick { col: number; row: number; x: number; y: number; vx: number; vy: number; a: number; va: number; state: BrickState; bolt: boolean; found: boolean; chest?: boolean }
export type WreckEvent = 'hit' | 'crash' | 'bolt' | 'bump' | 'crumble' | 'done' | 'swing' | 'treasure' | 'chip' | 'stick' | 'full' | 'fuse' | 'boom' | 'clang' | 'drop';

export interface Ball { theta: number; omega: number; held: boolean; len: number; r: number }
export interface Arm { x: number; y: number; tx: number; ty: number; t: number; biting: boolean; queued: { x: number; y: number } | null }
/** The jackhammer: how far the bottom brick in front is cracked (0 to `need`), and the hammer's shake. */
export interface Hammer { cracks: number; need: number; shake: number; cool: number }
/** The dynamite: the sticks on the building (each on a brick), and the fuse burning (seconds left; 0 when none is lit). */
export interface Blast { sticks: Brick[]; max: number; fuse: number; booms: { x: number; y: number }[] }
/** The magnet: where it is, what it's doing, the column it's going for, and the bricks stuck to it. */
export interface Magnet { x: number; y: number; w: number; state: 'rest' | 'over' | 'down' | 'up' | 'away'; col: number; carried: { b: Brick; dx: number; dy: number }[]; queued: number | null; dropX: number }

export interface Wreck {
  t: number;
  machine: MachineId;
  action: WreckAction;
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
  hammer: Hammer;
  blast: Blast;
  magnet: Magnet;
  /** Whether a treasure chest is in the bricks, and whether it has come out. */
  treasure: boolean;
  chestFound: boolean;
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

/** The old building: tier `tier`, shape number `shape` (any number; it wraps). Three bricks low down hold a Bolt each, and (`treasure`)
 *  one in the middle a treasure chest. */
export function createWreck(tier: Tier, shape: number, machine: MachineId, opts: { power: number; size: number; speed: number; ball?: { len: number; r: number }; magnet?: number; treasure?: boolean }): Wreck {
  const shapes = OLD_SHAPES[tier], cols = shapes[((shape % shapes.length) + shapes.length) % shapes.length]!, bricks: Brick[] = [];
  cols.forEach((h, col) => { for (let row = 0; row < h && bricks.length < MAX_BRICKS; row++) bricks.push({ col, row, x: BUILDING_X + col * BW + BW / 2, y: GROUND_Y - row * BH - BH / 2, vx: 0, vy: 0, a: 0, va: 0, state: 'stand', bolt: false, found: false }); });
  // the Bolts: in three different columns, in the lower half
  const picks = [0, Math.floor(cols.length / 2), cols.length - 1];
  for (const col of picks) { const b = bricks.find(x => x.col === col && x.row === Math.min(2, cols[col]! - 1) && !x.bolt); if (b) b.bolt = true; }
  if (opts.treasure) {
    const mid = Math.floor(cols.length / 2), b = bricks.find(x => x.col === mid && x.row === Math.min(1, cols[mid]! - 1) && !x.bolt) ?? bricks.find(x => !x.bolt);
    if (b) b.chest = true;
  }
  const rig = rigOf(machine), action: WreckAction = rig.kind === 'swing' || rig.kind === 'push' || rig.kind === 'bite' || rig.kind === 'hammer' || rig.kind === 'blast' || rig.kind === 'magnet' ? rig.kind : 'push';
  const size = opts.size + Math.max(0, opts.power - tier) * .4;
  const ball = { theta: 0, omega: 0, held: false, len: (opts.ball?.len ?? 116) * M_SCALE, r: (opts.ball?.r ?? 17) * M_SCALE };
  const mx = action === 'swing' ? 300 : action === 'magnet' ? 180 : action === 'blast' ? 40 : 120;
  const w: Wreck = {
    t: 0, machine, action, mx, vx: 0, size, speed: opts.speed, bricks, total: bricks.length, ball,
    arm: { x: 0, y: 0, tx: 0, ty: 0, t: 1, biting: false, queued: null },
    hammer: { cracks: 0, need: Math.max(2, 4 - Math.max(0, opts.power - tier)), shake: 0, cool: 0 },
    blast: { sticks: [], max: 3, fuse: 0, booms: [] },
    magnet: { x: 0, y: 0, w: (opts.magnet ?? 48) * M_SCALE, state: 'rest', col: -1, carried: [], queued: null, dropX: 0 },
    treasure: !!opts.treasure && bricks.some(b => b.chest), chestFound: false,
    bolts: 0, crumbled: false, done: false, settle: 0, idle: 0, events: [],
  };
  const rest = magnetRest(w);
  w.magnet.x = rest.x; w.magnet.y = rest.y;
  return w;
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
/** Where the jackhammer's bit hits. */
export function hammerTip(w: Pick<Wreck, 'mx' | 'machine'>) {
  const rig = rigOf(w.machine) as { tip?: { x: number; y: number } };
  const tip = rig.tip ?? { x: 214, y: 150 };
  return { x: w.mx + tip.x * M_SCALE, y: GROUND_Y - (150 - tip.y) * M_SCALE };
}
/** Where the magnet hangs between lifts: under the end of the crane's boom. */
export function magnetRest(w: Pick<Wreck, 'mx' | 'machine'>) {
  const t = tipOf(w);
  return { x: t.x, y: t.y + 90 * M_SCALE };
}

// ---------- knocking bricks loose ----------

function loosen(w: Wreck, b: Brick, from: { x: number; y: number }, power: number) {
  if (b.state !== 'stand') return;
  const dx = b.x - from.x, dy = b.y - from.y, d = Math.max(1, Math.hypot(dx, dy));
  b.state = 'fall';
  b.vx = (dx / d) * 260 * power + (Math.random() - .3) * 120;
  b.vy = Math.min(-80, (dy / d) * 200 * power) - 120 * power;
  b.va = (Math.random() - .5) * 10;
  release(w, b);
}
/** A brick that has come loose gives up what it hid: a Bolt, or the treasure chest. */
function release(w: Wreck, b: Brick) {
  if (b.bolt && !b.found) { b.found = true; w.bolts++; w.events.push('bolt'); }
  if (b.chest && !w.chestFound) { w.chestFound = true; w.events.push('treasure'); }
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
      if (broken) { b.state = 'fall'; b.vx = (Math.random() - .5) * 90 + 30; b.vy = -Math.random() * 60; b.va = (Math.random() - .5) * 4; release(w, b); }
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
  /** bite: where he tapped. swing: a tap swings the ball for him. hammer: one hit. blast: a stick goes on there. magnet: that column. */
  tap?: { x: number; y: number } | null;
  /** hammer: the 🔨 is held down (it hits by itself). */
  hammering?: boolean;
  /** blast: the plunger is pressed. */
  fire?: boolean;
}

const MIN_X = 20;
export function stepWreck(w: Wreck, dt: number, input: Input = {}) {
  w.events = [];
  w.t += dt;
  const acted = !!(input.hold || input.drive || input.tap || input.hammering || input.fire);
  w.idle = acted ? 0 : w.idle + dt;
  if (!w.crumbled) {
    if (w.action === 'swing') stepSwing(w, dt, input);
    else if (w.action === 'push') stepPush(w, dt, input);
    else if (w.action === 'hammer') stepHammer(w, dt, input);
    else if (w.action === 'blast') stepBlast(w, dt, input);
    else if (w.action === 'magnet') stepMagnet(w, dt, input);
    else stepBite(w, dt, input);
  }
  if (w.action === 'magnet') carry(w, dt);
  // the last few crumble on their own
  const left = standing(w).length;
  if (!w.crumbled && left <= Math.max(2, Math.round(w.total * .12))) {
    w.crumbled = true;
    for (const b of standing(w)) loosen(w, b, { x: b.x - 30, y: GROUND_Y + 40 }, .4);
    // anything on the magnet drops where it is
    for (const c of w.magnet.carried) { c.b.state = 'fall'; c.b.vx = 0; c.b.vy = 0; }
    w.magnet.carried = [];
    w.magnet.state = 'rest';
    w.events.push('crumble');
  }
  if (w.crumbled && w.action === 'magnet') stepMagnet(w, dt, {});
  stepBricks(w, dt);
  if (w.crumbled && !w.done) {
    w.settle += dt;
    if (w.settle > 3 || (w.settle > .6 && w.bricks.every(b => b.state === 'rest'))) {
      for (const b of w.bricks) release(w, b);
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

function stepHammer(w: Wreck, dt: number, input: Input) {
  const h = w.hammer, front = frontOfBuilding(w), offset = hammerTip(w).x - w.mx;
  // it drives up by itself until the bit is at the front of what's left
  const goal = Math.max(MIN_X, front - offset - 4);
  w.mx += Math.max(-260 * dt, Math.min(170 * w.speed * dt, goal - w.mx));
  h.shake = Math.max(0, h.shake - dt * 6);
  h.cool = Math.max(0, h.cool - dt);
  const hit = !!input.tap || (input.hammering && h.cool <= 0);
  if (!hit) return;
  h.cool = .17 / w.speed;
  h.shake = 1;
  // every hit cracks the bottom brick in front a bit more, more with bigger hits; when it's cracked through it comes out, and the
  // column above it comes down
  h.cracks += w.size;
  w.events.push('chip');
  if (h.cracks < h.need) return;
  h.cracks = 0;
  const stand = standing(w), col = Math.min(...stand.map(b => b.col)), bottom = stand.filter(b => b.col === col).sort((a, b) => a.row - b.row)[0];
  if (!bottom) return;
  loosen(w, bottom, { x: bottom.x - BW, y: bottom.y + BH }, .7);
  collapse(w);
  w.events.push('crash');
}

/** Where to put the sticks when he presses the plunger with none on: low in the front, the middle and the back. */
function autoSticks(w: Wreck) {
  const stand = standing(w), cols = [...new Set(stand.map(b => b.col))].sort((a, b) => a - b);
  const picks = [cols[0], cols[Math.floor(cols.length / 2)], cols.at(-1)].filter((c, i, a) => c !== undefined && a.indexOf(c) === i) as number[];
  return picks.slice(0, w.blast.max).map(c => stand.filter(b => b.col === c).sort((a, b) => a.row - b.row)[Math.min(1, stand.filter(b => b.col === c).length - 1)]!);
}
function stepBlast(w: Wreck, dt: number, input: Input) {
  const bl = w.blast;
  if (bl.fuse > 0) {
    bl.fuse -= dt;
    if (bl.fuse <= 0) {
      bl.fuse = 0;
      const sticks = bl.sticks;
      bl.sticks = [];
      bl.booms = sticks.map(s => ({ x: s.x, y: s.y }));
      for (const s of sticks) knock(w, { x: s.x, y: s.y }, BW * 1.5 * w.size, 1.5);
      w.events.push('boom');
    }
    return;
  }
  // a stick goes on the brick nearest his tap; a brick that already has one, or a fourth, does nothing
  if (input.tap) {
    const stand = standing(w), t = input.tap;
    if (stand.length) {
      const b = stand.reduce((a, c) => (Math.hypot(c.x - t.x, c.y - t.y) < Math.hypot(a.x - t.x, a.y - t.y) ? c : a));
      if (bl.sticks.length >= bl.max) w.events.push('full');
      else if (!bl.sticks.includes(b)) { bl.sticks.push(b); w.events.push('stick'); }
    }
  }
  if (input.fire) {
    if (!bl.sticks.length) bl.sticks = autoSticks(w);
    bl.fuse = .9 / w.speed;
    w.events.push('fuse');
  }
}

function stepMagnet(w: Wreck, dt: number, input: Input) {
  const mg = w.magnet, rest = magnetRest(w), top = rest.y - 40, speed = w.speed;
  const columnTop = (col: number) => { const c = standing(w).filter(b => b.col === col); return c.length ? Math.min(...c.map(b => b.y)) - BH / 2 : null; };
  const columnX = (col: number) => w.bricks.find(b => b.col === col)!.x;
  if (input.tap) {
    // the column nearest his tap that still has bricks
    const stand = standing(w), t = input.tap;
    if (stand.length) {
      const b = stand.reduce((a, c) => (Math.abs(c.x - t.x) < Math.abs(a.x - t.x) ? c : a));
      if (mg.state === 'rest') { mg.col = b.col; mg.state = 'over'; } else mg.queued = b.col;
    }
  }
  const toward = (x: number, y: number, v: number) => {
    const dx = x - mg.x, dy = y - mg.y, d = Math.hypot(dx, dy), step = v * dt;
    if (d <= step) { mg.x = x; mg.y = y; return true; }
    mg.x += (dx / d) * step; mg.y += (dy / d) * step;
    return false;
  };
  if (mg.state === 'rest') toward(rest.x, rest.y, 300 * speed);
  else if (mg.state === 'over') {
    if (columnTop(mg.col) === null) { mg.state = 'rest'; return; }
    if (toward(columnX(mg.col), Math.min(top, columnTop(mg.col)! - 60), 520 * speed)) mg.state = 'down';
  } else if (mg.state === 'down') {
    const ct = columnTop(mg.col);
    if (ct === null) { mg.state = 'up'; return; }
    if (toward(columnX(mg.col), ct - 16 * M_SCALE, 520 * speed)) {
      // clang: the top bricks of the column stick to it
      const n = Math.max(2, Math.round(4 + (w.size - 1) * 3));
      const lifted = standing(w).filter(b => b.col === mg.col).sort((a, b) => a.y - b.y).slice(0, n);
      for (const b of lifted) { b.state = 'lift'; mg.carried.push({ b, dx: b.x - mg.x, dy: b.y - mg.y }); release(w, b); }
      mg.dropX = BUILDING_X - 50 - Math.random() * 110;
      mg.state = 'up';
      w.events.push('clang');
    }
  } else if (mg.state === 'up') {
    if (toward(mg.x, top - 40, 420 * speed)) mg.state = mg.carried.length ? 'away' : 'rest';
  } else if (mg.state === 'away') {
    if (toward(mg.dropX, top - 40, 520 * speed)) {
      for (const c of mg.carried) { c.b.state = 'fall'; c.b.vx = (Math.random() - .5) * 60; c.b.vy = 0; c.b.va = (Math.random() - .5) * 3; }
      mg.carried = [];
      w.events.push('drop');
      if (mg.queued !== null && columnTop(mg.queued) !== null) { mg.col = mg.queued; mg.state = 'over'; } else mg.state = 'rest';
      mg.queued = null;
    }
  }
}
/** The bricks on the magnet go where it goes. */
function carry(w: Wreck, _dt: number) {
  for (const c of w.magnet.carried) { c.b.x = w.magnet.x + c.dx; c.b.y = w.magnet.y + c.dy; }
}

/** How much of the building is down, 0 to 1. */
export const progress = (w: Pick<Wreck, 'bricks' | 'total'>) => 1 - standing(w).length / Math.max(1, w.total);
