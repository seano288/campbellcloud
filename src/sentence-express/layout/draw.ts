// Draws his Layout on a 2D canvas: the pale wood table, wooden toy track (a tan strip with two grooves, worked out square by square
// from which sides it joins), points with a little lever showing which way they're set, stations beside the track, scenery, and the
// train itself (art/train.ts's drawTop). The table is drawn turned on its side when the screen is taller than wide, so the squares
// stay big on an upright iPad or phone. Emoji are always drawn upright.
//
// The table and track are drawn once into a cached layer and redrawn only when they change; each frame draws that, the train and
// what moves, so it holds 60 fps on an iPad 9.
import { drawTop, engineOf, carOf, roundRect, type Paint } from '../art/train';
import { DRAWN, sceneryArt } from '../art/scenery';
import { carAt, pointOn, SPACING, type Run } from '../delivery/run';
import { station, type StationId } from '../shed/catalogue';
import { bits, hasPoints, isEnd, isStraight, opposite, pointsParts, TRACK_SCENERY, xyOf, type Dir, type Layout } from './track';

const O = '#1d1d1f', WOOD = '#d8b47a', WOOD_EDGE = '#b8925a', TRACK = '#c99a5e', GROOVE = '#7a5230';
const EMO = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/** Where the table sits on the canvas: the size of a square in pixels, the corner, and whether it's turned on its side. */
export interface View { cell: number; ox: number; oy: number; rot: boolean; w: number; h: number; dpr: number }
export function viewFor(l: Pick<Layout, 'w' | 'h'>, w: number, h: number, dpr: number, pad = 10): View {
  const rot = h > w * 1.05;
  const gw = rot ? l.h : l.w, gh = rot ? l.w : l.h;
  const cell = Math.max(8, Math.min((w - 2 * pad) / gw, (h - 2 * pad) / gh));
  return { cell, ox: (w - gw * cell) / 2, oy: (h - gh * cell) / 2, rot, w, h, dpr };
}
/** A point on the table (in squares) to the screen (CSS pixels). */
export function toScreen(v: View, l: Pick<Layout, 'h'>, x: number, y: number) {
  return v.rot ? { x: v.ox + (l.h - y) * v.cell, y: v.oy + x * v.cell } : { x: v.ox + x * v.cell, y: v.oy + y * v.cell };
}
/** A point on the screen to the table, in squares. */
export function fromScreen(v: View, l: Pick<Layout, 'h'>, sx: number, sy: number) {
  return v.rot ? { x: (sy - v.oy) / v.cell, y: l.h - (sx - v.ox) / v.cell } : { x: (sx - v.ox) / v.cell, y: (sy - v.oy) / v.cell };
}
/** Sets the canvas to draw in squares. */
function gridSpace(c: CanvasRenderingContext2D, v: View, l: Pick<Layout, 'h'>) {
  const k = v.cell * v.dpr;
  if (v.rot) c.setTransform(0, k, -k, 0, (v.ox + l.h * v.cell) * v.dpr, v.oy * v.dpr);
  else c.setTransform(k, 0, 0, k, v.ox * v.dpr, v.oy * v.dpr);
}
/** Draws something upright at a point on the table: `f` draws at the origin, in CSS pixels. */
function upright(c: CanvasRenderingContext2D, v: View, l: Pick<Layout, 'h'>, x: number, y: number, f: () => void) {
  const p = toScreen(v, l, x, y);
  c.save();
  c.setTransform(v.dpr, 0, 0, v.dpr, p.x * v.dpr, p.y * v.dpr);
  f();
  c.restore();
}

const images = new Map<string, HTMLImageElement>();
function image(svg: string): HTMLImageElement | null {
  let img = images.get(svg);
  if (!img) { img = new Image(); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; images.set(svg, img); }
  return img.complete && img.naturalWidth ? img : null;
}

const MID: Record<Dir, [number, number]> = { 1: [.5, 0], 2: [1, .5], 4: [.5, 1], 8: [0, .5] };
/** The path of track from one side of a square to another, `off` to one side of its middle (for the grooves). */
function trackPath(c: CanvasRenderingContext2D, x: number, y: number, a: Dir, b: Dir, off: number) {
  const [ax, ay] = MID[a], [bx, by] = MID[b];
  if (opposite(a) === b) {
    const nx = -(by - ay), ny = bx - ax;
    c.moveTo(x + ax + nx * off, y + ay + ny * off);
    c.lineTo(x + bx + nx * off, y + by + ny * off);
    return;
  }
  const kx = ax === .5 ? bx : ax, ky = ay === .5 ? by : ay, a0 = Math.atan2(ay - ky, ax - kx), a1 = Math.atan2(by - ky, bx - kx);
  let d = a1 - a0;
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  c.arc(x + kx, y + ky, .5 + off, a0, a1, d < 0);
}

/** The ways through a square, for drawing: [from, to] pairs, and which are the way the points are set now. */
function waysOf(m: number, set: number): { a: Dir; b: Dir; on: boolean }[] {
  const ds = bits(m);
  if (ds.length === 2) return [{ a: ds[0]!, b: ds[1]!, on: true }];
  if (ds.length === 4) return [{ a: 1, b: 4, on: true }, { a: 2, b: 8, on: true }];
  if (ds.length === 3) {
    const { through, branch } = pointsParts(m);
    return [{ a: through[0], b: through[1], on: !set }, { a: branch, b: through[0], on: !!set }, { a: branch, b: through[1], on: !!set }];
  }
  return [];
}

function drawSquareTrack(c: CanvasRenderingContext2D, l: Layout, cell: number) {
  const m = l.cells[cell]!, { x, y } = xyOf(l, cell), set = l.points[cell] ?? 0;
  if (isEnd(m)) {
    // a loose end: the track runs in to a little turnaround loop
    const d = bits(m)[0]!, [mx, my] = MID[d], cx = x + .5 + (mx - .5) * .2, cy = y + .5 + (my - .5) * .2;
    for (const [w, col] of [[.62, O], [.5, TRACK]] as const) { c.lineWidth = w; c.strokeStyle = col; c.beginPath(); c.moveTo(x + mx, y + my); c.lineTo(cx, cy); c.stroke(); c.beginPath(); c.arc(x + .5 - (mx - .5) * .1, y + .5 - (my - .5) * .1, .26, 0, Math.PI * 2); c.stroke(); }
    return;
  }
  const ways = waysOf(m, set);
  // the wooden strip, outlined, then the grooves; the way the points are set drawn last and brightest
  for (const pass of [0, 1] as const) for (const w of [...ways].sort((p, q) => Number(p.on) - Number(q.on))) {
    c.lineCap = 'butt';
    if (pass === 0) {
      c.lineWidth = .64; c.strokeStyle = O; c.beginPath(); trackPath(c, x, y, w.a, w.b, 0); c.stroke();
      c.lineWidth = .52; c.strokeStyle = w.on ? TRACK : '#b8925a'; c.beginPath(); trackPath(c, x, y, w.a, w.b, 0); c.stroke();
    } else {
      c.lineWidth = .05; c.strokeStyle = w.on ? GROOVE : '#9a7a54';
      for (const off of [-.12, .12]) { c.beginPath(); trackPath(c, x, y, w.a, w.b, off); c.stroke(); }
    }
  }
  if (hasPoints(m)) {
    // the lever: a little red or green flag beside the square
    c.fillStyle = set ? '#2bb673' : '#e63946';
    c.strokeStyle = O; c.lineWidth = .05;
    c.beginPath(); c.arc(x + .5, y + .5, .13, 0, Math.PI * 2); c.fill(); c.stroke();
  }
}

/** The table and everything on it that doesn't move. */
export function drawTable(c: CanvasRenderingContext2D, v: View, l: Layout, opts: { grid?: boolean; target?: number | null } = {}) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, v.w * v.dpr, v.h * v.dpr);
  gridSpace(c, v, l);
  // the table: pale wood with a darker edge, faint squares to lay on
  c.fillStyle = WOOD_EDGE; roundRect(c, -.18, -.18, l.w + .36, l.h + .36, .5); c.fill();
  c.lineWidth = .08; c.strokeStyle = O; c.stroke();
  c.fillStyle = WOOD; roundRect(c, 0, 0, l.w, l.h, .3); c.fill();
  c.strokeStyle = '#c9a46a'; c.lineWidth = .03;
  for (let i = 1; i < l.h; i += 2) { c.beginPath(); c.moveTo(0, i + .3); c.bezierCurveTo(l.w * .3, i + .1, l.w * .6, i + .5, l.w, i + .25); c.stroke(); }
  if (opts.grid) {
    c.strokeStyle = '#00000014'; c.lineWidth = .03;
    for (let x = 1; x < l.w; x++) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, l.h); c.stroke(); }
    for (let y = 1; y < l.h; y++) { c.beginPath(); c.moveTo(0, y); c.lineTo(l.w, y); c.stroke(); }
  }
  // under the track: the bridge's water, the crossing's road
  for (const s of l.scenery) {
    if (!TRACK_SCENERY.has(s.id) || s.id === 'tunnel') continue;
    const { x, y } = xyOf(l, s.cell), across = (l.cells[s.cell]! & 2) !== 0;
    c.fillStyle = s.id === 'bridge' ? '#3d9be0' : '#5d6470';
    if (across) c.fillRect(x + .05, y - .02, .9, 1.04); else c.fillRect(x - .02, y + .05, 1.04, .9);
    if (s.id === 'crossing') { c.fillStyle = '#fff'; for (let k = 0; k < 4; k++) if (across) c.fillRect(x + .44, y + .05 + k * .26, .12, .14); else c.fillRect(x + .05 + k * .26, y + .44, .14, .12); }
  }
  for (let cell = 0; cell < l.cells.length; cell++) if (l.cells[cell]) drawSquareTrack(c, l, cell);
  // a bridge's rails over the water
  for (const s of l.scenery) if (s.id === 'bridge') {
    const { x, y } = xyOf(l, s.cell), across = (l.cells[s.cell]! & 2) !== 0;
    c.strokeStyle = O; c.lineWidth = .08;
    c.beginPath();
    if (across) { c.moveTo(x, y + .14); c.lineTo(x + 1, y + .14); c.moveTo(x, y + .86); c.lineTo(x + 1, y + .86); }
    else { c.moveTo(x + .14, y); c.lineTo(x + .14, y + 1); c.moveTo(x + .86, y); c.lineTo(x + .86, y + 1); }
    c.stroke();
  }
  // stations: a platform beside the track and the station's sign, upright
  for (const s of l.stations) drawStation(c, v, l, s.id as StationId, s.cell, opts.target === s.cell);
  // scenery on empty squares, upright
  for (const s of l.scenery) {
    if (TRACK_SCENERY.has(s.id)) continue;
    const { x, y } = xyOf(l, s.cell), a = sceneryArt(s.id), size = v.cell * .92;
    upright(c, v, l, x + .5, y + .5, () => {
      if ('emoji' in a) { c.font = `${size}px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(a.emoji, 0, size * .06); }
      else { const img = image(a.svg); if (img) c.drawImage(img, -size / 2, -size / 2, size, size); }
    });
  }
}

function drawStation(c: CanvasRenderingContext2D, v: View, l: Layout, id: StationId, cell: number, target: boolean) {
  const { x, y } = xyOf(l, cell), across = (l.cells[cell]! & 2) !== 0;
  gridSpace(c, v, l);
  c.fillStyle = id === 'town' ? '#ffd23f' : '#f4f6f8';
  c.strokeStyle = O; c.lineWidth = .06;
  if (across) { roundRect(c, x + .04, y - .08, .92, .22, .06); } else { roundRect(c, x - .08, y + .04, .22, .92, .06); }
  c.fill(); c.stroke();
  const st = station(id), size = v.cell * .62;
  upright(c, v, l, x + .5, y + .5, () => {
    c.beginPath(); c.arc(0, 0, size * .62, 0, Math.PI * 2);
    c.fillStyle = id === 'town' ? '#ffd23f' : '#ffffff'; c.fill();
    c.lineWidth = target ? 4 : 2.5; c.strokeStyle = target ? '#ff7a00' : O; c.stroke();
    c.font = `${size * .8}px ${EMO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(st.icon, 0, size * .05);
  });
}

/** Tunnels go over the train, so they're drawn after it. */
export function drawOver(c: CanvasRenderingContext2D, v: View, l: Layout) {
  gridSpace(c, v, l);
  for (const s of l.scenery) if (s.id === 'tunnel') {
    const { x, y } = xyOf(l, s.cell), across = (l.cells[s.cell]! & 2) !== 0;
    c.fillStyle = '#6fae4f'; c.strokeStyle = O; c.lineWidth = .06;
    if (across) roundRect(c, x + .12, y - .1, .76, 1.2, .3); else roundRect(c, x - .1, y + .12, 1.2, .76, .3);
    c.fill(); c.stroke();
    c.fillStyle = '#1d1d1f';
    if (across) { c.fillRect(x + .08, y + .2, .1, .6); c.fillRect(x + .82, y + .2, .1, .6); } else { c.fillRect(x + .2, y + .08, .6, .1); c.fillRect(x + .2, y + .82, .6, .1); }
  }
  void DRAWN;
}

/** The train: the engine and its cars, from above, each a fixed distance behind along the track. The cargo rides on the first car. */
export function drawTrain(c: CanvasRenderingContext2D, v: View, run: Pick<Run, 'layout' | 'segs' | 'head' | 'lean'>, t: { engine: string; cars: readonly string[] }, p: Paint, cargo: string | null) {
  gridSpace(c, v, run.layout);
  const pieces = [{ engine: engineOf(t.engine) }, ...t.cars.map(id => ({ car: carOf(id) }))];
  for (let k = pieces.length - 1; k >= 0; k--) {
    const at = carAt(run, k * SPACING), lean = k === 0 ? run.lean : run.lean * .6;
    c.save();
    c.translate(at.x, at.y);
    c.rotate(at.a + lean * .25);
    c.translate(0, -lean * .08);
    // a shadow, so it sits on the table
    c.fillStyle = '#0000002a'; roundRect(c, -.4, -.26, .84, .58, .14); c.fill();
    drawTop(c, pieces[k] as never, p, .82, k === 1 ? cargo ?? undefined : undefined);
    c.restore();
  }
  if (pieces.length === 1 && cargo) {
    const at = carAt(run, 0);
    upright(c, v, run.layout, at.x, at.y, () => { c.font = `${v.cell * .45}px ${EMO}`; c.textAlign = 'center'; c.fillText(cargo, 0, -v.cell * .3); });
  }
}

/** A soft ring round a square: the points to switch, a station to reach. */
export function drawRing(c: CanvasRenderingContext2D, v: View, l: Layout, cell: number, t: number, color = '#ffd23f') {
  gridSpace(c, v, l);
  const { x, y } = xyOf(l, cell), r = .55 + Math.sin(t * 6) * .06;
  c.strokeStyle = color; c.lineWidth = .12;
  c.beginPath(); c.arc(x + .5, y + .5, r, 0, Math.PI * 2); c.stroke();
}

/** The squares he's dragging across, before he lets go. */
export function drawStroke(c: CanvasRenderingContext2D, v: View, l: Layout, cells: readonly number[], erase: boolean) {
  gridSpace(c, v, l);
  c.fillStyle = erase ? '#e6394655' : '#2bb67355';
  for (const cell of cells) { const { x, y } = xyOf(l, cell); roundRect(c, x + .06, y + .06, .88, .88, .12); c.fill(); }
}

/** Squares a station could go on (straight track) or a piece of scenery could go on, lit while he's placing it. */
export function drawSpots(c: CanvasRenderingContext2D, v: View, l: Layout, ok: (cell: number) => boolean) {
  gridSpace(c, v, l);
  c.fillStyle = '#ffd23f44';
  for (let cell = 0; cell < l.cells.length; cell++) if (ok(cell)) { const { x, y } = xyOf(l, cell); c.fillRect(x + .1, y + .1, .8, .8); }
}

export { isStraight, pointOn };
