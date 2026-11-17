// A Dig, as a world with no drawing in it, so it can be tested and played by a script. A patch of ground (1000 × 640 world units),
// covered in dirt he rubs away, with rocks on it he taps to crack, and the Dig's bones (one or two), its Bolts and maybe a fossil buried
// underneath. A bone comes loose once most of the dirt over it is gone and no rock sits on it; then he drags it to the crate.
//
// The dirt is a coarse grid of how much is left in each cell (0 to 1), which the screen mirrors by erasing its dirt picture with the same
// stamps, so what he sees cleared is what the game counts. Nothing can go wrong: every stroke clears something, every tap on a rock
// cracks it, a bone let go anywhere stays where it is (or flies to the crate when he was dragging it that way), and if he stops, help
// comes: a hint where to dig after a few seconds, and the dirt over the next bone falls away by itself after a while longer.
import type { Rng } from '../../game/rng';
import type { BoneId } from '../museum/dinos';

export const W = 1000, H = 640, CELL = 20, COLS = W / CELL, ROWS = H / CELL;
/** How much one stamp of a stroke takes off a cell under it. */
export const STAMP = .24;
/** A cell this empty counts as clear. */
export const CLEAR = .3;
/** A bone comes loose when this much of the dirt over it is clear. */
export const LOOSE = .55;
/** Seconds without progress before a hint, and before the dirt over the next bone falls away by itself. */
export const HINT_S = 7, HELP_S = 18;

export type Thing = 'bone' | 'bolt' | 'fossil';
export interface Buried {
  id: number;
  thing: Thing;
  kind: BoneId | null;
  /** Centre and half size, in world units. */
  x: number; y: number; hw: number; hh: number;
  angle: number;
  state: 'buried' | 'loose' | 'held' | 'flying' | 'crated';
  /** Where it is drawn now (it moves once loose). */
  px: number; py: number;
  /** Taps on it while loose (the third sends it to the crate). */
  taps: number;
  /** Flying: seconds into the flight, and where from. */
  fly: number; fx: number; fy: number;
}
export interface Rock { id: number; x: number; y: number; r: number; hp: number; max: number; gone: boolean; shake: number }

export interface DigWorld {
  dirt: Float32Array;
  things: Buried[];
  rocks: Rock[];
  crate: { x: number; y: number; w: number; h: number };
  t: number;
  /** Seconds since the last progress (dirt cleared over something, a rock cracked, a bone moved). */
  idle: number;
  /** Where the hint points, while it shows. */
  hint: { x: number; y: number } | null;
  /** The thing the dirt is falling away from by itself. */
  helping: number | null;
  /** How many strokes (stamps) he has made, for the tour and the tests. */
  stamps: number;
}

export type DigEvent =
  | { kind: 'loose'; thing: Buried }
  | { kind: 'crack'; rock: Rock }
  | { kind: 'smash'; rock: Rock }
  | { kind: 'crated'; thing: Buried }
  | { kind: 'hint'; x: number; y: number }
  | { kind: 'tapLoose'; thing: Buried }
  | { kind: 'stamp'; x: number; y: number; r: number };

/** How many rocks a site has and how many hits each takes: deeper sites have more and harder rock (tier 1 to 6). */
export const rocksFor = (tier: number) => ({ rocks: 1 + Math.ceil(tier / 2), hp: 1 + tier * 2 });

const BONE_SIZE: Partial<Record<BoneId, [number, number]>> = {
  skull: [120, 70], ribs: [110, 100], plates: [120, 80], sail: [130, 90], frill: [110, 90], wings: [140, 80], club: [120, 60],
};

/** A new Dig. `bones`: the kinds to bury (one or two); `rocks`: how many; `hp`: how many hits a rock takes. */
export function createDig(o: { bones: readonly BoneId[]; bolts: number; fossil: boolean; rocks: number; hp: number }, rng: Rng): DigWorld {
  const dirt = new Float32Array(COLS * ROWS).fill(1), things: Buried[] = [], rocks: Rock[] = [];
  const crate = { x: W - 170, y: H - 150, w: 150, h: 130 };
  const fits = (x: number, y: number, hw: number, hh: number) =>
    x - hw > 30 && x + hw < W - 30 && y - hh > 30 && y + hh < H - 30 && !(x + hw > crate.x - 30 && y + hh > crate.y - 30)
    && things.every(t => Math.abs(t.x - x) > t.hw + hw + 24 || Math.abs(t.y - y) > t.hh + hh + 24);
  const place = (thing: Thing, kind: BoneId | null, hw: number, hh: number) => {
    for (let i = 0; i < 400; i++) {
      const x = 60 + rng() * (W - 120), y = 60 + rng() * (H - 120);
      if (!fits(x, y, hw, hh) && i < 399) continue;
      const angle = thing === 'bone' ? (rng() - .5) * .7 : 0;
      things.push({ id: things.length, thing, kind, x, y, hw, hh, angle, state: 'buried', px: x, py: y, taps: 0, fly: 0, fx: 0, fy: 0 });
      return;
    }
  };
  for (const k of o.bones) { const [w, h] = BONE_SIZE[k] ?? [130, 44]; place('bone', k, w / 2, h / 2); }
  if (o.fossil) place('fossil', null, 34, 34);
  for (let i = 0; i < o.bolts; i++) place('bolt', null, 24, 24);
  // rocks: the first ones sit on the bones (so he cracks them to free them), the rest anywhere
  const bones = things.filter(t => t.thing === 'bone');
  for (let i = 0; i < o.rocks; i++) {
    const on = bones[i % Math.max(1, bones.length)];
    const r = 46 + rng() * 22;
    const x = on && i < bones.length ? on.x + (rng() - .5) * on.hw : 80 + rng() * (W - 330), y = on && i < bones.length ? on.y + (rng() - .5) * on.hh : 80 + rng() * (H - 160);
    rocks.push({ id: i, x, y, r, hp: o.hp, max: o.hp, gone: false, shake: 0 });
  }
  return { dirt, things, rocks, crate, t: 0, idle: 0, hint: null, helping: null, stamps: 0 };
}

const at = (cx: number, cy: number) => cy * COLS + cx;
/** The cells under a box. */
function cellsUnder(x: number, y: number, hw: number, hh: number): number[] {
  const out: number[] = [];
  for (let cy = Math.max(0, Math.floor((y - hh) / CELL)); cy <= Math.min(ROWS - 1, Math.floor((y + hh) / CELL)); cy++)
    for (let cx = Math.max(0, Math.floor((x - hw) / CELL)); cx <= Math.min(COLS - 1, Math.floor((x + hw) / CELL)); cx++) out.push(at(cx, cy));
  return out;
}
/** How much of the dirt over a thing is clear, 0 to 1. */
export function uncovered(w: DigWorld, t: Pick<Buried, 'x' | 'y' | 'hw' | 'hh'>): number {
  const cells = cellsUnder(t.x, t.y, t.hw * .8, t.hh * .8);
  return cells.filter(i => w.dirt[i]! < CLEAR).length / Math.max(1, cells.length);
}
/** A rock still on it. */
export const blocked = (w: DigWorld, t: Pick<Buried, 'x' | 'y' | 'hw' | 'hh'>) =>
  w.rocks.some(r => !r.gone && r.x + r.r > t.x - t.hw && r.x - r.r < t.x + t.hw && r.y + r.r > t.y - t.hh && r.y - r.r < t.y + t.hh);
/** Is this point under a standing rock? Dirt under a rock can't be rubbed. */
const underRock = (w: DigWorld, x: number, y: number) => w.rocks.some(r => !r.gone && (r.x - x) ** 2 + (r.y - y) ** 2 < (r.r * .85) ** 2);

/** One stamp of his tool: the cells within r lose some dirt. Returns the stamps made, for the screen to erase the same. */
function stamp(w: DigWorld, x: number, y: number, r: number, k = STAMP): boolean {
  if (underRock(w, x, y)) return false;
  let any = false;
  for (let cy = Math.max(0, Math.floor((y - r) / CELL)); cy <= Math.min(ROWS - 1, Math.floor((y + r) / CELL)); cy++)
    for (let cx = Math.max(0, Math.floor((x - r) / CELL)); cx <= Math.min(COLS - 1, Math.floor((x + r) / CELL)); cx++) {
      const mx = cx * CELL + CELL / 2, my = cy * CELL + CELL / 2, d2 = (mx - x) ** 2 + (my - y) ** 2;
      if (d2 > r * r) continue;
      const i = at(cx, cy), before = w.dirt[i]!;
      w.dirt[i] = before * (1 - k * (1 - d2 / (r * r) * .5));
      if (before >= CLEAR) any = true;
    }
  w.stamps++;
  return any;
}

/** A stroke of his finger from (x0, y0) to (x1, y1): stamps along it, a third of the radius apart. */
export function rub(w: DigWorld, x0: number, y0: number, x1: number, y1: number, r: number): DigEvent[] {
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len / (r / 3))), out: DigEvent[] = [];
  for (let i = 1; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
    if (underRock(w, x, y)) continue;
    // clearing dirt over something still buried is progress: the hint and the help wait
    if (stamp(w, x, y, r) && w.things.some(t => t.state === 'buried' && Math.abs(t.x - x) < t.hw + r && Math.abs(t.y - y) < t.hh + r)) { w.idle = 0; w.hint = null; }
    out.push({ kind: 'stamp', x, y, r });
  }
  return [...out, ...settle(w)];
}

/** Anything now uncovered enough comes loose. */
function settle(w: DigWorld): DigEvent[] {
  const out: DigEvent[] = [];
  for (const t of w.things) {
    if (t.state !== 'buried' || blocked(w, t) || uncovered(w, t) < (t.thing === 'bone' ? LOOSE : .45)) continue;
    t.state = t.thing === 'bone' ? 'loose' : 'flying';
    if (t.thing !== 'bone') { t.fly = 0; t.fx = t.px; t.fy = t.py; }
    w.idle = 0; w.hint = null;
    if (w.helping === t.id) w.helping = null;
    out.push({ kind: 'loose', thing: t });
  }
  return out;
}

/** A tap: on a rock it cracks it (`crack` is how hard his tool hits); on a loose bone it hops (the third tap sends it to the crate). */
export function tap(w: DigWorld, x: number, y: number, crack: number): DigEvent[] {
  const rock = w.rocks.filter(r => !r.gone && (r.x - x) ** 2 + (r.y - y) ** 2 < (r.r + 18) ** 2).sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2))[0];
  if (rock) return hitRock(w, rock, crack);
  const loose = thingAt(w, x, y);
  if (loose && loose.state === 'loose') {
    loose.taps++;
    w.idle = 0;
    if (loose.taps >= 3) { send(loose); return [{ kind: 'tapLoose', thing: loose }]; }
    return [{ kind: 'tapLoose', thing: loose }];
  }
  return [];
}
export function hitRock(w: DigWorld, rock: Rock, crack: number): DigEvent[] {
  rock.hp = Math.max(0, rock.hp - Math.max(1, crack));
  rock.shake = .25;
  w.idle = 0; w.hint = null;
  if (rock.hp > 0) return [{ kind: 'crack', rock }];
  rock.gone = true;
  return [{ kind: 'smash', rock }, ...settle(w)];
}

/** The loose bone under a point (it can be picked up), with a little slack for small fingers. */
export function thingAt(w: DigWorld, x: number, y: number): Buried | null {
  return w.things.find(t => (t.state === 'loose' || t.state === 'held') && Math.abs(t.px - x) < t.hw + 26 && Math.abs(t.py - y) < t.hh + 26) ?? null;
}
export function grab(w: DigWorld, x: number, y: number): Buried | null {
  const t = thingAt(w, x, y);
  if (!t || t.state !== 'loose') return null;
  t.state = 'held';
  w.idle = 0;
  return t;
}
export function drag(w: DigWorld, t: Buried, x: number, y: number) {
  t.px = Math.max(t.hw, Math.min(W - t.hw, x));
  t.py = Math.max(t.hh, Math.min(H - t.hh, y));
  w.idle = 0;
}
const inCrate = (w: DigWorld, x: number, y: number) => x > w.crate.x - 40 && y > w.crate.y - 40;
/** Let go: in or near the crate (or dragged most of the way there), it goes in; anywhere else it stays, loose. */
export function release(w: DigWorld, t: Buried, startX: number, startY: number): DigEvent[] {
  if (t.state !== 'held') return [];
  const towards = Math.hypot(w.crate.x - startX, w.crate.y - startY) - Math.hypot(w.crate.x - t.px, w.crate.y - t.py);
  if (inCrate(w, t.px, t.py) || towards > 160) { send(t); return []; }
  t.state = 'loose';
  return [];
}
function send(t: Buried) { t.state = 'flying'; t.fly = 0; t.fx = t.px; t.fy = t.py; }

const FLY_S = .6;
/** Where the crate takes a thing (bones into the crate; Bolts and fossils up to the top corner, where the counter is). */
export const flyTarget = (w: DigWorld, t: Buried) => (t.thing === 'bone' ? { x: w.crate.x + w.crate.w / 2, y: w.crate.y + w.crate.h * .45 } : { x: W - 60, y: 40 });

export interface Helpers {
  /** The Bone Magnet: loose bones fly to the crate by themselves. */
  magnet?: boolean;
}
/** Time passes: things fly, rocks stop shaking, and help comes if he has stopped. */
export function step(w: DigWorld, dt: number, h: Helpers = {}): DigEvent[] {
  w.t += dt;
  w.idle += dt;
  const out: DigEvent[] = [];
  for (const r of w.rocks) r.shake = Math.max(0, r.shake - dt);
  for (const t of w.things) {
    if (t.state === 'loose' && h.magnet && t.thing === 'bone') send(t);
    if (t.state !== 'flying') continue;
    t.fly += dt;
    const k = Math.min(1, t.fly / FLY_S), e = 1 - (1 - k) ** 2, to = flyTarget(w, t);
    t.px = t.fx + (to.x - t.fx) * e;
    t.py = t.fy + (to.y - t.fy) * e - Math.sin(k * Math.PI) * 80;
    if (k >= 1) { t.state = 'crated'; w.idle = 0; out.push({ kind: 'crated', thing: t }); }
  }
  const next = nextBuried(w);
  if (next && w.idle > HINT_S && !w.hint) { w.hint = { x: next.x, y: next.y }; out.push({ kind: 'hint', x: next.x, y: next.y }); }
  if (next && w.idle > HELP_S) {
    // the dirt falls away by itself, and a rock on it crumbles
    w.helping = next.id;
    for (const r of w.rocks) if (!r.gone && blocked(w, next) && r.x + r.r > next.x - next.hw && r.x - r.r < next.x + next.hw) { r.hp = 0; r.gone = true; out.push({ kind: 'smash', rock: r }); }
    const n = Math.floor(w.t * 60), rnd = (k: number) => { const v = Math.sin((n + k) * 12.9898) * 43758.5453; return v - Math.floor(v); };
    const x = next.x + (rnd(1) - .5) * next.hw * 1.8, y = next.y + (rnd(2) - .5) * next.hh * 1.8;
    stamp(w, x, y, 36, .3);
    out.push({ kind: 'stamp', x, y, r: 36 });
    out.push(...settle(w));
  }
  return out;
}

/** The next thing still under the dirt, bones first. */
export const nextBuried = (w: DigWorld) => w.things.filter(t => t.state === 'buried').sort((a, b) => (a.thing === 'bone' ? 0 : 1) - (b.thing === 'bone' ? 0 : 1))[0] ?? null;
export const bonesLeft = (w: DigWorld) => w.things.filter(t => t.thing === 'bone' && t.state !== 'crated').length;
/** Every bone in the crate and every Bolt and fossil found. */
export const finished = (w: DigWorld) => w.things.every(t => t.state === 'crated');
/** How much of the whole patch is clear. */
export const clearedShare = (w: DigWorld) => w.dirt.reduce((n, v) => n + (v < CLEAR ? 1 : 0), 0) / w.dirt.length;
