// The Show, as a little simulation (drawn by ShowScreen.tsx). His plane flies by itself; a held finger leads it (it turns toward the
// finger as tightly as its Wings let it, as fast as its Engine lets it) and it leaves smoke behind, as long a trail as its Smoke Tank
// holds. Rings come one at a time across the sky; he flies through them. Loop and Roll (and the trick he picked) fly a stunt by
// themselves. Clouds, balloons and birds drift across; bumping one only wobbles the plane.
//
// It can't be failed: a ring he doesn't reach floats away when its time is up and the next one comes, and after RINGS_S seconds the
// rings are over however many he flew through. Then the sky is his (Free Sky): smoke only while his finger is down, and it stays, so
// he can draw. What he draws is kept as points, for a postcard.
//
// The world is 1000 units tall and as wide as the screen's shape makes it, so it plays the same in portrait and landscape.
import { int, type Rng } from '../../game/rng';
import type { TrickId } from '../airfield/parts';

export const H = 1000;
export const RINGS = 10, RINGS_S = 40, RING_R = 78, RING_LIFE = 7;
/** Pieces of smoke trail kept while the rings are on: the Smoke Tank multiplies it. Capped for the iPad 9's frame rate. */
export const TRAIL = 90, TRAIL_MAX = 300;
/** Free Sky: how far apart the kept points are, and how many the Smoke Tank holds (it multiplies the second). */
export const DRAW_STEP = 8, DRAW_POINTS = 400;
export const HAZARDS = 3;

export interface Flight { speed: number; turn: number; trail: number; accel: number }
export interface Gear { magnet: boolean; shield: boolean; turbo: boolean; autopilot: boolean }
export interface Ring { x: number; y: number; born: number; passed: boolean; gone: boolean }
export interface Hazard { kind: 'cloud' | 'balloon' | 'bird'; x: number; y: number; vx: number; r: number; bob: number; hit: number }
export interface Trick { id: TrickId; t: number; dur: number; x0: number; y0: number; h0: number; sx: number; sy: number; scale: number }
export type ShowEvent = 'ring' | 'bump' | 'boing' | 'trick' | 'rings-done' | 'last-ring' | 'first-ring' | 'turbo' | 'full';

export interface ShowWorld {
  t: number;
  phase: 'rings' | 'free';
  width: number;
  x: number; y: number; heading: number; speed: number;
  wobble: number; roll: number; turbo: number;
  trick: Trick | null;
  rings: Ring[]; ringIndex: number; passed: number;
  hazards: Hazard[];
  /** The smoke trail while the rings are on: newest last. */
  trail: { x: number; y: number }[];
  /** Free Sky's drawing: strokes of points. */
  drawing: { x: number; y: number }[][];
  drawn: number;
  smoking: boolean;
  events: ShowEvent[];
  rng: Rng;
  flight: Flight;
  gear: Gear;
}

export function createShow(aspect: number, flight: Flight, gear: Gear, rng: Rng, hazardKind: Hazard['kind'] = 'cloud'): ShowWorld {
  const width = Math.max(560, H * aspect);
  const w: ShowWorld = {
    t: 0, phase: 'rings', width, x: width * 0.15, y: H * 0.55, heading: 0, speed: flight.speed * 0.6, wobble: 0, roll: 0, turbo: 0, trick: null,
    rings: [], ringIndex: 0, passed: 0, hazards: [], trail: [], drawing: [], drawn: 0, smoking: false, events: [], rng, flight, gear,
  };
  for (let i = 0; i < HAZARDS; i++) w.hazards.push(newHazard(w, hazardKind, i));
  addRing(w);
  return w;
}

function newHazard(w: ShowWorld, kind: Hazard['kind'], i: number): Hazard {
  const fromLeft = w.rng() < 0.5, r = kind === 'cloud' ? 70 : kind === 'balloon' ? 45 : 32;
  return { kind, x: i === 0 ? w.width * 0.6 : fromLeft ? -r * 2 - i * 300 : w.width + r * 2 + i * 300, y: 140 + w.rng() * (H - 380), vx: (fromLeft ? 1 : -1) * (40 + w.rng() * 50), r, bob: w.rng() * 6, hit: 0 };
}

/** The next ring: well away from the plane and the last ring, inside the sky. */
function addRing(w: ShowWorld) {
  const margin = 140, last = w.rings.at(-1);
  let best = { x: w.width / 2, y: H / 2 }, bestD = -1;
  for (let k = 0; k < 12; k++) {
    const x = int(w.rng, margin, Math.round(w.width - margin)), y = int(w.rng, 160, H - 260);
    const d = Math.min(Math.hypot(x - w.x, y - w.y), last ? Math.hypot(x - last.x, y - last.y) : 9999);
    if (d > 260 && d < 700) { best = { x, y }; break; }
    if (d > bestD) { best = { x, y }; bestD = d; }
  }
  w.rings.push({ ...best, born: w.t, passed: false, gone: false });
}
export const currentRing = (w: ShowWorld): Ring | null => (w.phase === 'rings' ? w.rings.find(r => !r.passed && !r.gone) ?? null : null);

export const resize = (w: ShowWorld, aspect: number) => {
  const width = Math.max(560, H * aspect), k = width / w.width;
  w.width = width; w.x *= k;
  for (const r of w.rings) r.x *= k;
  for (const h of w.hazards) h.x *= k;
  for (const p of w.trail) p.x *= k;
  for (const s of w.drawing) for (const p of s) p.x *= k;
};

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Starts a stunt. Loop and Roll and the third trick. Nothing while one is flying. */
export function startTrick(w: ShowWorld, id: TrickId) {
  if (w.trick) return false;
  const dur = { loop: 1.5, roll: 0.9, zigzag: 1.8, heart: 2.6, spiral: 2.6, bigloop: 2.2, star: 2.8, eight: 2.8 }[id];
  const facing = Math.cos(w.heading) >= 0 ? 1 : -1;
  // the shape goes toward the roomier side, and shrinks to fit the sky
  const sx = w.x < w.width / 2 ? 1 : -1, sy = w.y > H / 2 ? 1 : -1;
  const room = Math.min(w.width - 80, H - 120), scale = Math.max(0.5, Math.min(1, room / 700));
  w.trick = { id, t: 0, dur, x0: w.x, y0: w.y, h0: w.heading, sx: id === 'loop' ? facing : sx, sy, scale };
  w.events.push('trick');
  return true;
}

/** Where a stunt has the plane at u (0 to 1), from where it started, in world units (y down). */
function trickAt(tr: Trick, u: number): { x: number; y: number } | null {
  const tau = Math.PI * 2, s = tr.scale;
  const up = (x: number, y: number) => ({ x: tr.x0 + x * tr.sx * s, y: tr.y0 - y * tr.sy * s });
  switch (tr.id) {
    case 'roll': return null;
    case 'loop': { const r = 85, a = u * tau; return up(Math.sin(a) * r, (1 - Math.cos(a)) * r); }
    case 'bigloop': { const r = 170, a = u * tau; return up(Math.sin(a) * r, (1 - Math.cos(a)) * r); }
    case 'zigzag': return up(u * 560, Math.sin(u * tau * 2.5) * 90);
    case 'spiral': { const a = u * tau * 3, r = 30 + u * 140; return up(Math.sin(a) * r, (1 - Math.cos(a)) * r * 0.9); }
    case 'heart': {
      const t = Math.PI + u * tau, hx = (q: number) => 16 * Math.sin(q) ** 3, hy = (q: number) => 13 * Math.cos(q) - 5 * Math.cos(2 * q) - 2 * Math.cos(3 * q) - Math.cos(4 * q);
      return up((hx(t) - hx(Math.PI)) * 11, (hy(t) - hy(Math.PI)) * 11);
    }
    case 'star': {
      const pts = Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5; return [Math.cos(a) * 200, Math.sin(a) * 200] as const; });
      const seg = Math.min(4.999, u * 5), i = Math.floor(seg), f = seg - i, a = pts[i]!, b = pts[i + 1]!;
      return up(a[0] + (b[0] - a[0]) * f - pts[0]![0], -(a[1] + (b[1] - a[1]) * f - pts[0]![1]));
    }
    case 'eight': { const a = u * tau, r = 150; return up(Math.sin(2 * a) * r * 0.6, (1 - Math.cos(a)) * r); }
  }
}

/** `target`: where his finger is (world units), or null. `down`: his finger is on the sky (Free Sky draws only then). */
export function stepShow(w: ShowWorld, dt: number, target: { x: number; y: number } | null, down = target !== null) {
  w.events = [];
  w.t += dt;
  const f = w.flight;
  w.wobble = Math.max(0, w.wobble - dt * 1.6);
  w.turbo = Math.max(0, w.turbo - dt);
  w.roll = 0;

  // ---------- flying ----------
  if (w.trick) {
    const tr = w.trick;
    tr.t += dt;
    const u = Math.min(1, tr.t / tr.dur), at = trickAt(tr, u);
    if (at) {
      const nx = Math.max(40, Math.min(w.width - 40, at.x)), ny = Math.max(60, Math.min(H - 60, at.y));
      const dx = nx - w.x, dy = ny - w.y;
      if (dx * dx + dy * dy > 0.01) w.heading = Math.atan2(dy, dx);
      w.x = nx; w.y = ny;
    } else {
      w.roll = u; // a roll: straight ahead, spinning
      w.x += Math.cos(w.heading) * w.speed * dt; w.y += Math.sin(w.heading) * w.speed * dt;
    }
    if (u >= 1) w.trick = null;
  } else {
    const ring = currentRing(w);
    const lead = target ?? (w.gear.autopilot && ring && w.phase === 'rings' ? ring : null);
    let want = w.heading;
    if (lead && Math.hypot(lead.x - w.x, lead.y - w.y) > 30) want = Math.atan2(lead.y - w.y, lead.x - w.x);
    else if (!lead && w.phase === 'free') want = w.heading + 0.9; // nothing to follow in Free Sky: a slow circle
    // the edges of the sky turn it back in
    const edge = 75;
    if (w.x < edge) want = 0; else if (w.x > w.width - edge) want = Math.PI;
    const right = Math.cos(w.heading) >= 0;
    if (w.y < edge) want = right ? 0.6 : Math.PI - 0.6; else if (w.y > H - edge - 70) want = right ? -0.6 : -(Math.PI - 0.6);
    const turn = f.turn * (w.wobble > 0 ? 0.5 : 1), d = wrap(want - w.heading);
    w.heading = wrap(w.heading + Math.max(-turn * dt, Math.min(turn * dt, d)));
    const top = f.speed * (w.turbo > 0 ? 1.6 : 1);
    w.speed += Math.max(-600 * dt, Math.min(260 * f.accel * dt, top - w.speed));
    w.speed = Math.max(f.speed * 0.45, w.speed);
    const wob = w.wobble > 0 ? Math.sin(w.t * 30) * w.wobble * 0.4 : 0;
    w.x += Math.cos(w.heading + wob) * w.speed * dt;
    w.y += Math.sin(w.heading + wob) * w.speed * dt;
  }
  w.x = Math.max(30, Math.min(w.width - 30, w.x));
  w.y = Math.max(50, Math.min(H - 70, w.y));

  // ---------- smoke ----------
  const tail = { x: w.x - Math.cos(w.heading) * 46, y: w.y - Math.sin(w.heading) * 46 };
  if (w.phase === 'rings') {
    const last = w.trail.at(-1);
    if (!last || Math.hypot(last.x - tail.x, last.y - tail.y) > 5) w.trail.push(tail);
    const cap = Math.min(TRAIL_MAX, Math.round(TRAIL * f.trail));
    if (w.trail.length > cap) w.trail.splice(0, w.trail.length - cap);
  } else {
    const room = Math.round(DRAW_POINTS * (1 + f.trail));
    if (down && w.drawn < room) {
      if (!w.smoking) { w.drawing.push([]); w.smoking = true; }
      const stroke = w.drawing.at(-1)!, last = stroke.at(-1);
      if (!last || Math.hypot(last.x - tail.x, last.y - tail.y) >= DRAW_STEP) { stroke.push(tail); w.drawn++; if (w.drawn === room) w.events.push('full'); }
    } else w.smoking = false;
    // the trail behind the plane while he isn't drawing fades as before
    if (!down) { const lastT = w.trail.at(-1); if (!lastT || Math.hypot(lastT.x - tail.x, lastT.y - tail.y) > 5) w.trail.push(tail); if (w.trail.length > 40) w.trail.splice(0, w.trail.length - 40); }
    else w.trail.length = 0;
  }

  // ---------- rings ----------
  if (w.phase === 'rings') {
    const ring = currentRing(w);
    if (ring) {
      if (w.gear.magnet) { const dx = w.x - ring.x, dy = w.y - ring.y, d = Math.hypot(dx, dy); if (d < 360 && d > 1) { ring.x += (dx / d) * 70 * dt; ring.y += (dy / d) * 70 * dt; } }
      if (Math.hypot(w.x - ring.x, w.y - ring.y) < RING_R) {
        ring.passed = true; w.passed++;
        w.events.push(w.passed === 1 ? 'first-ring' : 'ring');
        if (w.ringIndex + 1 < RINGS) { w.ringIndex++; addRing(w); } else w.events.push('last-ring');
      } else if (w.t - ring.born > RING_LIFE && w.ringIndex + 1 < RINGS) { ring.gone = true; w.ringIndex++; addRing(w); }
    }
    const allDone = w.ringIndex + 1 >= RINGS && !currentRing(w);
    if (allDone || w.t >= RINGS_S) { w.phase = 'free'; for (const r of w.rings) if (!r.passed) r.gone = true; w.events.push('rings-done'); }
  }

  // ---------- things in the sky: a bump only wobbles ----------
  for (const h of w.hazards) {
    h.x += h.vx * dt; h.bob += dt * 2; h.hit = Math.max(0, h.hit - dt);
    if ((h.vx > 0 && h.x > w.width + h.r * 3) || (h.vx < 0 && h.x < -h.r * 3)) { Object.assign(h, newHazard(w, h.kind, 1)); continue; }
    if (w.phase !== 'rings' || h.hit > 0) continue;
    const hy = h.y + Math.sin(h.bob) * 12, d = Math.hypot(w.x - h.x, w.y - hy);
    if (d < h.r + 34) {
      h.hit = 1.2;
      if (w.gear.shield) { w.events.push('boing'); continue; }
      w.wobble = 0.7; w.events.push('bump');
      w.heading += (w.y < hy ? -1 : 1) * 0.5;
    }
  }
}

/** Taps ⚡ (the Turbo Button gear): a burst of speed. */
export function turbo(w: ShowWorld) { if (w.gear.turbo && w.turbo <= 0) { w.turbo = 1.4; w.events.push('turbo'); } }

/** Free Sky's drawing, as a postcard's points: 0 to 255 across and down the sky, -1 between strokes, at most `max` points. */
export function postcardPoints(w: Pick<ShowWorld, 'drawing' | 'width'>, max = 700): number[] {
  const total = w.drawing.reduce((n, s) => n + s.length, 0), every = Math.max(1, Math.ceil(total / max)), out: number[] = [];
  for (const s of w.drawing) {
    if (s.length < 2) continue;
    if (out.length) out.push(-1);
    s.forEach((p, i) => { if (i % every === 0 || i === s.length - 1) out.push(Math.round((p.x / w.width) * 255), Math.round((p.y / H) * 255)); });
  }
  return out;
}
