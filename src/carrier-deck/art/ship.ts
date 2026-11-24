// His carrier, drawn in code: from the side (the hull a section at a time, the island with its bridge and masts, lifts, boats and
// anchors), from above (the flight deck with its catapults, wires, lifts, angled deck and markings), and cut away (the decks inside
// filling up). Every part has a fixed place, so it draws right whatever order he buys in. Fleet ships, from the side, from their parts.
// Units are the Mission's: the waterline is y = 0, the flight deck is DECK units up (drawn upward, so y is negative), the stern at x = 0.
import { CREW, itemOf, PARTS, type PaintItem, type Model, type ShipLook, type FlagItem, type MarkItem } from '../ship/catalog';
import { prizeById } from '../ship/missions';
import { airWing, capacity, catapults, deckLen, has, lifts, lookOf, SHIP_NAMES, wires, type ShipState } from '../ship/ship';
import { TUNING, wireX } from '../mission/sim';
import { airLook, drawAircraft, OUTLINE } from './aircraft';
import { drawAircraftTop } from './topdown';

export const DECK = TUNING.deckAlt;
type Ship = Pick<ShipState, 'owned' | 'more' | 'hullPaint' | 'flag' | 'mark' | 'name' | 'looks' | 'flying'>;
const owns = (a: Ship, id: string) => has(a, `part:${id}`);

function hullHex(a: Ship) { const p = itemOf(a.hullPaint) as PaintItem; return p.hex; }
function outlineFill(ctx: CanvasRenderingContext2D, pts: readonly [number, number][], fill: string | CanvasPattern | CanvasGradient, lw = 4) {
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.stroke();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, lw = 3, r = 3) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUTLINE; ctx.stroke();
}
function emoji(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number) {
  ctx.font = `${size}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
export function drawFlag(ctx: CanvasRenderingContext2D, flagId: string, x: number, y: number, w: number, h: number, t: number) {
  const f = itemOf(flagId) as FlagItem, wave = Math.sin(t * 4) * 2;
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(w / 2, wave, w, 0); ctx.lineTo(w, h); ctx.quadraticCurveTo(w / 2, h + wave, 0, h); ctx.closePath();
  ctx.save(); ctx.clip();
  const [c0, c1 = c0] = f.colors;
  ctx.fillStyle = c0!; ctx.fillRect(0, -4, w, h + 8);
  ctx.fillStyle = c1!;
  if (f.pattern === 'h') { const k = f.colors.length > 2 ? f.colors.length : 4; for (let i = 0; i < k; i++) { ctx.fillStyle = f.colors[i % f.colors.length]!; ctx.fillRect(0, -4 + i * (h + 8) / k, w, (h + 8) / k); } }
  if (f.pattern === 'v') ctx.fillRect(w / 2, -4, w / 2, h + 8);
  if (f.pattern === 'cross') { ctx.fillRect(w * .3, -4, w * .18, h + 8); ctx.fillRect(0, h * .4, w, h * .2); }
  if (f.pattern === 'diag') { ctx.beginPath(); ctx.moveTo(0, h + 4); ctx.lineTo(w, -4); ctx.lineTo(w, h + 4); ctx.fill(); }
  if (f.pattern === 'dot') { ctx.beginPath(); ctx.arc(w / 2, h / 2, h * .3, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = OUTLINE; ctx.stroke();
  ctx.restore();
}

/** Where the island stands, from the stern: about two thirds along. */
export const islandX = (len: number) => len * .58;
/** The catapults' start and end, near the bow (and the waist ones further back). */
export function catapultTracks(len: number, n: number): { x0: number; x1: number; lane: number }[] {
  return Array.from({ length: n }, (_, i) => i < 2 ? { x0: len * .62, x1: len - 14, lane: i ? -1 : 1 } : { x0: len * .3, x1: len * .62, lane: i === 2 ? -1.4 : -2.2 });
}

/** The carrier from the side, stern at x, waterline at y, `k` pixels a unit. `parked`: draw his aircraft on the deck. */
export function drawCarrierSide(ctx: CanvasRenderingContext2D, a: Ship, x: number, y: number, k: number, t = 0, opts: { parked?: boolean; night?: boolean; skipPlane?: Model | null } = {}) {
  const len = deckLen(a), hex = hullHex(a);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // over the side, behind the hull: anchors' chains, the crane's arm
  // the hull: a long box with a raked bow and a squared stern, its colour (or a dazzle of stripes)
  const bow = owns(a, 'skijump') ? [[len + 6, -DECK - 14], [len + 30, -DECK + 2]] : [[len + 34, -DECK - 2]];
  const hullPts: [number, number][] = [[0, -DECK], [len, -DECK], ...(bow as [number, number][]), [len - 40, 14], [12, 14], [-6, -DECK + 18]];
  let paint: string | CanvasPattern = hex;
  if (hex === 'dazzle') {
    const c = document.createElement('canvas'); c.width = 40; c.height = 40;
    const p = c.getContext('2d')!; p.fillStyle = '#c9d1da'; p.fillRect(0, 0, 40, 40); p.fillStyle = '#2a3038'; p.beginPath(); p.moveTo(0, 0); p.lineTo(20, 0); p.lineTo(0, 40); p.fill(); p.beginPath(); p.moveTo(40, 0); p.lineTo(40, 20); p.lineTo(20, 40); p.fill();
    paint = ctx.createPattern(c, 'repeat') ?? '#7d8894';
  }
  outlineFill(ctx, hullPts, paint);
  // the waterline stripe and the hangar's long side
  ctx.fillStyle = '#b5172b'; ctx.fillRect(4, 2, len - 46, 10);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(10, -DECK + 10, len - 30, 14);
  // the ship's name on the stern quarter
  ctx.save(); ctx.font = '900 13px Nunito, system-ui, sans-serif'; ctx.fillStyle = '#f4f6fa'; ctx.textBaseline = 'middle';
  ctx.fillText(SHIP_NAMES[a.name] ?? '', 18, -DECK + 36); ctx.restore();
  // portholes along the hull
  ctx.fillStyle = '#20262e';
  for (let px = 40; px < len - 50; px += 26) { ctx.beginPath(); ctx.arc(px, -DECK + 42, 3, 0, Math.PI * 2); ctx.fill(); }
  // the flight deck's edge: dark, with deck lights
  ctx.fillStyle = '#3a4150'; ctx.fillRect(-4, -DECK - 6, len + (owns(a, 'skijump') ? 8 : 36), 8);
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.strokeRect(-4, -DECK - 6, len + (owns(a, 'skijump') ? 8 : 36), 8);
  if (owns(a, 'lights')) for (let lx = 6; lx < len; lx += 22) { ctx.fillStyle = opts.night ? (Math.floor(t * 2 + lx / 22) % 2 ? '#ffe27a' : '#3ddc84') : '#ffe27a'; ctx.beginPath(); ctx.arc(lx, -DECK - 2, opts.night ? 3 : 2, 0, Math.PI * 2); ctx.fill(); }
  if (owns(a, 'bowlights')) { ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(len + 26, -DECK + 2, 4, 0, Math.PI * 2); ctx.fill(); }
  // deck-edge lifts: platforms cut in the hull side
  const liftXs = [len * .44, len * .72, len * .2].slice(0, lifts(a));
  for (const lx of liftXs) box(ctx, lx - 22, -DECK - 4, 44, 10, '#5a6370', 2.5, 2);
  // landing wires at the stern, the catapults' steam near the bow
  for (let w = 1; w <= wires(a); w++) { const wx = wireX({ stern: 0 }, w); ctx.strokeStyle = '#c9d1da'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx, -DECK - 6); ctx.lineTo(wx, -DECK - 9); ctx.stroke(); }
  for (const c of catapultTracks(len, catapults(a))) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(c.x1 - 10, -DECK - 9 - Math.abs(Math.sin(t * 2 + c.lane)) * 4, 4, 0, Math.PI * 2); ctx.fill(); }
  if (owns(a, 'fence')) box(ctx, len * .6 - 4, -DECK - 18, 6, 12, '#8a96a3', 2, 1);
  // the island: the bridge, its masts and radars
  if (owns(a, 'island')) {
    const ix = islandX(len), w = 54, top = -DECK - 70;
    box(ctx, ix - w / 2, top, w, 64, '#8e9aa6');
    ctx.fillStyle = '#6b7783'; ctx.fillRect(ix - w / 2 + 3, top + 34, w - 6, 4);
    if (owns(a, 'bridge')) { box(ctx, ix - w / 2 - 6, top - 14, w + 12, 18, '#a7b2bd'); ctx.fillStyle = opts.night ? '#ffe27a' : '#2a4a6a'; for (let i = 0; i < 6; i++) ctx.fillRect(ix - w / 2 - 2 + i * 11, top - 10, 7, 8); }
    if (owns(a, 'tower')) { box(ctx, ix + w / 2 - 4, top + 6, 16, 22, '#a7b2bd', 2.5); ctx.fillStyle = '#2a4a6a'; ctx.fillRect(ix + w / 2, top + 10, 8, 8); }
    if (owns(a, 'lookout')) { box(ctx, ix - w / 2 - 14, top + 10, 14, 10, '#a7b2bd', 2.5); }
    if (owns(a, 'searchlight')) { ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(ix - w / 2 + 6, top - 18, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke(); if (opts.night) { ctx.fillStyle = 'rgba(255,240,160,.18)'; ctx.beginPath(); ctx.moveTo(ix - w / 2 + 6, top - 18); ctx.lineTo(ix + 260, top - 90 + Math.sin(t) * 40); ctx.lineTo(ix + 260, top + 10 + Math.sin(t) * 40); ctx.fill(); } }
    const mastTop = top - (owns(a, 'mast') ? 70 : 30);
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ix, top - 14); ctx.lineTo(ix, mastTop); ctx.stroke();
    if (owns(a, 'radar')) { ctx.save(); ctx.translate(ix, top - 30); ctx.scale(Math.cos(t * 1.5), 1); box(ctx, -16, -4, 32, 7, '#c9d1da', 2.5, 2); ctx.restore(); }
    if (owns(a, 'bigradar')) { box(ctx, ix - 12, top - 56, 24, 24, '#f4f6fa', 2.5, 12); }
    if (owns(a, 'dish')) { ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(ix + w / 2 + 4, top - 4, 9, Math.PI * .9, Math.PI * 1.9); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5; ctx.stroke(); }
    if (owns(a, 'weather')) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ix + 10, top - 14); ctx.lineTo(ix + 10, top - 34); ctx.stroke(); ctx.save(); ctx.translate(ix + 10, top - 36); ctx.rotate(t * 6); for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI * 2 / 3); ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(8, 0, 3, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
    if (owns(a, 'flagline')) { ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ix, mastTop); ctx.lineTo(len - 10, -DECK - 6); ctx.stroke(); const cs = ['#e63946', '#ffd23f', '#2f8fe8', '#2fa84f', '#f4f6fa']; for (let i = 1; i < 9; i++) { const fx = ix + (len - 10 - ix) * i / 9, fy = mastTop + (-DECK - 6 - mastTop) * i / 9; ctx.fillStyle = cs[i % cs.length]!; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 5, fy + 9); ctx.lineTo(fx - 5, fy + 9); ctx.fill(); } }
    drawFlag(ctx, a.flag, ix, mastTop, 26, 16, t);
    if (owns(a, 'bell')) emoji(ctx, '🔔', ix - w / 2 + 8, top + 50, 10);
    if (owns(a, 'horn')) emoji(ctx, '📯', ix + w / 2 - 8, top + 50, 10);
  }
  // over the side
  if (owns(a, 'bowanchor')) emoji(ctx, '⚓', len - 6, -DECK + 22, 16);
  if (owns(a, 'sternanchor')) emoji(ctx, '⚓', 22, -DECK + 22, 14);
  if (owns(a, 'lifeboats')) for (let i = 0; i < 3; i++) box(ctx, len * .25 + i * 26, -DECK + 6, 22, 9, '#ff7a00', 2, 4);
  if (owns(a, 'rescueboat')) { box(ctx, len * .12, -DECK + 4, 30, 11, '#e63946', 2.5, 5); emoji(ctx, '🛟', len * .12 + 15, -DECK + 9, 9); }
  if (owns(a, 'boatbay')) box(ctx, len * .1 - 8, -DECK + 24, 46, 18, '#20262e', 2.5, 2);
  if (owns(a, 'crane')) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(len * .82, -DECK - 6); ctx.lineTo(len * .82, -DECK - 40); ctx.lineTo(len * .9, -DECK - 30); ctx.stroke(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(len * .9, -DECK - 30); ctx.lineTo(len * .9, -DECK - 14); ctx.stroke(); }
  if (owns(a, 'sonar')) { ctx.fillStyle = hex === 'dazzle' ? '#7d8894' : hex; ctx.beginPath(); ctx.ellipse(len - 30, 14, 20, 8, 0, 0, Math.PI); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = OUTLINE; ctx.stroke(); }
  if (owns(a, 'hoses')) emoji(ctx, '🧯', len * .35, -DECK - 14, 10);
  if (owns(a, 'spots')) { ctx.fillStyle = '#ffd23f'; for (const sx of [len * .15, len * .3]) { ctx.fillRect(sx - 8, -DECK - 7, 16, 2); } }
  // the deck crew in their jerseys, and the deck vehicles, along the deck
  if (opts.parked !== undefined) {
    const crew = CREW.filter(c => has(a, c.id));
    crew.forEach((c, i) => {
      const cx = len * (.12 + ((i * .137) % .8)), bob = Math.sin(t * 3 + i) * (c.vehicle ? 0 : 1.2);
      if (c.vehicle) { emoji(ctx, c.icon, cx, -DECK - 14, 16); return; }
      ctx.fillStyle = c.hex; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(cx - 3, -DECK - 17 + bob, 6, 9, 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f1c27d'; ctx.beginPath(); ctx.arc(cx, -DECK - 20 + bob, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c.hex; ctx.beginPath(); ctx.arc(cx, -DECK - 21.5 + bob, 2.6, Math.PI, 0); ctx.fill();
    });
  }
  // his aircraft on the deck: the one he flies waits on the first catapult, near the bow, a little bigger than the rest, so the aircraft
  // on the deck is plainly his (its paint, tail art and number); the others are parked aft of the island. In a Mission the one flying
  // out is drawn by the Mission itself (skipPlane), so it isn't here twice.
  if (opts.parked) {
    const hero = opts.skipPlane === undefined && has(a, `air:${a.flying}`) ? a.flying : null;
    const room = Math.max(1, Math.floor((islandX(len) - 40) / 62));
    const parked = airWing(a).filter(m => m !== opts.skipPlane && m !== hero).slice(0, hero ? room : Math.max(1, Math.floor(len / 110)));
    parked.forEach((m, i) => drawAircraft(ctx, airLook(m, lookOf(a, m)), 46 + i * ((islandX(len) - 70) / Math.max(1, parked.length)), -DECK - 6, .6, t));
    if (hero) { const c = catapultTracks(len, catapults(a))[0]!; drawAircraft(ctx, airLook(hero, lookOf(a, hero)), c.x0 + (c.x1 - c.x0) * .3, -DECK - 6, .82, t); }
  }
  ctx.restore();
}

/** How wide the deck is from above: a short ship is broad for its length, a long one a little broader, so it never becomes a sliver. */
export const beamOf = (len: number) => Math.max(76, Math.min(190, len * .17));
/** The deck from above: an outline of the hull, the angled deck, catapult tracks, wires, lifts, the island, the markings and his
 *  aircraft drawn from above in their paint (the one he flies on the first catapult). Fits `w` × `h` pixels with the bow to the right. */
export function drawCarrierTop(ctx: CanvasRenderingContext2D, a: Ship, w: number, h: number, t = 0) {
  const len = deckLen(a), beam = beamOf(len), lane = beam / 6, k = Math.min((w * .92) / (len + 70), (h * .84) / (beam * 1.25));
  ctx.save(); ctx.translate((w - (len + 40) * k) / 2 + 20 * k, h / 2); ctx.scale(k, k); ctx.lineJoin = 'round';
  // the sea's wake behind
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.moveTo(0, -beam * .3); ctx.lineTo(-60, -beam * .6); ctx.lineTo(-60, beam * .6); ctx.lineTo(0, beam * .3); ctx.fill();
  const deck = '#3a4150', hull = hullHex(a) === 'dazzle' ? '#7d8894' : hullHex(a);
  outlineFill(ctx, [[0, -beam * .45], [len * .9, -beam * .5], [len + 40, 0], [len * .9, beam * .5], [0, beam * .45]], hull, 4);
  outlineFill(ctx, [[4, -beam * .4], [len * .88, -beam * .44], [len + 30, 0], [len * .88, beam * .44], [4, beam * .4]], deck, 2);
  if (owns(a, 'angled')) outlineFill(ctx, [[0, -beam * .25], [len * .55, -beam * .62], [len * .62, -beam * .5], [10, beam * .15]], deck, 2);
  // the deck's edge lines, in white
  ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 2; ctx.setLineDash([14, 8]);
  ctx.beginPath(); ctx.moveTo(10, -beam * .36); ctx.lineTo(len * .86, -beam * .4); ctx.moveTo(10, beam * .36); ctx.lineTo(len * .86, beam * .4); ctx.stroke(); ctx.setLineDash([]);
  // the markings
  const markId = a.mark, prize = prizeById(markId), m = prize?.kind === 'mark' ? { hex: prize.hex, shape: prize.shape } : (itemOf(markId) as MarkItem);
  if (markId !== 'mark:none') {
    ctx.strokeStyle = m.hex; ctx.fillStyle = m.hex; ctx.lineWidth = 3;
    if (m.shape === 'stripe' || m.shape === 'dash') { ctx.setLineDash(m.shape === 'dash' ? [12, 10] : []); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(len + 10, 0); ctx.stroke(); ctx.setLineDash([]); }
    if (m.shape === 'circle') { ctx.beginPath(); ctx.arc(len * .25, 0, 16, 0, Math.PI * 2); ctx.stroke(); }
    if (m.shape === 'star') emoji(ctx, '★', len * .25, 0, 34);
    if (m.shape === 'arrow') for (let i = 0; i < 4; i++) emoji(ctx, '➤', len * .45 + i * 26, 0, 20);
    if (m.shape === 'check') for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) ctx.fillRect(len * .1 + i * 10, -10 + j * 10, 10, 10);
    if (m.shape === 'wave') { ctx.beginPath(); for (let x = 10; x < len; x += 4) ctx.lineTo(x, Math.sin(x / 14) * 6); ctx.stroke(); }
    if (m.shape === 'number') { ctx.font = '900 40px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(a.name + 1), len * .82, 0); }
  }
  ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 2;
  for (let i = 1; i <= wires(a); i++) { const x = wireX({ stern: 0 }, i); ctx.beginPath(); ctx.moveTo(x, -beam * .3); ctx.lineTo(x, beam * .3); ctx.stroke(); }
  const cats = catapultTracks(len, catapults(a));
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4;
  for (const c of cats) { const y = -c.lane * lane; ctx.beginPath(); ctx.moveTo(c.x0, y); ctx.lineTo(c.x1, y); ctx.stroke(); }
  for (const [i, lx] of [len * .44, len * .72, len * .2].slice(0, lifts(a)).entries()) box(ctx, lx - 18, (i % 2 ? -1 : 1) * beam * .44 - 13, 36, 26, '#5a6370', 2, 2);
  if (owns(a, 'island')) box(ctx, islandX(len) - 26, beam * .22, 52, beam * .2, '#8e9aa6', 3, 3);
  if (owns(a, 'skijump')) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(len - 20, -beam * .3, 40, beam * .6); }
  // his aircraft from above: the one he flies on the first catapult, the others parked nose-out in two rows aft of the island
  const hero = has(a, `air:${a.flying}`) ? a.flying : null, look = (md: Model) => airLook(md, lookOf(a, md));
  const others = airWing(a).filter(md => md !== hero), step = Math.max(40, beam * .42), rows = [beam * .2, -beam * .2];
  const perRow = Math.max(1, Math.floor((islandX(len) - 60) / step));
  others.slice(0, perRow * 2).forEach((md, i) => {
    const row = i % 2, col = Math.floor(i / 2), y = rows[row]!;
    drawAircraftTop(ctx, look(md), 44 + col * step, y, Math.min(.9, beam / 120), t, row ? -.5 : .5);
  });
  if (hero && cats[0]) drawAircraftTop(ctx, look(hero), cats[0].x0 + (cats[0].x1 - cats[0].x0) * .25, -cats[0].lane * lane, Math.min(1.05, beam / 100), t);
  ctx.restore();
}

/** The rooms inside, for the cutaway: each a part he can build, with its picture. */
export const ROOMS = PARTS.filter(p => p.does === 'room' || p.does === 'hangar' || p.does === 'bay');
/** How deep the cutaway is drawn below the waterline: deeper than the side view, so the rooms have room. */
export const CUT_KEEL = 66;
/** The carrier cut away, stern at x, waterline at y, `k` pixels a unit: the flight deck on top, the hangar deck under it with his
 *  aircraft (lit once the hangar is built), and two decks of rooms below, each a lit room with its floor, a porthole and its picture
 *  standing on the floor once it is built, a dark one waiting to be built. Ladders join the decks; a dashed line marks the waterline. */
export function drawCutaway(ctx: CanvasRenderingContext2D, a: Ship, x: number, y: number, k: number, t = 0) {
  const len = deckLen(a), hex = hullHex(a), hull = hex === 'dazzle' ? '#7d8894' : hex, built = (id: string) => owns(a, id);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const shell: [number, number][] = [[0, -DECK], [len, -DECK], [len + 34, -DECK - 2], [len - 50, CUT_KEEL], [16, CUT_KEEL], [-6, -DECK + 18]];
  outlineFill(ctx, shell, hull);
  // inside the shell: the decks
  const inX = 12, inW = len - 40, hangarTop = -DECK + 6, hangarH = 40, row1 = hangarTop + hangarH + 6, roomH = 30;
  box(ctx, inX, hangarTop, inW, hangarH, built('hangar') ? '#e9edf2' : '#4a5262', 2.5, 3);
  if (built('hangar')) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(inX + 4, hangarTop + hangarH - 6, inW - 8, 3); }
  const inHangar = airWing(a).slice(0, capacity(a)).filter(m => m !== a.flying);
  inHangar.slice(0, Math.max(0, Math.floor((inW - 20) / 58))).forEach((m, i) => drawAircraft(ctx, airLook(m, lookOf(a, m)), inX + 34 + i * 58, hangarTop + hangarH - 6, .5, t));
  // the rooms, in fixed places, two decks of them from the stern forward (where the view starts); the engines and stores fill the rest
  const rooms = ROOMS.filter(r => r.does === 'room');
  const cols = Math.ceil(rooms.length / 2), cw = Math.min(inW / cols, 76), left = inX + Math.min(40, inW - cols * cw);
  for (const [ex, ew] of [[inX, left - inX - 4], [left + cols * cw, inX + inW - left - cols * cw]] as const) if (ew > 8) box(ctx, ex, row1, ew, roomH * 2 + 4, '#4a5262', 2, 3);
  rooms.forEach((r, i) => {
    const rx = left + (i % cols) * cw, ry = row1 + Math.floor(i / cols) * (roomH + 4), on = built(r.id.slice(5)), w = cw - 4;
    box(ctx, rx, ry, w, roomH, on ? '#ffe9a8' : '#2c323e', 2, 3);
    if (on) {
      ctx.fillStyle = '#c98b4a'; ctx.fillRect(rx + 2, ry + roomH - 6, w - 4, 4); // the floor
      ctx.fillStyle = '#9fd0ff'; ctx.beginPath(); ctx.arc(rx + w - 7, ry + 8, 3, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUTLINE; ctx.stroke(); // a porthole
      emoji(ctx, r.icon, rx + w / 2 - 2, ry + roomH / 2, Math.min(18, w * .42));
    } else { ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.strokeRect(rx + 4, ry + 4, w - 8, roomH - 8); ctx.setLineDash([]); }
  });
  // ladders between the decks
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
  for (const lx of [left - 2, left + cols * cw + 2]) {
    ctx.beginPath(); ctx.moveTo(lx - 2.5, hangarTop + hangarH); ctx.lineTo(lx - 2.5, row1 + roomH * 2 + 4); ctx.moveTo(lx + 2.5, hangarTop + hangarH); ctx.lineTo(lx + 2.5, row1 + roomH * 2 + 4); ctx.stroke();
    for (let ly = hangarTop + hangarH + 4; ly < row1 + roomH * 2; ly += 6) { ctx.beginPath(); ctx.moveTo(lx - 2.5, ly); ctx.lineTo(lx + 2.5, ly); ctx.stroke(); }
  }
  // the flight deck on top, with its white edge and the aircraft he flies on it
  ctx.fillStyle = '#3a4150'; ctx.fillRect(-4, -DECK - 6, len + 36, 8); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3; ctx.strokeRect(-4, -DECK - 6, len + 36, 8);
  ctx.fillStyle = '#ffd23f'; for (let dx = 20; dx < len; dx += 28) ctx.fillRect(dx, -DECK - 3, 14, 2);
  if (has(a, `air:${a.flying}`)) drawAircraft(ctx, airLook(a.flying, lookOf(a, a.flying)), len * .72, -DECK - 6, .8, t);
  // the waterline, across the hull
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(len + 8, 0); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}

/** A Fleet ship from the side, its waterline at y, about 120 units long scaled by k: hull, deckhouse, mast and funnel from its parts. */
export function drawFleetShip(ctx: CanvasRenderingContext2D, s: ShipLook, x: number, y: number, k: number, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineJoin = 'round';
  const L = [130, 100, 90, 120, 80, 110][s.hull % 6]!, H = [18, 22, 16, 20, 24, 18][s.hull % 6]!;
  const bob = Math.sin(t * 1.6 + x) * 1.5;
  ctx.translate(0, bob);
  // the hull
  const rake = [20, 14, 26, 10, 18, 30][s.hull % 6]!;
  outlineFill(ctx, [[0, -H], [L, -H], [L + rake, -H - 6], [L - 10, 8], [8, 8], [-4, -H + 6]], s.hex, 3);
  ctx.fillStyle = s.stripe; ctx.fillRect(2, -H + 8, L - 6, 5);
  // the deckhouse
  const hw = [36, 52, 28, 44, 30, 60][s.house % 6]!, hh = [18, 14, 24, 20, 26, 16][s.house % 6]!, hx = [L * .55, L * .4, L * .2, L * .5, L * .35, L * .3][s.house % 6]!;
  box(ctx, hx - hw / 2, -H - hh, hw, hh, '#f4f6fa', 2.5, 3);
  ctx.fillStyle = '#2a4a6a'; for (let i = 0; i < Math.floor(hw / 10); i++) ctx.fillRect(hx - hw / 2 + 4 + i * 10, -H - hh + 4, 6, 5);
  // the funnel and the mast
  for (let f = 0; f < s.funnel; f++) { const fx = hx - hw / 2 - 14 - f * 14; box(ctx, fx, -H - 24, 10, 24, s.stripe, 2.5, 2); ctx.fillStyle = 'rgba(200,200,200,.5)'; ctx.beginPath(); ctx.arc(fx + 5 - ((t * 10 + f * 7) % 20), -H - 30 - ((t * 8) % 12), 4, 0, Math.PI * 2); ctx.fill(); }
  if (s.mast) { const mx = hx + hw / 4; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(mx, -H - hh); ctx.lineTo(mx, -H - hh - 14 - s.mast * 6); ctx.stroke(); if (s.mast > 2) { ctx.beginPath(); ctx.moveTo(mx - 8, -H - hh - 12); ctx.lineTo(mx + 8, -H - hh - 12); ctx.stroke(); } }
  if (s.hull === 5) { ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.moveTo(L * .7, -H); ctx.lineTo(L * .7, -H - 48); ctx.lineTo(L * .95, -H - 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
}
