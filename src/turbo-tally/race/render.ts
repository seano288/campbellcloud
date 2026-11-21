// Draws a Race on a 2D canvas, from above, with the camera following his car: the ground and its scenery, the track with its kerbs and
// start line, skid marks, dust and boost puffs, the cars, his finger's spot, and a little map of the whole track. It reads the race and
// never changes it. Moving pieces are capped (MAX_SKIDS, MAX_PUFFS) so three rivals, skids and boost flames hold 60 fps on an iPad 9.
import { drawCarTop, type Look } from '../art/car';
import { CAR_R, type Race, type RaceEvent } from './sim';
import { laid, type CupId, type Laid, type Pt, type TrackDef } from './tracks';

export const MAX_SKIDS = 140, MAX_PUFFS = 60;
/** World units seen across the screen's short side. */
const VIEW = 760;
const TAU = Math.PI * 2;

interface Theme { ground: string; ground2: string; road: string; edge: string; kerb: readonly [string, string]; line: string | null; deco: 'tree' | 'rock' | 'cactus' | 'pine' | 'building' | 'lava' | 'palm' | 'lollipop' | 'crater' | 'cloud'; bands?: readonly string[] }
export const THEMES: Record<CupId, Theme> = {
  tarmac: { ground: '#4caf50', ground2: '#43a047', road: '#5b5f66', edge: '#e6e9ef', kerb: ['#e63946', '#ffffff'], line: '#ffffffaa', deco: 'tree' },
  dirt: { ground: '#8d9440', ground2: '#7f8638', road: '#9a6b3f', edge: '#6e4a2a', kerb: ['#e63946', '#ffd23f'], line: null, deco: 'rock' },
  sand: { ground: '#f2d38a', ground2: '#e8c677', road: '#d4a95c', edge: '#b88a3f', kerb: ['#ff8a1f', '#ffffff'], line: null, deco: 'cactus' },
  snow: { ground: '#eef6fb', ground2: '#e1edf5', road: '#b9d6ea', edge: '#8fb5d1', kerb: ['#2f6fd6', '#ffffff'], line: '#ffffffcc', deco: 'pine' },
  night: { ground: '#1b1f33', ground2: '#22273d', road: '#3a3f4b', edge: '#ffd23f', kerb: ['#ff3ccf', '#39ff88'], line: '#ffd23faa', deco: 'building' },
  volcano: { ground: '#3b2320', ground2: '#46291f', road: '#5a4038', edge: '#2a1a16', kerb: ['#ff5a10', '#2a1a16'], line: null, deco: 'lava' },
  jungle: { ground: '#2f7d3a', ground2: '#2a7034', road: '#8a5a32', edge: '#5a3a1e', kerb: ['#ffd23f', '#1f6b3a'], line: null, deco: 'palm' },
  candy: { ground: '#ffd6ec', ground2: '#ffc4e3', road: '#fff4fa', edge: '#ff7ac8', kerb: ['#ff3c8a', '#ffffff'], line: '#8ed8ffcc', deco: 'lollipop' },
  moon: { ground: '#2a2d3a', ground2: '#30334a', road: '#8a8d99', edge: '#5b5f6e', kerb: ['#bfe8ff', '#2a2d3a'], line: null, deco: 'crater' },
  rainbow: { ground: '#7cc8ff', ground2: '#86cdff', road: '#ffffff', edge: '#ffffff', kerb: ['#ffffff', '#ffd23f'], line: null, deco: 'cloud',
    bands: ['#e63946', '#ff8a1f', '#ffd23f', '#3cb15b', '#3a8dde', '#8e5bd8'] },
};

interface Skid { x1: number; y1: number; x2: number; y2: number; life: number }
interface Puff { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string }
interface Deco { x: number; y: number; r: number; k: number }

function pathOf(t: Laid) {
  const p = new Path2D();
  t.pts.forEach((q, i) => (i ? p.lineTo(q.x, q.y) : p.moveTo(q.x, q.y)));
  p.closePath();
  return p;
}

/** Scenery scattered round the track, never on it: the same every time for a track. */
function scenery(t: Laid): Deco[] {
  let s = t.pts.length * 7919;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out: Deco[] = [];
  for (let i = 0; i < 260 && out.length < 90; i++) {
    const x = t.box.x0 - 300 + rand() * (t.box.x1 - t.box.x0 + 600), y = t.box.y0 - 300 + rand() * (t.box.y1 - t.box.y0 + 600);
    let near = Infinity;
    for (let j = 0; j < t.pts.length; j += 3) near = Math.min(near, Math.hypot(t.pts[j]!.x - x, t.pts[j]!.y - y));
    if (near > t.half + 70) out.push({ x, y, r: 22 + rand() * 26, k: rand() });
  }
  return out;
}

function drawDeco(c: CanvasRenderingContext2D, d: Deco, kind: Theme['deco'], t: number) {
  c.lineWidth = 3; c.strokeStyle = '#14161b';
  switch (kind) {
    case 'tree': c.fillStyle = '#2e7d32'; c.beginPath(); c.arc(d.x, d.y, d.r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#66bb6a'; c.beginPath(); c.arc(d.x - d.r * .3, d.y - d.r * .3, d.r * .45, 0, TAU); c.fill(); break;
    case 'pine': c.fillStyle = '#1f6b3a'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, rr = i % 2 ? d.r * .5 : d.r; c.lineTo(d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(d.x, d.y, d.r * .25, 0, TAU); c.fill(); break;
    case 'rock': c.fillStyle = '#7d7468'; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * .7, d.k * 3, 0, TAU); c.fill(); c.stroke(); break;
    case 'cactus': c.fillStyle = '#3f8f3a'; c.beginPath(); c.arc(d.x, d.y, d.r * .55, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#5fbf55'; for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + d.k; c.beginPath(); c.arc(d.x + Math.cos(a) * d.r * .7, d.y + Math.sin(a) * d.r * .7, d.r * .25, 0, TAU); c.fill(); c.stroke(); } break;
    case 'building': {
      const w = d.r * 2, h = d.r * 1.6;
      c.fillStyle = '#2c3350'; c.fillRect(d.x - w / 2, d.y - h / 2, w, h); c.strokeRect(d.x - w / 2, d.y - h / 2, w, h);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j + Math.floor(d.k * 9)) % 3 ? '#ffd23f' : '#3d4570'; c.fillRect(d.x - w / 2 + 6 + i * (w - 12) / 3, d.y - h / 2 + 6 + j * (h - 12) / 2, (w - 12) / 3 - 5, (h - 12) / 2 - 5); }
      break;
    }
    case 'palm': {
      c.fillStyle = '#7a4a26'; c.beginPath(); c.arc(d.x, d.y, d.r * .22, 0, TAU); c.fill();
      c.fillStyle = '#3cb15b';
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + d.k * 3; c.beginPath(); c.ellipse(d.x + Math.cos(a) * d.r * .55, d.y + Math.sin(a) * d.r * .55, d.r * .6, d.r * .2, a, 0, TAU); c.fill(); c.stroke(); }
      c.fillStyle = '#7a4a26'; c.beginPath(); c.arc(d.x, d.y, d.r * .2, 0, TAU); c.fill(); c.stroke();
      break;
    }
    case 'lollipop': {
      const cols = ['#ff3c8a', '#3a8dde', '#ffd23f', '#3cb15b', '#8e5bd8'], col = cols[Math.floor(d.k * cols.length)]!;
      c.fillStyle = col; c.beginPath(); c.arc(d.x, d.y, d.r * .8, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = d.r * .12; c.beginPath();
      for (let a = 0; a < TAU * 2; a += .25) c.lineTo(d.x + Math.cos(a + d.k * 6) * a * d.r * .055, d.y + Math.sin(a + d.k * 6) * a * d.r * .055);
      c.stroke();
      break;
    }
    case 'crater': {
      c.fillStyle = '#1d2030'; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * .85, d.k * 3, 0, TAU); c.fill();
      c.strokeStyle = '#4a4e63'; c.lineWidth = d.r * .18; c.stroke();
      if (d.k > .6) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(d.x + d.r * 1.6, d.y - d.r, 2.5, 0, TAU); c.fill(); }
      break;
    }
    case 'cloud': {
      c.fillStyle = '#ffffff';
      for (const [dx, dy, rr] of [[-.6, .1, .55], [0, -.15, .75], [.6, .1, .55], [0, .25, .6]] as const) { c.beginPath(); c.arc(d.x + dx * d.r, d.y + dy * d.r, rr * d.r, 0, TAU); c.fill(); }
      break;
    }
    case 'lava': {
      const glow = .7 + Math.sin(t * 2 + d.k * 9) * .3;
      c.fillStyle = `rgba(255,90,16,${glow})`; c.beginPath(); c.ellipse(d.x, d.y, d.r * 1.1, d.r * .8, d.k * 3, 0, TAU); c.fill();
      c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(d.x, d.y, d.r * .5, d.r * .35, d.k * 3, 0, TAU); c.fill();
      break;
    }
  }
}

export interface Stage {
  frame(r: Race, t: number, finger: Pt | null): void;
  /** Where a point on the screen (CSS pixels from the canvas's corner) is on the track. */
  toWorld(x: number, y: number): Pt;
  /** And back: where a point on the track is on the screen. */
  toScreen(p: Pt): Pt;
  take(r: Race, events: readonly RaceEvent[]): void;
}

export function createStage(canvas: HTMLCanvasElement, def: TrackDef, looks: readonly Look[], reduced: boolean): Stage {
  const c = canvas.getContext('2d')!, track = laid(def), theme = THEMES[def.cup], road = pathOf(track), decos = scenery(track);
  let skids: Skid[] = [], puffs: Puff[] = [], cam = { x: 0, y: 0, k: 1, w: 1, h: 1, dpr: 1 }, last = 0, shake = 0;
  const puff = (x: number, y: number, n: number, color: string, speed: number, size = 8) => {
    if (reduced) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      if (puffs.length >= MAX_PUFFS) puffs.shift();
      const a = Math.random() * TAU, v = speed * (.3 + Math.random() * .7), life = .3 + Math.random() * .4;
      puffs.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, size: size * (.6 + Math.random() * .6), color });
    }
  };
  const dust = def.surface === 'tarmac' ? '#c9ccd6' : def.surface === 'snow' ? '#ffffff' : def.surface === 'sand' ? '#f6e2a8' : '#b98b5a';
  const spanX = track.box.x1 - track.box.x0, spanY = track.box.y1 - track.box.y0;

  function take(r: Race, events: readonly RaceEvent[]) {
    for (const e of events) {
      if (e.t === 'wall') { puff(e.x, e.y, 8, dust, 160, 10); if (e.car === 0) shake = Math.min(14, shake + 6 * e.hard); }
      if (e.t === 'bump') { puff(e.x, e.y, 10, '#ffd23f', 220, 7); shake = Math.min(14, shake + 4); }
      if (e.t === 'boost') { const car = r.cars[e.car]!; puff(car.x, car.y, 12, '#ff9a1e', 200, 9); }
    }
  }

  return {
    take,
    toWorld(x, y) { return { x: cam.x + (x * cam.dpr - cam.w / 2) / cam.k, y: cam.y + (y * cam.dpr - cam.h / 2) / cam.k }; },
    toScreen(p) { return { x: ((p.x - cam.x) * cam.k + cam.w / 2) / cam.dpr, y: ((p.y - cam.y) * cam.k + cam.h / 2) / cam.dpr }; },
    frame(r, t, finger) {
      const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const dt = last ? Math.min(.05, t - last) : 0;
      last = t;
      const you = r.cars[0]!, k = Math.min(w, h) / VIEW;
      // the camera looks a little ahead of him
      const tx = you.x + you.vx * .35, ty = you.y + you.vy * .35;
      cam = { x: cam.w === 1 ? tx : cam.x + (tx - cam.x) * Math.min(1, dt * 4), y: cam.w === 1 ? ty : cam.y + (ty - cam.y) * Math.min(1, dt * 4), k, w, h, dpr };
      shake = Math.max(0, shake - dt * 40);
      const sx = reduced ? 0 : (Math.random() - .5) * shake, sy = reduced ? 0 : (Math.random() - .5) * shake;

      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = theme.ground; c.fillRect(0, 0, w, h);
      c.setTransform(k, 0, 0, k, w / 2 - cam.x * k + sx, h / 2 - cam.y * k + sy);
      const x0 = cam.x - w / 2 / k - 80, x1 = cam.x + w / 2 / k + 80, y0 = cam.y - h / 2 / k - 80, y1 = cam.y + h / 2 / k + 80;
      // a checker of lighter ground, so movement shows
      c.fillStyle = theme.ground2;
      const g = 160;
      for (let gx = Math.floor(x0 / g) * g; gx < x1; gx += g) for (let gy = Math.floor(y0 / g) * g; gy < y1; gy += g) if (((gx + gy) / g) % 2 === 0) c.fillRect(gx, gy, g, g);
      for (const d of decos) if (d.x > x0 && d.x < x1 && d.y > y0 && d.y < y1) drawDeco(c, d, theme.deco, t);
      // the track: kerbs, the edge, the surface, the centre line
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = theme.kerb[0]; c.lineWidth = def.width + 22; c.stroke(road);
      c.setLineDash([36, 36]); c.strokeStyle = theme.kerb[1]; c.stroke(road); c.setLineDash([]);
      c.strokeStyle = theme.edge; c.lineWidth = def.width + 6; c.stroke(road);
      c.strokeStyle = theme.road; c.lineWidth = def.width - 4; c.stroke(road);
      // the Rainbow Cup's road is striped in rainbow bands, side to side
      if (theme.bands) theme.bands.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = (def.width - 4) * (1 - i / theme.bands!.length); c.stroke(road); });
      if (theme.line) { c.setLineDash([30, 40]); c.strokeStyle = theme.line; c.lineWidth = 5; c.stroke(road); c.setLineDash([]); }
      // the start line, chequered across the track
      const p0 = track.pts[0]!, d0 = track.dir[0]!, nx = -d0.y, ny = d0.x, sq = 18, rows = Math.ceil(def.width / sq);
      for (let i = 0; i < rows; i++) for (let j = 0; j < 2; j++) {
        c.fillStyle = (i + j) % 2 ? '#ffffff' : '#14161b';
        const a = -def.width / 2 + i * sq, bx = p0.x + nx * a + d0.x * (j * sq - sq), by = p0.y + ny * a + d0.y * (j * sq - sq);
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + nx * sq, by + ny * sq); c.lineTo(bx + nx * sq + d0.x * sq, by + ny * sq + d0.y * sq); c.lineTo(bx + d0.x * sq, by + d0.y * sq); c.closePath(); c.fill();
      }
      // skid marks: a car sliding leaves a pair of lines
      for (const car of r.cars) if (car.slip > .3 && Math.hypot(car.vx, car.vy) > 140) {
        const bx = car.x - Math.cos(car.heading) * 20, by = car.y - Math.sin(car.heading) * 20, px = -Math.sin(car.heading) * 14, py = Math.cos(car.heading) * 14;
        for (const s of [-1, 1]) { if (skids.length >= MAX_SKIDS) skids.shift(); skids.push({ x1: bx + px * s, y1: by + py * s, x2: bx + px * s - car.vx * dt, y2: by + py * s - car.vy * dt, life: 3 }); }
      }
      c.lineCap = 'round'; c.lineWidth = 6;
      skids = skids.filter(s => (s.life -= dt) > 0);
      for (const s of skids) { c.strokeStyle = `rgba(20,22,27,${Math.min(.45, s.life * .2)})`; c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke(); }
      // dust behind fast cars on loose ground, and boost puffs
      for (const [i, car] of r.cars.entries()) {
        if (car.boosting > 0 && Math.random() < .5) puff(car.x - Math.cos(car.heading) * 34, car.y - Math.sin(car.heading) * 34, 1, '#ffb02e', 60, 9);
        else if (def.surface !== 'tarmac' && Math.hypot(car.vx, car.vy) > 200 && Math.random() < (i === 0 ? .35 : .15)) puff(car.x - Math.cos(car.heading) * 30, car.y - Math.sin(car.heading) * 30, 1, dust, 40, 9);
      }
      puffs = puffs.filter(p => (p.life -= dt) > 0);
      for (const p of puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; c.globalAlpha = Math.max(0, p.life / p.max) * .8; c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.size * (1.6 - p.life / p.max), 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      // his finger's spot
      if (finger) { c.strokeStyle = '#ffd23f'; c.lineWidth = 5; c.beginPath(); c.arc(finger.x, finger.y, 22 + Math.sin(t * 8) * 3, 0, TAU); c.stroke(); }
      // the cars, his last so it's on top, with a ring under it
      for (let i = r.cars.length - 1; i >= 0; i--) {
        const car = r.cars[i]!;
        c.save(); c.translate(car.x, car.y);
        if (i === 0) { c.fillStyle = '#ffd23f55'; c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, CAR_R + 20, 0, TAU); c.fill(); c.stroke(); }
        c.rotate(car.heading);
        drawCarTop(c, looks[i]!, { boosting: car.boosting > 0, t });
        c.restore();
      }
      // night city and the moon: a dark wash with light round each car
      if (def.cup === 'night' || def.cup === 'moon') {
        c.setTransform(1, 0, 0, 1, 0, 0);
        const grd = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.max(w, h) * .7);
        grd.addColorStop(0, '#00000000'); grd.addColorStop(1, '#000000aa');
        c.fillStyle = grd; c.fillRect(0, 0, w, h);
      }
      // the little map, top right
      c.setTransform(1, 0, 0, 1, 0, 0);
      const m = Math.min(120, (Math.min(w, h) / dpr) * .26) * dpr, mx = w - m - 24 * dpr, my = 78 * dpr; // in from the side like the controls, smaller on a phone
      c.fillStyle = '#00000088'; c.beginPath(); c.roundRect(mx - 8 * dpr, my - 8 * dpr, m + 16 * dpr, m + 16 * dpr, 14 * dpr); c.fill();
      const ms = m / Math.max(spanX, spanY);
      c.setTransform(ms, 0, 0, ms, mx + (m - spanX * ms) / 2 - track.box.x0 * ms, my + (m - spanY * ms) / 2 - track.box.y0 * ms);
      c.strokeStyle = '#ffffff'; c.lineWidth = (5 * dpr) / ms; c.stroke(road);
      for (let i = r.cars.length - 1; i >= 0; i--) {
        const car = r.cars[i]!, col = i === 0 ? '#ffd23f' : '#e63946';
        c.fillStyle = col; c.strokeStyle = '#000'; c.lineWidth = (2 * dpr) / ms; c.beginPath(); c.arc(car.x, car.y, ((i === 0 ? 7 : 5) * dpr) / ms, 0, TAU); c.fill(); c.stroke();
      }
    },
  };
}
