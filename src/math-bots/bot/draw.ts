// Draws a robot from above, flat, with thick black outlines like the rest of the family's art. The same drawing is used everywhere, in the
// Workshop, the League and the fight, so what he builds is exactly what he drives. Front is +x. `spin` is seconds of running time, so
// blades turn; `swing` is 0 to 1 per Mount, just after a weapon fires.
import { fittedAdds, type Build } from './build';
import { add, body, edge, face, MOUNT_ANGLE, paint, wheels, type AddPart, type BodyPart, type FaceArt, type Mount, type PaintPart, type Shape, type WheelArt } from './parts';

const O = '#10151f';
const TAU = Math.PI * 2;
type C = CanvasRenderingContext2D;

function line(c: C, w = 4) { c.lineWidth = w; c.strokeStyle = O; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function fillLine(c: C, fill: string | CanvasGradient, w = 4) { c.fillStyle = fill; c.fill(); line(c, w); }
function poly(c: C, pts: readonly (readonly [number, number])[]) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); }
function round(c: C, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function disc(c: C, x: number, y: number, r: number) { c.beginPath(); c.arc(x, y, r, 0, TAU); }

function shapePath(c: C, shape: Shape, r: number) {
  switch (shape) {
    case 'box': return round(c, -r, -r * .84, r * 2, r * 1.68, 12);
    case 'wedge': return poly(c, [[-r, -r * .8], [r * .22, -r * .8], [r * 1.14, -r * .3], [r * 1.14, r * .3], [r * .22, r * .8], [-r, r * .8]]);
    case 'dart': return poly(c, [[-r * .95, -r * .66], [-r * .1, -r * .62], [r * 1.2, 0], [-r * .1, r * .62], [-r * .95, r * .66], [-r * .76, 0]]);
    case 'shell': c.beginPath(); c.ellipse(0, 0, r * 1.02, r * .94, 0, 0, TAU); return;
    case 'tank': return poly(c, [[-r, -r * .6], [-r * .66, -r * .9], [r * .66, -r * .9], [r, -r * .6], [r, r * .6], [r * .66, r * .9], [-r * .66, r * .9], [-r, r * .6]]);
    case 'titan': return poly(c, [[-r, -r * .5], [-r * .5, -r * .92], [r * .5, -r * .92], [r * 1.06, -r * .34], [r * 1.06, r * .34], [r * .5, r * .92], [-r * .5, r * .92], [-r, r * .5]]);
    case 'boulder': return poly(c, [[-r, -r * .3], [-r * .74, -r * .78], [-r * .2, -r * .94], [r * .42, -r * .88], [r * .92, -r * .5], [r * 1.02, r * .1], [r * .8, r * .68], [r * .24, r * .94], [-r * .4, r * .9], [-r * .92, r * .52]]);
    case 'hull': return poly(c, [[-r, -r * .7], [-r * .5, -r * .92], [-r * .3, -r * .76], [0, -r * .96], [r * .3, -r * .76], [r * .6, -r * .92], [r * 1.08, -r * .36], [r * 1.08, r * .36], [r * .6, r * .92], [r * .3, r * .76], [0, r * .96], [-r * .3, r * .76], [-r * .5, r * .92], [-r, r * .7]]);
  }
}

function paintFill(c: C, p: PaintPart, r: number): string | CanvasGradient {
  if (p.rainbow) {
    const g = c.createLinearGradient(-r, 0, r, 0);
    ['#e8262c', '#ff9a1e', '#f7d51e', '#27b84a', '#1f7fe0', '#8a2be2'].forEach((hex, i) => g.addColorStop(i / 5, hex));
    return g;
  }
  if (p.to) { const g = c.createLinearGradient(r, 0, -r, 0); g.addColorStop(0, p.hex); g.addColorStop(1, p.to); return g; }
  return p.hex;
}

function drawWheels(c: C, art: WheelArt, r: number, spin: number) {
  const roll = (spin * 10) % 1;
  const tyre = (x: number, y: number, w: number, h: number, hub: string) => {
    round(c, x - w / 2, y - h / 2, w, h, 6); fillLine(c, '#16181b');
    c.strokeStyle = '#3a3f46'; c.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const at = x - w / 2 + ((i + roll) / 4) * w; c.beginPath(); c.moveTo(at, y - h / 2 + 3); c.lineTo(at, y + h / 2 - 3); c.stroke(); }
    round(c, x - w * .16, y - h * .22, w * .32, h * .44, 3); c.fillStyle = hub; c.fill();
  };
  const side = r * .9;
  const pairs = { small: [34, 16, '#ff6508'], big: [48, 22, '#f5c400'], grip: [46, 26, '#27b84a'], race: [52, 15, '#e0322c'], zip: [50, 13, '#2fd3ff'] } as const;
  if (art === 'tread') { for (const s of [-1, 1]) { const w = r * 2.1, h = 26; round(c, -w / 2, s * side - h / 2, w, h, 12); fillLine(c, '#16181b'); c.strokeStyle = '#4a5058'; c.lineWidth = 4; for (let i = 0; i < 9; i++) { const at = -w / 2 + ((i + roll) / 9) * w; c.beginPath(); c.moveTo(at, s * side - h / 2 + 3); c.lineTo(at, s * side + h / 2 - 3); c.stroke(); } } return; }
  if (art === 'hover') { for (const [x, y] of [[-.6, -.7], [.6, -.7], [-.6, .7], [.6, .7]] as const) { disc(c, x * r, y * r * 1.15, 19); c.fillStyle = '#2fd3ff66'; c.fill(); disc(c, x * r, y * r * 1.15, 12); fillLine(c, '#bff3ff', 3); } return; }
  if (art === 'comet') { for (const s of [-1, 1]) for (const x of [-.55, .55]) { tyre(x * r, s * side, 50, 22, '#ff8a1e'); round(c, x * r - 27, s * side - 13, 54, 26, 9); c.lineWidth = 3; c.strokeStyle = '#ff8a1e'; c.stroke(); } return; }
  const [w, h, hub] = pairs[art];
  for (const s of [-1, 1]) for (const x of [-.56, .56]) tyre(x * r, s * side, w, h, hub);
}

function teeth(c: C, r: number, n: number, depth: number, spin: number) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * TAU, b = spin + ((i + .55) / n) * TAU;
    c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    c.lineTo(Math.cos(a + .02) * (r + depth), Math.sin(a + .02) * (r + depth));
    c.lineTo(Math.cos(b) * r, Math.sin(b) * r);
  }
  c.closePath();
}

/** One part, drawn out from a Mount: the origin is on the robot's edge and +x points away from it. */
function drawAdd(c: C, p: AddPart, spin: number, swing: number) {
  const s = p.size, tint = p.tint, reach = p.reach;
  c.save();
  switch (p.kind) {
    case 'saw': {
      const r = 22 * s, n = 12;
      round(c, -6, -7, reach - r * .3, 14, 4); fillLine(c, '#6d7278');
      c.translate(reach - r * .2, 0);
      teeth(c, r, n, 8, spin * 14); fillLine(c, tint);
      disc(c, 0, 0, r * .36); fillLine(c, '#3a3f46', 3);
      if (p.extra === 'sparks') { c.translate(0, 0); c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r * .68, spin * 9, spin * 9 + 2); c.stroke(); }
      break;
    }
    case 'spin': {
      if (p.id === 'drum' || p.id === 'lightning') { // a drum, seen from above: a wide roller with teeth racing round it
        const w = 30 * s, h = 74 * s;
        round(c, -6, -h / 2 - 6, 18, h + 12, 4); fillLine(c, '#4b525c');
        round(c, reach - w, -h / 2, w, h, 12); fillLine(c, tint);
        for (let i = 0; i < 4; i++) { const y = -h / 2 + (((i + spin * 12) % 4) / 4) * h; round(c, reach - w - 5, y - 2, w + 10, 7, 3); fillLine(c, p.id === 'lightning' ? '#fff36b' : '#e9edf1', 3); }
        break;
      }
      const r = 44 * s;
      round(c, -6, -8, reach * .6, 16, 4); fillLine(c, '#6d7278');
      c.translate(reach * .55, 0); c.rotate(spin * 16 + swing * 2);
      poly(c, [[-r, -7 * s], [-r * .2, -12 * s], [r * .2, -7 * s], [r, -13 * s], [r + 4, 7 * s], [r * .2, 12 * s], [-r * .2, 7 * s], [-r - 4, 13 * s]]);
      fillLine(c, tint);
      disc(c, 0, 0, 9 * s); fillLine(c, '#3a3f46', 3);
      break;
    }
    case 'lance': {
      round(c, -6, -8, 16, 16, 3); fillLine(c, '#6d7278');
      poly(c, [[6, -11], [reach + 2, 0], [6, 11]]); fillLine(c, tint);
      break;
    }
    case 'hammer': {
      // swings up off the robot and comes down: from above, that's it growing, then snapping back
      const lift = Math.sin(Math.min(1, swing) * Math.PI), head = 1 + lift * .45, len = reach - 10;
      round(c, -6, -7 * s, len + 8, 14 * s, 4); fillLine(c, '#6d7278');
      c.translate(len, 0); c.scale(head, head);
      round(c, -14 * s, -28 * s, 30 * s, 56 * s, 7); fillLine(c, tint);
      c.fillStyle = '#ffffff55'; c.fillRect(-9 * s, -22 * s, 6, 44 * s);
      break;
    }
    case 'flip': {
      const lift = Math.sin(Math.min(1, swing) * Math.PI), w = 62 * s * (1 + lift * .35), l = reach * (1 + lift * .3);
      poly(c, [[-4, -w * .52], [l * .8, -w * .42], [l, -w * .2], [l, w * .2], [l * .8, w * .42], [-4, w * .52]]); fillLine(c, tint);
      c.strokeStyle = '#0005'; c.lineWidth = 4; for (const y of [-.2, .2]) { c.beginPath(); c.moveTo(6, y * w); c.lineTo(l * .78, y * w); c.stroke(); }
      break;
    }
    case 'claw': {
      const open = .5 - Math.sin(Math.min(1, swing) * Math.PI) * .45;
      round(c, -6, -8, 24, 16, 4); fillLine(c, '#6d7278');
      c.translate(16, 0);
      for (const d of [-1, 1]) { c.save(); c.rotate(d * open); c.beginPath(); c.moveTo(0, d * 6); c.quadraticCurveTo(reach * .55, d * 30, reach * .95, d * 3); c.quadraticCurveTo(reach * .5, d * 14, 0, d * -5); c.closePath(); fillLine(c, tint); c.restore(); }
      break;
    }
    case 'prod': {
      round(c, -6, -6, reach - 16, 12, 3); fillLine(c, '#6d7278');
      for (const y of [-11, 11]) { round(c, reach - 26, y - 4, 28, 8, 3); fillLine(c, tint, 3); }
      c.strokeStyle = '#fff36b'; c.lineWidth = 3; const j = Math.sin(spin * 40) * 5; c.beginPath(); c.moveTo(reach + 2, -9); c.lineTo(reach - 6 + j, 0); c.lineTo(reach + 2, 9); c.stroke();
      break;
    }
    case 'bumper': { round(c, -7, -36, 7 + reach, 72, 11); fillLine(c, tint); c.fillStyle = '#ffffff22'; c.fillRect(0, -28, 4, 56); break; }
    case 'shield': {
      const h = 50 * s;
      c.beginPath(); c.moveTo(-4, -h); c.quadraticCurveTo(reach * 2.6, 0, -4, h); c.closePath(); fillLine(c, tint);
      c.strokeStyle = '#ffffff77'; c.lineWidth = 4; c.beginPath(); c.moveTo(3, -h * .6); c.quadraticCurveTo(reach * 1.5, 0, 3, h * .6); c.stroke();
      if (p.id === 'brick') { c.strokeStyle = '#7a2d1f'; c.lineWidth = 3; for (const y of [-18, 18]) { c.beginPath(); c.moveTo(0, y); c.lineTo(reach * .9, y); c.stroke(); } }
      break;
    }
    case 'thorns': {
      const h = 46 * s;
      round(c, -6, -h, 13, h * 2, 5); fillLine(c, p.extra === 'gold' ? '#b8860b' : '#4b525c');
      const n = 4;
      for (let i = 0; i < n; i++) { const y = -h + (i + .5) * (2 * h / n); poly(c, [[5, y - 11], [reach + 15, y], [5, y + 11]]); fillLine(c, tint, 3); }
      break;
    }
    case 'boost': {
      round(c, -6, -19, 26, 38, 7); fillLine(c, '#4b525c');
      const flame = 12 + Math.sin(spin * 34) * 5 + swing * 14;
      poly(c, [[20, -13], [20 + flame + 14, 0], [20, 13]]); c.fillStyle = tint; c.fill();
      poly(c, [[20, -7], [20 + flame, 0], [20, 7]]); c.fillStyle = '#ffe36b'; c.fill();
      break;
    }
    case 'magnet': {
      c.beginPath(); c.arc(6, 0, 19, -Math.PI / 2, Math.PI / 2, true); c.lineWidth = 19; c.strokeStyle = O; c.lineCap = 'butt'; c.stroke();
      c.lineWidth = 12; c.strokeStyle = tint; c.stroke();
      for (const d of [-1, 1]) { round(c, 6, d * 19 - 8, 18, 16, 3); fillLine(c, '#e9edf1', 3); }
      break;
    }
    case 'repair': {
      round(c, -6, -19, 34, 38, 8); fillLine(c, tint);
      c.fillStyle = '#fff'; c.fillRect(8, -11, 7, 22); c.fillRect(0, -3.5, 23, 7);
      break;
    }
  }
  c.restore();
}

function drawFace(c: C, art: FaceArt, r: number, opts: { out?: boolean; hurt?: boolean }) {
  const ex = r * .34, ey = r * .34, er = r * .2;
  c.save();
  c.translate(r * .22, 0);
  const eyes = (f: (y: number) => void) => { f(-ey); f(ey); };
  if (opts.out) { // knocked out: crosses for eyes
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round';
    eyes(y => { for (const d of [-1, 1]) { c.beginPath(); c.moveTo(ex - er * .7, y - er * .7 * d); c.lineTo(ex + er * .7, y + er * .7 * d); c.stroke(); } });
    c.restore(); return;
  }
  const ball = (fill = '#fff') => eyes(y => { disc(c, ex, y, er); fillLine(c, fill, 3); disc(c, ex + er * .35, y, er * .5); c.fillStyle = O; c.fill(); });
  switch (art) {
    case 'happy': ball(); break;
    case 'angry': ball(); c.strokeStyle = O; c.lineWidth = 6; c.lineCap = 'round'; eyes(y => { c.beginPath(); c.moveTo(ex - er * 1.1, y + Math.sign(y) * er * 1.2); c.lineTo(ex + er * 1.2, y - Math.sign(y) * er * .2 + Math.sign(y) * 0); c.stroke(); }); break;
    case 'visor': { round(c, ex - er * .9, -ey * 1.6, er * 1.8, ey * 3.2, 8); fillLine(c, '#10151f'); const scan = Math.sin(performance.now() / 300) * ey; round(c, ex - er * .55, scan - 10, er * 1.1, 20, 6); c.fillStyle = opts.hurt ? '#ff5a3c' : '#40e0ff'; c.fill(); break; }
    case 'cyclops': disc(c, ex * .8, 0, r * .36); fillLine(c, '#fff', 4); disc(c, ex * .8 + r * .13, 0, r * .17); c.fillStyle = '#e0322c'; c.fill(); disc(c, ex * .8 + r * .16, 0, r * .08); c.fillStyle = O; c.fill(); break;
    case 'shark': ball(); { const x = ex + er * 1.5; poly(c, [[x - 6, -ey * 1.4], [x + 14, -ey * .9], [x, -ey * .45], [x + 14, 0], [x, ey * .45], [x + 14, ey * .9], [x - 6, ey * 1.4]]); fillLine(c, '#fff', 3); } break;
    case 'cat': ball('#b7f07a'); poly(c, [[ex + er * 1.6, -6], [ex + er * 2.2, 0], [ex + er * 1.6, 6]]); c.fillStyle = '#ff7a9c'; c.fill(); for (const y of [-1, 1]) { c.strokeStyle = O; c.lineWidth = 3; c.beginPath(); c.moveTo(ex + er * 1.6, y * 14); c.lineTo(ex + er * 2, y * 34); c.stroke(); } eyes(y => { poly(c, [[-r * .36, y * 1.2 - 16], [-r * .75, y * 1.8], [-r * .36, y * 1.2 + 16]]); fillLine(c, '#ffffff66', 3); }); break;
    case 'cool': round(c, ex - er * .7, -ey * 1.6, er * 1.5, ey * 3.2, 7); fillLine(c, O); c.fillStyle = '#ffffff66'; c.fillRect(ex - er * .3, -ey * 1.2, 5, ey * .9); break;
    case 'crown': ball(); poly(c, [[-r * .42, -r * .46], [-r * .16, -r * .28], [-r * .28, -r * .1], [-r * .1, 0], [-r * .28, r * .1], [-r * .16, r * .28], [-r * .42, r * .46], [-r * .62, r * .22], [-r * .62, -r * .22]]); fillLine(c, '#ffc53d'); break;
  }
  c.restore();
}

export interface DrawOpts { spin?: number; swing?: Partial<Record<Mount, number>>; hurt?: boolean; out?: boolean; flash?: boolean; rolling?: number }

export function drawBot(c: C, b: Build, o: DrawOpts = {}) {
  const shell: BodyPart = body(b.body), r = shell.radius, spin = o.spin ?? 0, drive = wheels(b.wheels);
  drawWheels(c, drive.art, r, o.rolling ?? spin * .3);
  const adds = fittedAdds(b);
  const place = (mount: Mount, p: AddPart) => {
    c.save(); c.rotate(MOUNT_ANGLE[mount]); c.translate(edge(shell, mount), 0);
    drawAdd(c, p, spin, o.swing?.[mount] ?? 0);
    c.restore();
  };
  for (const a of adds) place(a.mount, a.part);
  shapePath(c, shell.shape, r);
  fillLine(c, o.flash ? '#fff' : paintFill(c, paint(b.paint), r), 6);
  if (!o.flash) {
    c.save(); shapePath(c, shell.shape, r); c.clip();
    c.fillStyle = '#ffffff30'; c.beginPath(); c.ellipse(-r * .15, -r * .4, r * .95, r * .4, 0, 0, TAU); c.fill(); // a shine, so it reads as a shape rather than a sticker
    c.fillStyle = '#00000022'; c.fillRect(-r * 1.3, r * .56, r * 2.6, r);
    c.restore();
    for (const [x, y] of [[-.72, -.5], [-.72, .5]] as const) { disc(c, x * r, y * r, 4.5); c.fillStyle = '#0006'; c.fill(); }
    drawFace(c, face(b.face).art, r, o);
  }
}

/** How far a robot reaches from its middle, so a picture can fit it. */
export function extentOf(b: Build) {
  const shell = body(b.body);
  return Math.max(shell.radius * 1.25, ...fittedAdds(b).map(a => edge(shell, a.mount) + a.part.reach + 34 * a.part.size * (a.part.kind === 'hammer' || a.part.kind === 'spin' ? 1 : .2)));
}

/** A part on its own, for a tile in the tray. */
export function drawPartAlone(c: C, cat: 'body' | 'wheels' | 'add' | 'paint' | 'face', id: string, size: number, spin = 0) {
  c.save();
  c.translate(size / 2, size / 2);
  const k = size / 120;
  c.scale(k, k);
  if (cat === 'body') { c.rotate(-Math.PI / 2); const s = body(id as Build['body']); c.scale(.92, .92); shapePath(c, s.shape, s.radius); fillLine(c, '#8fa3b5', 6); }
  else if (cat === 'wheels') { c.rotate(-Math.PI / 2); drawWheels(c, wheels(id as Build['wheels']).art, 40, .1); }
  else if (cat === 'add') { const p = add(id as NonNullable<Build['adds']['front']>); c.rotate(-Math.PI / 2); c.translate(-(p.reach + 8) * .42, 0); const fit = Math.min(1, 60 / Math.max(p.reach + 16, 50 * p.size)); c.scale(fit * 1.2, fit * 1.2); drawAdd(c, p, spin, 0); }
  else if (cat === 'paint') { c.beginPath(); c.roundRect(-44, -44, 88, 88, 20); fillLine(c, paintFill(c, paint(id as Build['paint']), 44), 6); }
  else { disc(c, 0, 0, 48); fillLine(c, '#8fa3b5', 6); c.rotate(-Math.PI / 2); drawFace(c, face(id as Build['face']).art, 48, {}); }
  c.restore();
}
