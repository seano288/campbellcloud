// The Port drawn on a canvas, from the front: sky, the land with its buildings, the yard with stacked containers, the rail line and its
// train, the gate and its lorries, the quay with his cranes, and his ships at their berths in the water. Every piece has a fixed place
// (port/plot.ts). Drawn simply for now (boxes with the piece's emoji); pass 3 is the design pass. "Watch it run" draws the same port and
// moves things on it (`moving`).
import { pick, seeded } from '../../game/rng';
import { BOX_COLOURS, DECOR, PIECES } from '../port/catalog';
import { boxLooks, craneLook, fleetKinds, has, shipLook, type PortState } from '../port/port';
import { CRATES, SPECIALS } from '../port/sea';
import { BERTH_X, DECOR_STEP, DECOR_X0, DECOR_Y, DRAW_MOST, LAND_Y, PLACES, PLOT_H, PLOT_W, QUAY_Y, SEA_Y, STRIPS, VEHICLES } from '../port/plot';
import { drawBox, type BoxLook } from './container';
import { drawShip, type ShipLook } from './ship';

export interface Moving {
  /** Ships coming in or going out: which berth, how far out (0 moored, 1 off screen) and its look. */
  ships: { berth: number; out: number; look: ShipLook; boxes: number }[];
  /** The train's place along the rail (0 to 1, or null) and the lorries' (each 0 to 1). */
  train: number | null;
  lorries: number[];
  /** Each crane's trolley place along its boom, 0 to 1. */
  trolleys: number[];
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

/** Draws the whole port in plot units (PLOT_W × PLOT_H). */
export function drawPort(ctx: CanvasRenderingContext2D, p: PortState, t: number, moving: Moving | null = null) {
  const own = (id: string) => has(p, id);
  // sky, land, the quay and the sea
  const sky = ctx.createLinearGradient(0, 0, 0, LAND_Y);
  sky.addColorStop(0, '#6cc0ec'); sky.addColorStop(1, '#d8f1ff');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, PLOT_W, LAND_Y);
  ctx.fillStyle = '#b9c38a'; ctx.fillRect(0, LAND_Y, PLOT_W, QUAY_Y - LAND_Y);
  ctx.fillStyle = '#9aa1a8'; ctx.fillRect(0, QUAY_Y - 20, PLOT_W, 32);
  ctx.fillStyle = '#1f9a8a'; ctx.fillRect(0, SEA_Y - 20, PLOT_W, PLOT_H - SEA_Y + 20);
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) { const yy = SEA_Y + 20 + i * 22, off = (t * 20 + i * 40) % 80; ctx.beginPath(); for (let x = -off; x < PLOT_W; x += 80) { ctx.moveTo(x, yy); ctx.lineTo(x + 30, yy); } ctx.stroke(); }
  // the wooden pier is always there
  ctx.fillStyle = '#8a5a35'; ctx.fillRect(BERTH_X[0], QUAY_Y - 8, 100, 14);
  // each berth he has built: a concrete jetty with its number
  const built = PIECES.filter(x => x.does === 'berth' && own(x.id)).length + p.more.berth;
  for (let i = 1; i <= Math.min(BERTH_X.length - 1, built); i++) {
    ctx.fillStyle = '#7e858c'; ctx.fillRect(BERTH_X[i]!, QUAY_Y - 10, 100, 16);
    ctx.fillStyle = '#ffd23f'; ctx.font = '900 14px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), BERTH_X[i]! + 50, QUAY_Y - 2);
  }

  // pieces in their places, in the order of the catalogue so stages draw over their base
  for (const piece of PIECES) {
    if (!own(piece.id)) continue;
    const pl = PLACES[piece.id];
    if (!pl || VEHICLES.includes(piece.id)) continue;
    if (STRIPS.includes(piece.id) && piece.id !== 'piece:weigh' && piece.id !== 'piece:harbourlights') {
      ctx.fillStyle = pl.colour; ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      if (piece.id === 'piece:rail') { ctx.fillStyle = '#d0d0d0'; for (let x = pl.x; x < pl.x + pl.w; x += 18) ctx.fillRect(x, pl.y + 4, 10, 6); }
      continue;
    }
    roundRect(ctx, pl.x, pl.y, pl.w, pl.h, 6); ctx.fillStyle = pl.colour; ctx.fill(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = `${Math.min(34, pl.h * 0.6, pl.w * 0.7)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(piece.icon, pl.x + pl.w / 2, pl.y + pl.h / 2);
    if (piece.id === 'piece:lighthouse') { ctx.fillStyle = `rgba(255,240,140,${0.35 + 0.25 * Math.sin(t * 2)})`; ctx.beginPath(); ctx.moveTo(pl.x + pl.w / 2, pl.y + 14); ctx.lineTo(pl.x - 120, pl.y - 10); ctx.lineTo(pl.x - 120, pl.y + 40); ctx.fill(); }
  }
  // the yard's stacks, from the container looks he owns; more yard blocks and warehouses, drawn up to a few
  const looks = boxLooks(p), rng = seeded(7);
  const yardBoxes = (own('piece:yard') ? 10 : 0) + (own('piece:bigyard') ? 10 : 0) + Math.min(DRAW_MOST.block, p.more.block) * 3;
  for (let i = 0; i < yardBoxes; i++) {
    const look: BoxLook = { hex: pick(rng, looks.colours), stripe: 'none', stripeHex: '#ffffff', mark: '' };
    const col = i % 14, tier = Math.floor(i / 14);
    drawBox(ctx, 26 + col * 30, 236 - tier * 16, 28, 15, look, null);
  }
  for (let i = 0; i < Math.min(DRAW_MOST.shed, p.more.shed); i++) { roundRect(ctx, 20 + i * 96, 10, 90, 40, 6); ctx.fillStyle = '#b77a4a'; ctx.fill(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 3; ctx.stroke(); }
  if (p.more.rail > 0 && own('piece:rail')) { ctx.fillStyle = '#6b4b3a'; ctx.fillRect(760, 262, Math.min(DRAW_MOST.rail, p.more.rail) * 70, 14); }

  // the train and the lorries (moving in "Watch it run")
  if (own('piece:engine')) {
    const x = moving?.train !== null && moving?.train !== undefined ? -200 + moving.train * (PLOT_W + 400) : 600;
    const cars = (own('piece:longtrain') ? 4 : 1) + Math.min(DRAW_MOST.rail, p.more.rail);
    for (let i = 0; i < cars; i++) drawBox(ctx, x - 70 - i * 64, 236, 60, 24, { hex: BOX_COLOURS[i % BOX_COLOURS.length]!.hex, stripe: 'none', stripeHex: '#fff', mark: '' }, null);
    roundRect(ctx, x - 6, 232, 60, 30, 6); ctx.fillStyle = '#2f8a3f'; ctx.fill(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 3; ctx.stroke();
  }
  const lorries = (own('piece:lorry') ? 1 : 0) + (own('piece:biglorry') ? 1 : 0);
  for (let i = 0; i < lorries; i++) {
    const x = moving ? 780 + (moving.lorries[i] ?? 0) * 500 : 850 + i * 70;
    roundRect(ctx, x, 248, 54, 22, 4); ctx.fillStyle = i ? '#e63946' : '#2f6fe0'; ctx.fill(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + 12, 272, 6, 0, 7); ctx.arc(x + 42, 272, 6, 0, 7); ctx.fill();
  }
  // decorations along the front of the land
  let dx = DECOR_X0;
  ctx.font = '30px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const d of DECOR) if (own(d.id)) { ctx.fillText(d.icon, dx, DECOR_Y); dx += DECOR_STEP; }
  for (const id of p.owned) if (id.startsWith('crate:') || id.startsWith('special:')) { const icon = cratesIcon(id); if (icon && dx < PLOT_W - 20) { ctx.fillText(icon, dx, DECOR_Y); dx += DECOR_STEP; } }

  // his cranes on the quay
  const cl = craneLook(p), cranes = 1 + Math.min(DRAW_MOST.crane, p.more.crane);
  for (let i = 0; i < cranes; i++) {
    const x0 = 60 + i * 150, legH = cl.kind === 'tall' || cl.kind === 'giant' ? 190 : 150, top = QUAY_Y - 20 - legH;
    ctx.strokeStyle = '#141414'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x0, QUAY_Y - 20); ctx.lineTo(x0, top); ctx.moveTo(x0 + 70, QUAY_Y - 20); ctx.lineTo(x0 + 70, top); ctx.moveTo(x0 - 40, top); ctx.lineTo(x0 + 140, top); ctx.stroke();
    ctx.strokeStyle = cl.paint; ctx.lineWidth = 7; ctx.stroke();
    const tx = x0 - 30 + (moving?.trolleys[i] ?? 0.6) * 160;
    ctx.fillStyle = '#3a3f44'; ctx.fillRect(tx - 10, top + 2, 20, 10);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, top + 12); ctx.lineTo(tx, top + 60); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(tx - 16, top + 58, 32, 6);
  }
  // his ships at their berths (and moving ones)
  const kinds = fleetKinds(p);
  const ships = moving ? moving.ships : kinds.slice(0, BERTH_X.length).map((k, i) => ({ berth: i, out: 0, look: shipLook(p, k), boxes: 0 }));
  for (const s of ships) {
    const x = BERTH_X[s.berth]! + s.out * 900, u = 2.2;
    drawShip(ctx, s.look, x + 10, 30 * u * 0.5, SEA_Y + 2, SEA_Y + 10, u, t);
    for (let b = 0; b < s.boxes; b++) drawBox(ctx, x + 10 + (b % 3) * 11, SEA_Y + 2 - 10 - Math.floor(b / 3) * 10, 10.5, 9.5, { hex: pick(seeded(b + s.berth), looks.colours), stripe: 'none', stripeHex: '#fff', mark: '' }, null);
  }
}

/** The crates and special prizes that are decorations show along the front of the land. */
const CRATE_ICONS: Readonly<Record<string, string>> = Object.fromEntries([...CRATES, ...SPECIALS].filter(c => c.kind === 'decor').map(c => [c.id, c.icon]));
const cratesIcon = (id: string): string | null => CRATE_ICONS[id] ?? null;
