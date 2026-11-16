// What moves on his table besides the train, drawn each frame over the cached table (draw.ts): his scenery (a piece hops when he
// taps it), the working pieces (crossing gates that come down as the train comes, a drawbridge he taps to let a boat through, a car
// wash, a rainbow arch, a signal, windmills and a big wheel that turn, and pieces that go off when tapped: a fountain, a volcano, a
// launch pad, a balloon ride, fireworks, a music box), the tricks his engine and cars do, the time of day and the weather.
//
// Everything is plain 2D canvas: particles are little dots, rings and lines in screen pixels (so smoke rises up the screen whichever
// way the table is turned), emoji are drawn from a cache of small canvases, and the night is one half-size layer with holes where
// the lights are. A few hundred particles at most, so it holds its frame rate on an iPad 9.
//
// Nothing here can stop the train or get in its way: a drawbridge comes down by itself before the train gets to it.
import { noise, tone } from '../../audio/sfx';
import { LOAD_COLORS, roundRect, type Paint } from '../art/train';
import { sceneryArt } from '../art/scenery';
import { carAt, SPACING, type Run } from '../delivery/run';
import { CARS, ENGINES, GLOWING_GIFTS, SCENERY, type SkyId, type Trick, type Works } from '../shed/catalogue';
import { drawTrain, EMO, gridSpace, image, railsOf, toScreen, type View } from './draw';
import { bits, xyOf, type Layout } from './track';

const O = '#1d1d1f';
const RAIN = ['#e63946', '#ff9a1f', '#ffd23f', '#2bb673', '#2f7fd8', '#7a4fd8'];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]!;

type Kind = 'dot' | 'soft' | 'ring' | 'bubble' | 'line' | 'rect' | 'sprite' | 'text';
interface Part { x: number; y: number; vx: number; vy: number; ay: number; drag: number; life: number; max: number; size: number; grow: number; color: string; kind: Kind; text: string; add: boolean; rot: number; vr: number; wob: number; alpha: number }
const MAX_PARTS = 600;

/** Where a piece of the train is: on the table (in squares) and on the screen (CSS pixels), and which way it faces. */
interface Piece { gx: number; gy: number; sx: number; sy: number; sa: number }
/** A trick going on for a while: from a piece of the train, or from a square of the table (then it goes up the screen). */
interface Emitter { fx: Trick; piece: number; at: { gx: number; gy: number } | null; left: number; acc: number; n: number; color: string }

export interface World {
  t: number;
  parts: Part[];
  sky: Part[];
  emitters: Emitter[];
  /** Seconds left of: the screen shaking, the ghost train see-through, the siren, the disco, a lightning flash. */
  shake: number; ghost: number; siren: number; disco: number; flash: number;
  /** When each square's piece was last tapped (by world time). */
  taps: Map<number, number>;
  /** Each working piece's state, 0 to 1: gates down, a drawbridge up, a signal green; and how far round a windmill's sails are. */
  state: Map<number, number>;
  spin: Map<number, number>;
  /** Drawbridges he has asked to go up. */
  raise: Set<number>;
  /** Working pieces the train is at now, to notice it arriving. */
  near: Set<number>;
  nextSky: number;
  /** The weather the sky's particles are for. */
  skyKind: SkyId | null;
  pieces: Piece[];
}
export const createWorld = (): World => ({
  t: 0, parts: [], sky: [], emitters: [], shake: 0, ghost: 0, siren: 0, disco: 0, flash: 0, taps: new Map(), state: new Map(), spin: new Map(),
  raise: new Set(), near: new Set(), nextSky: 2, skyKind: null, pieces: [],
});

function add(w: World, p: Partial<Part> & Pick<Part, 'x' | 'y'>, into: Part[] = w.parts) {
  if (into.length >= MAX_PARTS) into.shift();
  const life = p.life ?? 1;
  into.push({ vx: 0, vy: 0, ay: 0, drag: 0, max: life, size: 4, grow: 0, color: '#fff', kind: 'dot', text: '', add: false, rot: Math.random() * 6.28, vr: 0, wob: 0, alpha: 1, ...p, life });
}

// ---------- emoji drawn from little cached canvases ----------

const sprites = new Map<string, HTMLCanvasElement>();
function sprite(e: string, px: number): HTMLCanvasElement {
  const size = Math.max(6, Math.round(px)), key = `${e}|${size}`;
  let s = sprites.get(key);
  if (!s) {
    if (sprites.size > 500) sprites.clear();
    s = document.createElement('canvas');
    s.width = s.height = Math.ceil(size * 1.3);
    const c = s.getContext('2d')!;
    c.font = `${size}px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(e, s.width / 2, s.height / 2 + size * .06);
    sprites.set(key, s);
  }
  return s;
}
/** An emoji `size` CSS pixels tall, centred at (x, y) in CSS pixels. */
function emoji(c: CanvasRenderingContext2D, v: View, e: string, x: number, y: number, size: number, rot = 0) {
  const s = sprite(e, size * v.dpr), k = s.width / v.dpr;
  c.setTransform(v.dpr, 0, 0, v.dpr, x * v.dpr, y * v.dpr);
  if (rot) c.rotate(rot);
  c.drawImage(s, -k / 2, -k / 2, k, k);
}
const screen = (c: CanvasRenderingContext2D, v: View) => c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
const centre = (v: View, l: Layout, cell: number) => { const { x, y } = xyOf(l, cell); return toScreen(v, l, x + .5, y + .5); };
/** The table on the screen, in CSS pixels. */
export function tableRect(v: View, l: Pick<Layout, 'w' | 'h'>) {
  const a = toScreen(v, l, 0, 0), b = toScreen(v, l, l.w, l.h);
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

// ---------- tricks: what each one throws out, and its sound ----------

type Spawn = (w: World, x: number, y: number, a: number, s: number, i: number, color: string) => void;
const UP = -Math.PI / 2;
const FX: Record<Trick, { dur: number; every: number; spawn: Spawn }> = {
  puff: { dur: 1.3, every: .13, spawn: (w, x, y, a, s) => add(w, { x: x + Math.cos(a) * .3 * s, y: y + Math.sin(a) * .3 * s, vx: rnd(-.3, .3) * s, vy: -rnd(.5, .9) * s, life: 1.5, size: .22 * s, grow: .35 * s, color: pick(['#f4f6f8', '#dfe4ea', '#c9d1d9']), kind: 'soft', alpha: .85 }) },
  boost: { dur: 3, every: .045, spawn: (w, x, y, a, s) => { const px = Math.cos(a + 1.57) * rnd(-.3, .3) * s, py = Math.sin(a + 1.57) * rnd(-.3, .3) * s; add(w, { x: x - Math.cos(a) * .45 * s + px, y: y - Math.sin(a) * .45 * s + py, vx: -Math.cos(a) * 3 * s, vy: -Math.sin(a) * 3 * s, life: .35, size: 2, color: pick(['#ffffff', '#ffd23f', '#ff7a1a']), kind: 'line', add: true }); } },
  sparks: { dur: 1.1, every: .03, spawn: (w, x, y, _a, s) => { for (let k = 0; k < 2; k++) { const d = rnd(0, 6.28), sp = rnd(1.6, 3.6) * s; add(w, { x, y, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp - s, ay: 6 * s, life: .45, size: .06 * s, color: pick(['#fff6a0', '#ffd23f', '#7fdcff']), add: true }); } } },
  horn: { dur: 1.2, every: .3, spawn: (w, x, y, _a, s) => add(w, { x, y, life: .8, size: .3 * s, grow: 1.8 * s, color: '#ffffff', kind: 'ring' }) },
  snow: { dur: 1.6, every: .018, spawn: (w, x, y, a, s, i) => { const d = a + (i % 2 ? 1.4 : -1.4) + rnd(-.4, .4), sp = rnd(2, 3.4) * s; add(w, { x: x + Math.cos(a) * .4 * s, y: y + Math.sin(a) * .4 * s, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, drag: 2.2, life: .9, size: rnd(.05, .1) * s, color: '#ffffff' }); } },
  fire: { dur: 1.5, every: .022, spawn: (w, x, y, a, s) => { const d = a + rnd(-.25, .25), sp = rnd(2.5, 3.6) * s; add(w, { x: x + Math.cos(a) * .4 * s, y: y + Math.sin(a) * .4 * s, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, drag: 1, life: .5, size: .14 * s, grow: .55 * s, color: pick(['#ff7a1a', '#ffd23f', '#e63946']), kind: 'soft', add: true }); } },
  water: { dur: 1.6, every: .018, spawn: (w, x, y, a, s) => { const d = a + rnd(-.3, .3), sp = rnd(1.8, 2.8) * s; add(w, { x: x + Math.cos(a) * .35 * s, y: y + Math.sin(a) * .35 * s, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp - rnd(1, 2.2) * s, ay: 5 * s, life: .75, size: rnd(.05, .09) * s, color: pick(['#7fc8ff', '#bfe8ff', '#3d9be0']) }); } },
  rainbow: { dur: 4, every: .025, spawn: (w, x, y, _a, s, i) => add(w, { x, y, life: 1.4, size: .32 * s, color: RAIN[i % RAIN.length]!, kind: 'soft', alpha: .8 }) },
  bubbles: { dur: 2, every: .08, spawn: (w, x, y, _a, s) => add(w, { x: x + rnd(-.3, .3) * s, y, vx: rnd(-.2, .2) * s, vy: -rnd(.4, .8) * s, wob: .6, life: 2.4, size: rnd(.12, .24) * s, color: '#bfe8ff', kind: 'bubble' }) },
  siren: { dur: .01, every: 1, spawn: w => { w.siren = 4; } },
  music: { dur: 2, every: .22, spawn: (w, x, y, _a, s, i) => add(w, { x: x + rnd(-.3, .3) * s, y: y - .3 * s, vx: rnd(-.3, .3) * s, vy: -.8 * s, wob: .5, life: 1.6, size: .5 * s, color: RAIN[i % RAIN.length]!, kind: 'text', text: i % 2 ? '♫' : '♪' }) },
  stars: { dur: 1.5, every: .06, spawn: (w, x, y, _a, s) => add(w, { x: x + rnd(-.6, .6) * s, y: y + rnd(-.6, .6) * s, life: .8, size: .45 * s, kind: 'sprite', text: '✨' }) },
  ghost: { dur: 3, every: .7, spawn: (w, x, y, _a, s) => { w.ghost = Math.max(w.ghost, 3); add(w, { x, y, vx: rnd(-.3, .3) * s, vy: -.5 * s, wob: .4, life: 1.6, size: .6 * s, kind: 'sprite', text: '👻' }); } },
  cannon: { dur: .01, every: 1, spawn: (w, x, y, a, s) => {
    const d = a - Math.PI / 2;
    add(w, { x: x + Math.cos(d) * .3 * s, y: y + Math.sin(d) * .3 * s, vx: Math.cos(d) * 3 * s, vy: Math.sin(d) * 3 * s - 2 * s, ay: 5 * s, life: 1, size: .13 * s, color: '#1d1d1f' });
    for (let k = 0; k < 6; k++) add(w, { x: x + Math.cos(d) * .4 * s, y: y + Math.sin(d) * .4 * s, vx: rnd(-.5, .5) * s, vy: -rnd(.3, .8) * s, life: 1.2, size: .25 * s, grow: .5 * s, color: '#c9d1d9', kind: 'soft', alpha: .9 });
  } },
  roar: { dur: .01, every: 1, spawn: (w, x, y, _a, s) => { w.shake = Math.max(w.shake, .7); for (let k = 0; k < 2; k++) add(w, { x, y, life: .7 + k * .2, size: .4 * s, grow: 2.4 * s, color: '#a07850', kind: 'ring' }); } },
  disco: { dur: .01, every: 1, spawn: w => { w.disco = 4; } },
  confetti: { dur: .01, every: 1, spawn: (w, x, y, _a, s) => { for (let k = 0; k < 70; k++) { const d = UP + rnd(-1.4, 1.4), sp = rnd(1.2, 4) * s; add(w, { x, y, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, ay: 4 * s, drag: 1.2, life: 1.8, size: .1 * s, color: pick(RAIN), kind: 'rect', vr: rnd(-8, 8) }); } } },
  dump: { dur: 1, every: .03, spawn: (w, x, y, a, s, i, color) => { const d = a + (i % 2 ? 1.57 : -1.57) + rnd(-.3, .3), sp = rnd(.8, 1.6) * s; add(w, { x, y, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, drag: 2.5, life: 1.4, size: rnd(.07, .12) * s, color }); } },
  balloons: { dur: .01, every: 1, spawn: (w, x, y, _a, s) => { for (let k = 0; k < 5; k++) add(w, { x: x + rnd(-.4, .4) * s, y, vy: -rnd(.7, 1.2) * s, wob: .6, life: 3, size: .5 * s, kind: 'sprite', text: '🎈' }); } },
  fireworks: { dur: 1, every: .33, spawn: (w, x, y, _a, s) => burst(w, x + rnd(-1, 1) * s, y - rnd(1.4, 2.4) * s, s) },
  popcorn: { dur: 1.5, every: .06, spawn: (w, x, y, _a, s) => add(w, { x: x + rnd(-.2, .2) * s, y, vx: rnd(-1, 1) * s, vy: -rnd(2, 3) * s, ay: 7 * s, life: .8, size: .09 * s, color: pick(['#fffbe6', '#ffe9a0']) }) },
  hearts: { dur: 1.5, every: .15, spawn: (w, x, y, _a, s) => add(w, { x: x + rnd(-.3, .3) * s, y, vy: -.7 * s, wob: .5, life: 1.4, size: .4 * s, kind: 'sprite', text: '❤️' }) },
};
function burst(w: World, x: number, y: number, s: number, into?: Part[]) {
  const color = pick(RAIN);
  for (let k = 0; k < 36; k++) { const d = (k / 36) * 6.28, sp = rnd(1.4, 2.4) * s; add(w, { x, y, vx: Math.cos(d) * sp, vy: Math.sin(d) * sp, ay: s, drag: 1.2, life: 1, size: .07 * s, color: k % 4 ? color : '#ffffff', add: true }, into); }
}

/** The sounds, made in code like the rest of the game's sound effects. */
const chuff = (when = 0, v = .07) => noise({ dur: .12, vol: v, type: 'bandpass', f: 700, when });
const TRICK_SOUND: Record<Trick, () => void> = {
  puff: () => { for (let i = 0; i < 4; i++) chuff(i * .16, .09); },
  boost: () => { noise({ dur: .8, vol: .2, type: 'bandpass', f: 300, f2: 3500 }); tone(180, .8, 'sawtooth', 0, .05, 720); },
  sparks: () => { for (let i = 0; i < 6; i++) noise({ dur: .05, vol: .12, type: 'highpass', f: 3000, when: i * .09 + Math.random() * .04 }); },
  horn: () => { tone(220, .9, 'sawtooth', 0, .1); tone(277, .9, 'sawtooth', 0, .08); },
  snow: () => noise({ dur: 1.2, vol: .14, type: 'highpass', f: 2500, f2: 5000 }),
  fire: () => { noise({ dur: 1.2, vol: .22, type: 'lowpass', f: 900, f2: 300 }); tone(70, 1, 'sawtooth', 0, .08, 45); },
  water: () => noise({ dur: 1, vol: .16, type: 'bandpass', f: 1800, f2: 900 }),
  rainbow: () => [523, 659, 784, 988, 1175, 1319].forEach((f, i) => tone(f, .25, 'triangle', i * .08, .07)),
  bubbles: () => { for (let i = 0; i < 6; i++) tone(rnd(500, 900), .08, 'sine', i * .12, .1, rnd(1000, 1500)); },
  siren: () => { for (let i = 0; i < 4; i++) tone(i % 2 ? 950 : 700, .5, 'triangle', i * .5, .07, i % 2 ? 700 : 950); },
  music: () => [659, 784, 880, 784, 659, 523, 587, 659].forEach((f, i) => tone(f, .2, 'triangle', i * .18, .09)),
  stars: () => [1568, 2093, 1760, 2349].forEach((f, i) => tone(f, .3, 'sine', i * .1, .05)),
  ghost: () => { tone(420, .9, 'sine', 0, .09, 210); tone(380, .9, 'sine', .9, .07, 190); },
  cannon: () => { noise({ dur: .9, vol: .35, type: 'lowpass', f: 400, f2: 80 }); tone(60, .6, 'sine', 0, .25, 35); },
  roar: () => { tone(110, 1.2, 'sawtooth', 0, .2, 45); tone(160, 1.1, 'square', 0, .07, 60); noise({ dur: 1.1, vol: .2, f: 500 }); },
  disco: () => { for (let i = 0; i < 8; i++) { tone(70, .15, 'sine', i * .25, .3, 45); if (i % 2) tone(pick([784, 880, 988]), .12, 'square', i * .25, .04); } },
  confetti: () => { for (let i = 0; i < 5; i++) noise({ dur: .06, vol: .15, type: 'highpass', f: 1500, when: i * .05 }); [523, 659, 784].forEach((f, i) => tone(f, .2, 'triangle', .2 + i * .1, .08)); },
  dump: () => noise({ dur: 1, vol: .2, type: 'lowpass', f: 600, f2: 150 }),
  balloons: () => { for (let i = 0; i < 3; i++) tone(rnd(600, 900), .25, 'sine', i * .15, .06, rnd(1100, 1400)); },
  fireworks: () => { for (let i = 0; i < 3; i++) { tone(900, .3, 'sine', i * .33, .04, 2200); noise({ dur: .3, vol: .2, type: 'lowpass', f: 1200, when: i * .33 + .3 }); } },
  popcorn: () => { for (let i = 0; i < 10; i++) noise({ dur: .03, vol: .14, type: 'bandpass', f: 1600, when: i * .14 + Math.random() * .06 }); },
  hearts: () => [784, 988, 1175].forEach((f, i) => tone(f, .35, 'sine', i * .15, .06)),
};
export const trickSound = (t: Trick) => TRICK_SOUND[t]();
export const trickOf = (engine: string): Trick => (ENGINES.find(e => e.id === engine) ?? ENGINES[0]).trick;

/** He tapped the trick button: the engine does its trick, and every car that does something does it too. */
export function doTrick(w: World, t: { engine: string; cars: readonly string[] }) {
  const own = trickOf(t.engine);
  start(w, own, 0);
  trickSound(own);
  carsDo(w, t.cars, own);
}
/** The cars that do something do it (with the trick button, and when they bring the cargo home), each kind of sound once. */
export function carsDo(w: World, cars: readonly string[], heard?: Trick) {
  const done = new Set<Trick>(heard ? [heard] : []);
  cars.forEach((id, i) => {
    const car = CARS.find(c => c.id === id);
    if (!car || !('does' in car)) return;
    start(w, car.does, i + 1, 'load' in car && car.load in LOAD_COLORS ? LOAD_COLORS[car.load]! : '#9a6a3a');
    if (!done.has(car.does)) { done.add(car.does); trickSound(car.does); }
  });
}
function start(w: World, fx: Trick, piece: number, color = '#ffffff', at: Emitter['at'] = null) {
  w.emitters.push({ fx, piece, at, left: FX[fx].dur, acc: FX[fx].every, n: 0, color });
}

// ---------- each frame ----------

export interface Scene {
  layout: Layout;
  run?: Pick<Run, 'layout' | 'segs' | 'head' | 'lean'> | null;
  train?: { engine: string; cars: readonly string[] };
  paint?: Paint;
  cargo?: string | null;
  time?: SkyId;
  weather?: SkyId | null;
  rails?: string;
  /** Drawn after the scenery and before the train: the rings round a station or the points. */
  under?: () => void;
}

/** Draws everything over the cached table, and moves it on by dt seconds. */
export function drawScene(c: CanvasRenderingContext2D, v: View, w: World, dt: number, o: Scene) {
  const l = o.layout;
  w.t += dt;
  for (const k of ['shake', 'ghost', 'siren', 'disco', 'flash'] as const) w[k] = Math.max(0, w[k] - dt);
  w.pieces = o.run && o.train ? piecesOf(v, o.run, o.train.cars.length) : [];
  stepWorks(w, l, dt);
  for (const cell of smoke) { const p = centre(v, l, cell); add(w, { x: p.x, y: p.y - v.cell * .3, vx: rnd(-.1, .1) * v.cell, vy: -.35 * v.cell, life: 1.4, size: .1 * v.cell, grow: .12 * v.cell, color: '#dfe4ea', kind: 'soft', alpha: .7 }); }
  drawScenery(c, v, l, w);
  o.under?.();
  if (o.run && o.train && o.paint) drawTrain(c, v, o.run, o.train, o.paint, o.cargo ?? null, w.ghost > 0 ? .35 : 1);
  drawOverTrain(c, v, l, w);
  stepEmitters(w, v, l, dt);
  stepParts(w.parts, w.t, dt);
  drawParts(c, v, w.parts);
  drawTrainLights(c, v, w);
  if (o.time && o.time !== 'day') drawDark(c, v, l, w, o);
  if (o.weather) drawWeather(c, v, l, w, o.weather, dt);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

function piecesOf(v: View, run: Pick<Run, 'layout' | 'segs' | 'head'>, cars: number): Piece[] {
  const out: Piece[] = [];
  for (let k = 0; k <= cars; k++) {
    const at = carAt(run, k * SPACING), s = toScreen(v, run.layout, at.x, at.y);
    out.push({ gx: at.x, gy: at.y, sx: s.x, sy: s.y, sa: v.rot ? at.a + Math.PI / 2 : at.a });
  }
  return out;
}

function stepEmitters(w: World, v: View, l: Layout, dt: number) {
  for (const e of w.emitters) {
    const f = FX[e.fx];
    e.left -= dt;
    e.acc += dt;
    while (e.acc >= f.every) {
      e.acc -= f.every;
      let x: number, y: number, a = UP;
      if (e.at) { const p = toScreen(v, l, e.at.gx, e.at.gy); x = p.x; y = p.y; }
      else { const p = w.pieces[e.piece]; if (!p) break; x = p.sx; y = p.sy; a = p.sa; }
      f.spawn(w, x, y, a, v.cell, e.n++, e.color);
      if (f.dur < .05) break;
    }
  }
  w.emitters = w.emitters.filter(e => e.left > 0);
}

function stepParts(parts: Part[], t: number, dt: number) {
  for (const p of parts) {
    p.vy += p.ay * dt;
    if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; }
    p.x += p.vx * dt + (p.wob ? Math.sin(t * 3 + p.rot) * p.wob * p.size * dt * 3 : 0);
    p.y += p.vy * dt;
    p.size = Math.max(.5, p.size + p.grow * dt);
    p.rot += p.vr * dt;
    p.life -= dt;
  }
  let n = 0;
  for (const p of parts) if (p.life > 0) parts[n++] = p;
  parts.length = n;
}

function drawParts(c: CanvasRenderingContext2D, v: View, parts: readonly Part[]) {
  for (const p of parts) {
    const a = Math.min(1, (p.life / p.max) * 1.6) * p.alpha;
    if (a <= 0) continue;
    if (p.kind === 'sprite') { c.globalAlpha = a; emoji(c, v, p.text, p.x, p.y, p.size, p.vr ? p.rot : 0); continue; }
    screen(c, v);
    c.globalAlpha = a;
    c.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    c.fillStyle = p.color; c.strokeStyle = p.color;
    switch (p.kind) {
      case 'dot': case 'soft':
        if (p.kind === 'soft') c.globalAlpha = a * .7;
        c.beginPath(); c.arc(p.x, p.y, p.size, 0, 6.283); c.fill(); break;
      case 'ring': c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 6.283); c.stroke(); break;
      case 'bubble': c.fillStyle = '#bfe8ff55'; c.strokeStyle = '#ffffffcc'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 6.283); c.fill(); c.stroke(); break;
      case 'line': c.lineWidth = p.size; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .07, p.y - p.vy * .07); c.stroke(); break;
      case 'rect': c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); break;
      case 'text': c.font = `900 ${p.size}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = O; c.strokeText(p.text, p.x, p.y); c.fillText(p.text, p.x, p.y); break;
    }
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

/** The siren's red and blue, and the disco's coloured lights, round the train. */
function drawTrainLights(c: CanvasRenderingContext2D, v: View, w: World) {
  const e = w.pieces[0];
  if (!e || (!w.siren && !w.disco)) return;
  screen(c, v);
  c.globalCompositeOperation = 'lighter';
  const glow = (x: number, y: number, r: number, color: string) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
  };
  if (w.siren) glow(e.sx, e.sy, v.cell * 1.1, Math.floor(w.t * 6) % 2 ? 'rgba(255,40,40,.75)' : 'rgba(40,90,255,.75)');
  if (w.disco) w.pieces.forEach((p, i) => { const d = w.t * 3 + i * 1.7; glow(p.sx + Math.cos(d) * v.cell * .7, p.sy + Math.sin(d) * v.cell * .7, v.cell * .8, ['rgba(255,60,180,.6)', 'rgba(60,200,255,.6)', 'rgba(255,220,40,.6)', 'rgba(120,255,90,.6)'][(i + Math.floor(w.t * 2)) % 4]!); });
  c.globalCompositeOperation = 'source-over';
}

// ---------- scenery and the working pieces ----------

const SCENERY_ROW = new Map<string, (typeof SCENERY)[number]>(SCENERY.map(s => [s.id, s]));
const worksOf = (id: string): Works | null => { const r = SCENERY_ROW.get(id); return r && 'works' in r ? r.works : null; };
/** How near the train has to be for a piece to notice it, in squares. */
const NEAR: Partial<Record<Works, number>> = { gates: 2.3, blinker: 2.6, drawbridge: 2.6, wash: .75, arch: .75 };

function trainNear(w: World, l: Layout, cell: number, r: number) {
  const { x, y } = xyOf(l, cell);
  return w.pieces.some(p => Math.hypot(p.gx - x - .5, p.gy - y - .5) < r);
}
const since = (w: World, cell: number) => w.t - (w.taps.get(cell) ?? -99);

/** Volcanoes that give off a wisp of smoke this frame (drawn when the view is known). */
const smoke: number[] = [];
function stepWorks(w: World, l: Layout, dt: number) {
  smoke.length = 0;
  for (const s of l.scenery) {
    const kind = worksOf(s.id);
    if (!kind) continue;
    const r = NEAR[kind], near = r !== undefined && trainNear(w, l, s.cell, r), was = w.near.has(s.cell);
    if (near && !was) arrived(w, l, s.cell, kind);
    if (near) w.near.add(s.cell); else w.near.delete(s.cell);
    const st = w.state.get(s.cell) ?? 0;
    if (kind === 'gates') w.state.set(s.cell, ease(st, near || since(w, s.cell) < 1.6 ? 1 : 0, 2.2 * dt));
    if (kind === 'blinker') w.state.set(s.cell, near || since(w, s.cell) < 1.5 ? 1 : 0);
    if (kind === 'drawbridge') {
      // down, and quickly, whenever the train is coming: he can't make the train wait
      if (near) w.raise.delete(s.cell);
      w.state.set(s.cell, ease(st, w.raise.has(s.cell) ? 1 : 0, (w.raise.has(s.cell) ? .9 : 5) * dt));
    }
    if (kind === 'spinmill' || kind === 'turbine' || kind === 'wheel') w.spin.set(s.cell, (w.spin.get(s.cell) ?? Math.random() * 6) + dt * (kind === 'wheel' ? .5 : 1.4) * (since(w, s.cell) < 3 ? 4 : 1));
    if (kind === 'wash' && near && Math.random() < dt * 20) { const { x, y } = xyOf(l, s.cell); start(w, 'bubbles', 0, '#fff', { gx: x + .5, gy: y + .5 }); w.emitters.at(-1)!.left = .1; }
    // a wisp of smoke from the volcano now and then: small, so it never hides the pieces round it
    if (kind === 'volcano' && Math.random() < dt * .8) smoke.push(s.cell);
    if (kind === 'fountain' && Math.random() < dt * 8) { const { x, y } = xyOf(l, s.cell); start(w, 'water', 0, '#fff', { gx: x + .5, gy: y + .4 }); w.emitters.at(-1)!.left = .02; }
  }
}
const ease = (a: number, b: number, k: number) => (a < b ? Math.min(b, a + k) : Math.max(b, a - k));

/** The train came to a working piece. */
function arrived(w: World, l: Layout, cell: number, kind: Works) {
  const { x, y } = xyOf(l, cell);
  if (kind === 'gates') { for (let i = 0; i < 4; i++) tone(1250, .18, 'triangle', i * .36, .07); }
  if (kind === 'wash') noise({ dur: 1.2, vol: .12, type: 'bandpass', f: 2200 });
  if (kind === 'arch') { start(w, 'stars', 0, '#fff', { gx: x + .5, gy: y + .5 }); w.emitters.at(-1)!.left = .6; [1047, 1319, 1568].forEach((f, i) => tone(f, .3, 'sine', i * .08, .05)); }
  if (kind === 'blinker') tone(880, .1, 'square', 0, .04);
}

export type Tapped = 'works' | 'hop' | 'nope' | null;
/**
 * He tapped the table at (gx, gy), in squares, while the train runs: a working piece goes off, any other piece hops. Null when
 * there's no piece there (so the tap can switch points instead).
 */
export function tapWorld(w: World, l: Layout, gx: number, gy: number): Tapped {
  let best: (typeof l.scenery)[number] | null = null, bestD = .8;
  for (const s of l.scenery) { const { x, y } = xyOf(l, s.cell), d = Math.hypot(x + .5 - gx, y + .5 - gy); if (d < bestD) { best = s; bestD = d; } }
  if (!best) return null;
  const kind = worksOf(best.id), cell = best.cell, { x, y } = xyOf(l, cell), here = { gx: x + .5, gy: y + .5 };
  if (!kind) {
    if (SCENERY_ROW.get(best.id) && 'on' in SCENERY_ROW.get(best.id)!) return null; // a tunnel, a bridge, a level crossing: just track
    w.taps.set(cell, w.t);
    tone(660, .1, 'triangle', 0, .08, 990);
    return 'hop';
  }
  if (kind === 'drawbridge') {
    if (w.raise.has(cell)) { w.raise.delete(cell); tone(300, .3, 'square', 0, .05, 200); return 'works'; }
    if (w.near.has(cell) || trainNear(w, l, cell, NEAR.drawbridge!)) { tone(160, .25, 'square', 0, .06); return 'nope'; }
    w.raise.add(cell);
    tone(200, .5, 'square', 0, .04, 320); tone(392, .6, 'sawtooth', .6, .05);
    return 'works';
  }
  w.taps.set(cell, w.t);
  switch (kind) {
    case 'gates': for (let i = 0; i < 3; i++) tone(1250, .18, 'triangle', i * .36, .07); break;
    case 'blinker': tone(880, .1, 'square', 0, .05); break;
    case 'wash': start(w, 'bubbles', 0, '#fff', here); TRICK_SOUND.bubbles(); break;
    case 'arch': start(w, 'rainbow', 0, '#fff', here); w.emitters.at(-1)!.left = 1.2; TRICK_SOUND.rainbow(); break;
    case 'spinmill': case 'turbine': case 'wheel': noise({ dur: 1.5, vol: .12, type: 'bandpass', f: 500, f2: 1200 }); break;
    case 'fountain': start(w, 'water', 0, '#fff', { gx: here.gx, gy: here.gy - .1 }); w.emitters.at(-1)!.left = 1.6; TRICK_SOUND.water(); break;
    case 'volcano': start(w, 'fire', 0, '#fff', { gx: here.gx, gy: here.gy - .2 }); start(w, 'puff', 0, '#fff', here); w.shake = .5; noise({ dur: 1.4, vol: .3, type: 'lowpass', f: 200, f2: 60 }); break;
    case 'launch': noise({ dur: 2, vol: .22, type: 'bandpass', f: 300, f2: 2500 }); break;
    case 'balloon': TRICK_SOUND.balloons(); break;
    case 'fireworks': start(w, 'fireworks', 0, '#fff', here); TRICK_SOUND.fireworks(); break;
    case 'musicbox': start(w, 'music', 0, '#fff', here); w.emitters.at(-1)!.left = 2.2; TRICK_SOUND.music(); break;
  }
  return 'works';
}

/** Scenery on empty squares, upright, and the drawbridge's deck (which the train runs over). */
function drawScenery(c: CanvasRenderingContext2D, v: View, l: Layout, w: World) {
  const S = v.cell;
  for (const s of l.scenery) {
    const kind = worksOf(s.id), row = SCENERY_ROW.get(s.id);
    if (row && 'on' in row) { if (kind === 'drawbridge') drawDrawbridge(c, v, l, w, s.cell); continue; }
    const p = centre(v, l, s.cell), t = since(w, s.cell);
    let dy = t < .5 ? -Math.sin((t / .5) * Math.PI) * .35 * S : 0;
    if (kind && drawWorking(c, v, w, kind, s.cell, p.x, p.y, S)) continue;
    if (kind === 'launch' && t < 3) { dy = -S * 3.2 * Math.sin(Math.min(1, t / 3) * Math.PI); if (t < 2.6 && Math.random() < .7) add(w, { x: p.x + rnd(-.1, .1) * S, y: p.y + dy + .35 * S, vy: S * rnd(.8, 1.4), life: .4, size: .12 * S, grow: .2 * S, color: pick(['#ff7a1a', '#ffd23f']), kind: 'soft', add: true }); }
    if (kind === 'balloon' && t < 5) dy = -S * 2.2 * Math.sin(Math.min(1, t / 5) * Math.PI);
    const a = sceneryArt(s.id), size = S * .92, sway = kind === 'balloon' && t < 5 ? Math.sin(w.t * 2) * .12 : 0;
    if ('emoji' in a) emoji(c, v, a.emoji, p.x, p.y + dy, size, sway);
    else { const img = image(a.svg); if (img) { screen(c, v); c.drawImage(img, p.x - size / 2, p.y - size / 2 + dy, size, size); } }
  }
}

/** The working pieces drawn by hand, upright: true if drawn. */
function drawWorking(c: CanvasRenderingContext2D, v: View, w: World, kind: Works, cell: number, x: number, y: number, S: number): boolean {
  if (kind !== 'blinker' && kind !== 'spinmill' && kind !== 'turbine' && kind !== 'wheel') return false;
  screen(c, v);
  c.save();
  c.translate(x, y);
  c.scale(S / 100, S / 100);
  c.translate(-50, -50);
  c.lineWidth = 4; c.strokeStyle = O; c.lineJoin = 'round';
  const a = w.spin.get(cell) ?? 0;
  if (kind === 'blinker') {
    const green = (w.state.get(cell) ?? 0) > .5;
    c.fillStyle = '#3a3f47'; c.fillRect(46, 44, 8, 52); c.strokeRect(46, 44, 8, 52);
    c.fillStyle = '#2a2d33'; roundRect(c, 32, 6, 36, 48, 10); c.fill(); c.stroke();
    c.fillStyle = green ? '#3a4a3a' : '#ff3b3b'; c.beginPath(); c.arc(50, 20, 8, 0, 6.283); c.fill(); c.stroke();
    c.fillStyle = green ? '#3dff8a' : '#2a3a2a'; c.beginPath(); c.arc(50, 40, 8, 0, 6.283); c.fill(); c.stroke();
  } else if (kind === 'spinmill') {
    c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(36, 96); c.lineTo(42, 44); c.lineTo(58, 44); c.lineTo(64, 96); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#9a6a3a'; c.fillRect(44, 70, 12, 26);
    c.translate(50, 42); c.rotate(a);
    c.fillStyle = '#f4f6f8';
    for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(-6, -38); c.lineTo(6, -38); c.closePath(); c.fill(); c.stroke(); }
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, 0, 6, 0, 6.283); c.fill(); c.stroke();
  } else if (kind === 'turbine') {
    c.fillStyle = '#f4f6f8'; c.beginPath(); c.moveTo(46, 96); c.lineTo(48, 38); c.lineTo(52, 38); c.lineTo(54, 96); c.closePath(); c.fill(); c.stroke();
    c.translate(50, 36); c.rotate(a * 1.6);
    for (let k = 0; k < 3; k++) { c.rotate((2 * Math.PI) / 3); c.beginPath(); c.moveTo(-3, 0); c.lineTo(-4, -34); c.lineTo(4, -34); c.lineTo(3, 0); c.closePath(); c.fill(); c.stroke(); }
    c.fillStyle = '#c9d1d9'; c.beginPath(); c.arc(0, 0, 6, 0, 6.283); c.fill(); c.stroke();
  } else {
    c.beginPath(); c.moveTo(26, 98); c.lineTo(50, 50); c.lineTo(74, 98); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.arc(50, 46, 36, 0, 6.283); c.stroke();
    c.lineWidth = 2.5;
    for (let k = 0; k < 4; k++) { const d = a + (k * Math.PI) / 4; c.beginPath(); c.moveTo(50 + Math.cos(d) * 36, 46 + Math.sin(d) * 36); c.lineTo(50 - Math.cos(d) * 36, 46 - Math.sin(d) * 36); c.stroke(); }
    c.lineWidth = 3;
    for (let k = 0; k < 8; k++) { const d = a + (k * Math.PI) / 4, cx = 50 + Math.cos(d) * 36, cy = 46 + Math.sin(d) * 36; c.fillStyle = RAIN[k % 6]!; roundRect(c, cx - 7, cy - 2, 14, 12, 3); c.fill(); c.stroke(); }
    c.fillStyle = '#f4f6f8'; c.beginPath(); c.arc(50, 46, 6, 0, 6.283); c.fill(); c.stroke();
  }
  c.restore();
  return true;
}

/** Which way a straight square's track runs. */
const across = (l: Layout, cell: number) => (l.cells[cell]! & 2) !== 0;

function drawDrawbridge(c: CanvasRenderingContext2D, v: View, l: Layout, w: World, cell: number) {
  const u = w.state.get(cell) ?? 0;
  if (u <= .01) return;
  gridSpace(c, v, l);
  const { x, y } = xyOf(l, cell), ac = across(l, cell);
  // the water under it shows, and the two halves of the deck lift
  c.fillStyle = '#3d9be0';
  if (ac) c.fillRect(x + .02, y - .02, .96, 1.04); else c.fillRect(x - .02, y + .02, 1.04, .96);
  const half = .5 * (1 - u * .75);
  c.fillStyle = '#c9935a'; c.strokeStyle = O; c.lineWidth = .05;
  for (const side of [0, 1]) {
    if (ac) { const x0 = side ? x + 1 - half : x; c.fillRect(x0, y + .14, half, .72); c.strokeRect(x0, y + .14, half, .72); }
    else { const y0 = side ? y + 1 - half : y; c.fillRect(x + .14, y0, .72, half); c.strokeRect(x + .14, y0, .72, half); }
  }
  if (u > .6) {
    // a boat sails through the gap, across the track
    const k = ((w.t * .35) % 1) * 1.6 - .3, bx = ac ? x + .5 : x - .3 + k * 1.6, by = ac ? y - .3 + k * 1.6 : y + .5, p = toScreen(v, l, bx, by);
    c.save(); emoji(c, v, '⛵', p.x, p.y, v.cell * .55); c.restore();
  }
}

/** Over the train: tunnels, the car wash's walls and brushes, the rainbow arch, the crossing gates' arms. */
function drawOverTrain(c: CanvasRenderingContext2D, v: View, l: Layout, w: World) {
  for (const s of l.scenery) {
    if (s.id !== 'tunnel' && s.id !== 'wash' && s.id !== 'arch' && s.id !== 'gates') continue;
    gridSpace(c, v, l);
    const { x, y } = xyOf(l, s.cell), ac = across(l, s.cell);
    c.strokeStyle = O; c.lineWidth = .06;
    // draws in a square where the track runs left to right; turned for track that runs up and down
    c.save();
    if (!ac) { c.translate(x + .5, y + .5); c.rotate(Math.PI / 2); c.translate(-x - .5, -y - .5); }
    if (s.id === 'tunnel') {
      c.fillStyle = '#6fae4f'; roundRect(c, x + .12, y - .1, .76, 1.2, .3); c.fill(); c.stroke();
      c.fillStyle = '#1d1d1f'; c.fillRect(x + .08, y + .2, .1, .6); c.fillRect(x + .82, y + .2, .1, .6);
    } else if (s.id === 'wash') {
      const busy = w.near.has(s.cell), a = w.t * (busy ? 14 : 2);
      c.fillStyle = '#2f7fd8';
      for (const yy of [y - .06, y + .84]) { roundRect(c, x + .04, yy, .92, .22, .06); c.fill(); c.stroke(); }
      for (const [bx, by] of [[x + .3, y + .18], [x + .7, y + .82]] as const) {
        c.fillStyle = busy ? '#ff7ac0' : '#ffb3d9'; c.beginPath(); c.arc(bx, by, .14, 0, 6.283); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(bx + Math.cos(a) * .14, by + Math.sin(a) * .14); c.lineTo(bx - Math.cos(a) * .14, by - Math.sin(a) * .14); c.stroke();
      }
    } else if (s.id === 'arch') {
      c.globalAlpha = .9;
      RAIN.forEach((col, i) => { c.fillStyle = col; c.fillRect(x + .2 + i * .1, y - .12, .1, 1.24); });
      c.globalAlpha = 1;
      c.lineWidth = .04; c.strokeRect(x + .2, y - .12, .6, 1.24);
    } else {
      const g = w.state.get(s.cell) ?? 0, len = .12 + g * .5;
      for (const [px, py, dir] of [[x + .08, y - .02, 1], [x + .92, y + 1.02, -1]] as const) {
        c.lineCap = 'round';
        c.lineWidth = .1; c.strokeStyle = O; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + dir * len); c.stroke();
        c.lineWidth = .07; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + dir * len); c.stroke();
        c.setLineDash([.08, .08]); c.strokeStyle = '#e63946'; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + dir * len); c.stroke(); c.setLineDash([]);
        c.fillStyle = g > .1 && Math.floor(w.t * 4) % 2 ? '#ff3b3b' : '#5a1a1a'; c.lineWidth = .03; c.strokeStyle = O;
        c.beginPath(); c.arc(px, py, .09, 0, 6.283); c.fill(); c.stroke();
      }
      c.lineCap = 'butt';
    }
    c.restore();
  }
}

// ---------- the time of day ----------

let dark: HTMLCanvasElement | null = null;
const GLOW_SCENERY = new Set<string>([...SCENERY.filter(s => 'glow' in s).map(s => s.id), ...GLOWING_GIFTS]);
const GLOW_CARS = new Set<string>(CARS.filter(c => 'glow' in c).map(c => c.id));

function drawDark(c: CanvasRenderingContext2D, v: View, l: Layout, w: World, o: Scene) {
  const r = tableRect(v, l), night = o.time === 'night', S = v.cell;
  const lights: { x: number; y: number; r: number; color: string }[] = [];
  for (const s of l.stations) { const p = centre(v, l, s.cell); lights.push({ ...p, r: S * 1.1, color: 'rgba(255,220,140,.35)' }); }
  for (const s of l.scenery) if (GLOW_SCENERY.has(s.id)) {
    const p = centre(v, l, s.cell), lamp = s.id === 'lamp' || s.id === 'lighthouse';
    const color = s.id === 'blinker' ? ((w.state.get(s.cell) ?? 0) > .5 ? 'rgba(60,255,140,.7)' : 'rgba(255,60,60,.7)') : s.id === 'gates' && (w.state.get(s.cell) ?? 0) > .1 ? 'rgba(255,60,60,.6)' : s.id === 'wheel' ? `hsla(${(w.t * 60) % 360},90%,60%,.5)` : 'rgba(255,214,120,.45)';
    lights.push({ ...p, r: S * (lamp ? 1.8 : 1.15), color });
    if (s.id === 'lighthouse') { const d = w.t * 1.2; lights.push({ x: p.x + Math.cos(d) * S * 1.8, y: p.y + Math.sin(d) * S * 1.8, r: S * 1.3, color: 'rgba(255,240,180,.35)' }); }
  }
  const train = o.train;
  w.pieces.forEach((p, i) => {
    if (i === 0) { lights.push({ x: p.sx + Math.cos(p.sa) * S * 1.1, y: p.sy + Math.sin(p.sa) * S * 1.1, r: S * 1.5, color: 'rgba(255,245,200,.35)' }); lights.push({ x: p.sx, y: p.sy, r: S * .7, color: 'rgba(255,230,160,.2)' }); return; }
    const id = train?.cars[i - 1];
    if (id && GLOW_CARS.has(id)) lights.push({ x: p.sx, y: p.sy, r: S * (id === 'searchlight' ? 2.4 : .95), color: 'rgba(255,220,120,.5)' });
  });
  if (!night) {
    // a sunset: warm light over the table, a little dim, the lamps just on
    screen(c, v);
    c.fillStyle = 'rgba(255,120,50,.16)'; c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = 'rgba(70,20,100,.16)'; c.fillRect(r.x, r.y, r.w, r.h);
    additive(c, v, lights.map(x => ({ ...x, r: x.r * .7 })));
    return;
  }
  const W = Math.ceil(v.w / 2), H = Math.ceil(v.h / 2);
  if (!dark) dark = document.createElement('canvas');
  if (dark.width !== W || dark.height !== H) { dark.width = W; dark.height = H; }
  const d = dark.getContext('2d')!;
  d.setTransform(.5, 0, 0, .5, 0, 0);
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, v.w, v.h);
  d.fillStyle = 'rgba(6,12,44,.68)';
  roundRect(d, r.x - S * .2, r.y - S * .2, r.w + S * .4, r.h + S * .4, S * .4); d.fill();
  d.globalCompositeOperation = 'destination-out';
  for (const p of lights) {
    const g = d.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g; d.beginPath(); d.arc(p.x, p.y, p.r, 0, 6.283); d.fill();
  }
  const rails = railsOf(o.rails ?? 'wood');
  if (rails.look === 'glow') { gridSpace(d, { ...v, dpr: .5 }, l); d.lineWidth = .6; d.strokeStyle = 'rgba(0,0,0,.75)'; trackLines(d, l); }
  d.globalCompositeOperation = 'source-over';
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(dark, 0, 0, W, H, 0, 0, v.w * v.dpr, v.h * v.dpr);
  additive(c, v, lights);
  if (rails.look === 'glow') { gridSpace(c, v, l); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .45 + Math.sin(w.t * 2) * .1; c.lineWidth = .32; c.strokeStyle = rails.strip; trackLines(c, l); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
}
function additive(c: CanvasRenderingContext2D, v: View, lights: readonly { x: number; y: number; r: number; color: string }[]) {
  screen(c, v);
  c.globalCompositeOperation = 'lighter';
  for (const p of lights) {
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * .6);
    g.addColorStop(0, p.color); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * .6, 0, 6.283); c.fill();
  }
  c.globalCompositeOperation = 'source-over';
}
/** Every square of track as lines from its middle to its sides. */
function trackLines(c: CanvasRenderingContext2D, l: Layout) {
  const MID: Record<number, [number, number]> = { 1: [.5, 0], 2: [1, .5], 4: [.5, 1], 8: [0, .5] };
  c.beginPath();
  l.cells.forEach((m, cell) => { if (!m) return; const { x, y } = xyOf(l, cell); for (const d of bits(m)) { c.moveTo(x + .5, y + .5); c.lineTo(x + MID[d]![0], y + MID[d]![1]); } });
  c.stroke();
}

// ---------- the weather ----------

const SKY_COUNT: Partial<Record<SkyId, number>> = { rain: 70, storm: 110, snow: 70, leaves: 16, petals: 30, bubbles: 18, clouds: 5, fireflies: 24, balloons: 10 };

function drawWeather(c: CanvasRenderingContext2D, v: View, l: Layout, w: World, kind: SkyId, dt: number) {
  const r = tableRect(v, l), S = v.cell, sky = w.sky, want = SKY_COUNT[kind] ?? 0;
  screen(c, v);
  c.save();
  c.beginPath(); c.rect(r.x - S * .2, r.y - S * .2, r.w + S * .4, r.h + S * .4); c.clip();
  // keep the sky topped up: new ones come in from the top (or the bottom, for things that rise)
  const rises = kind === 'bubbles' || kind === 'balloons';
  const spawn = (fresh: boolean) => {
    const x = rnd(r.x, r.x + r.w + (kind === 'rain' || kind === 'storm' ? r.h * .25 : 0)), y = fresh ? rnd(r.y, r.y + r.h) : rises ? r.y + r.h + S : r.y - S * rnd(.2, 1.5);
    switch (kind) {
      case 'rain': case 'storm': add(w, { x, y, vx: -S * 2, vy: S * (kind === 'storm' ? 12 : 9), life: 99, size: 1.5, color: 'rgba(200,225,255,.75)', kind: 'line' }, sky); break;
      case 'snow': add(w, { x, y, vx: 0, vy: S * rnd(.5, .9), wob: .8, life: 99, size: S * rnd(.05, .1), color: '#ffffff' }, sky); break;
      case 'leaves': add(w, { x, y, vy: S * rnd(.4, .7), wob: 1.4, vr: rnd(-1.5, 1.5), life: 99, size: S * .4, kind: 'sprite', text: pick(['🍂', '🍁']) }, sky); break;
      case 'petals': add(w, { x, y, vy: S * rnd(.35, .6), wob: 1.6, vr: rnd(-2, 2), life: 99, size: S * .07, color: pick(['#ffc0d8', '#ff9ec7', '#fff0f6']), kind: 'rect' }, sky); break;
      case 'bubbles': add(w, { x, y, vy: -S * rnd(.4, .7), wob: .8, life: 99, size: S * rnd(.12, .28), kind: 'bubble' }, sky); break;
      case 'balloons': add(w, { x, y, vy: -S * rnd(.35, .55), wob: .6, life: 99, size: S * .55, kind: 'sprite', text: '🎈' }, sky); break;
      case 'clouds': add(w, { x: fresh ? x : r.x - S * 2, y: rnd(r.y, r.y + r.h), vx: S * rnd(.15, .3), life: 99, size: S * rnd(.9, 1.4), color: '#ffffff', kind: 'soft', alpha: .55 }, sky); break;
      case 'fireflies': add(w, { x, y: rnd(r.y, r.y + r.h), vx: rnd(-.3, .3) * S, vy: rnd(-.3, .3) * S, wob: 1, life: 99, size: S * .08, color: '#d8ff6a', add: true }, sky); break;
    }
  };
  if (w.skyKind !== kind) { sky.length = 0; w.skyKind = kind; w.nextSky = 1; while (sky.length < want) spawn(true); }
  for (const p of sky) {
    p.vx += 0; p.x += p.vx * dt + (p.wob ? Math.sin(w.t * 2 + p.rot) * p.wob * S * dt * .6 : 0); p.y += p.vy * dt; p.rot += p.vr * dt;
    if (kind === 'fireflies') { p.vx += rnd(-1, 1) * S * dt; p.vy += rnd(-1, 1) * S * dt; p.vx *= .98; p.vy *= .98; }
    const out = p.y > r.y + r.h + S * 1.2 || p.y < r.y - S * 2 || p.x < r.x - S * 3 || p.x > r.x + r.w + S * 3;
    if (out) p.life = 0;
  }
  for (let i = sky.length - 1; i >= 0; i--) if (sky[i]!.life <= 0) { sky.splice(i, 1); spawn(false); }
  if (kind === 'fireflies') for (const p of sky) p.alpha = .5 + .5 * Math.sin(w.t * 3 + p.rot);
  drawParts(c, v, sky);
  screen(c, v);
  // the weathers that happen now and then
  w.nextSky -= dt;
  if (kind === 'storm') {
    c.fillStyle = 'rgba(30,40,70,.18)'; c.fillRect(r.x, r.y, r.w, r.h);
    if (w.nextSky <= 0) { w.nextSky = rnd(5, 9); w.flash = .3; noise({ dur: 1.6, vol: .22, type: 'lowpass', f: 160, f2: 50, when: .35 }); }
    if (w.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(.7, w.flash * 2.5)})`; c.fillRect(r.x, r.y, r.w, r.h); }
  }
  if (kind === 'shooting' && w.nextSky <= 0) {
    w.nextSky = rnd(1, 2.4);
    const x = rnd(r.x, r.x + r.w * .7), y = rnd(r.y, r.y + r.h * .4);
    add(w, { x, y, vx: S * 6, vy: S * 2.5, life: .7, size: 3, color: '#ffffff', kind: 'line', add: true });
    for (let k = 1; k < 6; k++) add(w, { x: x - k * S * .25, y: y - k * S * .1, vx: S * 6, vy: S * 2.5, life: .7 - k * .05, size: 2, color: '#fff6c0', kind: 'line', add: true });
  }
  if (kind === 'fireworks' && w.nextSky <= 0) {
    w.nextSky = rnd(.7, 1.5);
    burst(w, rnd(r.x + S, r.x + r.w - S), rnd(r.y + S, r.y + r.h * .6), S);
    noise({ dur: .3, vol: .12, type: 'lowpass', f: 1200 });
  }
  if (kind === 'rainbowsky') {
    const cx = r.x + r.w / 2, cy = r.y + r.h * 1.05, rad = Math.min(r.w * .48, r.h * .95);
    c.globalAlpha = .32;
    c.lineWidth = rad * .06;
    RAIN.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, rad - i * rad * .06, Math.PI, 0); c.stroke(); });
    c.globalAlpha = 1;
  }
  if (kind === 'aurora') {
    c.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) {
      const g = c.createLinearGradient(0, r.y, 0, r.y + r.h * .55);
      g.addColorStop(0, ['rgba(80,255,170,.0)', 'rgba(160,90,255,.0)', 'rgba(80,220,255,.0)'][b]!);
      g.addColorStop(.5, ['rgba(80,255,170,.28)', 'rgba(160,90,255,.22)', 'rgba(80,220,255,.2)'][b]!);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(r.x, r.y + r.h * .55);
      for (let i = 0; i <= 24; i++) { const x = r.x + (r.w * i) / 24; c.lineTo(x, r.y + r.h * (.12 + b * .08) + Math.sin(i * .6 + w.t * (.7 + b * .3) + b) * S * .8); }
      c.lineTo(r.x + r.w, r.y + r.h * .55);
      c.closePath(); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}

