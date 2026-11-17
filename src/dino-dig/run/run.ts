// The Alive run, as a world with no drawing in it, so it can be tested and played by a script. He is the dinosaur he brought to life,
// seen from the side: hold to walk, tap to jump, and ROAR. Along the way are snacks (low ones, high leaves only a long neck or a good
// jump reaches, bugs in the air), rocks (a big dinosaur smashes through; a small one jumps them, or bumps and wobbles back), the land's
// own thing in the way (a log, a crab, a cactus...), ponds (Spinosaurus swims fast; everyone else wades slowly) and trees (a T. rex or
// a Parasaurolophus roar shakes fruit down). At the end is his nest: "You made it!"
//
// It can't be failed or lost: nothing hurts him, a bump only wobbles him back, and anything he bumps three times gets out of his way.
// Each dinosaur moves its own way (museum/dinos.ts, `moves`), and the Gear he has bought changes it for all of them.
import type { Rng } from '../../game/rng';
import type { Dino } from '../museum/dinos';
import type { GearId, LandId } from '../shop/shop';

export const LENGTH = 4200, GRAVITY = 2200, HIGH = 330, AIR = 190, LOW = 30;

export interface Snack { id: number; x: number; y: number; kind: 'low' | 'high' | 'air' | 'fruit'; eaten: boolean; vy?: number }
export interface Block { id: number; x: number; w: number; h: number; kind: 'rock' | 'thing'; gone: boolean; bumps: number }
export interface Pond { x: number; w: number }
export interface Tree { x: number; shaken: boolean }

export interface RunWorld {
  x: number; y: number; vx: number; vy: number;
  onGround: boolean; jumps: number;
  /** How big the dinosaur is here: its height and length in world units. */
  height: number; length: number;
  snacks: Snack[]; blocks: Block[]; ponds: Pond[]; trees: Tree[];
  eaten: number;
  t: number; phase: number; wobble: number; roar: number; idle: number;
  done: boolean;
  inWater: boolean;
}

export interface Abilities {
  speed: number; jump: number; smash: boolean; reach: boolean; fly: boolean; double: boolean; swim: boolean; shake: boolean;
  glide: boolean; magnet: boolean; stomp: boolean;
}
/** What this dinosaur can do, with his Gear. */
export function abilities(d: Dino, gear: ReadonlySet<GearId>): Abilities {
  const m = d.moves;
  return {
    speed: m.speed * (gear.has('turbo') ? 1.35 : 1), jump: m.jump * (gear.has('springs') ? 1.22 : 1), smash: !!m.smash, reach: !!m.reach,
    fly: !!m.fly, double: !!m.double, swim: !!m.swim, shake: !!m.shake, glide: gear.has('cape'), magnet: gear.has('magnet'), stomp: gear.has('stomp'),
  };
}

export function createRun(size: { height: number; length: number }, land: LandId, rng: Rng): RunWorld {
  const snacks: Snack[] = [], blocks: Block[] = [], ponds: Pond[] = [], trees: Tree[] = [];
  let id = 0;
  for (let x = 500; x < LENGTH - 400; x += 420 + rng() * 260) {
    const r = rng();
    if (r < .38) blocks.push({ id: id++, x, w: 70 + rng() * 40, h: 50 + rng() * 30, kind: 'rock', gone: false, bumps: 0 });
    else if (r < .66) blocks.push({ id: id++, x, w: 90, h: 46, kind: 'thing', gone: false, bumps: 0 });
    else if (r < .8 && land !== 'desert') ponds.push({ x, w: 260 });
    else trees.push({ x, shaken: false });
    // snacks between: a few low, a high leaf and a bug in the air
    for (let k = 0; k < 3; k++) snacks.push({ id: id++, x: x + 140 + k * 60, y: LOW, kind: 'low', eaten: false });
    snacks.push({ id: id++, x: x + 260, y: rng() < .5 ? HIGH : AIR, kind: rng() < .5 ? 'high' : 'air', eaten: false });
  }
  for (let x = 300; x < LENGTH; x += 700) trees.push({ x: x + rng() * 200, shaken: false });
  return {
    x: 120, y: 0, vx: 0, vy: 0, onGround: true, jumps: 0, height: size.height, length: size.length, snacks, blocks, ponds, trees, eaten: 0,
    t: 0, phase: 0, wobble: 0, roar: 0, idle: 0, done: false, inWater: false,
  };
}

export interface Input { walk: boolean; jumpHeld: boolean; jumpPressed: boolean; roar: boolean }
export type RunEvent =
  | { kind: 'jump' } | { kind: 'land' } | { kind: 'eat'; snack: Snack } | { kind: 'bonk'; block: Block } | { kind: 'smash'; block: Block }
  | { kind: 'splash' } | { kind: 'roar' } | { kind: 'shake'; tree: Tree } | { kind: 'move'; block: Block } | { kind: 'finish' } | { kind: 'hint' };

/** A step of the run. */
export function stepRun(w: RunWorld, dt: number, a: Abilities, input: Input): RunEvent[] {
  const out: RunEvent[] = [];
  if (w.done) return out;
  w.t += dt;
  w.inWater = w.ponds.some(p => w.x > p.x && w.x < p.x + p.w) && w.y <= 1;
  const speed = a.speed * (w.inWater ? (a.swim ? 1.6 : .55) : 1);
  const want = input.walk ? speed : 0;
  w.vx += (want - w.vx) * Math.min(1, dt * (input.walk ? 4 : 6));
  if (w.wobble > 0) { w.wobble -= dt; }
  w.idle = input.walk || input.jumpPressed ? 0 : w.idle + dt;
  if (w.idle > 5) { w.idle = 0; out.push({ kind: 'hint' }); }

  // jumping, flying, gliding
  if (input.jumpPressed) {
    if (w.onGround) { w.vy = -a.jump; w.onGround = false; w.jumps = 1; out.push({ kind: 'jump' }); }
    else if (a.fly) { w.vy = Math.min(w.vy, -a.jump * .55); out.push({ kind: 'jump' }); }
    else if (a.double && w.jumps < 2) { w.vy = -a.jump * .85; w.jumps = 2; out.push({ kind: 'jump' }); }
  }
  let g = GRAVITY;
  if (!w.onGround && input.jumpHeld && w.vy > 0 && (a.fly || a.glide)) g = GRAVITY * .18;
  if (!w.onGround && a.fly && input.jumpHeld && w.vy < 0) g = GRAVITY * .6;
  w.vy += g * dt;
  if (a.fly && w.y < -560) { w.y = -560; w.vy = Math.max(0, w.vy); }
  w.y += w.vy * dt;
  if (w.y >= 0) {
    if (!w.onGround) {
      out.push({ kind: 'land' });
      if (a.stomp) for (const b of w.blocks) if (!b.gone && Math.abs(b.x + b.w / 2 - w.x) < 160) { b.gone = true; out.push({ kind: 'smash', block: b }); }
    }
    w.y = 0; w.vy = 0; w.onGround = true; w.jumps = 0;
  }
  if (w.inWater && !a.swim && w.vx > 40 && Math.floor(w.t * 3) !== Math.floor((w.t - dt) * 3)) out.push({ kind: 'splash' });

  // moving forward, and what's in the way
  let nx = w.x + w.vx * dt;
  const front = w.length * .45;
  for (const b of w.blocks) {
    if (b.gone || -w.y > b.h - 4) continue;
    if (w.x + front <= b.x && nx + front > b.x) {
      if (a.smash && b.kind === 'rock') { b.gone = true; out.push({ kind: 'smash', block: b }); continue; }
      b.bumps++;
      if (b.bumps >= 3) { b.gone = true; out.push({ kind: 'move', block: b }); continue; }
      nx = b.x - front - 30; w.vx = -180; w.wobble = .5; out.push({ kind: 'bonk', block: b });
    }
  }
  w.x = Math.max(60, Math.min(LENGTH, nx));
  if (w.vx > 10) w.phase += dt * w.vx / Math.max(60, w.length * .5) * 2.2;

  // roaring: shakes fruit out of a nearby tree if it can, and every roar makes a big noise
  w.roar = Math.max(0, w.roar - dt);
  if (input.roar && w.roar <= 0) {
    w.roar = .8;
    out.push({ kind: 'roar' });
    for (const tr of w.trees) if (!tr.shaken && Math.abs(tr.x - w.x) < 380 && (a.shake || a.reach)) {
      tr.shaken = true;
      for (let k = 0; k < 4; k++) w.snacks.push({ id: 1000 + w.snacks.length, x: tr.x - 60 + k * 40, y: 300, kind: 'fruit', eaten: false, vy: 0 });
      out.push({ kind: 'shake', tree: tr });
    }
  }
  // fruit falls to the ground
  for (const s of w.snacks) if (s.kind === 'fruit' && s.y > LOW) { s.vy = (s.vy ?? 0) + 900 * dt; s.y = Math.max(LOW, s.y - s.vy * dt); }

  // eating: a snack within reach of the head
  const headX = w.x + w.length * .45, reachTop = -w.y + w.height + (a.reach ? 60 : 0), reachBot = -w.y - 10;
  for (const s of w.snacks) {
    if (s.eaten) continue;
    if (a.magnet && Math.abs(s.x - headX) < 200) s.x += (headX - s.x) * Math.min(1, dt * 4);
    if (Math.abs(s.x - headX) < 60 + w.length * .15 && s.y <= reachTop && s.y >= reachBot - 10) { s.eaten = true; w.eaten++; out.push({ kind: 'eat', snack: s }); }
  }
  if (w.x >= LENGTH - 10) { w.done = true; out.push({ kind: 'finish' }); }
  return out;
}

/** How far along he is, 0 to 1. */
export const progress = (w: RunWorld) => Math.min(1, w.x / LENGTH);
