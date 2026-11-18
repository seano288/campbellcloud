// Draws the Service on a 2D canvas, from what service.ts holds: the Spot's sky and ground with its things in the background, the
// customers walking up (an emoji face on a body drawn in code) with their order in a bubble, the truck's awning and lights along the top
// of the kitchen, the grill spots with each order's ticket, the food (its base drawn in code, the finished food as its emoji, the
// toppings around it), the trays, and whatever his finger is carrying. Emoji are drawn as text, so they look as they do on his iPad.
import { partOf, type BaseShape, type CookKind, type Fitted } from '../truck/parts';
import { spotOf } from '../truck/world';
import { nextNeed, type Customer, type Food, type Service } from './service';

const SHIRTS = ['#e63946', '#2f6fd6', '#2fa84f', '#ffb000', '#8e5bd8', '#ff7ac8', '#14a3a3', '#ff8a1f'];
const INK = '#1d1d1f';
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches;

function emoji(g: CanvasRenderingContext2D, e: string, x: number, y: number, size: number) {
  g.font = `${Math.round(size)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(e, x, y + size * 0.06);
}
function rounded(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
}

/** The base, before it's cooked: drawn in code, so it can't be mistaken for the finished food. */
export function drawBase(g: CanvasRenderingContext2D, shape: BaseShape, x: number, y: number, r: number, cooked = 0) {
  g.save(); g.translate(x, y); g.lineWidth = Math.max(2, r * 0.07); g.strokeStyle = INK;
  const brown = (a: string, b: string) => (cooked > 0.5 ? b : a);
  switch (shape) {
    case 'tortilla': g.fillStyle = brown('#f6dfa0', '#e7bf6a'); g.beginPath(); g.ellipse(0, 0, r * .9, r * .78, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#d9b25e'; for (const [a, b] of [[-.3, -.2], [.25, .15], [-.1, .35], [.35, -.3]] as const) { g.beginPath(); g.arc(a * r, b * r, r * .06, 0, 7); g.fill(); } break;
    case 'dough': g.fillStyle = brown('#f3e0b8', '#e6b866'); g.beginPath(); g.arc(0, 0, r * .88, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#e7c98f'; g.beginPath(); g.arc(0, 0, r * .68, 0, 7); g.fill(); break;
    case 'patty': g.fillStyle = cooked > 0.5 ? '#6b3a1e' : '#c46a6a'; g.beginPath(); g.ellipse(0, 0, r * .85, r * .6, 0, 0, 7); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.25)'; for (const d of [-.3, 0, .3]) { g.beginPath(); g.moveTo(-r * .5, d * r); g.lineTo(r * .5, d * r); g.stroke(); } break;
    case 'cone': g.fillStyle = '#e8b66b'; g.beginPath(); g.moveTo(-r * .5, -r * .35); g.lineTo(r * .5, -r * .35); g.lineTo(0, r * .9); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#b07a32'; for (const d of [-.2, .15]) { g.beginPath(); g.moveTo(-r * .45, d * r); g.lineTo(r * .45, d * r + r * .2); g.stroke(); } break;
    case 'bowl': g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-r * .9, -r * .15); g.quadraticCurveTo(0, r * 1.25, r * .9, -r * .15); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = '#f1d27a'; g.lineWidth = r * .08; for (const d of [-.5, -.2, .1, .4]) { g.beginPath(); g.moveTo(d * r, -r * .2); g.quadraticCurveTo(d * r + r * .15, -r * .55, d * r + r * .3, -r * .2); g.stroke(); } break;
    case 'ring': g.fillStyle = brown('#f6e2b3', '#d7954a'); g.beginPath(); g.arc(0, 0, r * .85, 0, 7); g.arc(0, 0, r * .32, 0, 7, true); g.fill('evenodd'); g.stroke();
      g.beginPath(); g.arc(0, 0, r * .32, 0, 7); g.stroke(); break;
    case 'sausage': g.fillStyle = cooked > 0.5 ? '#a8432a' : '#e48a7a'; rounded(g, -r * .85, -r * .28, r * 1.7, r * .56, r * .28); g.fill(); g.stroke(); break;
    case 'batter': g.fillStyle = brown('#fbeec6', '#e3a24f'); g.beginPath(); g.ellipse(0, 0, r * .85, r * .7, 0, 0, 7); g.fill(); g.stroke(); break;
    case 'cup': g.fillStyle = '#e9f4ff'; g.beginPath(); g.moveTo(-r * .55, -r * .7); g.lineTo(r * .55, -r * .7); g.lineTo(r * .4, r * .8); g.lineTo(-r * .4, r * .8); g.closePath(); g.fill(); g.stroke(); break;
    case 'kernels': g.fillStyle = '#e63946'; g.beginPath(); g.moveTo(-r * .6, -r * .55); g.lineTo(r * .6, -r * .55); g.lineTo(r * .45, r * .8); g.lineTo(-r * .45, r * .8); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ffd23f'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(((i % 3) - 1) * r * .3, -r * .62 + Math.floor(i / 3) * r * .08, r * .1, 0, 7); g.fill(); } break;
  }
  g.restore();
}

/** A grill spot, drawn as the truck's way of cooking. */
function drawStation(g: CanvasRenderingContext2D, cook: CookKind, x: number, y: number, r: number, glow: boolean, heat: number) {
  g.save(); g.translate(x, y); g.lineWidth = 4; g.strokeStyle = INK;
  const ring = cook === 'freezer' ? '#bfe9ff' : cook === 'blender' ? '#d6f5e8' : cook === 'oven' ? '#7a3b1d' : cook === 'pot' ? '#9aa3ad' : '#3b424c';
  g.fillStyle = ring; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); g.stroke();
  g.fillStyle = cook === 'freezer' ? '#e8f8ff' : cook === 'blender' ? '#f4fffa' : cook === 'oven' ? '#2a1209' : cook === 'pot' ? '#5d8fb8' : '#1c2027'; g.beginPath(); g.arc(0, 0, r * .82, 0, 7); g.fill();
  if (cook === 'grill' || cook === 'griddle' || cook === 'fryer' || cook === 'popper') {
    g.strokeStyle = heat > 0 ? '#ff8a1f' : '#555c66'; g.lineWidth = Math.max(2, r * .05);
    for (let k = -3; k <= 3; k++) { const d = k * r * .22, h = Math.sqrt(Math.max(0, (r * .8) ** 2 - d * d)); g.beginPath(); g.moveTo(d, -h); g.lineTo(d, h); g.stroke(); }
  }
  if (glow) { g.strokeStyle = '#ffd23f'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, r + 5, 0, 7); g.stroke(); }
  g.restore();
}

function drawFoodOn(g: CanvasRenderingContext2D, s: Service, f: Food, x: number, y: number, r: number) {
  const k = s.kind, cooked = f.cooked >= 1, show = (cooked && !k.cookFirst) || (cooked && k.cookFirst);
  if (show) emoji(g, k.food, x, y, r * 1.35); else drawBase(g, k.base, x, y, r * .9, f.cooked);
  // toppings around it
  f.toppings.forEach((id, i) => {
    const a = -Math.PI / 2 + (i - (f.toppings.length - 1) / 2) * 0.9, t = k.toppings.find(t => t.id === id)!;
    emoji(g, t.emoji, x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55 + r * .1, r * .62);
  });
}

function drawCustomer(g: CanvasRenderingContext2D, s: Service, c: Customer, now: number) {
  const L = s.layout, h = L.head, x = c.x, feet = L.feet;
  const bob = c.state === 'walking' || c.state === 'leaving' ? Math.abs(Math.sin(now * 9 + c.id)) * h * .08 : c.state === 'happy' && !reduced() ? Math.abs(Math.sin(now * 12)) * h * .25 : 0;
  const dance = s.setup.helpers.bubbles && c.state === 'waiting' && !reduced() ? Math.sin(now * 6 + c.id) * h * .08 : 0;
  g.save(); g.translate(x + dance, -bob);
  // legs and body
  g.lineWidth = 3; g.strokeStyle = INK;
  g.fillStyle = '#2b2f36'; rounded(g, -h * .32, feet - h * .62, h * .24, h * .62, 4); g.fill(); rounded(g, h * .08, feet - h * .62, h * .24, h * .62, 4); g.fill();
  g.fillStyle = SHIRTS[c.shirt % SHIRTS.length]!; rounded(g, -h * .45, feet - h * 1.45, h * .9, h * .9, h * .3); g.fill(); g.stroke();
  emoji(g, c.face, 0, feet - h * 1.85, h);
  if (c.state === 'happy') emoji(g, '❤️', h * .55, feet - h * 2.5, h * .45);
  g.restore();
}

/** The order, in a bubble beside the customer's head: the food and each topping. */
function drawBubble(g: CanvasRenderingContext2D, s: Service, c: Customer, food: Food | null) {
  const L = s.layout, h = L.head, items = [s.kind.food, ...c.order.map(id => s.kind.toppings.find(t => t.id === id)!.emoji)];
  const size = Math.max(18, h * .5), pad = size * .25, w = items.length * size + pad * 2, bh = size + pad * 2;
  let x = c.x - w / 2, y = L.feet - h * 2.4 - bh - 8;
  // a short street has no room above the heads (the HUD is there): the bubble goes beside the head
  if (L.streetH < 200 || y < 4) { y = Math.max(4, L.feet - h * 1.9 - bh / 2); x = c.x + h * .6; }
  x = Math.max(4, Math.min(L.w - w - 4, x));
  g.save(); g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 3;
  rounded(g, x, y, w, bh, bh / 2); g.fill(); g.stroke();
  items.forEach((e, i) => {
    const done = i > 0 && food?.toppings.includes(c.order[i - 1]!);
    g.globalAlpha = done ? .35 : 1;
    emoji(g, e, x + pad + size * (i + .5), y + bh / 2, size * .9);
  });
  g.restore();
}

function drawTicket(g: CanvasRenderingContext2D, s: Service, f: Food, x: number, y: number, w: number, h: number) {
  const c = s.customers.find(c => c.id === f.for);
  if (!c) return;
  g.save(); g.fillStyle = '#fffbe9'; g.strokeStyle = INK; g.lineWidth = 3;
  rounded(g, x - w / 2, y, w, h, 8); g.fill(); g.stroke();
  const items = [c.face, ...c.order.map(id => s.kind.toppings.find(t => t.id === id)!.emoji)], size = Math.min(h * .78, (w - 12) / items.length);
  items.forEach((e, i) => {
    g.globalAlpha = i > 0 && f.toppings.includes(c.order[i - 1]!) ? .3 : 1;
    emoji(g, e, x - (items.length * size) / 2 + size * (i + .5), y + h / 2, size * .92);
  });
  g.restore();
}

/** The awning along the top of the kitchen, and the lights on it. */
function drawAwning(g: CanvasRenderingContext2D, fit: Fitted, w: number, y: number, now: number, night: boolean) {
  const aw = partOf(fit.awning), cols = aw.look, n = Math.ceil(w / 46), sw = w / n, d = 18;
  for (let i = 0; i < n; i++) {
    g.fillStyle = aw.id === 'dots' ? (cols[0]!) : cols[i % cols.length]!;
    g.beginPath(); g.moveTo(i * sw, y - 14); g.lineTo((i + 1) * sw, y - 14); g.lineTo((i + 1) * sw, y); g.arc((i + .5) * sw, y, sw / 2, 0, Math.PI); g.closePath(); g.fill();
    if (aw.id === 'dots') { g.fillStyle = cols[1]!; g.beginPath(); g.arc((i + .5) * sw, y + 2, 5, 0, 7); g.fill(); }
  }
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y - 14); g.lineTo(w, y - 14); g.stroke();
  const lights = partOf(fit.lights).look;
  if (lights.length) for (let i = 0; i < n; i++) {
    const on = night || Math.floor(now * 2 + i) % 3 !== 0;
    g.fillStyle = lights[i % lights.length]!; g.globalAlpha = on ? 1 : .45;
    g.beginPath(); g.arc((i + .5) * sw, y + sw / 2 + 4, 6, 0, 7); g.fill();
    if (on && night) { g.globalAlpha = .25; g.beginPath(); g.arc((i + .5) * sw, y + sw / 2 + 4, 16, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  void d;
}

export interface Look { fit: Fitted; hint: { x: number; y: number } | null }

export function drawService(g: CanvasRenderingContext2D, s: Service, now: number, look: Look) {
  const L = s.layout, spot = spotOf(s.setup.spot);
  g.clearRect(0, 0, L.w, L.h);
  // the street: sky, ground, the Spot's things
  const sky = g.createLinearGradient(0, 0, 0, L.streetH);
  sky.addColorStop(0, spot.sky[0]); sky.addColorStop(1, spot.sky[1]);
  g.fillStyle = sky; g.fillRect(0, 0, L.w, L.streetH);
  if (spot.night) { g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { g.globalAlpha = .4 + .4 * Math.sin(now + i); g.fillRect((i * 97) % L.w, (i * 53) % (L.streetH * .6), 2, 2); } g.globalAlpha = 1; }
  // the ground the customers stand on, with the Spot's things standing back on it, smaller and paler
  const horizon = L.feet - L.head * .9;
  g.fillStyle = spot.ground; g.fillRect(0, horizon, L.w, L.streetH - horizon + 14);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, horizon, L.w, 3);
  spot.props.forEach((p, i) => { g.globalAlpha = .75; emoji(g, p, L.w * (i + .5) / spot.props.length, horizon - L.head * .35, L.head * .95); });
  g.globalAlpha = 1;
  for (const b of s.bubbles) { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke(); }
  for (const c of s.customers) drawCustomer(g, s, c, now);
  for (const c of s.customers) if (c.state === 'waiting' || c.state === 'walking') drawBubble(g, s, c, c.spot !== null ? (s.foods[c.spot] ?? null) : null);
  // the kitchen: steel counter, the awning over the hatch
  const steel = g.createLinearGradient(0, L.streetH, 0, L.h);
  steel.addColorStop(0, '#dfe5ec'); steel.addColorStop(1, '#aab4c0');
  g.fillStyle = steel; g.fillRect(0, L.streetH, L.w, L.h - L.streetH);
  g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2;
  for (let x = 0; x < L.w; x += 40) { g.beginPath(); g.moveTo(x, L.streetH); g.lineTo(x, L.h); g.stroke(); }
  drawAwning(g, look.fit, L.w, L.streetH, now, spot.night);
  // the grill spots
  const cook = s.kind.cook;
  s.layout.spots.forEach((p, i) => {
    const f = s.foods[i] ?? null, need = nextNeed(s, f), holding = s.hold?.spot === i;
    drawStation(g, cook, p.x, p.y, L.sr, !!f && need === 'ready' && !f.sent, holding ? 1 : 0);
    if (f) drawTicket(g, s, f, p.x, p.y - L.sr - L.ticketH - 4, Math.min(L.sr * 2.4, L.w / s.foods.length - 10), L.ticketH);
    if (f?.base && !s.pieces.some(q => q.spot === i && q.kind === 'food')) drawFoodOn(g, s, f, p.x, p.y, L.sr * .8);
    // cooking: a ring that fills while he holds; steam when it's done
    if (f?.base && need === 'cook' && (holding || f.cooked > 0)) {
      g.strokeStyle = '#ffd23f'; g.lineWidth = 8; g.beginPath(); g.arc(p.x, p.y, L.sr + 4, -Math.PI / 2, -Math.PI / 2 + f.cooked * Math.PI * 2); g.stroke();
      if (holding && !reduced()) for (let k = 0; k < 3; k++) emoji(g, cook === 'freezer' ? '❄️' : cook === 'blender' ? '🌀' : '♨️', p.x + (k - 1) * L.sr * .5, p.y - L.sr * .9 - ((now * 40 + k * 15) % 30), L.sr * .35);
    }
  });
  // the trays
  for (const t of L.trays) {
    g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 4;
    rounded(g, t.x - L.r, t.y - L.r, L.r * 2, L.r * 2, L.r * .35); g.fill(); g.stroke();
    if (t.id === 'base') drawBase(g, s.kind.base, t.x, t.y, L.r * .8);
    else emoji(g, s.kind.toppings.find(x => x.id === t.id)!.emoji, t.x, t.y, L.r * 1.15);
  }
  // what he's carrying, and what's flying
  for (const p of s.pieces) {
    g.globalAlpha = p.wrong && p.state === 'back' ? .7 : 1;
    if (p.kind === 'base') drawBase(g, s.kind.base, p.x, p.y, L.r * .85);
    else if (p.kind === 'topping') emoji(g, s.kind.toppings.find(x => x.id === p.id)!.emoji, p.x, p.y, L.r * 1.2);
    else { const f = s.foods[p.spot!]; if (f) drawFoodOn(g, s, f, p.x, p.y, L.r * .9); }
    g.globalAlpha = 1;
  }
  // the pointing finger
  if (look.hint) emoji(g, '👇', look.hint.x, look.hint.y - L.r * 1.1 - (reduced() ? 0 : Math.abs(Math.sin(now * 5)) * 12), Math.max(40, L.r * 1.1));
}
