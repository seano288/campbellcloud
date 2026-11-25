// A dragon drawn in code, side on, facing right: round, bright and never frightening. One bright colour with a pale belly, big eyes with
// a shine, a smile, and parts that make each one its own: body, head, horns, wings, tail, colour, pattern and breath. The same drawing is
// the egg's hatchling, the dragon at the Roost, the one he flies and the one that shows a lesson ("big", "green", "muddy").
//
// Drawn round (0, 0), about `size` pixels long. It grows through three stages (hatchling, young, great), and after that it wears its
// marks: a stripe, a horn ring, a star on its wing, one more every few Flights, without end.

export const BREATHS = ['fire', 'frost', 'sparks', 'bubbles', 'rainbow'] as const;
export type BreathId = (typeof BREATHS)[number];

export interface DragonLook {
  readonly body: number;
  readonly head: number;
  readonly horns: number;
  readonly wings: number;
  readonly tail: number;
  readonly colour: number;
  readonly accent: number;
  readonly pattern: number;
  readonly breath: BreathId;
}

/** How many of each part there are. The last of horns, wings and pattern are the wild ones (no bought egg has them). */
export const PARTS = { body: 6, head: 5, horns: 9, wings: 8, tail: 6, colour: 24, accent: 24, pattern: 9 } as const;
export const WILD_ONLY = { horns: 8, wings: 7, pattern: 8 } as const;
export const BODY_NAMES = ['Round', 'Long', 'Chunky', 'Slim', 'Pear', 'Puffy'] as const;

export const DRAGON_COLOURS = [
  '#e8483b', '#ff8a1f', '#f5c518', '#9bd42a', '#2fae5a', '#16a89a', '#2bb5e8', '#3b82e8', '#5560e0', '#8a4fd6', '#c04fd6', '#ff5fa2',
  '#ff9e9e', '#ffd27f', '#c9f27a', '#7fe0c0', '#9fd8ff', '#b9a6ff', '#a0622e', '#6b7280', '#3a3a44', '#f4f1e8', '#d4a017', '#2a9d8f',
] as const;

export interface DrawOpts {
  /** 0 hatchling, 1 young, 2 great. */
  readonly stage?: 0 | 1 | 2;
  /** Seconds, for flapping and blinking. */
  readonly t?: number;
  /** How fast the wings beat (0 still). */
  readonly flap?: number;
  readonly mood?: 'happy' | 'unhappy' | 'sleepy';
  readonly muddy?: boolean;
  readonly wingSize?: number;
  /** Marks earned after the last stage. */
  readonly marks?: number;
  /** Mouth open (roaring or breathing). */
  readonly open?: boolean;
  readonly saddle?: string | null;
  readonly hat?: string | null;
  /** A colour to wear instead of its own (the Adjectives lesson turns it green). */
  readonly paint?: string;
}

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
const OUT = '#2a1a12';

/** Where the mouth is, from the dragon's middle, in `size` units: breath comes from here. */
export const MOUTH = { x: .62, y: -.2 } as const;

/** The outline: the family's thick dark line, never heavier than 7px however big the dragon is drawn. */
const lineFor = (s: number) => Math.min(7, Math.max(1.5, s * .032));

export function drawDragon(ctx: CanvasRenderingContext2D, look: DragonLook, size: number, o: DrawOpts = {}) {
  const stage = o.stage ?? 2, t = o.t ?? 0, s = size, lw = lineFor(s);
  const col = o.paint ?? DRAGON_COLOURS[look.colour % DRAGON_COLOURS.length]!, acc = DRAGON_COLOURS[look.accent % DRAGON_COLOURS.length]!;
  const belly = shade(col, .62);
  // a hatchling is all head; a great dragon is long and strong
  const headK = [1.25, 1.08, 1][stage]!, bodyK = [.78, .92, 1][stage]!, wingK = ([.62, .84, 1][stage]!) * (o.wingSize ?? 1);
  const bodyW = [.5, .62, .56, .46, .52, .58][look.body % 6]! * bodyK, bodyH = [.36, .3, .4, .27, .38, .42][look.body % 6]! * bodyK;
  const beat = Math.sin(t * (o.flap ?? 0) * Math.PI * 2);
  const pear = look.body % 6 === 4;
  const bodyPath = () => { ctx.beginPath(); if (pear) ctx.ellipse(-bodyW * s * .15, bodyH * s * .1, bodyW * s * 1.05, bodyH * s, 0, 0, Math.PI * 2); else ctx.ellipse(0, 0, bodyW * s, bodyH * s, -.08, 0, Math.PI * 2); };
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = OUT;

  // ---------- the far wing, behind ----------
  drawWing(ctx, look.wings, s, wingK, beat, col, acc, true, lw);

  // ---------- tail: thick at the body, curling up to its tip ----------
  const tx = -bodyW * s * .95, ty = bodyH * s * .15, sway = Math.sin(t * 2) * s * .03;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-bodyW * s * .45, -bodyH * s * .4);
  ctx.quadraticCurveTo(tx - s * .06, ty - s * .08, tx - s * .28, ty - s * .22 + sway);
  ctx.quadraticCurveTo(tx + s * .02, ty + s * .14, -bodyW * s * .4, bodyH * s * .55);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  drawTailTip(ctx, look.tail, tx - s * .28, ty - s * .22 + sway, s, acc, col);

  // ---------- spines down its back, in its accent colour ----------
  ctx.fillStyle = shade(acc, .1);
  for (const a of [-2.75, -2.45, -2.15]) {
    const ex = Math.cos(a) * bodyW * s * (pear ? 1.05 : 1) - (pear ? bodyW * s * .15 : 0), ey = Math.sin(a) * bodyH * s + (pear ? bodyH * s * .1 : 0), r = s * .055 * bodyK;
    const nx = Math.cos(a), ny = Math.sin(a);
    ctx.beginPath(); ctx.moveTo(ex - ny * r - nx * r * .4, ey + nx * r - ny * r * .4); ctx.quadraticCurveTo(ex + nx * r * 1.2 - ny * r * .5, ey + ny * r * 1.2 + nx * r * .5, ex + nx * r * 1.5, ey + ny * r * 1.5);
    ctx.quadraticCurveTo(ex + nx * r * .9 + ny * r * .6, ey + ny * r * .9 - nx * r * .6, ex + ny * r - nx * r * .4, ey - nx * r - ny * r * .4); ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // ---------- legs: short and stout, with pale toes ----------
  for (const [i, lx] of [[0, -.28], [1, .22]] as const) {
    const x = lx * bodyW * s * 1.6, top = bodyH * s * .3, bottom = bodyH * s * .95 + s * .05, w = s * .12;
    ctx.fillStyle = i ? col : shade(col, -.15);
    ctx.beginPath(); ctx.roundRect(x - w / 2, top, w, bottom - top, w * .45); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + w * .15, bottom - s * .01, w * .62, s * .038, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // a foot
    ctx.fillStyle = belly; for (const c of [-.1, .2, .5]) { ctx.beginPath(); ctx.arc(x + w * (c + .15), bottom - s * .01, s * .012, 0, Math.PI * 2); ctx.fill(); } // claws
  }

  // ---------- neck, behind the body and the head, so it joins them ----------
  const hx = bodyW * s * .95, hy = -bodyH * s * .9, hr = s * .2 * headK;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(hx - hr * .55, hy + hr * .6, hr * .6, hr * .85, .55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // ---------- body and belly ----------
  ctx.fillStyle = col;
  bodyPath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = belly;
  ctx.beginPath(); ctx.ellipse(bodyW * s * .08, bodyH * s * .62, bodyW * s * .78, bodyH * s * .55, -.05, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(col, .38); ctx.lineWidth = Math.max(1, lw * .6); // the belly's soft plates
  for (const k of [-.4, -.1, .2, .5]) { const x = bodyW * s * (.08 + k); ctx.beginPath(); ctx.moveTo(x, bodyH * s * .22); ctx.quadraticCurveTo(x - bodyW * s * .06, bodyH * s * .6, x, bodyH * s); ctx.stroke(); }
  drawPattern(ctx, look.pattern, bodyW * s, bodyH * s, acc, s);
  for (let k = 0; k < Math.min(o.marks ?? 0, 6); k++) { // stripes he has earned, across the back
    ctx.strokeStyle = shade(acc, -.1); ctx.lineWidth = s * .03;
    ctx.beginPath(); ctx.arc(-bodyW * s * .6 + k * s * .1, -bodyH * s * 1.1, bodyH * s * .7, .9, 1.6); ctx.stroke();
  }
  if (o.muddy) { ctx.fillStyle = '#6b4423cc'; for (const [mx, my, mr] of [[-.3, .2, .12], [.15, -.15, .09], [.3, .3, .1], [-.05, .45, .08]] as const) { ctx.beginPath(); ctx.arc(mx * bodyW * s * 1.6, my * bodyH * s * 1.6, mr * s, 0, Math.PI * 2); ctx.fill(); } }
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = lw;
  bodyPath(); ctx.stroke(); // the outline again, crisp over the neck's join

  if (o.saddle) { ctx.fillStyle = o.saddle; ctx.beginPath(); ctx.ellipse(-bodyW * s * .1, -bodyH * s * .85, s * .16, s * .07, -.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }

  // ---------- head ----------
  drawHorns(ctx, look.horns, hx, hy, hr, acc, (o.marks ?? 0) >= 2);
  ctx.fillStyle = col;
  ctx.beginPath();
  const headShape = look.head % 5;
  if (headShape === 1) ctx.ellipse(hx, hy, hr * 1.1, hr * .9, -.15, 0, Math.PI * 2);
  else if (headShape === 2) ctx.roundRect(hx - hr, hy - hr * .9, hr * 2, hr * 1.8, hr * .7);
  else ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // snout, a shade paler than the head
  const snoutL = [1, .8, 1.15, .9, 1.3][headShape]!;
  ctx.fillStyle = shade(col, .14);
  ctx.beginPath(); ctx.ellipse(hx + hr * .85, hy + hr * .25, hr * .62 * snoutL, hr * .46, .05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = OUT;
  ctx.beginPath(); ctx.arc(hx + hr * (1.05 + .3 * (snoutL - 1)), hy + hr * .08, hr * .07, 0, Math.PI * 2); ctx.fill(); // nostril
  // mouth
  ctx.lineWidth = lw * .85;
  ctx.beginPath();
  if (o.open) { ctx.fillStyle = '#7a1f1f'; ctx.ellipse(hx + hr * 1.05, hy + hr * .48, hr * .3, hr * .18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  else if (o.mood === 'unhappy') { ctx.arc(hx + hr * .95, hy + hr * .72, hr * .22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  else { ctx.arc(hx + hr * .95, hy + hr * .3, hr * .28, .45, Math.PI * .85); ctx.stroke(); }
  ctx.lineWidth = lw;
  // cheek
  ctx.globalAlpha = .7; ctx.fillStyle = '#ff8fb0'; ctx.beginPath(); ctx.ellipse(hx + hr * .08, hy + hr * .42, hr * .2, hr * .14, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  // eye: big and shiny; blinks now and then; closed when sleepy
  const blink = o.mood === 'sleepy' || (t % 4.2) < .12;
  const ex = hx + hr * .15, ey = hy - hr * .2, er = hr * (stage === 0 ? .36 : .3);
  if (blink) { ctx.beginPath(); ctx.arc(ex, ey, er * .8, .2, Math.PI - .2); ctx.stroke(); }
  else {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.arc(ex + er * .25, ey + (o.mood === 'unhappy' ? er * .2 : 0), er * .55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + er * .45, ey - er * .25, er * .22, 0, Math.PI * 2); ctx.fill();
    if (o.mood === 'unhappy') { ctx.beginPath(); ctx.moveTo(ex - er, ey - er * 1.3); ctx.lineTo(ex + er, ey - er * .9); ctx.stroke(); }
  }
  if (o.hat) { ctx.font = `${hr * 1.3}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.hat, hx - hr * .1, hy - hr * 1.2); }

  // ---------- the near wing, in front ----------
  drawWing(ctx, look.wings, s, wingK, beat, col, acc, false, lw);
  if ((o.marks ?? 0) >= 3) { // a star on the wing
    ctx.fillStyle = '#ffe14d'; star(ctx, -s * .2, -s * .5 - beat * s * .12, s * .06); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); }
  ctx.closePath();
}

type P = readonly [number, number];
/** A scallop from a to b, its curve pulled toward `to` (in for a bat's membrane, out for a feather). */
const scallop = (ctx: CanvasRenderingContext2D, a: P, b: P, to: P, k: number) => {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  ctx.quadraticCurveTo(mx + (to[0] - mx) * k, my + (to[1] - my) * k, b[0], b[1]);
};

/** A wing, rising from the shoulder and swept back: a bright arm in the body's colour holding a pale membrane, so it reads as a wing
 *  (not a dark shape) even when the dragon is small. The far wing is the same, a shade darker, behind the body. */
function drawWing(ctx: CanvasRenderingContext2D, kind: number, s: number, k: number, beat: number, col: string, acc: string, far: boolean, lw: number) {
  const kd = kind % 8, sizeK = kd === 4 ? 1.22 : kd === 3 ? .5 : 1;
  const lift = beat * s * .22 * k * sizeK;
  ctx.save();
  ctx.translate(far ? s * .16 : -s * .04, far ? -s * .24 : -s * .2);
  if (far) ctx.rotate(.22); // the far wing, a little forward and more upright, so the two read as a pair
  const span = s * .6 * k * sizeK, tipY = -span * .85 - lift, back = -span * .78;
  const skin = shade(col, far ? .3 : .55), bone = far ? shade(col, -.14) : col;
  const R1: P = [s * .09, s * .02], R2: P = [-s * .2, s * .05], W: P = [-span * .08, tipY * .78], T: P = [back, tipY];
  const arm = () => { // the leading edge: shoulder, wrist, tip
    ctx.beginPath(); ctx.moveTo(R1[0], R1[1]); ctx.quadraticCurveTo(s * .06, tipY * .45, W[0], W[1]); ctx.lineTo(T[0], T[1]);
    ctx.strokeStyle = OUT; ctx.lineWidth = lw * 2.4; ctx.stroke();
    ctx.strokeStyle = bone; ctx.lineWidth = lw * 1.1; ctx.stroke();
    ctx.fillStyle = bone; ctx.beginPath(); ctx.arc(W[0], W[1], lw * 1.1, 0, Math.PI * 2); ctx.fill(); // the wrist
  };
  ctx.fillStyle = skin; ctx.strokeStyle = OUT; ctx.lineWidth = lw;
  switch (kd) {
    case 1: { // feathered: round feathers fanning back
      const F: P[] = [[back * 1.02, tipY * .62], [back * .9, tipY * .3], [back * .62, tipY * .06]];
      ctx.beginPath(); ctx.moveTo(R1[0], R1[1]); ctx.quadraticCurveTo(s * .06, tipY * .45, W[0], W[1]); ctx.lineTo(T[0], T[1]);
      let a: P = T; for (const f of [...F, R2]) { scallop(ctx, a, f, W, -.4); a = f; }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = shade(col, .2); ctx.lineWidth = Math.max(1, lw * .7);
      for (const f of F) { ctx.beginPath(); ctx.moveTo(W[0], W[1]); ctx.lineTo(W[0] + (f[0] - W[0]) * .8, W[1] + (f[1] - W[1]) * .8); ctx.stroke(); }
      arm(); break;
    }
    case 2: { // butterfly: two round lobes, each with a spot
      for (const [cx, cy, rx, ry, rot] of [[back * .5, tipY * .62, span * .42, span * .52, -.55], [back * .55, tipY * .08, span * .3, span * .22, .3]] as const) {
        ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = shade(acc, .15); ctx.beginPath(); ctx.arc(cx + rx * .1, cy - ry * .1, Math.min(rx, ry) * .35, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 5: { // leaf: one broad leaf with its veins
      ctx.beginPath(); ctx.moveTo(R1[0], R1[1]); ctx.quadraticCurveTo(span * .25, tipY * .75, T[0], T[1]); ctx.quadraticCurveTo(back * 1.05, tipY * .1, R2[0], R2[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = bone; ctx.lineWidth = lw * 1.1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(back * .3, tipY * .5, T[0] * .85, T[1] * .85); ctx.stroke();
      ctx.lineWidth = Math.max(1, lw * .7);
      for (const q of [.35, .6]) { const x = back * q * .9, y = tipY * q * .85; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - span * .22, y + span * .12); ctx.stroke(); }
      break;
    }
    case 6: { // fin: a fan of rays, like a fish's
      const F: P[] = [T, [back * 1.05, tipY * .66], [back * 1.02, tipY * .34], [back * .8, tipY * .06]];
      ctx.beginPath(); ctx.moveTo(R1[0], R1[1]); ctx.lineTo(W[0] * .4, W[1] * .5); ctx.lineTo(T[0], T[1]);
      let a: P = T; for (const f of [...F.slice(1), R2]) { scallop(ctx, a, f, [0, 0], -.25); a = f; }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = bone; ctx.lineWidth = lw * 1.1;
      for (const f of F) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(f[0] * .92, f[1] * .92); ctx.stroke(); }
      break;
    }
    default: { // bat (and tiny, big sails and the wild rainbow wing): fingers from the wrist, the membrane scalloped between them
      const F: P[] = [[back * 1.08, tipY * .45], [back * .82, tipY * .12]];
      ctx.beginPath(); ctx.moveTo(R1[0], R1[1]); ctx.quadraticCurveTo(s * .06, tipY * .45, W[0], W[1]); ctx.lineTo(T[0], T[1]);
      let a: P = T; for (const f of [...F, R2]) { scallop(ctx, a, f, W, .32); a = f; }
      ctx.closePath();
      if (kd === 7) {
        const g = ctx.createLinearGradient(0, tipY, 0, 0);
        ['#e8483b', '#ff8a1f', '#f5c518', '#2fae5a', '#3b82e8', '#8a4fd6'].forEach((c, i) => g.addColorStop(i / 5, c));
        ctx.fillStyle = g;
      }
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = bone; ctx.lineWidth = Math.max(1, lw * .9);
      for (const f of F) { ctx.beginPath(); ctx.moveTo(W[0], W[1]); ctx.lineTo(f[0], f[1]); ctx.stroke(); }
      arm();
    }
  }
  ctx.restore();
  ctx.strokeStyle = OUT; ctx.lineWidth = lw;
}

function drawTailTip(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, s: number, acc: string, col: string) {
  ctx.fillStyle = acc;
  ctx.beginPath();
  switch (kind % 6) {
    case 1: // spade
      ctx.moveTo(x, y); ctx.lineTo(x - s * .1, y - s * .02); ctx.lineTo(x - s * .03, y - s * .12); ctx.closePath(); break;
    case 2: // fluffy tuft
      for (let i = 2; i >= 0; i--) { ctx.beginPath(); ctx.arc(x - s * .04 - i * s * .03, y - s * .03 + (i % 2) * s * .04, s * .05, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      return;
    case 3: // club
      ctx.arc(x - s * .03, y - s * .02, s * .07, 0, Math.PI * 2); break;
    case 4: // curl
      ctx.fillStyle = col; ctx.arc(x - s * .04, y - s * .05, s * .06, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.fillStyle = acc; ctx.arc(x - s * .04, y - s * .05, s * .025, 0, Math.PI * 2); break;
    case 5: // a flame at the tip
      ctx.fillStyle = '#ffb02e'; ctx.moveTo(x, y + s * .03); ctx.quadraticCurveTo(x - s * .14, y - s * .05, x - s * .03, y - s * .18); ctx.quadraticCurveTo(x + s * .04, y - s * .05, x, y + s * .03); break;
    default: // point
      ctx.moveTo(x + s * .02, y + s * .03); ctx.lineTo(x - s * .08, y - s * .06); ctx.lineTo(x + s * .03, y - s * .06); ctx.closePath();
  }
  ctx.fill(); ctx.stroke();
}

function drawHorns(ctx: CanvasRenderingContext2D, kind: number, hx: number, hy: number, hr: number, acc: string, ring: boolean) {
  const k = kind % 9;
  if (k === 0) return;
  ctx.fillStyle = k === 8 ? '#bff3ff' : shade(acc, .35);
  const horn = (dx: number, len: number, bend: number) => {
    ctx.beginPath();
    ctx.moveTo(hx + dx - hr * .14, hy - hr * .7);
    ctx.quadraticCurveTo(hx + dx - hr * bend, hy - hr * (.8 + len * .6), hx + dx - hr * bend * 1.6, hy - hr * (.7 + len));
    ctx.quadraticCurveTo(hx + dx, hy - hr * (.7 + len * .5), hx + dx + hr * .14, hy - hr * .75);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  switch (k) {
    case 1: ctx.beginPath(); ctx.arc(hx - hr * .3, hy - hr * .85, hr * .16, 0, Math.PI * 2); ctx.arc(hx + hr * .15, hy - hr * .95, hr * .16, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break; // nubs
    case 2: horn(-hr * .3, .9, .7); horn(hr * .15, .8, .6); break; // curly
    case 3: horn(-hr * .3, 1.3, .3); horn(hr * .15, 1.2, .25); break; // long
    case 4: for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(hx - hr * .5 + i * hr * .35, hy - hr * .8); ctx.lineTo(hx - hr * .35 + i * hr * .35, hy - hr * 1.35); ctx.lineTo(hx - hr * .2 + i * hr * .35, hy - hr * .85); ctx.closePath(); ctx.fill(); ctx.stroke(); } break; // crown
    case 5: horn(-hr * .05, 1.4, .05); break; // one, in the middle
    case 6: for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(hx - hr * 1.1 + i * hr * .3, hy - hr * .55 + i * -hr * .1); ctx.lineTo(hx - hr * 1.05 + i * hr * .3, hy - hr * .95 - i * hr * .1); ctx.lineTo(hx - hr * .85 + i * hr * .3, hy - hr * .65 - i * hr * .1); ctx.fill(); ctx.stroke(); } break; // spikes
    case 7: horn(-hr * .3, 1, .9); horn(hr * .15, 1, -.5); break; // antlers
    default: horn(-hr * .25, 1.1, .2); horn(hr * .15, 1, .2); // crystal (wild)
  }
  if (ring) { ctx.strokeStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(hx - hr * .3, hy - hr * 1.05, hr * .18, hr * .06, 0, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = OUT; }
}

function drawPattern(ctx: CanvasRenderingContext2D, kind: number, w: number, h: number, acc: string, s: number) {
  ctx.fillStyle = shade(acc, .1);
  ctx.strokeStyle = shade(acc, .1);
  ctx.lineWidth = s * .03;
  const dots = (pts: readonly (readonly [number, number, number])[]) => { for (const [x, y, r] of pts) { ctx.beginPath(); ctx.arc(x * w, y * h, r * s, 0, Math.PI * 2); ctx.fill(); } };
  switch (kind % 9) {
    case 1: dots([[-.5, -.4, .05], [-.1, -.6, .04], [.3, -.45, .05], [-.3, -.1, .03], [.55, -.1, .03]]); break; // spots
    case 2: for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * w * .25, -h); ctx.lineTo(i * w * .25 + w * .1, -h * .2); ctx.stroke(); } break; // stripes
    case 3: for (const [x, y] of [[-.4, -.5], [.15, -.55], [.45, -.2]] as const) { star(ctx, x * w, y * h, s * .05); ctx.fill(); } break; // stars
    case 4: for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-w * .6 + i * w * .3, -h * .55, s * .05, 0, Math.PI); ctx.stroke(); } break; // scales
    case 5: for (const [x, y] of [[-.35, -.45], [.25, -.5]] as const) { const cx = x * w, cy = y * h, r = s * .035; ctx.beginPath(); ctx.arc(cx - r, cy, r, Math.PI, 0); ctx.arc(cx + r, cy, r, Math.PI, 0); ctx.lineTo(cx, cy + r * 2); ctx.closePath(); ctx.fill(); } break; // hearts
    case 6: ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(-w + i * w * .25, -h * .45 + (i % 2) * h * .2); ctx.stroke(); break; // zigzag
    case 7: dots([[-.6, -.3, .1], [.0, -.55, .08], [.5, -.3, .09]]); break; // patches
    case 8: { // the wild one: a starry night across its back
      ctx.fillStyle = '#1b1f4a99'; ctx.beginPath(); ctx.ellipse(0, -h * .6, w * .9, h * .45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; for (const [x, y] of [[-.5, -.6], [-.2, -.75], [.2, -.6], [.5, -.7], [0, -.45]] as const) { star(ctx, x * w, y * h, s * .025); ctx.fill(); }
      break;
    }
    default:
  }
}

/** An egg, drawn round (0, 0), `size` tall: its dragon's colours, with spots or stripes, and cracks as it gets close to hatching. */
export function drawEgg(ctx: CanvasRenderingContext2D, look: DragonLook, size: number, warmth: number, t = 0) {
  const col = DRAGON_COLOURS[look.colour % DRAGON_COLOURS.length]!, acc = DRAGON_COLOURS[look.accent % DRAGON_COLOURS.length]!;
  const wobble = warmth >= 1 ? Math.sin(t * 9) * .12 : warmth > .6 ? Math.sin(t * 4) * .04 : 0;
  ctx.save();
  ctx.rotate(wobble);
  ctx.lineWidth = Math.max(1.5, size * .04); ctx.strokeStyle = OUT;
  ctx.fillStyle = shade(col, .35);
  ctx.beginPath(); ctx.ellipse(0, 0, size * .36, size * .48, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = acc;
  if (look.pattern % 2) for (const [x, y, r] of [[-.15, -.2, .08], [.12, .05, .1], [-.08, .25, .07], [.18, -.3, .05]] as const) { ctx.beginPath(); ctx.arc(x * size, y * size, r * size, 0, Math.PI * 2); ctx.fill(); }
  else for (let i = -1; i <= 1; i++) { ctx.fillRect(-size * .5, i * size * .22 - size * .03, size, size * .06); }
  ctx.fillStyle = '#ffffff55'; ctx.beginPath(); ctx.ellipse(-size * .12, -size * .2, size * .07, size * .14, -.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(0, 0, size * .36, size * .48, 0, 0, Math.PI * 2); ctx.stroke();
  if (warmth > .5) { // cracks
    ctx.beginPath(); ctx.moveTo(-size * .2, -size * .05); ctx.lineTo(-size * .08, -size * .12); ctx.lineTo(0, -size * .02); ctx.lineTo(size * .1, -size * .1);
    if (warmth >= 1) { ctx.lineTo(size * .2, 0); ctx.moveTo(-size * .05, -size * .3); ctx.lineTo(size * .02, -size * .18); }
    ctx.stroke();
  }
  ctx.restore();
}

/** Draws a dragon to a fresh canvas and returns it as an image URL, for tiles and lists (cached). */
const pics = new Map<string, string>();
export function dragonPic(look: DragonLook, px: number, o: DrawOpts = {}): string {
  const key = JSON.stringify([look, px, o]);
  const hit = pics.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas'), dpr = 2;
  c.width = px * dpr; c.height = px * dpr;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr); ctx.translate(px * .46, px * .58);
  drawDragon(ctx, look, px * .62, { stage: 2, ...o });
  const url = c.toDataURL();
  pics.set(key, url);
  return url;
}
export function eggPic(look: DragonLook, px: number, warmth = 0): string {
  const key = JSON.stringify(['egg', look, px, warmth]);
  const hit = pics.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas'), dpr = 2;
  c.width = px * dpr; c.height = px * dpr;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.scale(dpr, dpr); ctx.translate(px / 2, px / 2);
  drawEgg(ctx, look, px * .9, warmth);
  const url = c.toDataURL();
  pics.set(key, url);
  return url;
}
