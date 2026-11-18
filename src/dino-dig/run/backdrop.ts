// The run's scenery for each land, painted once into a few canvases when the run starts or the screen changes size, then only copied
// each frame (the iPad 9's limit is fill rate, so a frame is a handful of drawImage calls whatever the land has in it):
//   sky: the sky, its sun or moon, clouds or stars, and the land's far shape (mesas, peaks, a volcano, the sea, hills) on the horizon,
//        all so far away they stay put (one layer fewer to fill each frame than sliding it);
//   near: nearer hills or dunes, sliding behind him;
//   ground: the ground he walks on, in layers with pebbles, sliding with him.
// The near and ground strips repeat seamlessly: each is one period wide and drawn twice side by side.
import { layer } from '../art/loop';
import type { LandId } from '../shop/shop';

interface Scenery {
  far: 'mesa' | 'peaks' | 'volcano' | 'sea' | 'hills';
  farCol: string; farShade: string;
  near: 'hills' | 'dunes' | 'rocks';
  nearCol: string;
  light: 'sun' | 'moon' | 'glow';
  clouds: boolean;
}
const SCENERY: Record<LandId, Scenery> = {
  forest: { far: 'hills', farCol: '#8fbf9a', farShade: '#7aae86', near: 'hills', nearCol: '#6f9f4a', light: 'sun', clouds: true },
  beach: { far: 'sea', farCol: '#3a9fd8', farShade: '#7fd0f5', near: 'dunes', nearCol: '#f3dc9e', light: 'sun', clouds: true },
  swamp: { far: 'hills', farCol: '#9db48a', farShade: '#8aa476', near: 'hills', nearCol: '#6d7f45', light: 'sun', clouds: true },
  desert: { far: 'mesa', farCol: '#d98a4e', farShade: '#c4733c', near: 'dunes', nearCol: '#e6b873', light: 'sun', clouds: false },
  snow: { far: 'peaks', farCol: '#a9c3dc', farShade: '#f4f8fb', near: 'hills', nearCol: '#e3edf5', light: 'sun', clouds: true },
  volcano: { far: 'volcano', farCol: '#3a2a28', farShade: '#ff7a1a', near: 'rocks', nearCol: '#2f2422', light: 'glow', clouds: false },
  night: { far: 'hills', farCol: '#262c5a', farShade: '#1d2248', near: 'hills', nearCol: '#1f3a24', light: 'moon', clouds: false },
  candy: { far: 'hills', farCol: '#ffd0ea', farShade: '#ffffff', near: 'hills', nearCol: '#ffb0d8', light: 'sun', clouds: true },
};

export interface Backdrop { key: string; sky: HTMLCanvasElement; near: HTMLCanvasElement; ground: HTMLCanvasElement; nearTop: number }

const TAU = Math.PI * 2;
const INK = '#1b1410';

/** Paints the scenery for a land at this size: `gy` is the ground line, `sc` pixels per world unit. */
export function paintBackdrop(land: { id: LandId; sky: readonly [string, string]; ground: string; ground2: string }, cw: number, ch: number, gy: number, sc: number): Backdrop {
  const s = SCENERY[land.id], P = Math.ceil(Math.max(cw, 1400 * sc));
  // ---------- the sky ----------
  const sky = layer(cw, gy), c = sky.ctx;
  const g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, land.sky[0]); g.addColorStop(1, land.sky[1]);
  c.fillStyle = g; c.fillRect(0, 0, cw, gy);
  const lx = cw * .78, ly = Math.min(gy * .3, 170 * sc), lr = 46 * sc;
  if (s.light === 'sun') {
    const halo = c.createRadialGradient(lx, ly, lr * .8, lx, ly, lr * 3); halo.addColorStop(0, '#fff6c880'); halo.addColorStop(1, '#fff6c800');
    c.fillStyle = halo; c.fillRect(lx - lr * 3, ly - lr * 3, lr * 6, lr * 6);
    c.fillStyle = '#ffe58a'; c.strokeStyle = INK; c.lineWidth = 4 * sc; c.beginPath(); c.arc(lx, ly, lr, 0, TAU); c.fill(); c.stroke();
  } else if (s.light === 'moon') {
    for (let i = 0; i < 70; i++) { c.fillStyle = i % 5 ? '#ffffffaa' : '#fff'; const r = (i % 5 ? 1.2 : 2) * Math.max(1, sc); c.fillRect((i * 97.3 + 13) % cw, (i * 41) % Math.max(1, gy * .7), r, r); }
    c.fillStyle = '#f4f0d8'; c.strokeStyle = INK; c.lineWidth = 4 * sc; c.beginPath(); c.arc(lx, ly, lr, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#d9d3b4'; for (const [dx, dy, r] of [[-.3, -.2, .22], [.25, .2, .16], [.1, -.35, .1]] as const) { c.beginPath(); c.arc(lx + dx * lr, ly + dy * lr, r * lr, 0, TAU); c.fill(); }
  } else {
    // the volcano's sky: a red glow low down and drifting ash
    const glow = c.createRadialGradient(cw * .5, gy, 0, cw * .5, gy, gy * .9); glow.addColorStop(0, '#ff8a3d66'); glow.addColorStop(1, '#ff8a3d00');
    c.fillStyle = glow; c.fillRect(0, 0, cw, gy);
    c.fillStyle = '#00000030'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((i * 131.7) % cw, (i * 71.3) % (gy * .8), (1.5 + (i % 3)) * sc, 0, TAU); c.fill(); }
  }
  if (s.clouds) {
    c.fillStyle = land.id === 'candy' ? '#fff' : '#ffffffd8'; c.strokeStyle = '#1b141033'; c.lineWidth = 3 * sc;
    for (let i = 0; i < 4; i++) {
      const x = ((i * .29 + .06) % 1) * cw, y = Math.min(gy * .5, (70 + (i % 2) * 60) * sc), k = (32 + (i % 3) * 10) * sc;
      c.beginPath(); c.arc(x, y, k, Math.PI, 0); c.arc(x + k * 1.2, y + k * .1, k * .8, Math.PI * 1.1, .2); c.arc(x - k * 1.1, y + k * .2, k * .65, Math.PI * .8, 1.95 * Math.PI);
      c.lineTo(x + k * 1.9, y + k * .45); c.lineTo(x - k * 1.7, y + k * .45); c.closePath(); c.fill();
    }
  }

  // ---------- the far shape ----------
  const farH = Math.min(gy, 330 * sc), far = layer(P, farH), f = far.ctx;
  const wave = (x: number, parts: readonly (readonly [number, number, number])[]) => parts.reduce((h, [n, a, ph]) => h + Math.sin((x / P) * TAU * n + ph) * a, 0);
  const ridge = (h: (x: number) => number, fill: string | CanvasGradient, line = true) => {
    f.beginPath(); f.moveTo(0, farH);
    for (let x = 0; x <= P; x += Math.max(4, 6 * sc)) f.lineTo(x, farH - h(x));
    f.lineTo(P, farH); f.closePath(); f.fillStyle = fill; f.fill();
    if (line) { f.strokeStyle = '#1b141055'; f.lineWidth = 3 * sc; f.stroke(); }
  };
  if (s.far === 'mesa') {
    // flat-topped sandstone buttes, banded in layers
    const h = (x: number) => { const v = Math.sin((x / P) * TAU * 3 + .5) * .6 + Math.sin((x / P) * TAU * 7) * .4; return (v > .15 ? 230 : v > -.2 ? 150 : 90) * sc; };
    ridge(h, s.farCol);
    f.save(); f.clip(); f.fillStyle = s.farShade; for (let y = farH - 220 * sc; y < farH; y += 34 * sc) f.fillRect(0, y, P, 9 * sc); f.restore();
  } else if (s.far === 'peaks') {
    const h = (x: number) => (150 + 110 * Math.pow(Math.abs(Math.sin((x / P) * Math.PI * 5)), 1.6) + 30 * Math.sin((x / P) * TAU * 11)) * sc;
    ridge(h, s.farCol);
    // snow caps
    f.save(); f.clip(); f.fillStyle = s.farShade; f.beginPath(); f.moveTo(0, 0);
    for (let x = 0; x <= P; x += 8 * sc) f.lineTo(x, farH - h(x) + 40 * sc + Math.sin(x / (14 * sc)) * 6 * sc);
    f.lineTo(P, 0); f.closePath(); f.fill(); f.restore();
  } else if (s.far === 'volcano') {
    const peak = (x: number) => { const d = Math.abs(((x / P) % 1) - .5) / .5; return Math.max(60, 300 * (1 - Math.pow(d, .7) * 1.25)) * sc; };
    const h = (x: number) => Math.min(peak(x), 270 * sc) + wave(x, [[9, 6, 0]]) * sc;
    ridge(h, s.farCol);
    // lava running down from the crater
    f.strokeStyle = s.farShade; f.lineWidth = 7 * sc; f.lineCap = 'round';
    for (const dx of [-30, 8, 38]) { f.beginPath(); f.moveTo(P / 2 + dx * sc * .5, farH - 266 * sc); f.quadraticCurveTo(P / 2 + dx * sc * 1.5, farH - 160 * sc, P / 2 + dx * sc * 3, farH - 40 * sc); f.stroke(); }
    const glow = f.createRadialGradient(P / 2, farH - 270 * sc, 0, P / 2, farH - 270 * sc, 70 * sc); glow.addColorStop(0, '#ffb347cc'); glow.addColorStop(1, '#ff7a1a00');
    f.fillStyle = glow; f.fillRect(P / 2 - 70 * sc, farH - 340 * sc, 140 * sc, 140 * sc);
  } else if (s.far === 'sea') {
    f.fillStyle = s.farCol; f.fillRect(0, farH - 60 * sc, P, 60 * sc);
    f.fillStyle = s.farShade; for (let x = 0; x < P; x += 90 * sc) f.fillRect(x + ((x / (90 * sc)) % 2) * 40 * sc, farH - 40 * sc + ((x / (90 * sc)) % 3) * 12 * sc, 34 * sc, 4 * sc);
    f.fillStyle = '#1b141055'; f.fillRect(0, farH - 60 * sc, P, 3 * sc);
  } else {
    ridge(x => (120 + wave(x, [[2, 50, .3], [5, 22, 1.1]])) * sc, s.farCol);
    ridge(x => (70 + wave(x, [[3, 30, 2], [7, 14, .4]])) * sc, s.farShade, false);
  }

  // painted a period wide (so its shapes are whole), then laid on the sky from a point that puts the volcano's crater in view
  c.drawImage(far.canvas, -Math.max(0, P / 2 - cw * .6), gy - farH);

  // ---------- the near shape ----------
  const nearH = Math.min(gy, 170 * sc), nearTop = gy - nearH, near = layer(P, nearH), n = near.ctx;
  const nh = s.near === 'dunes' ? (x: number) => (60 + wave(x, [[4, 34, .2], [9, 10, 1]])) * sc
    : s.near === 'rocks' ? (x: number) => (40 + Math.abs(wave(x, [[6, 40, .2], [13, 22, 1]]))) * sc
    : (x: number) => (70 + wave(x, [[3, 40, 1.4], [8, 16, .2]])) * sc;
  n.beginPath(); n.moveTo(0, nearH);
  for (let x = 0; x <= P; x += Math.max(4, 6 * sc)) n.lineTo(x, nearH - nh(x));
  n.lineTo(P, nearH); n.closePath(); n.fillStyle = s.nearCol; n.fill(); n.strokeStyle = '#1b141066'; n.lineWidth = 3 * sc; n.stroke();

  // ---------- the ground ----------
  const GP = Math.ceil(400 * sc) * Math.max(1, Math.ceil(cw / Math.ceil(400 * sc))), gh = Math.max(1, ch - gy), ground = layer(GP, gh), q = ground.ctx;
  q.fillStyle = land.ground; q.fillRect(0, 0, GP, gh);
  q.fillStyle = land.ground2;
  for (let y = 26 * sc, k = 0; y < gh; y += 30 * sc, k++) { q.globalAlpha = .55; q.fillRect(0, y, GP, (10 + (k % 2) * 6) * sc); }
  q.globalAlpha = 1;
  for (let i = 0; i < GP / (40 * sc); i++) {
    const x = (i * 40 + (i % 3) * 13) * sc, y = (12 + ((i * 37) % 70)) * sc, r = (4 + (i % 4) * 2) * sc;
    if (y + r > gh) continue;
    q.fillStyle = '#ffffff30'; q.beginPath(); q.arc(x, y, r, 0, TAU); q.fill(); q.strokeStyle = '#1b141040'; q.lineWidth = 2 * sc; q.stroke();
  }
  q.fillStyle = land.ground2; q.fillRect(0, 0, GP, 10 * sc);
  q.fillStyle = INK; q.fillRect(0, 0, GP, Math.max(2, 4 * sc));

  return { key: '', sky: sky.canvas, near: near.canvas, ground: ground.canvas, nearTop };
}

/** Draws a repeating strip across the screen, slid by `shift` pixels. */
export function strip(c: CanvasRenderingContext2D, img: HTMLCanvasElement, shift: number, y: number, cw: number) {
  const w = img.width, x0 = -(((shift % w) + w) % w);
  c.drawImage(img, x0, y);
  if (x0 + w < cw) c.drawImage(img, x0 + w, y);
}
