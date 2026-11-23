// His airport from above, drawn on a canvas: grass and the lake, the runway (a grass strip to start), the taxiways and apron, then every
// piece he has built in its place, the signs and lights, and the again-and-again things (only so many drawn; the rest are counted on a
// sign). Planes and vehicles are drawn on top by whoever is using it (the Airport screen, the taxi, "Watch it run").
import { REPEATS, SIGNS, DECOR, PIECES, type RepeatId } from '../airport/catalog';
import { has, lightHex, type AirportState } from '../airport/airport';
import { prizeById } from '../airport/charter';
import { CROSSING, EXTRA_HANGARS, EXTRA_STAND_LEN, EXTRA_STANDS, SHED, GATE_X, HOLD_POINT, HOME_STAND, isPoint, PLOT_H, PLOT_W, RUNWAY_Y, runwayRect, SPOTS, STAND_Y, TAXI_Y, type Rect } from '../airport/plot';

type Ctx = CanvasRenderingContext2D;
export type AirportLook = Pick<AirportState, 'owned' | 'more' | 'lights'>;
const ink = '#14161b';
/** Roof colours, so pieces read apart at a glance. */
const ROOF: Record<string, string> = {
  hut: '#ff7a00', terminal: '#dfe7ef', bigterminal: '#dfe7ef', glass: '#9fd8ff', baggage: '#ffb000', food: '#ff6f61', shops: '#ff7ac8', lounge: '#7b4bd1',
  deck: '#2fa84f', tower: '#f4f6fa', talltower: '#f4f6fa', radar: '#b8c2cc', weather: '#f4f6fa', hangar: '#8a96a3', bighangar: '#6f7c8a', paintshop: '#ff7ac8',
  maintenance: '#8a96a3', museum: '#e3c38a', fire: '#e63946', firepit: '#5a4630', fuel: '#d9dee4', cargo: '#555c66', warehouse: '#ffb000', deice: '#a9e4ff',
  plough: '#ff7a00', catering: '#f4f6fa', post: '#e63946', hotel: '#2346c8', train: '#6b3f22', monostation: '#1fa6a0', watertower: '#9fd8ff', solar: '#1d3a78',
  show: '#ff7a00', clock: '#e3c38a', taxi: '#ffd23f', busstop: '#2f8fe8', blast: '#555', carpark: '#555c66', bigcarpark: '#555c66', roofgarden: '#2fa84f',
};

function box(ctx: Ctx, r: Rect, fill: string, radius = 6) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'; roundRect(ctx, r.x + 4, r.y + 5, r.w, r.h, radius); ctx.fill();
  ctx.fillStyle = fill; roundRect(ctx, r.x, r.y, r.w, r.h, radius); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
}
export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function icon(ctx: Ctx, glyph: string, x: number, y: number, size: number) {
  ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(glyph, x, y);
}
function pave(ctx: Ctx, r: Rect, fill = '#5b616d') { ctx.fillStyle = fill; ctx.fillRect(r.x, r.y, r.w, r.h); }

function drawRunway(ctx: Ctx, a: AirportLook, t: number) {
  const owned = (id: string) => has(a, id), r = runwayRect(owned), grass = r === runwayRect(() => false);
  // stretches: extra runway either end
  const stretch = Math.min(a.more.stretch, REPEATS.find(x => x.id === 'stretch')!.drawn);
  const rr = { ...r, x: r.x - stretch * 14, w: r.w + stretch * 28 };
  if (grass) {
    ctx.fillStyle = '#7cc46a'; ctx.fillRect(rr.x, rr.y, rr.w, rr.h);
    ctx.strokeStyle = '#a6dc8f'; ctx.lineWidth = 4; for (let x = rr.x + 10; x < rr.x + rr.w; x += 30) { ctx.beginPath(); ctx.moveTo(x, rr.y + 4); ctx.lineTo(x, rr.y + rr.h - 4); ctx.stroke(); }
    ctx.fillStyle = '#f4f6fa'; for (const x of [rr.x + 4, rr.x + rr.w - 12]) for (let i = 0; i < 4; i++) ctx.fillRect(x, rr.y + 4 + i * 8, 8, 4);
  } else {
    pave(ctx, rr, '#3a3f4b');
    ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 3; ctx.setLineDash([22, 18]); ctx.beginPath(); ctx.moveTo(rr.x + 40, RUNWAY_Y); ctx.lineTo(rr.x + rr.w - 40, RUNWAY_Y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#f4f6fa'; for (const x of [rr.x + 6, rr.x + rr.w - 26]) for (let i = 0; i < 5; i++) ctx.fillRect(x, rr.y + 4 + i * 7, 20, 3.5);
  }
  if (has(a, 'sign:numbers')) { ctx.fillStyle = '#f4f6fa'; ctx.font = '900 16px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('09', rr.x + 44, RUNWAY_Y); ctx.fillText('27', rr.x + rr.w - 44, RUNWAY_Y); }
  if (has(a, 'piece:crossing')) {
    pave(ctx, CROSSING, '#3a3f4b');
    ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 3; ctx.setLineDash([22, 18]); ctx.beginPath(); ctx.moveTo(CROSSING.x + 20, CROSSING.y + 30); ctx.lineTo(CROSSING.x + 20, CROSSING.y + CROSSING.h - 30); ctx.stroke(); ctx.setLineDash([]);
  }
  // runway lights, in his colour, twinkling
  if (has(a, 'sign:runwaylights')) {
    const hex = lightHex(a.lights), rainbow = hex === 'rainbow';
    for (let x = rr.x + 8, i = 0; x < rr.x + rr.w; x += 26, i++) for (const y of [rr.y - 2, rr.y + rr.h + 2]) {
      ctx.fillStyle = rainbow ? `hsl(${(i * 40 + t * 120) % 360} 90% 60%)` : hex; ctx.globalAlpha = .7 + .3 * Math.sin(t * 4 + i); ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (has(a, 'sign:approach')) for (let i = 0; i < 6; i++) { ctx.fillStyle = (Math.floor(t * 6) % 6) === 5 - i ? '#fff' : '#ffd23f'; ctx.beginPath(); ctx.arc(12 + i * 16, RUNWAY_Y, 4, 0, 7); ctx.fill(); }
}

function drawGround(ctx: Ctx, a: AirportLook) {
  const owned = (id: string) => has(a, id);
  // the worn track from the stand to the runway, always there
  ctx.fillStyle = '#b9a77a';
  ctx.fillRect(HOLD_POINT.x - 10, TAXI_Y - 10, 900 - HOLD_POINT.x + 10, 20);
  ctx.fillRect(HOLD_POINT.x - 10, TAXI_Y, 20, RUNWAY_Y - TAXI_Y - 18);
  for (const gx of [...GATE_X, HOME_STAND.x]) ctx.fillRect(gx - 10, STAND_Y, 20, TAXI_Y - STAND_Y);
  if (owned('piece:apron')) pave(ctx, SPOTS['piece:apron']!, '#6b717d');
  for (const id of ['piece:taxiway2', 'piece:taxiway'] as const) if (owned(id)) {
    const r = SPOTS[id]!;
    pave(ctx, r, '#4a505c');
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2); ctx.stroke();
    pave(ctx, { x: HOLD_POINT.x - 10, y: TAXI_Y, w: 20, h: RUNWAY_Y - TAXI_Y - 18 }, '#4a505c');
    if (has(a, 'sign:edgelights')) { ctx.fillStyle = '#4fa3ff'; for (let x = r.x + 6; x < r.x + r.w; x += 24) for (const y of [r.y - 2, r.y + r.h + 2]) { ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); } }
  }
  if (has(a, 'sign:holdlines')) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(HOLD_POINT.x - 12, TAXI_Y + 18, 24, 4); ctx.fillRect(HOLD_POINT.x - 12, TAXI_Y + 26, 24, 4); }
}

function drawPiece(ctx: Ctx, id: string, glyph: string, t: number) {
  const r = SPOTS[id];
  if (!r || isPoint(r)) return;
  const key = id.split(':')[1]!;
  switch (key) {
    case 'tarmac': case 'long': case 'crossing': case 'taxiway': case 'taxiway2': case 'apron': return; // drawn with the ground
    case 'cargo': case 'deice': pave(ctx, r, key === 'deice' ? '#7fb8d6' : '#555c66'); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); icon(ctx, glyph, r.x + r.w / 2, r.y + r.h / 2, 26); return;
    case 'helipad': ctx.fillStyle = '#555c66'; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, 7); ctx.fill(); ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#f4f6fa'; ctx.font = '900 30px Bungee, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', r.x + r.w / 2, r.y + r.h / 2 + 2); return;
    case 'dock': ctx.fillStyle = '#8a5a2b'; ctx.fillRect(r.x, r.y, r.w, 12); ctx.fillRect(r.x + r.w / 2 - 6, r.y, 12, r.h); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, 12); icon(ctx, '⚓', r.x + r.w + 14, r.y + 8, 18); return;
    case 'carpark': case 'bigcarpark': {
      pave(ctx, r, '#555c66'); ctx.strokeStyle = '#f4f6fa'; ctx.lineWidth = 1.5;
      for (let x = r.x + 8; x < r.x + r.w - 6; x += 16) { ctx.beginPath(); ctx.moveTo(x, r.y + 6); ctx.lineTo(x, r.y + 30); ctx.moveTo(x, r.y + r.h - 6); ctx.lineTo(x, r.y + r.h - 30); ctx.stroke(); }
      const cars = ['#e63946', '#2f8fe8', '#ffd23f', '#f4f6fa', '#2fa84f'];
      for (let i = 0; i < Math.floor(r.w / 16) - 1; i += 2) { ctx.fillStyle = cars[i % 5]!; ctx.fillRect(r.x + 10 + i * 16, r.y + 10, 11, 18); ctx.fillStyle = cars[(i + 2) % 5]!; ctx.fillRect(r.x + 26 + i * 16, r.y + r.h - 28, 11, 18); }
      icon(ctx, '🅿️', r.x + r.w / 2, r.y + r.h / 2, 18); return;
    }
    case 'monorail': ctx.fillStyle = '#b8c2cc'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h);
      { const tx = r.x + ((t * 90) % (r.w + 160)) - 80; ctx.fillStyle = '#1fa6a0'; roundRect(ctx, Math.max(r.x, tx), r.y - 4, Math.min(80, r.x + r.w - Math.max(r.x, tx)), r.h + 8, 8); ctx.fill(); ctx.stroke(); } return;
    case 'solar': ctx.fillStyle = '#1d3a78'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.fillRect(r.x + 4 + i * 37, r.y + 4 + j * 36, 32, 30); } ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) ctx.strokeRect(r.x + 4 + i * 37, r.y + 4 + j * 36, 32, 30); return;
    case 'wind': for (const [dx, dy] of [[25, 40], [80, 70], [40, 130]] as const) { const cx = r.x + dx, cy = r.y + dy; ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill(); ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 2 + dx); for (let k = 0; k < 3; k++) { ctx.rotate(2.09); ctx.fillRect(-2, -26, 4, 24); } ctx.restore(); } return;
    case 'fuel': for (const [dx, dy] of [[35, 35], [100, 35], [35, 95], [100, 95]] as const) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(r.x + dx + 4, r.y + dy + 4, 26, 0, 7); ctx.fill(); ctx.fillStyle = '#d9dee4'; ctx.beginPath(); ctx.arc(r.x + dx, r.y + dy, 26, 0, 7); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#2fa84f'; ctx.beginPath(); ctx.arc(r.x + dx, r.y + dy, 9, 0, 7); ctx.fill(); } return;
    case 'radar': box(ctx, { x: r.x + 20, y: r.y + 40, w: 30, h: 36 }, '#b8c2cc', 4); ctx.save(); ctx.translate(r.x + 35, r.y + 34); ctx.rotate(t * 2.5); ctx.fillStyle = '#f4f6fa'; ctx.fillRect(-28, -5, 56, 10); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(-28, -5, 56, 10); ctx.restore(); return;
    case 'tower': case 'talltower': {
      const big = key === 'talltower', cx = r.x + r.w / 2, cy = r.y + r.h / 2, rad = big ? 28 : 22;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(cx + 5, cy + 6, rad, 0, 7); ctx.fill();
      ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      ctx.fillStyle = '#2a4a6a'; ctx.beginPath(); ctx.arc(cx, cy, rad * .7, 0, 7); ctx.fill(); ctx.fillStyle = '#9fd8ff'; ctx.beginPath(); ctx.arc(cx, cy, rad * .45, 0, 7); ctx.fill();
      return;
    }
    case 'roofgarden': ctx.fillStyle = '#2fa84f'; roundRect(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill(); for (let i = 0; i < 5; i++) icon(ctx, '🌿', r.x + 10 + i * 18, r.y + r.h / 2, 14); return;
    case 'blast': ctx.fillStyle = '#8a96a3'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(r.x, r.y, r.w, r.h); return;
  }
  box(ctx, r, ROOF[key] ?? '#dfe7ef');
  if (key === 'glass') { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; for (let x = r.x + 12; x < r.x + r.w; x += 18) { ctx.beginPath(); ctx.moveTo(x, r.y + 4); ctx.lineTo(x - 8, r.y + r.h - 4); ctx.stroke(); } }
  if (key === 'hangar' || key === 'bighangar' || key === 'museum') { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let y = r.y + 10; y < r.y + r.h; y += 10) { ctx.beginPath(); ctx.moveTo(r.x + 4, y); ctx.lineTo(r.x + r.w - 4, y); ctx.stroke(); } }
  icon(ctx, glyph, r.x + r.w / 2, r.y + r.h / 2, Math.min(34, Math.max(16, Math.min(r.w, r.h) * .55)));
}

/** The gates, each with its jet bridge when he has them; extra gates along the concourses. */
function drawGates(ctx: Ctx, a: AirportLook) {
  GATE_X.forEach((gx, i) => {
    if (!has(a, `piece:gate${i + 1}`)) return;
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, STAND_Y - 40); ctx.lineTo(gx, TAXI_Y - 14); ctx.stroke();
    ctx.fillStyle = '#14161b'; roundRect(ctx, gx - 14, 452, 28, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.font = '900 12px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), gx, 460);
    if (has(a, 'piece:bridges')) { ctx.fillStyle = '#b8c2cc'; ctx.fillRect(gx + 10, 462, 10, 48); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(gx + 10, 462, 10, 48); }
  });
  const drawn = Math.min(a.more.gate, REPEATS.find(r => r.id === 'gate')!.drawn);
  // each extra gate is a remote stand: a paved pad with its yellow lead-in line
  for (let i = 0; i < drawn; i++) {
    const s = EXTRA_STANDS[i]!, top = s.y - EXTRA_STAND_LEN / 2;
    ctx.fillStyle = '#5b616d'; roundRect(ctx, s.x - s.w / 2, top, s.w, EXTRA_STAND_LEN, 6); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, top + 6); ctx.lineTo(s.x, top + EXTRA_STAND_LEN - 6); ctx.stroke();
  }
}

/** What he has built, as a part of the plot shaped like the plot, so a young airport fills its view instead of sitting small in a field.
 *  It never shows less than about half the plot, and grows as he builds. */
export function builtBounds(a: AirportLook): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (r: Rect, pad = 0) => { x0 = Math.min(x0, r.x - pad); y0 = Math.min(y0, r.y - pad); x1 = Math.max(x1, r.x + r.w + pad); y1 = Math.max(y1, r.y + r.h + pad); };
  add(runwayRect(id => has(a, id))); add(SHED); add({ x: HOME_STAND.x - 50, y: HOME_STAND.y - 50, w: 100, h: 100 });
  for (const id of a.owned) { const r = SPOTS[id]; if (r && (r.x || r.y)) add(r, isPoint(r) ? 30 : 0); }
  if (a.more.hangar) add(EXTRA_HANGARS[0]!);
  if (a.more.concourse) add({ x: 200, y: 330, w: 762, h: 115 });
  if (a.more.gate) for (const s of EXTRA_STANDS.slice(0, a.more.gate)) add({ x: s.x - s.w / 2, y: s.y - EXTRA_STAND_LEN / 2, w: s.w, h: EXTRA_STAND_LEN });
  const pad = 40, ratio = PLOT_W / PLOT_H;
  let w = Math.max(x1 - x0 + 2 * pad, PLOT_W * .45), h = Math.max(y1 - y0 + 2 * pad, PLOT_H * .45);
  if (w / h > ratio) h = w / ratio; else w = h * ratio;
  w = Math.min(w, PLOT_W); h = Math.min(h, PLOT_H);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return { x: Math.min(PLOT_W - w, Math.max(0, cx - w / 2)), y: Math.min(PLOT_H - h, Math.max(0, cy - h / 2)), w, h };
}

function drawRepeats(ctx: Ctx, a: AirportLook) {
  const drawn = (id: RepeatId) => Math.min(a.more[id], REPEATS.find(r => r.id === id)!.drawn);
  // concourses either side of the terminal
  const spots = [{ x: 200, y: 395 }, { x: 870, y: 395 }, { x: 200, y: 330 }, { x: 870, y: 330 }];
  for (let i = 0; i < drawn('concourse'); i++) { const s = spots[i]!; box(ctx, { x: s.x, y: s.y, w: 92, h: 50 }, '#dfe7ef'); icon(ctx, '🏢', s.x + 46, s.y + 25, 20); }
  for (let i = 0; i < drawn('hangar'); i++) { const r = EXTRA_HANGARS[i]!; box(ctx, r, '#8a96a3'); icon(ctx, '🏚️', r.x + r.w / 2, r.y + r.h / 2, 22); }
  // the counts beyond what's drawn
  for (const rep of REPEATS) {
    const n = a.more[rep.id];
    if (n > rep.drawn) {
      const at = rep.id === 'concourse' ? { x: 245, y: 318 } : rep.id === 'gate' ? { x: 930, y: 480 } : rep.id === 'hangar' ? { x: 640, y: 760 } : { x: 70, y: 640 };
      ctx.fillStyle = '#14161b'; roundRect(ctx, at.x - 26, at.y - 12, 52, 24, 6); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.font = '900 14px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`×${n}`, at.x, at.y);
    }
  }
}

function drawSigns(ctx: Ctx, a: AirportLook, t: number) {
  for (const s of SIGNS) {
    if (!has(a, s.id)) continue;
    const r = SPOTS[s.id];
    if (!r || isPoint(r)) continue;
    if (s.id === 'sign:windsock') { ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x, r.y); ctx.stroke(); ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + 28, r.y + 4 + Math.sin(t * 3) * 3); ctx.lineTo(r.x + 28, r.y + 12 + Math.sin(t * 3) * 3); ctx.lineTo(r.x, r.y + 16); ctx.fill(); continue; }
    if (s.id === 'sign:approach' || s.id === 'sign:glidelights') { for (let i = 0; i < 4; i++) { ctx.fillStyle = i < 2 ? '#e63946' : '#f4f6fa'; ctx.beginPath(); ctx.arc(r.x + 6 + i * 12, r.y + r.h / 2, 4, 0, 7); ctx.fill(); } continue; }
    ctx.fillStyle = '#14161b'; roundRect(ctx, r.x, r.y, r.w, r.h, 4); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke();
    icon(ctx, s.icon, r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * .7);
  }
  // signs on others: the flags by the gates, the passenger board, the beacon, the floodlights
  if (has(a, 'sign:flags')) for (let i = 0; i < 4; i++) { const x = 300 + i * 10; ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 448); ctx.stroke(); ctx.fillStyle = ['#e63946', '#2f8fe8', '#ffd23f', '#2fa84f'][i]!; ctx.fillRect(x, 448, 9, 6); }
  if (has(a, 'sign:beacon') && (has(a, 'piece:tower') || has(a, 'piece:talltower'))) { const r = SPOTS['piece:tower']!; ctx.fillStyle = Math.sin(t * 5) > 0 ? '#2fa84f' : '#f4f6fa'; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 6, 0, 7); ctx.fill(); }
  if (has(a, 'sign:flood')) for (const x of [300, 590, 880]) { ctx.fillStyle = 'rgba(255,240,180,.25)'; ctx.beginPath(); ctx.arc(x, 480, 40, 0, 7); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, 470, 4, 0, 7); ctx.fill(); }
  if (has(a, 'sign:search')) { ctx.save(); ctx.translate(925, 520); ctx.rotate(Math.sin(t * .8) * .8 - 1.2); ctx.fillStyle = 'rgba(255,250,200,.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-30, -220); ctx.lineTo(30, -220); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // Charter signs
  const charterSigns = a.owned.filter(id => prizeById(id)?.kind === 'sign');
  charterSigns.forEach((id, i) => { const p = prizeById(id)!; const x = 1040 + i * 40, y = 270; ctx.fillStyle = '#14161b'; roundRect(ctx, x, y, 34, 34, 6); ctx.fill(); ctx.strokeStyle = '#b26bff'; ctx.lineWidth = 2; ctx.stroke(); icon(ctx, 'glyph' in p ? p.glyph : '🧭', x + 17, y + 17, 22); });
}

function drawDecor(ctx: Ctx, a: AirportLook, t: number) {
  for (const d of DECOR) {
    if (!has(a, d.id)) continue;
    const r = SPOTS[d.id];
    if (!r) continue;
    if (isPoint(r)) { icon(ctx, d.icon, r.x, r.y, 26); continue; }
    if (d.id === 'decor:pond' || d.id === 'decor:lake') { ctx.fillStyle = '#4fa3e0'; ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#2a6aa0'; ctx.lineWidth = 3; ctx.stroke(); }
    const n = Math.max(1, Math.round(r.w / 34));
    for (let i = 0; i < n; i++) icon(ctx, d.icon, r.x + 16 + i * ((r.w - 32) / Math.max(1, n - 1 || 1)), r.y + r.h / 2 + (d.id === 'decor:balloons' ? Math.sin(t + i) * 6 : 0), Math.min(28, r.h * .8));
  }
}

/** The whole plot, at plot units (scale and translate the context first). */
export function drawAirport(ctx: Ctx, a: AirportLook, t = 0, night = false) {
  // grass, with mown stripes, and the lake
  ctx.fillStyle = '#8fd17a'; ctx.fillRect(0, 0, PLOT_W, PLOT_H);
  ctx.fillStyle = '#86c972'; for (let y = 0; y < PLOT_H; y += 60) ctx.fillRect(0, y, PLOT_W, 30);
  ctx.fillStyle = '#4fa3e0'; ctx.beginPath(); ctx.moveTo(1060, PLOT_H); ctx.quadraticCurveTo(1080, 700, 1300, 690); ctx.lineTo(1300, PLOT_H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(1150 + i * 40 + Math.sin(t + i) * 6, 735 + i * 10); ctx.lineTo(1170 + i * 40 + Math.sin(t + i) * 6, 735 + i * 10); ctx.stroke(); }
  drawGround(ctx, a);
  drawRunway(ctx, a, t);
  drawDecor(ctx, a, t);
  // the terminal: only its biggest stage is drawn
  const stage = ['piece:glass', 'piece:bigterminal', 'piece:terminal', 'piece:hut'].find(id => has(a, id));
  // the shed he starts with, until the Ticket Hut replaces it
  if (!stage) { box(ctx, SHED, '#b07a3c', 4); ctx.fillStyle = '#6b3f22'; ctx.fillRect(SHED.x + 18, SHED.y + 18, 14, 22); icon(ctx, '🛖', SHED.x + SHED.w / 2, SHED.y + 12, 16); }
  for (const p of PIECES) {
    if (!has(a, p.id)) continue;
    if (['piece:hut', 'piece:terminal', 'piece:bigterminal', 'piece:glass'].includes(p.id) && p.id !== stage) continue;
    if (p.id === 'piece:tower' && has(a, 'piece:talltower')) continue;
    if (p.id === 'piece:roofgarden') continue;
    if (p.id.startsWith('piece:gate') || p.id === 'piece:bridges') continue;
    drawPiece(ctx, p.id, p.icon, t);
  }
  if (has(a, 'piece:roofgarden') && stage && stage !== 'piece:hut') drawPiece(ctx, 'piece:roofgarden', '🌿', t);
  if (has(a, 'sign:board') && stage) { const r = SPOTS[stage]!; ctx.fillStyle = '#14161b'; roundRect(ctx, r.x + r.w / 2 - 40, r.y + r.h - 22, 80, 18, 4); ctx.fill(); ctx.fillStyle = '#ffd23f'; ctx.font = '900 11px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✈ ✈ ✈', r.x + r.w / 2, r.y + r.h - 13); }
  drawGates(ctx, a);
  drawRepeats(ctx, a);
  drawSigns(ctx, a, t);
  if (night) { ctx.fillStyle = 'rgba(10,20,50,.45)'; ctx.fillRect(0, 0, PLOT_W, PLOT_H); }
}

/** A ground vehicle from above. */
export function drawVehicle(ctx: Ctx, x: number, y: number, heading: number, hex: string, len: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(heading);
  ctx.fillStyle = hex; roundRect(ctx, -len / 2, -6, len, 12, 3); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#2a4a6a'; ctx.fillRect(len / 2 - 7, -4.5, 4, 9);
  ctx.restore();
}
