// Drawing the City from above (the City screen, the Job and the fly-over). Each Block is drawn once into its own image, its
// buildings in order from back to front, and kept until something on it changes or day turns to night; a frame then draws the
// streets and a handful of Block images, and on top only the moving pieces (people, cars, his vehicle), which are capped. Far out
// (the fly-over's widest view) Blocks are drawn as plain shapes. That is what keeps a big City at 60 fps on the iPad 9.
import { drawBuilding, drawLittleCar, drawPerson, emoji, O, reachAbove, shade } from '../art/draw';
import { DISTRICTS, STREET_THINGS, type StreetThing } from './catalog';
import { designOf, nextBlock, tallest, type CityState } from './city';
import { BLOCK_H, BLOCK_W, blockAt, blockIdAt, blockRect, districtOf, PITCH_X, PITCH_Y, plotsOf, ROWS, STREET, streetX, streetY, worldSize, type Bounds } from './grid';

/** The look of a Block's land: its District's, or for the Blocks past the six, each column in turn. */
export function landOf(block: number) {
  const d = districtOf(block);
  return DISTRICTS[d ?? (blockAt(block).bx % DISTRICTS.length)]!;
}

/** How much room above a Block its tallest building needs, in world units. */
const TOP = 320, SCALE = 1.5;

interface Cached { canvas: HTMLCanvasElement; key: string; used: number }
const cache = new Map<number, Cached>();
const MAX_CACHED = 40;
let tick = 0;

/** What a Block looks like right now, as a string: when it changes, the image is redrawn. */
function blockKey(s: CityState, id: number, night: boolean, flagAt: string | null, things: readonly StreetThing[]): string {
  const owned = s.blocks.includes(id);
  if (!owned) return `${id}|${night}|lot|${nextBlock(s) === id}`;
  const plots = plotsOf(id).map(p => { const x = s.plots[p.id]; return x ? `${x.d}/${x.floors}${flagAt === p.id ? 'F' : ''}` : '-'; }).join(',');
  return `${id}|${night}|${plots}|${things.length}`;
}

function drawBlock(s: CityState, id: number, night: boolean, flagAt: string | null, things: readonly StreetThing[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((BLOCK_W + 8) * SCALE); canvas.height = Math.ceil((BLOCK_H + TOP + 8) * SCALE);
  const c = canvas.getContext('2d')!;
  c.scale(SCALE, SCALE); c.translate(4, TOP + 4);
  const r = blockRect(id), land = landOf(id);
  c.translate(-r.x, -r.y);
  const owned = s.blocks.includes(id);
  // the pavement, then the plots
  c.fillStyle = night ? shade(land.pave, -.5) : land.pave; c.fillRect(r.x, r.y, r.w, r.h);
  c.strokeStyle = O; c.lineWidth = 2; c.strokeRect(r.x, r.y, r.w, r.h);
  if (!owned) {
    c.fillStyle = night ? '#2c4a2a' : '#9fcf7f'; c.fillRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12);
    c.strokeStyle = '#8a6a3a'; c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16); c.setLineDash([]);
    if (nextBlock(s) === id) emoji(c, '🪧', r.x + r.w / 2, r.y + r.h / 2, 34);
    else for (const [fx, fy] of [[.2, .35], [.55, .7], [.8, .3]] as const) emoji(c, '🌳', r.x + r.w * fx, r.y + r.h * fy, 20);
    return canvas;
  }
  const plots = plotsOf(id);
  for (const p of plots) { c.fillStyle = night ? shade(land.ground, -.5) : land.ground; c.fillRect(p.rect.x + 3, p.rect.y + 3, p.rect.w - 6, p.rect.h - 6); }
  // street things along the edge, the same ones in the same places every time
  const spots = [[.04, .02], [.5, .02], [.96, .02], [.04, .98], [.5, .98], [.96, .98], [.27, .02], [.73, .98]] as const;
  for (let i = 0; i < spots.length && things.length; i++) {
    const t = things[(id * 5 + i * 3) % things.length]!, [fx, fy] = spots[i]!;
    emoji(c, t.emoji, r.x + r.w * fx, r.y + r.h * fy, 15);
  }
  // back row first, so the front row's buildings stand in front of it
  for (const p of [...plots].sort((a, b) => a.rect.y + a.rect.h - (b.rect.y + b.rect.h))) {
    const placed = s.plots[p.id];
    if (!placed) { c.strokeStyle = night ? '#ffffff33' : '#00000026'; c.setLineDash([5, 5]); c.lineWidth = 2; c.strokeRect(p.rect.x + 8, p.rect.y + 8, p.rect.w - 16, p.rect.h - 16); c.setLineDash([]); continue; }
    const d = designOf(s, placed.d);
    if (!d) continue;
    drawBuilding(c, d.look, placed.floors, p.rect.x + 6, p.rect.y + 6, p.rect.w - 12, p.rect.h - 12, { night, seed: hashStr(p.id), flag: flagAt === p.id });
  }
  return canvas;
}
const hashStr = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return h; };

/** The plot with the tallest tower, which flies the flag. */
export function flagPlot(s: CityState): string | null {
  const top = tallest(s);
  if (top <= 0) return null;
  return Object.entries(s.plots).find(([, p]) => p.floors === top && designOf(s, p.d)?.tower)?.[0] ?? null;
}
export const ownedThings = (s: CityState) => STREET_THINGS.filter(t => s.owned.includes(t.key));

function blockImage(s: CityState, id: number, night: boolean, flagAt: string | null, things: readonly StreetThing[]) {
  const key = blockKey(s, id, night, flagAt, things);
  let hit = cache.get(id);
  if (!hit || hit.key !== key) {
    hit = { canvas: drawBlock(s, id, night, flagAt, things), key, used: 0 };
    cache.set(id, hit);
    if (cache.size > MAX_CACHED) {
      const old = [...cache.entries()].sort((a, b) => a[1].used - b[1].used)[0];
      if (old) cache.delete(old[0]);
    }
  }
  hit.used = ++tick;
  return hit.canvas;
}

export interface Camera { x: number; y: number; zoom: number }
/** What a frame can draw over the City: people and cars on the streets. */
export interface Walker { block: number; t: number; speed: number; hue: number }

/** Draws the City for one frame. `cam` is the world point in the middle of the canvas and how many pixels a world unit is. */
export function drawCity(c: CanvasRenderingContext2D, s: CityState, bounds: Bounds, cam: Camera, w: number, h: number, night: number) {
  const z = cam.zoom, left = cam.x - w / 2 / z, top = cam.y - h / 2 / z, right = left + w / z, bottom = top + h / z;
  const world = worldSize(bounds);
  c.save();
  c.fillStyle = night > .5 ? '#1c2230' : '#7aa35c'; c.fillRect(0, 0, w, h); // grass beyond the city
  c.scale(z, z); c.translate(-left, -top);
  // the sea under the Harbour and the Beach
  c.fillStyle = night > .5 ? '#0f2c4a' : '#4fb3ea'; c.fillRect(-2000, world.h, Math.max(world.w, right) + 4000, 2000);
  c.fillStyle = night > .5 ? '#3a3a2a' : '#f0dc9f'; c.fillRect(4 * PITCH_X, world.h - 6, 2 * PITCH_X + STREET, 24);
  // the roads
  c.fillStyle = night > .5 ? '#2a2e38' : '#5b6170'; c.fillRect(0, 0, world.w, world.h);
  c.strokeStyle = night > .5 ? '#a89a4a' : '#ffd23f'; c.lineWidth = 2.5; c.setLineDash([14, 12]);
  c.beginPath();
  for (let i = 0; i <= bounds.cols; i++) { const x = streetX(i); if (x > left - 40 && x < right + 40) { c.moveTo(x, Math.max(0, top)); c.lineTo(x, Math.min(world.h, bottom)); } }
  for (let j = 0; j <= ROWS; j++) { const y = streetY(j); if (y > top - 40 && y < bottom + 40) { c.moveTo(Math.max(0, left), y); c.lineTo(Math.min(world.w, right), y); } }
  c.stroke(); c.setLineDash([]);
  const flagAt = flagPlot(s), things = ownedThings(s), far = z < .32;
  const bx0 = Math.max(0, Math.floor((left - STREET) / PITCH_X)), bx1 = Math.min(bounds.cols - 1, Math.floor((right - STREET) / PITCH_X));
  for (let by = 0; by < ROWS; by++) {
    const yTop = STREET + by * PITCH_Y;
    if (yTop - TOP > bottom || yTop + BLOCK_H < top) continue;
    for (let bx = bx0; bx <= bx1; bx++) {
      const id = blockIdAt(bx, by);
      if (id === null) continue;
      const r = blockRect(id);
      if (far) { c.fillStyle = s.blocks.includes(id) ? landOf(id).pave : '#9fcf7f'; c.fillRect(r.x, r.y, r.w, r.h); drawFar(c, s, id); continue; }
      c.drawImage(blockImage(s, id, night > .5, flagAt, things), r.x - 4, r.y - TOP - 4, BLOCK_W + 8, BLOCK_H + TOP + 8);
    }
  }
  c.restore();
}

/** A Block far away: its buildings as plain shapes, as tall as they are. */
function drawFar(c: CanvasRenderingContext2D, s: CityState, id: number) {
  for (const p of plotsOf(id)) {
    const placed = s.plots[p.id];
    if (!placed) continue;
    const d = designOf(s, placed.d);
    if (!d) continue;
    const H = Math.min(reachAbove(d.look, placed.floors) - 30, 300);
    c.fillStyle = d.look.wall; c.fillRect(p.rect.x + 6, p.rect.y + p.rect.h - 6 - H, p.rect.w - 12, H);
  }
}

// ---------- people and cars in the City ----------

/** People walking round the pavements: more with more homes and places to go, but never more than this. */
export const MAX_WALKERS = 24, MAX_CARS = 8;
export function walkersFor(s: CityState, count: number): Walker[] {
  const out: Walker[] = [];
  for (let i = 0; i < count; i++) out.push({ block: s.blocks[(i * 7) % s.blocks.length]!, t: (i * 0.137) % 1, speed: (.012 + (i % 5) * .003) * (i % 2 ? 1 : -1), hue: (i * 47) % 360 });
  return out;
}
/** A point on the pavement round a Block, `t` from 0 to 1 of the way round. */
export function pavement(block: number, t: number) {
  const r = blockRect(block), per = 2 * (r.w + r.h), d = (((t % 1) + 1) % 1) * per, o = 7;
  if (d < r.w) return { x: r.x + d, y: r.y - o };
  if (d < r.w + r.h) return { x: r.x + r.w + o, y: r.y + d - r.w };
  if (d < 2 * r.w + r.h) return { x: r.x + r.w - (d - r.w - r.h), y: r.y + r.h + o };
  return { x: r.x - o, y: r.y + r.h - (d - 2 * r.w - r.h) };
}
export function drawWalkers(c: CanvasRenderingContext2D, walkers: readonly Walker[], cam: Camera, w: number, h: number, t: number) {
  const z = cam.zoom, left = cam.x - w / 2 / z, top = cam.y - h / 2 / z;
  c.save(); c.scale(z, z); c.translate(-left, -top);
  for (const p of walkers) { const at = pavement(p.block, p.t); drawPerson(c, at.x, at.y, p.hue, t * 8 + p.hue); }
  c.restore();
}
export interface CityCar { x: number; y: number; dir: number; speed: number; hue: number }
export function carsFor(bounds: Bounds, n: number): CityCar[] {
  return Array.from({ length: n }, (_, i) => {
    const vertical = i % 2 === 1, dir = vertical ? (i % 4 === 1 ? 1 : 3) : (i % 4 === 0 ? 0 : 2);
    const line = vertical ? streetX(i % (bounds.cols + 1)) : streetY(i % (ROWS + 1));
    const w = worldSize(bounds);
    return { x: vertical ? line + (dir === 1 ? -14 : 14) : (i * 211) % w.w, y: vertical ? (i * 173) % w.h : line + (dir === 0 ? 14 : -14), dir, speed: 50 + (i % 3) * 15, hue: (i * 67) % 360 };
  });
}
export function moveCars(cars: CityCar[], bounds: Bounds, dt: number) {
  const w = worldSize(bounds);
  for (const car of cars) {
    const dx = car.dir === 0 ? 1 : car.dir === 2 ? -1 : 0, dy = car.dir === 1 ? 1 : car.dir === 3 ? -1 : 0;
    car.x += dx * car.speed * dt; car.y += dy * car.speed * dt;
    if (car.x < 0) car.x += w.w; if (car.x > w.w) car.x -= w.w; if (car.y < 0) car.y += w.h; if (car.y > w.h) car.y -= w.h;
  }
}
export function drawCars(c: CanvasRenderingContext2D, cars: readonly { x: number; y: number; dir: number; hue: number }[], cam: Camera, w: number, h: number) {
  const z = cam.zoom, left = cam.x - w / 2 / z, top = cam.y - h / 2 / z;
  c.save(); c.scale(z, z); c.translate(-left, -top);
  for (const car of cars) drawLittleCar(c, car.x, car.y, car.dir, car.hue);
  c.restore();
}
/** Forgets every Block image (after a reload of the save from elsewhere). */
export const forgetImages = () => cache.clear();
