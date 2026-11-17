// Every dinosaur, drawn in code on a 2D canvas from the numbers in museum/dinos.ts: a body, a neck and head, a tail, legs and its own
// extras (plates, a frill and horns, a sail, a tail club, wings, a crest). The same rig draws it two ways: as a skeleton in the Museum
// (the bones he has found in bone white, the ones still missing as dashed outlines, on its iron stand) and with its skin, walking, in
// the Museum hall and the Alive run, so the one he built is the one he plays. It faces right; the caller flips it.
//
// Drawn at the feet: (0, 0) is the ground under its middle, y up is negative. `px` is pixels per unit (a body is about 1 unit long).
import type { BoneId, Dino } from '../museum/dinos';
import type { Look } from '../museum/state';
import { COLORS, HATS, MARKINGS } from '../shop/shop';

export interface Pose {
  /** Walk cycle, in radians: legs swing and the tail sways with it. */
  phase?: number;
  /** How far the walk swings (0 standing still, 1 walking). */
  stride?: number;
  /** Mouth open, 0 to 1 (a roar). */
  jaw?: number;
  /** Wing flap, -1 to 1. */
  flap?: number;
}

type P = { x: number; y: number };
const rot = (p: P, a: number): P => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) });
const add = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
const deg = (d: number) => (d * Math.PI) / 180;

/** Where everything is, for a dinosaur in a pose. */
export function rig(d: Dino, pose: Pose = {}) {
  const ph = pose.phase ?? 0, stride = pose.stride ?? 0, bob = Math.abs(Math.sin(ph)) * .02 * stride;
  const back = d.legs.back, front = d.legs.stand ? d.legs.front : back;
  const hip: P = { x: -d.body.rx * .5, y: -back - bob }, shoulder: P = { x: d.body.rx * .5, y: -front - bob };
  const tilt = Math.atan2(shoulder.y - hip.y, shoulder.x - hip.x);
  const centre: P = { x: (hip.x + shoulder.x) / 2, y: (hip.y + shoulder.y) / 2 - d.body.ry * .35 };
  const onBody = (x: number, y: number) => add(centre, rot({ x: x * d.body.rx, y: y * d.body.ry }, tilt));
  const neckBase = onBody(.82, -.3);
  const neckAng = -deg(d.neck.up) + tilt + Math.sin(ph * 2) * .02 * stride;
  const head = add(neckBase, rot({ x: d.neck.len, y: 0 }, neckAng));
  const tailBase = onBody(-.9, -.1), tail: P[] = [tailBase];
  const n = 8, sway = Math.sin(ph) * .05 * stride;
  for (let i = 1; i <= n; i++) {
    const t = i / n, prev = tail[i - 1]!;
    const ang = Math.PI + tilt * (1 - t) - (d.tail.droop * 1.4 + sway) * t;
    tail.push(add(prev, { x: Math.cos(ang) * d.tail.len / n, y: Math.sin(ang) * d.tail.len / n }));
  }
  const swing = (k: number) => Math.sin(ph + k) * .45 * stride;
  return { hip, shoulder, centre, tilt, neckBase, neckAng, head, tail, swing, onBody };
}
export type Rig = ReturnType<typeof rig>;

/** How big it is, in units: from the tail tip to the snout, and from the ground to its highest point. */
export function bounds(d: Dino) {
  const r = rig(d), hl = HEAD_LEN[d.head];
  const xs = [...r.tail.map(p => p.x), r.head.x + hl, r.centre.x + d.body.rx], top = Math.min(r.head.y - hl * .6, r.centre.y - d.body.ry * (d.id === 'spino' ? 2.2 : d.id === 'stego' ? 1.8 : 1.1), d.id === 'ptero' ? -1.2 : 0);
  return { left: Math.min(...xs), right: Math.max(...xs), top, width: Math.max(...xs) - Math.min(...xs), height: -top };
}

const HEAD_LEN: Record<Dino['head'], number> = {
  small: .26, raptor: .32, beak: .42, dome: .3, stego: .21, duck: .3, horns: .4, armor: .27, allo: .42, croc: .46, rex: .56, long: .22,
};

// ---------- the paths ----------

/** A tapered limb from a to b, wa thick at a and wb at b. */
function limb(c: CanvasRenderingContext2D, a: P, b: P, wa: number, wb: number) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), n = { x: -Math.sin(ang), y: Math.cos(ang) };
  c.moveTo(a.x + n.x * wa / 2, a.y + n.y * wa / 2);
  c.lineTo(b.x + n.x * wb / 2, b.y + n.y * wb / 2);
  c.arc(b.x, b.y, wb / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  c.lineTo(a.x - n.x * wa / 2, a.y - n.y * wa / 2);
  c.arc(a.x, a.y, wa / 2, ang - Math.PI / 2, ang + Math.PI / 2, true);
  c.closePath();
}

/** The tail as one tapered shape along its points. */
function tailPath(c: CanvasRenderingContext2D, pts: readonly P[], w0: number) {
  const left: P[] = [], right: P[] = [];
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)]!, o = pts[Math.max(i - 1, 0)]!, ang = Math.atan2(q.y - o.y, q.x - o.x);
    const w = w0 * (1 - i / (pts.length - 1)) * .5 + .006;
    left.push({ x: p.x - Math.sin(ang) * w, y: p.y + Math.cos(ang) * w });
    right.push({ x: p.x + Math.sin(ang) * w, y: p.y - Math.cos(ang) * w });
  });
  c.moveTo(left[0]!.x, left[0]!.y);
  for (const p of left.slice(1)) c.lineTo(p.x, p.y);
  for (const p of right.reverse()) c.lineTo(p.x, p.y);
  c.closePath();
}

/** The head, at its place, pointing along `ang`. Drawn in the head's own frame: x forward, y down. */
function headFrame(c: CanvasRenderingContext2D, r: Rig, d: Dino, ang: number, draw: (hl: number) => void) {
  c.save();
  c.translate(r.head.x, r.head.y);
  c.rotate(ang);
  draw(HEAD_LEN[d.head]);
  c.restore();
}
const headAngle = (d: Dino, r: Rig) => (d.head === 'long' ? r.neckAng * .25 : d.head === 'beak' ? .08 : r.neckAng * .2 + (d.legs.stand ? .25 : .05));

function headShape(c: CanvasRenderingContext2D, d: Dino, hl: number, jaw: number) {
  const h = hl * (d.head === 'rex' ? .62 : d.head === 'allo' ? .52 : d.head === 'beak' || d.head === 'croc' ? .3 : .55);
  c.moveTo(-hl * .2, -h * .55);
  c.quadraticCurveTo(hl * .4, -h * .8, hl, -h * .15);
  c.lineTo(hl, h * .05);
  c.quadraticCurveTo(hl * .5, h * .25 + jaw * h * .1, -hl * .2, h * .5);
  c.quadraticCurveTo(-hl * .35, 0, -hl * .2, -h * .55);
  c.closePath();
  if (jaw > 0) { // the lower jaw drops open
    c.moveTo(-hl * .15, h * .15);
    c.lineTo(hl * .85, h * .15 + jaw * h * .8);
    c.quadraticCurveTo(hl * .8, h * .45 + jaw * h * .8, hl * .4, h * .5 + jaw * h * .5);
    c.lineTo(-hl * .2, h * .5);
    c.closePath();
  }
}

/** The bits that make each dinosaur itself, drawn in the head's frame (crest, horns, frill, dome, beak crest). */
function headExtras(c: CanvasRenderingContext2D, d: Dino, hl: number) {
  if (d.head === 'duck') { c.moveTo(0, -hl * .2); c.quadraticCurveTo(-hl * .9, -hl * .7, -hl * 1.5, -hl * .55); c.lineTo(-hl * 1.45, -hl * .4); c.quadraticCurveTo(-hl * .8, -hl * .45, hl * .1, -hl * .05); c.closePath(); }
  if (d.head === 'beak') { c.moveTo(0, -hl * .1); c.lineTo(-hl * .75, -hl * .42); c.lineTo(-hl * .1, hl * .08); c.closePath(); }
  if (d.head === 'dome') { c.ellipse(hl * .1, -hl * .28, hl * .42, hl * .32, 0, Math.PI, 0); c.closePath(); }
  if (d.head === 'allo') { c.moveTo(hl * .3, -hl * .2); c.lineTo(hl * .38, -hl * .38); c.lineTo(hl * .48, -hl * .18); c.closePath(); }
}
function frillPath(c: CanvasRenderingContext2D, hl: number) {
  c.ellipse(-hl * .15, -hl * .25, hl * .55, hl * .7, -.3, 0, Math.PI * 2);
}
function hornsPath(c: CanvasRenderingContext2D, hl: number) {
  const horn = (x: number, y: number, len: number, a: number) => { c.moveTo(x - .02, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.lineTo(x + .025, y + .01); c.closePath(); };
  horn(hl * .3, -hl * .22, hl * .55, -1.15); horn(hl * .45, -hl * .2, hl * .5, -1.0); horn(hl * .85, -hl * .1, hl * .22, -1.3);
}

function platesPath(c: CanvasRenderingContext2D, r: Rig, d: Dino) {
  for (let i = 0; i < 7; i++) {
    const t = -.85 + i * .28, base = r.onBody(t, -.92), h = d.body.ry * (.75 - Math.abs(t) * .35);
    c.moveTo(base.x - .045, base.y + .02); c.lineTo(base.x, base.y - h); c.lineTo(base.x + .045, base.y + .02); c.closePath();
  }
  const tip = r.tail.at(-2)!;
  c.moveTo(tip.x, tip.y); c.lineTo(tip.x - .1, tip.y - .1); c.lineTo(tip.x + .02, tip.y - .01); c.closePath();
  c.moveTo(tip.x, tip.y); c.lineTo(tip.x - .1, tip.y + .08); c.lineTo(tip.x + .02, tip.y + .01); c.closePath();
}
function sailPath(c: CanvasRenderingContext2D, r: Rig, d: Dino) {
  const a = r.onBody(-.75, -.8), b = r.onBody(.7, -.8);
  c.moveTo(a.x, a.y);
  c.bezierCurveTo(a.x + .05, a.y - d.body.ry * 2.4, b.x - .05, b.y - d.body.ry * 2.4, b.x, b.y);
  c.closePath();
}
function clubPath(c: CanvasRenderingContext2D, r: Rig) {
  const tip = r.tail.at(-1)!;
  c.ellipse(tip.x, tip.y, .09, .065, 0, 0, Math.PI * 2);
}
function armorPath(c: CanvasRenderingContext2D, r: Rig) {
  for (let i = 0; i < 6; i++) { const p = r.onBody(-.75 + i * .3, -.85); c.moveTo(p.x + .04, p.y); c.arc(p.x, p.y, .04, 0, Math.PI * 2); }
}
function wingPath(c: CanvasRenderingContext2D, r: Rig, d: Dino, flap: number) {
  const s = r.onBody(.35, -.4), lift = flap * .5;
  c.moveTo(s.x, s.y);
  c.lineTo(s.x - .12, s.y - .42 - lift);
  c.lineTo(s.x - .72, s.y - .1 - lift * .6);
  c.quadraticCurveTo(s.x - .5, s.y + .05, r.onBody(-.6, .2).x, r.onBody(-.6, .2).y);
  c.closePath();
  void d;
}

/** One leg: thigh, shin and foot, from the hip, swinging by `a`. */
function legPoints(top: P, len: number, a: number, stand: boolean) {
  const knee = add(top, rot({ x: 0, y: len * .5 }, a + (stand ? 0 : .35)));
  const ankle = add(knee, rot({ x: 0, y: len * .5 }, a * .6 - (stand ? 0 : .5)));
  const foot = { x: ankle.x + len * .16, y: Math.min(ankle.y, 0) };
  return { knee, ankle: { x: ankle.x, y: Math.min(ankle.y, 0) }, foot };
}
function legPath(c: CanvasRenderingContext2D, top: P, len: number, a: number, w: number, stand: boolean) {
  const { knee, ankle, foot } = legPoints(top, len, a, stand);
  limb(c, top, knee, w * 1.5, w); limb(c, knee, ankle, w, w * .75); limb(c, ankle, foot, w * .6, w * .45);
}
function armPath(c: CanvasRenderingContext2D, r: Rig, d: Dino, a: number) {
  const top = r.onBody(.6, .3), len = d.legs.front;
  const elbow = add(top, rot({ x: 0, y: len * .55 }, -.4 + a * .3)), hand = add(elbow, rot({ x: len * .45, y: 0 }, .5));
  limb(c, top, elbow, d.legs.w * .6, d.legs.w * .45); limb(c, elbow, hand, d.legs.w * .45, d.legs.w * .3);
}

// ---------- drawing it ----------

const INK = '#1b1410', BONE = '#f4ecd6', BONE_SHADE = '#cbbd98';

export interface DrawOpts {
  mode: 'skin' | 'bones';
  /** Bones mode: which bones he has. The rest are dashed outlines. */
  have?: readonly BoneId[];
  look?: Look;
  pose?: Pose;
  /** Pixels per unit. */
  px: number;
  /** A time in seconds, for things that shimmer (rainbow, glow). */
  t?: number;
}

/** A pattern of markings, inside the dinosaur's outline (already clipped). */
function markings(c: CanvasRenderingContext2D, id: string, b: { left: number; right: number; top: number }, ink: string, t: number) {
  const w = b.right - b.left, h = -b.top;
  c.fillStyle = ink; c.strokeStyle = ink;
  const rnd = (i: number) => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
  const dot = (x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  switch (id) {
    case 'spots': case 'leopard': for (let i = 0; i < 40; i++) { const x = b.left + rnd(i) * w, y = -rnd(i + 99) * h, r = .03 + rnd(i + 7) * .03; if (id === 'leopard') { c.lineWidth = .018; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); } else dot(x, y, r); } break;
    case 'dots': for (let x = b.left; x < b.right; x += .12) for (let y = -h; y < 0; y += .12) dot(x + ((y * 10) % 2 ? .06 : 0), y, .028); break;
    case 'stripes': case 'tiger': c.lineWidth = id === 'tiger' ? .045 : .035; for (let x = b.left; x < b.right; x += .14) { c.beginPath(); c.moveTo(x, -h); c.lineTo(x + (id === 'tiger' ? .08 : 0), -h * .55); c.lineTo(x, 0); c.stroke(); } break;
    case 'zigzag': c.lineWidth = .03; for (let y = -h + .08; y < 0; y += .16) { c.beginPath(); for (let x = b.left, k = 0; x < b.right; x += .06, k++) c.lineTo(x, y + (k % 2 ? .04 : -.04)); c.stroke(); } break;
    case 'scales': c.lineWidth = .012; for (let y = -h; y < 0; y += .06) for (let x = b.left + ((y * 100) % 2 ? .03 : 0); x < b.right; x += .06) { c.beginPath(); c.arc(x, y, .03, 0, Math.PI); c.stroke(); } break;
    case 'hearts': case 'stars': { for (let i = 0; i < 30; i++) { const x = b.left + rnd(i) * w, y = -rnd(i + 50) * h, k = .035; c.beginPath(); if (id === 'hearts') { c.moveTo(x, y + k); c.bezierCurveTo(x - k * 1.6, y - k * .2, x - k * .6, y - k * 1.3, x, y - k * .4); c.bezierCurveTo(x + k * .6, y - k * 1.3, x + k * 1.6, y - k * .2, x, y + k); } else for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? k * .45 : k; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); } break; }
    case 'camo': for (let i = 0; i < 26; i++) { c.globalAlpha = .55; c.beginPath(); c.ellipse(b.left + rnd(i) * w, -rnd(i + 31) * h, .06 + rnd(i + 3) * .05, .04, rnd(i) * 3, 0, Math.PI * 2); c.fill(); } c.globalAlpha = 1; break;
    case 'flames': { const g = c.createLinearGradient(0, 0, 0, -h); g.addColorStop(0, '#ffd23f'); g.addColorStop(.5, '#ff7a00'); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.beginPath(); c.moveTo(b.left, 0); for (let x = b.left; x <= b.right; x += .1) c.lineTo(x + .05, -h * (.35 + .15 * Math.sin(x * 30 + t * 6))); c.lineTo(b.right, 0); c.fill(); break; }
    case 'galaxy': { c.fillStyle = '#1b1240cc'; c.fillRect(b.left, -h, w, h); c.fillStyle = '#fff'; for (let i = 0; i < 40; i++) dot(b.left + rnd(i) * w, -rnd(i + 9) * h, .008 + rnd(i + 2) * .01 * (1 + Math.sin(t * 3 + i) * .5)); break; }
    case 'glow': { c.lineWidth = .03; c.strokeStyle = `hsl(${(t * 80) % 360} 100% 65%)`; c.shadowColor = c.strokeStyle; c.shadowBlur = 8; for (let x = b.left; x < b.right; x += .18) { c.beginPath(); c.moveTo(x, -h); c.lineTo(x + .1, 0); c.stroke(); } c.shadowBlur = 0; break; }
  }
}

/** The whole dinosaur. The transform is at its feet; this scales by px. */
export function drawDino(c: CanvasRenderingContext2D, d: Dino, o: DrawOpts) {
  const pose = o.pose ?? {}, r = rig(d, pose), have = new Set(o.have ?? []), bonesMode = o.mode === 'bones';
  const look = o.look, t = o.t ?? 0;
  const color = look ? COLORS.find(x => x.id === look.color) : undefined;
  const skinCol = color && color.skin ? color.skin : d.skin, bellyCol = color && color.belly ? color.belly : d.belly;
  c.save();
  c.scale(o.px, o.px);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const lw = 3.2 / o.px;
  const hAng = headAngle(d, r), jaw = pose.jaw ?? 0, flap = pose.flap ?? 0;
  const b = bounds(d);

  if (bonesMode) { drawBones(c, d, r, have, lw, hAng, flap); c.restore(); return; }

  const shade = (hex: string, k: number) => {
    if (!hex.startsWith('#')) return hex;
    const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.round(Math.max(0, Math.min(255, v * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  const rainbow = skinCol === 'rainbow';
  const fill = (dark = 1) => {
    if (rainbow) { const g = c.createLinearGradient(b.left, 0, b.right, 0); ['#e63946', '#ff9f1c', '#ffd23f', '#2bb673', '#3a72d0', '#8a4fc7'].forEach((k, i) => g.addColorStop(i / 5, k)); c.fillStyle = g; c.globalAlpha = dark < 1 ? .8 : 1; }
    else c.fillStyle = shade(skinCol, dark);
  };
  const part = (path: () => void, dark = 1, stroke = true) => { c.beginPath(); path(); fill(dark); c.fill(); c.globalAlpha = 1; if (stroke) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); } };
  const far = .78;

  // behind: far legs, wings, sail, plates, frill
  part(() => legPath(c, add(r.hip, { x: .03, y: 0 }), d.legs.back, -r.swing(0), d.legs.w, d.legs.stand), far);
  if (d.legs.stand) part(() => legPath(c, add(r.shoulder, { x: .03, y: 0 }), d.legs.front, r.swing(0), d.legs.w, true), far);
  if (d.id === 'ptero') part(() => wingPath(c, r, d, -flap * .6), far);
  if (d.id === 'spino') part(() => sailPath(c, r, d), .9);
  if (d.id === 'stego') part(() => platesPath(c, r, d), .85);
  if (d.head === 'horns') headFrame(c, r, d, hAng, hl => part(() => frillPath(c, hl), .9));

  // the body and everything on it, with its markings clipped inside
  const silhouette = () => {
    tailPath(c, r.tail, d.tail.w * 2);
    c.moveTo(r.centre.x + d.body.rx, r.centre.y); c.ellipse(r.centre.x, r.centre.y, d.body.rx, d.body.ry, r.tilt, 0, Math.PI * 2);
    limb(c, r.neckBase, r.head, d.neck.w * 1.6, d.neck.w);
  };
  part(() => tailPath(c, r.tail, d.tail.w * 2));
  part(() => limb(c, r.neckBase, r.head, d.neck.w * 1.6, d.neck.w));
  part(() => c.ellipse(r.centre.x, r.centre.y, d.body.rx, d.body.ry, r.tilt, 0, Math.PI * 2));
  // the belly, lighter
  c.save(); c.beginPath(); c.ellipse(r.centre.x, r.centre.y, d.body.rx, d.body.ry, r.tilt, 0, Math.PI * 2); c.clip();
  c.fillStyle = bellyCol; c.beginPath(); c.ellipse(r.centre.x, r.centre.y + d.body.ry * .75, d.body.rx * .9, d.body.ry * .5, r.tilt, 0, Math.PI * 2); c.fill(); c.restore();
  if (look && look.marking !== 'none' && MARKINGS.some(m => m.id === look.marking)) {
    c.save(); c.beginPath(); silhouette(); c.clip(); markings(c, look.marking, b, shade(skinCol === 'rainbow' ? '#333333' : skinCol, .55), t); c.restore();
    // redraw the outlines the markings covered
    c.strokeStyle = INK; c.lineWidth = lw;
    c.beginPath(); c.ellipse(r.centre.x, r.centre.y, d.body.rx, d.body.ry, r.tilt, 0, Math.PI * 2); c.stroke();
  }
  if (d.id === 'anky') part(() => armorPath(c, r), .8);
  if (d.id === 'anky') part(() => clubPath(c, r), .85);

  // the head
  headFrame(c, r, d, hAng, hl => {
    part(() => headExtras(c, d, hl), d.head === 'dome' ? .85 : .95);
    part(() => headShape(c, d, hl, jaw));
    if (d.head === 'horns') part(() => hornsPath(c, hl), 1.25);
    // eye and smile
    c.fillStyle = '#fff'; c.beginPath(); c.arc(hl * .35, -hl * .12, hl * .1, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = lw * .7; c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(hl * .38, -hl * .11, hl * .05, 0, Math.PI * 2); c.fill();
    if (jaw < .1) { c.beginPath(); c.moveTo(hl * .5, hl * .12); c.quadraticCurveTo(hl * .75, hl * .2, hl * .95, hl * .05); c.lineWidth = lw * .6; c.stroke(); }
    if (look && look.hat !== 'none') {
      const hat = HATS.find(x => x.id === look.hat);
      if (hat) {
        // text is drawn at its real pixel size: a font smaller than a pixel doesn't draw
        const eyes = look.hat === 'shades' || look.hat === 'goggles';
        c.save(); c.translate(eyes ? hl * .4 : hl * .2, eyes ? hl * .02 : -hl * .28); c.scale(1 / o.px, 1 / o.px);
        c.font = `${Math.max(8, hl * o.px * (eyes ? .55 : .8))}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(hat.pic, 0, 0); c.restore();
      }
    }
  });

  // in front: near legs and arms, wings
  part(() => legPath(c, r.hip, d.legs.back, r.swing(0), d.legs.w, d.legs.stand));
  if (d.legs.stand) part(() => legPath(c, r.shoulder, d.legs.front, -r.swing(0), d.legs.w, true));
  else if (d.legs.front > 0) part(() => armPath(c, r, d, r.swing(1)));
  if (d.id === 'ptero') part(() => wingPath(c, r, d, flap));
  c.restore();
}

/** The skeleton: found bones in bone white with dark joints, missing ones as dashed outlines, on an iron stand. */
function drawBones(c: CanvasRenderingContext2D, d: Dino, r: Rig, have: Set<BoneId>, lw: number, hAng: number, flap: number) {
  const ghost = (on: boolean) => {
    c.setLineDash(on ? [lw * 2.2, lw * 1.6] : []);
    c.strokeStyle = on ? '#00000055' : INK;
    c.fillStyle = on ? '#ffffff22' : BONE;
    c.lineWidth = on ? lw * .8 : lw * .9;
  };
  const shape = (bone: BoneId, path: () => void) => { const miss = !have.has(bone); ghost(miss); c.beginPath(); path(); c.fill(); c.stroke(); c.setLineDash([]); };
  const chain = (bone: BoneId, pts: readonly P[], r0: number, r1: number) => {
    const miss = !have.has(bone);
    pts.forEach((p, i) => { ghost(miss); const k = r0 + (r1 - r0) * (i / Math.max(1, pts.length - 1)); c.beginPath(); c.ellipse(p.x, p.y, k * 1.15, k, 0, 0, Math.PI * 2); c.fill(); c.stroke(); });
    c.setLineDash([]);
  };
  // the iron stand: a pole to the ground under the hips and under the chest
  c.strokeStyle = '#3b3f45'; c.lineWidth = lw * 1.4; c.setLineDash([]);
  for (const p of [r.onBody(-.3, 0), r.onBody(.35, 0)]) { c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x, 0); c.stroke(); }
  c.beginPath(); c.moveTo(r.onBody(-.3, 0).x - .12, 0); c.lineTo(r.onBody(.35, 0).x + .12, 0); c.lineWidth = lw * 2.4; c.stroke();

  // far legs
  const leg = (top: P, len: number, a: number, w: number) => {
    const { knee, ankle, foot } = legPoints(top, len, a, d.legs.stand);
    c.beginPath(); limb(c, top, knee, w * .8, w * .55); limb(c, knee, ankle, w * .55, w * .45); limb(c, ankle, foot, w * .4, w * .3); c.fill(); c.stroke();
  };
  ghost(!have.has('legs')); leg(add(r.hip, { x: .03, y: 0 }), d.legs.back, 0, d.legs.w);
  if (d.legs.stand) { ghost(!have.has('arms')); leg(add(r.shoulder, { x: .03, y: 0 }), d.legs.front, 0, d.legs.w); }
  c.setLineDash([]);
  if (d.id === 'ptero') shape('wings', () => wingPath(c, r, d, flap));
  if (d.id === 'spino') shape('sail', () => sailPath(c, r, d));
  if (d.id === 'stego') shape('plates', () => platesPath(c, r, d));
  if (d.head === 'horns') headFrame(c, r, d, hAng, hl => shape('frill', () => frillPath(c, hl)));

  // tail and neck vertebrae, the spine and the ribs
  chain('tail', r.tail, d.tail.w * .45, d.tail.w * .15);
  const nn = Math.max(3, Math.round(d.neck.len / .07));
  const neckPts = Array.from({ length: nn }, (_, i) => { const t = i / (nn - 1); return { x: r.neckBase.x + (r.head.x - r.neckBase.x) * t, y: r.neckBase.y + (r.head.y - r.neckBase.y) * t }; });
  chain(d.bones.includes('neck') ? 'neck' : 'ribs', neckPts, d.neck.w * .5, d.neck.w * .38);
  const ribsMissing = !have.has('ribs');
  ghost(ribsMissing);
  c.beginPath();
  for (let i = 0; i <= 8; i++) { const p = r.onBody(-.95 + i * .24, -.65); if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }
  c.lineWidth = lw * 2.2; c.strokeStyle = ribsMissing ? '#00000055' : INK; c.stroke();
  c.lineWidth = lw * 1.4; c.strokeStyle = ribsMissing ? '#00000033' : BONE; c.stroke();
  for (let i = 0; i < 7; i++) {
    const x = -.7 + i * .23, top = r.onBody(x, -.62), bot = r.onBody(x + .12, .55 - Math.abs(x) * .3);
    c.beginPath(); c.moveTo(top.x, top.y); c.quadraticCurveTo(top.x + .12 * d.body.rx, (top.y + bot.y) / 2, bot.x, bot.y);
    c.lineWidth = lw * 1.9; c.strokeStyle = ribsMissing ? '#00000044' : INK; c.stroke();
    c.lineWidth = lw * 1.0; c.strokeStyle = ribsMissing ? '#ffffff22' : BONE; c.stroke();
  }
  c.setLineDash([]);
  // the hips
  shape('legs', () => { const p = r.hip; c.ellipse(p.x, p.y - .03, d.body.rx * .3, d.body.ry * .35, r.tilt, 0, Math.PI * 2); });
  if (d.id === 'anky') { shape('club', () => clubPath(c, r)); shape('club', () => armorPath(c, r)); }

  // the skull, with its eye socket and teeth
  headFrame(c, r, d, hAng, hl => {
    shape('skull', () => { headExtras(c, d, hl); headShape(c, d, hl, 0); });
    if (d.head === 'horns') shape(d.bones.includes('frill') ? 'skull' : 'skull', () => hornsPath(c, hl));
    if (have.has('skull')) {
      c.fillStyle = INK; c.beginPath(); c.ellipse(hl * .35, -hl * .1, hl * .11, hl * .09, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(hl * .72, -hl * .02, hl * .05, hl * .03, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = INK; c.lineWidth = lw * .6;
      c.beginPath(); for (let i = 0; i < 6; i++) { const x = hl * (.3 + i * .11); c.moveTo(x, hl * .1); c.lineTo(x + hl * .03, hl * .19); } c.stroke();
    }
  });
  // near legs and arms
  ghost(!have.has('legs')); leg(r.hip, d.legs.back, 0, d.legs.w);
  if (d.legs.stand) { ghost(!have.has('arms')); leg(r.shoulder, d.legs.front, 0, d.legs.w); }
  else if (d.legs.front > 0 && d.bones.includes('arms')) { ghost(!have.has('arms')); c.beginPath(); armPath(c, r, d, 0); c.fill(); c.stroke(); }
  c.setLineDash([]);
  void BONE_SHADE;
}

/** A single bone as he digs it up: drawn on its own, about `size` pixels long. */
export function drawLooseBone(c: CanvasRenderingContext2D, kind: BoneId, size: number) {
  c.save();
  c.lineJoin = 'round';
  c.fillStyle = BONE; c.strokeStyle = INK; c.lineWidth = Math.max(2.5, size * .045);
  const s = size / 2;
  c.beginPath();
  if (kind === 'skull') {
    c.moveTo(-s, -s * .2); c.quadraticCurveTo(-s * .2, -s * .8, s, -s * .2); c.lineTo(s, s * .1); c.quadraticCurveTo(0, s * .45, -s, s * .3); c.closePath();
    c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(-s * .2, -s * .15, s * .16, 0, Math.PI * 2); c.fill();
  } else if (kind === 'ribs') {
    for (let i = 0; i < 4; i++) { c.moveTo(-s * .6 + i * s * .4, -s * .6); c.quadraticCurveTo(-s * .2 + i * s * .4, 0, -s * .6 + i * s * .4, s * .6); }
    c.lineWidth = s * .2; c.stroke(); c.strokeStyle = BONE; c.lineWidth = s * .11; c.stroke();
  } else if (kind === 'plates' || kind === 'sail' || kind === 'frill' || kind === 'wings') {
    if (kind === 'frill') c.ellipse(0, 0, s * .8, s * .65, 0, 0, Math.PI * 2);
    else { c.moveTo(-s, s * .4); c.lineTo(kind === 'wings' ? s : 0, -s * .7); c.lineTo(s, s * .4); c.closePath(); }
    c.fill(); c.stroke();
  } else if (kind === 'club') {
    c.ellipse(s * .4, 0, s * .45, s * .35, 0, 0, Math.PI * 2); c.moveTo(s * .1, -s * .1); c.lineTo(-s, -s * .08); c.lineTo(-s, s * .08); c.lineTo(s * .1, s * .1); c.fill(); c.stroke();
  } else {
    // a long bone with two knobbly ends (legs, arms, tail, neck)
    const k = s * .26;
    c.moveTo(-s + k, -k * .55); c.lineTo(s - k, -k * .55);
    c.arc(s - k * .7, -k * .55, k * .6, Math.PI, Math.PI * 2.3); c.arc(s - k * .7, k * .55, k * .6, Math.PI * 1.7, Math.PI);
    c.lineTo(-s + k, k * .55);
    c.arc(-s + k * .7, k * .55, k * .6, 0, Math.PI * 1.3); c.arc(-s + k * .7, -k * .55, k * .6, Math.PI * .7, Math.PI * 2);
    c.closePath(); c.fill(); c.stroke();
  }
  c.restore();
}
