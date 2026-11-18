// The Service, the reward he plays with his hands: customers walk up to the hatch with an order drawn as a picture (a taco with
// cheese and tomato). He drags the base onto a grill spot, the toppings onto the food, holds on it to cook it, and drags it to the
// customer (or taps it, and it slides over). About a minute of customers, then the last ones in line are served and it ends with a cheer
// and the count of people he fed.
//
// It cannot be failed. A wrong topping bounces back to its tray. Customers never get cross and never leave unfed. There is no clock he
// can lose to: when time is up no one new comes, and everyone in line is still served. If he stops, a pointing finger shows the next
// step after a few seconds, and after a few more it happens by itself, so even a child who does nothing finishes (service.test.ts).
//
// Pure and in CSS pixels: the screen (ServiceScreen.tsx) feeds it pointer events and a clock and draws what it holds (render.ts).
// Every piece he can drag is at least 48px across, and drops snap from well outside the target.
import { int, pick, shuffle, type Rng } from '../../game/rng';
import { truckOf, type TruckKind } from '../truck/parts';
import type { Setup } from '../truck/state';
import { FACES, spotOf } from '../truck/world';

export const SERVICE_S = 60;
export const COOK_S = 1.2;
/** Idle seconds before the finger points at the next step, and before the step happens by itself. Shorter after closing time. */
export const HINT_S = 6, AUTO_S = 14, LATE_HINT_S = 3, LATE_AUTO_S = 7;
export const STEP = 1 / 60;

// ---------- where everything is ----------

export interface Pt { x: number; y: number }
export interface Layout {
  w: number; h: number;
  /** The street: customers stand on the ground line `feet`. */
  streetH: number; feet: number; head: number;
  /** Where each place in line stands, front first. */
  line: number[];
  /** The kitchen: grill spots and their order tickets, and the trays. */
  workTop: number;
  spots: Pt[]; sr: number; ticketH: number;
  trays: (Pt & { id: string })[]; r: number;
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** The floor at the bottom belongs to iPadOS (a swipe there opens the Dock), so nothing to touch goes below it. */
export const FLOOR = 56;
export function layoutFor(w: number, h: number, trayIds: readonly string[], grills: number, lineCap: number): Layout {
  const streetH = Math.round(clamp(h * 0.36, 120, 330)), workTop = streetH + 12, workBottom = h - FLOOR, workH = workBottom - workTop;
  const wide = w > workH * 1.7;
  const spotBox = wide ? { x0: 12, x1: w * 0.46, y0: workTop, y1: workBottom } : { x0: 12, x1: w - 12, y0: workTop, y1: workTop + workH * 0.44 };
  const trayBox = wide ? { x0: w * 0.48, x1: w - 12, y0: workTop, y1: workBottom } : { x0: 12, x1: w - 12, y0: spotBox.y1, y1: workBottom };
  // the grill spots in a row, each with its ticket above
  const sw = (spotBox.x1 - spotBox.x0) / grills, sh = spotBox.y1 - spotBox.y0;
  const ticketH = clamp(sh * 0.2, 30, 52);
  const sr = clamp(Math.min(sw * 0.38, (sh - ticketH - 16) / 2), 30, 92);
  const spots = Array.from({ length: grills }, (_, i) => ({ x: spotBox.x0 + sw * (i + .5), y: spotBox.y0 + ticketH + 8 + sr + Math.max(0, (sh - ticketH - 16 - sr * 2) / 2) }));
  // trays: three across, as many rows as it takes
  const cols = 3, rows = Math.ceil(trayIds.length / cols), cw = (trayBox.x1 - trayBox.x0) / cols, ch = (trayBox.y1 - trayBox.y0) / rows;
  const r = clamp(Math.min(cw, ch) * 0.38, 26, 62);
  const trays = trayIds.map((id, i) => ({ id, x: trayBox.x0 + cw * ((i % cols) + .5), y: trayBox.y0 + ch * (Math.floor(i / cols) + .5) }));
  const head = clamp(streetH * 0.25, 28, 80), feet = streetH - 6;
  // on a short street the order bubbles sit beside the heads (above them is the HUD), so the line spreads out to make room
  const gapX = Math.min(w * 0.2, head * (streetH < 200 ? 3.4 : 2.6));
  const line = Array.from({ length: lineCap }, (_, k) => w * 0.8 - k * gapX);
  return { w, h, streetH, feet, head, line, workTop, spots, sr, ticketH, trays, r };
}

// ---------- the people and the food ----------

export interface Customer {
  id: number;
  face: string;
  /** A Regular's name, when it's one (a new one is met). */
  regular: string | null;
  order: string[];
  x: number;
  state: 'walking' | 'waiting' | 'happy' | 'leaving' | 'gone';
  /** Time in its state. */
  t: number;
  /** The grill spot cooking for it, if any. */
  spot: number | null;
  shirt: number;
}
export interface Food {
  for: number;
  base: boolean;
  toppings: string[];
  /** 0 to 1: cooked at 1. */
  cooked: number;
  /** It's on its way to the customer (the Conveyor Belt, or a tap). */
  sent: boolean;
}
export interface Piece {
  kind: 'base' | 'topping' | 'food';
  id: string;
  x: number; y: number;
  /** Where it came from: a tray, or a grill spot (food being handed over). */
  home: Pt; spot: number | null;
  state: 'held' | 'back' | 'fly';
  /** Where it's flying to, and what lands there. */
  to?: Pt; land?: () => void; t: number;
  wrong?: boolean;
}
export type Step = { kind: 'base'; spot: number } | { kind: 'cook'; spot: number } | { kind: 'topping'; spot: number; topping: string } | { kind: 'serve'; spot: number };
export type ServiceEvent =
  | { t: 'arrive'; regular: string | null } | { t: 'place' } | { t: 'topping'; id: string } | { t: 'wrong'; why: 'order' | 'cookFirst' | 'toppingsFirst' }
  | { t: 'cooking' } | { t: 'cooked' } | { t: 'served'; regular: string | null; face: string } | { t: 'hint'; step: Step } | { t: 'auto'; step: Step }
  | { t: 'closing' } | { t: 'done' };

export interface Service {
  setup: Setup;
  kind: TruckKind;
  layout: Layout;
  t: number;
  phase: 'open' | 'closing' | 'done';
  customers: Customer[];
  foods: (Food | null)[];
  pieces: Piece[];
  /** The finger on a grill spot, cooking. */
  hold: { pointer: number; spot: number } | null;
  /** A press that hasn't moved yet: a tap if it lifts here. */
  press: { pointer: number; x: number; y: number; on: 'tray' | 'food'; index: number } | null;
  nextArrive: number;
  nextId: number;
  fed: number;
  /** The Regular served this time, if one came. */
  metRegular: string | null;
  regularDue: boolean;
  idle: number;
  hinted: Step | null;
  events: ServiceEvent[];
  rng: Rng;
  /** Bubbles from the Bubble Machine, just for show. */
  bubbles: { x: number; y: number; r: number; v: number }[];
}

export const trayIdsOf = (k: TruckKind) => ['base', ...k.toppings.map(t => t.id)];

export function createService(setup: Setup, w: number, h: number, rng: Rng = Math.random): Service {
  const kind = truckOf(setup.truck);
  return {
    setup, kind, layout: layoutFor(w, h, trayIdsOf(kind), setup.grills, setup.line), t: 0, phase: 'open',
    customers: [], foods: Array.from({ length: setup.grills }, () => null), pieces: [], hold: null, press: null,
    nextArrive: 0.4, nextId: 1, fed: 0, metRegular: null, regularDue: !!setup.regular, idle: 0, hinted: null, events: [], rng, bubbles: [],
  };
}
/** The screen changed size: everything moves to its new place. */
export function resize(s: Service, w: number, h: number) {
  const old = s.layout;
  s.layout = layoutFor(w, h, trayIdsOf(s.kind), s.setup.grills, s.setup.line);
  for (const c of s.customers) c.x = c.x * (w / old.w);
  for (const p of s.pieces) { p.state = 'back'; p.x *= w / old.w; p.y *= h / old.h; p.home = p.spot !== null ? s.layout.spots[p.spot]! : trayPt(s, p.kind === 'base' ? 'base' : p.id); }
  s.hold = null; s.press = null;
}
export const takeEvents = (s: Service) => s.events.splice(0);

const trayPt = (s: Service, id: string): Pt => s.layout.trays.find(t => t.id === id) ?? s.layout.trays[0]!;
const customerOf = (s: Service, id: number) => s.customers.find(c => c.id === id);
const lineOf = (s: Service) => s.customers.filter(c => c.state === 'walking' || c.state === 'waiting');

/** What a food still needs, in order: the base, then cooking or toppings in the truck's order, then it's ready. */
export function nextNeed(s: Service, f: Food | null): 'base' | 'cook' | 'toppings' | 'ready' {
  if (!f || !f.base) return 'base';
  const c = customerOf(s, f.for), missing = c ? c.order.some(t => !f.toppings.includes(t)) : false;
  if (s.kind.cookFirst) return f.cooked < 1 ? 'cook' : missing ? 'toppings' : 'ready';
  return missing ? 'toppings' : f.cooked < 1 ? 'cook' : 'ready';
}
const missingOf = (s: Service, f: Food) => customerOf(s, f.for)?.order.filter(t => !f.toppings.includes(t)) ?? [];

// ---------- the clock ----------

const WALK = 260; // px a second
export function stepService(s: Service, dt: number) {
  if (s.phase === 'done') return;
  s.t += dt;
  const L = s.layout;
  // customers arrive until closing time, while there's room in line; a Regular he hasn't met comes second
  if (s.phase === 'open' && s.t >= SERVICE_S) { s.phase = 'closing'; s.events.push({ t: 'closing' }); }
  if (s.phase === 'open' && s.t >= s.nextArrive && lineOf(s).length < s.setup.line) {
    const regular = s.regularDue && s.nextId >= 2 ? s.setup.regular : null;
    if (regular) s.regularDue = false;
    const visitors = spotOf(s.setup.spot).visitors as readonly string[];
    const face = regular?.face ?? (visitors.length && s.rng() < .25 ? pick(s.rng, visitors) : pick(s.rng, FACES));
    const [lo, hi] = s.setup.toppings, n = int(s.rng, lo, hi);
    const order = regular ? [...regular.fav] : shuffle(s.rng, s.kind.toppings.map(t => t.id)).slice(0, n);
    s.customers.push({ id: s.nextId++, face, regular: regular?.name ?? null, order, x: -L.head * 2, state: 'walking', t: 0, spot: null, shirt: int(s.rng, 0, 7) });
    s.nextArrive = s.t + s.setup.gap;
    s.events.push({ t: 'arrive', regular: regular?.name ?? null });
  }
  if (s.phase === 'open' && lineOf(s).length >= s.setup.line) s.nextArrive = Math.max(s.nextArrive, s.t + 1);
  // walking up the line, and away
  const line = lineOf(s);
  for (const c of s.customers) {
    c.t += dt;
    if (c.state === 'walking' || c.state === 'waiting') {
      const k = line.indexOf(c), tx = L.line[Math.min(k, L.line.length - 1)]!;
      const d = tx - c.x, step = WALK * dt;
      if (Math.abs(d) <= step) { c.x = tx; if (c.state === 'walking') { c.state = 'waiting'; c.t = 0; } } else { c.x += Math.sign(d) * step; if (c.state === 'waiting') c.state = 'walking'; }
    } else if (c.state === 'happy' && c.t > 1.2) { c.state = 'leaving'; c.t = 0; }
    else if (c.state === 'leaving') { c.x += WALK * 1.3 * dt; if (c.x > L.w + L.head * 2) c.state = 'gone'; }
  }
  s.customers = s.customers.filter(c => c.state !== 'gone');
  // an empty grill spot takes the next customer in line who has none
  for (let i = 0; i < s.foods.length; i++) {
    if (s.foods[i]) continue;
    const c = lineOf(s).find(c => c.spot === null && c.state === 'waiting');
    if (c) { c.spot = i; s.foods[i] = { for: c.id, base: false, toppings: [], cooked: 0, sent: false }; }
  }
  // cooking, while his finger holds the spot
  if (s.hold) {
    const f = s.foods[s.hold.spot];
    if (f && nextNeed(s, f) === 'cook') {
      f.cooked = Math.min(1, f.cooked + dt / (s.setup.helpers.burner ? COOK_S / 2 : COOK_S));
      s.idle = 0;
      if (f.cooked >= 1) s.events.push({ t: 'cooked' });
    }
  }
  // the Robot Helper puts the base down; the Conveyor Belt sends ready food
  for (let i = 0; i < s.foods.length; i++) {
    const f = s.foods[i];
    if (!f) continue;
    if (s.setup.helpers.robot && !f.base && !s.pieces.some(p => p.spot === i && p.kind === 'base')) flyBase(s, i, trayPt(s, 'base'));
    if (s.setup.helpers.conveyor && !f.sent && nextNeed(s, f) === 'ready' && !s.pieces.some(p => p.spot === i && p.kind === 'food')) send(s, i);
  }
  // pieces flying home or to where they land
  for (const p of s.pieces) {
    if (p.state === 'held') continue;
    p.t += dt;
    const to = p.state === 'back' ? p.home : p.to!;
    const k = Math.min(1, dt * 12);
    p.x += (to.x - p.x) * k; p.y += (to.y - p.y) * k;
    if (Math.hypot(to.x - p.x, to.y - p.y) < 4 || p.t > 0.9) { p.x = to.x; p.y = to.y; if (p.state === 'fly') p.land?.(); p.state = 'back'; p.t = -1; }
  }
  s.pieces = s.pieces.filter(p => p.t !== -1);
  // help: a finger, then the step itself
  const busy = s.pieces.some(p => p.state === 'held') || !!s.hold;
  const step = nextStep(s);
  if (!step || busy) { s.idle = 0; s.hinted = null; }
  else {
    s.idle += dt;
    const late = s.phase !== 'open';
    if (s.idle >= (late ? LATE_HINT_S : HINT_S) && !s.hinted) { s.hinted = step; s.events.push({ t: 'hint', step }); }
    if (s.idle >= (late ? LATE_AUTO_S : AUTO_S)) { doStep(s, step); s.events.push({ t: 'auto', step }); s.idle = 0; s.hinted = null; }
  }
  if (s.setup.helpers.bubbles) {
    if (s.bubbles.length < 10 && s.rng() < dt * 3) s.bubbles.push({ x: s.rng() * L.w, y: L.streetH, r: 6 + s.rng() * 10, v: 30 + s.rng() * 40 });
    for (const b of s.bubbles) b.y -= b.v * dt;
    s.bubbles = s.bubbles.filter(b => b.y > -20);
  }
  // done when closing time has come and everyone has been fed and has walked off
  if (s.phase === 'closing' && !s.customers.length && !s.pieces.length) { s.phase = 'done'; s.events.push({ t: 'done' }); }
}

/** The next thing to do, for the pointing finger: the customer who has waited longest first. */
export function nextStep(s: Service): Step | null {
  const order = s.foods.map((f, i) => ({ f, i })).filter(x => x.f && !x.f.sent).sort((a, b) => a.f!.for - b.f!.for);
  for (const { f, i } of order) {
    if (s.pieces.some(p => p.spot === i)) continue; // something is already on its way there
    const need = nextNeed(s, f);
    if (need === 'base') return { kind: 'base', spot: i };
    if (need === 'cook') return { kind: 'cook', spot: i };
    if (need === 'toppings') return { kind: 'topping', spot: i, topping: missingOf(s, f!)[0]! };
    return { kind: 'serve', spot: i };
  }
  return null;
}
export function doStep(s: Service, step: Step) {
  const f = s.foods[step.spot];
  if (!f) return;
  if (step.kind === 'base') flyBase(s, step.spot, trayPt(s, 'base'));
  else if (step.kind === 'cook') { f.cooked = 1; s.events.push({ t: 'cooked' }); }
  else if (step.kind === 'topping') flyTopping(s, step.spot, step.topping, trayPt(s, step.topping));
  else send(s, step.spot);
}

// ---------- what lands where ----------

function flyBase(s: Service, i: number, from: Pt) {
  s.pieces.push({ kind: 'base', id: 'base', x: from.x, y: from.y, home: trayPt(s, 'base'), spot: i, state: 'fly', to: s.layout.spots[i], t: 0, land: () => placeBase(s, i) });
}
function placeBase(s: Service, i: number) {
  const f = s.foods[i];
  if (!f || f.base) return;
  f.base = true; s.idle = 0;
  s.events.push({ t: 'place' });
}
function flyTopping(s: Service, i: number, id: string, from: Pt) {
  s.pieces.push({ kind: 'topping', id, x: from.x, y: from.y, home: trayPt(s, id), spot: i, state: 'fly', to: s.layout.spots[i], t: 0, land: () => addTopping(s, i, id) });
}
function addTopping(s: Service, i: number, id: string) {
  const f = s.foods[i];
  if (!f || f.toppings.includes(id) || !missingOf(s, f).includes(id)) return;
  f.toppings.push(id); s.idle = 0;
  s.events.push({ t: 'topping', id });
}
/** The food goes to its customer: on landing, the customer is fed and the spot is free. */
function send(s: Service, i: number, from?: Pt) {
  const f = s.foods[i], c = f && customerOf(s, f.for);
  if (!f || !c || f.sent) return;
  f.sent = true;
  const L = s.layout, at = from ?? L.spots[i]!;
  s.pieces.push({ kind: 'food', id: s.kind.id, x: at.x, y: at.y, home: L.spots[i]!, spot: i, state: 'fly', to: { x: c.x, y: L.feet - L.head * 1.6 }, t: 0, land: () => serve(s, i) });
}
function serve(s: Service, i: number) {
  const f = s.foods[i], c = f && customerOf(s, f.for);
  s.foods[i] = null;
  if (!c) return;
  c.state = 'happy'; c.t = 0; c.spot = null;
  s.fed++; s.idle = 0;
  if (c.regular && s.setup.regular?.name === c.regular) s.metRegular = s.setup.regular.id;
  s.events.push({ t: 'served', regular: c.regular, face: c.face });
}

// ---------- his finger ----------

const near = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const snap = (s: Service) => s.layout.sr * (s.setup.helpers.spatula ? 2.6 : 1.7);
/** The grill spot nearest a point, within snapping distance. */
function spotAt(s: Service, p: Pt, reach = snap(s)): number | null {
  let best: number | null = null, d = reach;
  s.layout.spots.forEach((q, i) => { const e = near(p, q); if (e <= d) { d = e; best = i; } });
  return best;
}

export function pointerDown(s: Service, pointer: number, x: number, y: number) {
  if (s.phase === 'done' || s.pieces.some(p => p.state === 'held') || s.hold || s.press) return;
  const L = s.layout, at = { x, y };
  // a tray: pick up what's in it
  const tray = L.trays.findIndex(t => near(at, t) <= L.r * 1.25);
  if (tray >= 0) {
    const id = L.trays[tray]!.id;
    s.pieces.push({ kind: id === 'base' ? 'base' : 'topping', id, x, y, home: L.trays[tray]!, spot: null, state: 'held', t: 0 });
    s.press = { pointer, x, y, on: 'tray', index: tray };
    return;
  }
  // a grill spot: hold to cook, or pick up ready food
  const i = spotAt(s, at, L.sr * 1.25);
  if (i === null) return;
  const f = s.foods[i] ?? null, need = nextNeed(s, f);
  if (f && !f.sent && need === 'ready') {
    s.pieces.push({ kind: 'food', id: s.kind.id, x, y, home: L.spots[i]!, spot: i, state: 'held', t: 0 });
    s.press = { pointer, x, y, on: 'food', index: i };
    return;
  }
  if (f && f.base) {
    s.hold = { pointer, spot: i };
    if (need === 'cook') s.events.push({ t: 'cooking' });
    else if (need === 'toppings' && !s.kind.cookFirst) s.events.push({ t: 'wrong', why: 'toppingsFirst' });
  }
}
export function pointerMove(s: Service, pointer: number, x: number, y: number) {
  if (s.press?.pointer === pointer && near(s.press, { x, y }) > 12) s.press = null;
  const held = s.pieces.find(p => p.state === 'held');
  if (held && (!s.press || s.press.pointer === pointer)) { held.x = x; held.y = y; }
  // sliding off the spot stops the cooking; it stays as cooked as it got
  if (s.hold?.pointer === pointer && near({ x, y }, s.layout.spots[s.hold.spot]!) > s.layout.sr * 1.6) s.hold = null;
}
export function pointerUp(s: Service, pointer: number, x: number, y: number) {
  if (s.hold?.pointer === pointer) { s.hold = null; return; }
  const held = s.pieces.find(p => p.state === 'held');
  const tap = s.press?.pointer === pointer ? s.press : null;
  s.press = null;
  if (!held) return;
  held.x = x; held.y = y;
  if (held.kind === 'food') { dropFood(s, held, tap !== null); return; }
  if (tap) { tapTray(s, held); return; }
  dropIngredient(s, held);
}

/** A tap on a tray: it goes where it fits, or bounces back if nothing needs it. */
function tapTray(s: Service, p: Piece) {
  s.pieces = s.pieces.filter(q => q !== p);
  const waiting = s.foods.map((f, i) => ({ f, i })).filter((x): x is { f: Food; i: number } => !!x.f && !x.f.sent).sort((a, b) => a.f.for - b.f.for);
  const fits = waiting.find(({ f, i }) => p.kind === 'base'
    ? !f.base && !s.pieces.some(q => q.kind === 'base' && q.spot === i)
    : nextNeed(s, f) === 'toppings' && missingOf(s, f).includes(p.id) && !s.pieces.some(q => q.spot === i && q.id === p.id));
  if (fits) { if (p.kind === 'base') flyBase(s, fits.i, p); else flyTopping(s, fits.i, p.id, p); return; }
  const early = p.kind === 'topping' && s.kind.cookFirst && waiting.some(({ f }) => nextNeed(s, f) === 'cook' && missingOf(s, f).includes(p.id));
  bounce(s, p, early ? 'cookFirst' : 'order');
}
function dropIngredient(s: Service, p: Piece) {
  const i = p.kind === 'base' ? spotAt(s, p, s.layout.sr * 2.6) : spotAt(s, p);
  const f = i === null ? null : s.foods[i];
  if (i === null || !f || f.sent) { p.state = 'back'; p.t = 0; return; } // let go away from the grill: it goes home, no fuss
  if (p.kind === 'base') {
    if (f.base) { bounce(s, p); return; }
    s.pieces = s.pieces.filter(q => q !== p);
    flyBase(s, i, p);
    return;
  }
  const need = nextNeed(s, f);
  if (need === 'toppings' && missingOf(s, f).includes(p.id)) { s.pieces = s.pieces.filter(q => q !== p); flyTopping(s, i, p.id, p); return; }
  if (need === 'cook' && s.kind.cookFirst && missingOf(s, f).includes(p.id)) { bounce(s, p, 'cookFirst'); return; }
  bounce(s, p);
}
function dropFood(s: Service, p: Piece, tapped: boolean) {
  const i = p.spot!, f = s.foods[i], c = f && customerOf(s, f.for);
  s.pieces = s.pieces.filter(q => q !== p);
  if (!f || !c) return;
  // a tap sends it; a drag lands anywhere up in the street, or near its customer
  if (tapped || p.y < s.layout.streetH + s.layout.sr * 0.5 || near(p, { x: c.x, y: s.layout.feet - s.layout.head }) < s.layout.head * 2.5) send(s, i, p);
  else s.pieces.push({ ...p, state: 'back', t: 0 });
}
function bounce(s: Service, p: Piece, why: 'order' | 'cookFirst' = 'order') {
  if (!s.pieces.includes(p)) s.pieces.push(p);
  p.state = 'back'; p.t = 0; p.wrong = true;
  s.events.push({ t: 'wrong', why });
}

/** For the tests and the tour: where to press for a step. */
export function whereFor(s: Service, step: Step): { from: Pt; to: Pt | null; hold: boolean } {
  const L = s.layout, spot = L.spots[step.spot]!;
  if (step.kind === 'base') return { from: trayPt(s, 'base'), to: spot, hold: false };
  if (step.kind === 'topping') return { from: trayPt(s, step.topping), to: spot, hold: false };
  if (step.kind === 'cook') return { from: spot, to: null, hold: true };
  const c = customerOf(s, s.foods[step.spot]!.for)!;
  return { from: spot, to: { x: c.x, y: L.feet - L.head }, hold: false };
}
