// The Dive, as numbers: no drawing here, so the tests can play it (sim.test.ts). His held finger leads the submarine, and its
// headlights point where it's going. He photographs an animal by holding his light on it for a moment, and the Claw picks up
// treasure he passes close to. Sonar pings by itself every few seconds; the ring draws the outline of everything it passes, lit or
// not. About a minute in, the submarine rises by itself. Nothing chases him and nothing can hurt him: the edges of the sea only nudge
// him back, and the Dive can't be lost.
import { seeded, shuffle } from '../../game/rng';
import { diveAnimals, DIVE_S, TREASURES, type Gear } from '../dock/dock';
import type { Animal, AnimalId } from '../sea/animals';
import type { ZoneId } from '../sea/zones';

/** The sea, in world units: about two screens wide and one and a half deep. */
export const WORLD = { w: 2400, h: 1500, floor: 1420, top: 90 } as const;
/** Seconds of light on an animal to take its picture. */
export const HOLD_S = 0.9;
/** How long a sonar outline stays, and how fast a ping travels. */
export const OUTLINE_S = 2.6;
export const PING_SPEED = 700;
/** How long the camera flash lights the whole sea. */
export const FLASH_S = 0.7;
/** How far the flash reaches (about a screen). */
export const FLASH_REACH = 900;

export interface Swimmer {
  readonly a: Animal;
  x: number; y: number;
  readonly home: { x: number; y: number };
  readonly phase: number;
  face: 1 | -1;
  /** 0 to 1: how long the light has been on it, toward its picture. */
  photo: number;
  /** Photographed on this Dive. */
  done: boolean;
  /** Seconds its sonar outline still shows. */
  outline: number;
  /** A toot of the horn makes it wiggle. */
  wiggle: number;
  lit: boolean;
}
export interface Treasure { readonly kind: 'chest' | 'pearl' | 'coins' | 'crown' | 'gem'; readonly x: number; readonly y: number; got: boolean; outline: number }
export interface Crystal { readonly x: number; readonly y: number; readonly tilt: number }

export interface DiveState {
  readonly zone: ZoneId;
  readonly gear: Gear;
  t: number;
  phase: 'dive' | 'rise' | 'done';
  sub: { x: number; y: number; vx: number; vy: number; aim: number; face: 1 | -1 };
  /** Where his finger is holding, in world units. */
  target: { x: number; y: number } | null;
  readonly animals: Swimmer[];
  readonly treasures: Treasure[];
  readonly crystals: Crystal[];
  ping: { r: number } | null;
  pingIn: number;
  flash: number;
  flashes: number;
  photos: AnimalId[];
  treasure: number;
  bumped: number;
  events: string[];
}

const TREASURE_KINDS: Treasure['kind'][] = ['chest', 'pearl', 'coins', 'crown', 'gem'];

export function startDive(zone: ZoneId, gear: Gear, photos: readonly string[], seed = 1): DiveState {
  const rng = seeded(seed), animals = diveAnimals(zone, photos, rng);
  // spread them across the sea in loose columns, swimmers in the water and crawlers on the floor, none on top of the start
  const cols = shuffle(rng, animals.map((_, i) => i));
  const swimmers: Swimmer[] = animals.map((a, i) => {
    const col = cols[i]!, x = 420 + (col + 0.2 + rng() * 0.6) * ((WORLD.w - 560) / animals.length);
    const floor = a.moves === 'crawl' || a.moves === 'still';
    const y = floor ? WORLD.floor - 40 * a.size - 10 : 300 + rng() * (WORLD.floor - 520);
    return { a, x, y, home: { x, y }, phase: rng() * 6.28, face: rng() < 0.5 ? 1 : -1, photo: 0, done: false, outline: 0, wiggle: 0, lit: false };
  });
  const treasures: Treasure[] = shuffle(rng, TREASURE_KINDS).slice(0, TREASURES).map((kind, i) => ({
    kind, x: 500 + i * ((WORLD.w - 700) / TREASURES) + rng() * 300, y: WORLD.floor - 26 - (i === 1 ? 0 : rng() * 30), got: false, outline: 0,
  }));
  const crystals: Crystal[] = zone === 'cave' ? Array.from({ length: 6 }, (_, i) => ({ x: 300 + i * 360 + rng() * 120, y: i % 2 ? 140 + rng() * 60 : WORLD.floor - 30, tilt: (rng() - 0.5) * 1.2 })) : [];
  return {
    zone, gear, t: 0, phase: 'dive', sub: { x: 220, y: 260, vx: 0, vy: 0, aim: 0.25, face: 1 }, target: null, animals: swimmers, treasures, crystals,
    ping: null, pingIn: 1.2, flash: 0, flashes: gear.flashes, photos: [], treasure: 0, bumped: 0, events: [],
  };
}

// ---------- his hands ----------

export function hold(s: DiveState, x: number, y: number) { s.target = { x, y }; }
export function release(s: DiveState) { s.target = null; }
/** Sends a ping now (the Sonar button), unless one is still going out. */
export function ping(s: DiveState): boolean {
  if (s.ping || s.phase === 'done') return false;
  s.ping = { r: 0 }; s.pingIn = s.gear.sonarEvery; s.events.push('ping');
  return true;
}
/** The camera flash: the whole sea lights up for a moment, and every animal near enough has its picture taken. */
export function flash(s: DiveState): boolean {
  if (s.flashes <= 0 || s.phase === 'done' || s.flash > 0) return false;
  s.flashes--; s.flash = FLASH_S; s.events.push('flash');
  for (const m of s.animals) if (!m.done && Math.hypot(m.x - s.sub.x, m.y - s.sub.y) < FLASH_REACH) snap(s, m);
  return true;
}
/** The horn: the animals near him wiggle (sound makes things move). */
export function horn(s: DiveState) {
  for (const m of s.animals) if (Math.hypot(m.x - s.sub.x, m.y - s.sub.y) < 520) m.wiggle = 1;
}

// ---------- the light ----------

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** Is this point in his headlights' beam? */
export function inBeam(s: Pick<DiveState, 'sub' | 'gear'>, x: number, y: number, pad = 0): boolean {
  const dx = x - s.sub.x, dy = y - s.sub.y, d = Math.hypot(dx, dy);
  if (d > s.gear.reach + pad) return false;
  if (d < 60 + pad) return true; // right against the window
  return Math.abs(wrap(Math.atan2(dy, dx) - s.sub.aim)) < s.gear.half + Math.atan2(pad, d);
}

function snap(s: DiveState, m: Swimmer) {
  m.done = true; m.photo = 1;
  if (!s.photos.includes(m.a.id as AnimalId)) s.photos.push(m.a.id as AnimalId);
  s.events.push(`photo:${m.a.id}`);
}

// ---------- a moment of the Dive ----------

export function step(s: DiveState, dt: number) {
  if (s.phase === 'done') return;
  s.t += dt;
  const sub = s.sub, g = s.gear;
  if (s.phase === 'dive' && s.t >= DIVE_S) { s.phase = 'rise'; s.target = null; s.events.push('rise'); }

  // the submarine: toward his finger, gently; rising by itself at the end
  let want = { x: 0, y: 0 };
  if (s.phase === 'rise') want = { x: 0, y: -g.speed * 0.8 };
  else if (s.target) {
    const dx = s.target.x - sub.x, dy = s.target.y - sub.y, d = Math.hypot(dx, dy);
    if (d > 8) { const v = g.speed * Math.min(1, d / 140); want = { x: (dx / d) * v, y: (dy / d) * v }; }
  }
  const k = Math.min(1, dt * 3.2);
  sub.vx += (want.x - sub.vx) * k; sub.vy += (want.y - sub.vy) * k;
  sub.x += sub.vx * dt; sub.y += sub.vy * dt;
  // the light points where he's heading (where his finger is), and stays put while he's still
  const sp = Math.hypot(sub.vx, sub.vy);
  if (s.target && s.phase === 'dive') {
    const toward = Math.atan2(s.target.y - sub.y, s.target.x - sub.x);
    if (Math.hypot(s.target.x - sub.x, s.target.y - sub.y) > 30) sub.aim += wrap(toward - sub.aim) * Math.min(1, dt * 6);
  } else if (sp > 40) sub.aim += wrap(Math.atan2(sub.vy, sub.vx) - sub.aim) * Math.min(1, dt * 3);
  if (Math.abs(sub.vx) > 25) sub.face = sub.vx > 0 ? 1 : -1;
  // the edges of the sea only nudge him back
  s.bumped = Math.max(0, s.bumped - dt);
  const minY = s.phase === 'rise' ? -200 : WORLD.top;
  if (sub.x < 80 || sub.x > WORLD.w - 80 || sub.y < minY || sub.y > WORLD.floor - 70) {
    if (s.bumped <= 0 && s.phase === 'dive') { s.events.push('bump'); s.bumped = 1; }
    if (sub.x < 80) { sub.x = 80; sub.vx = Math.abs(sub.vx) * 0.3; }
    if (sub.x > WORLD.w - 80) { sub.x = WORLD.w - 80; sub.vx = -Math.abs(sub.vx) * 0.3; }
    if (sub.y < minY) { sub.y = minY; sub.vy = Math.abs(sub.vy) * 0.3; }
    if (sub.y > WORLD.floor - 70) { sub.y = WORLD.floor - 70; sub.vy = -Math.abs(sub.vy) * 0.3; }
  }
  if (s.phase === 'rise' && sub.y <= WORLD.top - 120) { s.phase = 'done'; s.events.push('done'); }

  // the animals: swimmers wander round their home, crawlers creep along the floor, the still ones sway
  for (const m of s.animals) {
    const w = s.t * (m.a.moves === 'drift' ? 0.35 : 0.5) + m.phase, range = m.a.moves === 'still' ? 0 : m.a.moves === 'crawl' ? 90 : 160;
    const nx = m.home.x + Math.sin(w) * range, ny = m.home.y + (m.a.moves === 'swim' ? Math.sin(w * 1.7) * 50 : m.a.moves === 'drift' ? Math.sin(w * 1.3) * 70 : 0);
    if (Math.abs(nx - m.x) > 0.5) m.face = nx > m.x ? 1 : -1;
    m.x = nx; m.y = ny;
    m.wiggle = Math.max(0, m.wiggle - dt * 1.2);
    m.outline = Math.max(0, m.outline - dt);
    const lit = inBeam(s, m.x, m.y, 26 * m.a.size) || s.flash > 0;
    if (lit && !m.lit && !m.done) s.events.push(`lit:${m.a.id}`);
    m.lit = lit;
    if (m.done || s.phase === 'done') continue;
    if (lit && s.phase === 'dive') { m.photo += dt / HOLD_S; if (m.photo >= 1) snap(s, m); }
    else m.photo = Math.max(0, m.photo - dt * 0.6);
  }

  // treasure the Claw can reach
  for (const tr of s.treasures) {
    tr.outline = Math.max(0, tr.outline - dt);
    if (!tr.got && s.phase === 'dive' && Math.hypot(tr.x - sub.x, tr.y - (sub.y + 40)) < g.claw) { tr.got = true; s.treasure++; s.events.push('treasure'); }
  }

  // sonar: a ping goes out every few seconds; its ring outlines whatever it passes, in the light or not
  s.flash = Math.max(0, s.flash - dt);
  s.pingIn -= dt;
  if (!s.ping && s.pingIn <= 0 && s.phase === 'dive') ping(s);
  if (s.ping) {
    const r0 = s.ping.r;
    s.ping.r += PING_SPEED * dt;
    const passed = (x: number, y: number) => { const d = Math.hypot(x - sub.x, y - sub.y); return d >= r0 && d < s.ping!.r && d <= g.sonarRange; };
    for (const m of s.animals) if (passed(m.x, m.y)) m.outline = OUTLINE_S;
    for (const tr of s.treasures) if (!tr.got && passed(tr.x, tr.y)) tr.outline = OUTLINE_S;
    if (s.ping.r > g.sonarRange) s.ping = null;
  }
}

export function takeEvents(s: DiveState): string[] {
  const e = s.events;
  s.events = [];
  return e;
}
