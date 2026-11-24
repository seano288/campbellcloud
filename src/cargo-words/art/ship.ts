// Ships from the side, drawn in code: the ten kinds he can own (and every generated visitor). They share one way of building a hull, and
// each kind gets its own bow, superstructure and gear: the tug's tyre fenders and tall wheelhouse, the fishing boat's mast and derrick,
// the research ship's A-frame and radar dome, the ferry's three white decks, the icebreaker's sloped ice bow, the tanker's pipes, the car
// carrier's slab sides, the container ship's cell guides and the liner's two funnels. The deck where containers stand runs from `deckX`
// for `deckW` pixels; the bridge and the bow are to the right of it (the ship sails off to the right), the stern a little to the left.
// Thick dark outlines, as everything in the family's art. `u` is pixels per world unit.
import { inkFor, shade } from './container';

export const SHIP_KINDS = ['tug', 'fishing', 'research', 'ferry', 'feeder', 'icebreaker', 'tanker', 'carcarrier', 'boxship', 'liner'] as const;
export type ShipKind = (typeof SHIP_KINDS)[number];

export interface ShipLook {
  readonly kind: ShipKind;
  readonly hull: string;
  /** The band along the top of the hull. */
  readonly trim: string;
  readonly funnel: string;
  /** The funnel mark: an emoji. */
  readonly mark: string;
  /** The name on its bow. */
  readonly name: string;
}

type Bow = 'round' | 'sharp' | 'ice';
const KIND_BITS: Record<ShipKind, { tall: number; bow: Bow }> = {
  tug: { tall: 1.15, bow: 'round' }, fishing: { tall: 1, bow: 'sharp' }, research: { tall: 1.1, bow: 'sharp' }, ferry: { tall: 1.15, bow: 'round' },
  feeder: { tall: 1.1, bow: 'sharp' }, icebreaker: { tall: 1.3, bow: 'ice' }, tanker: { tall: 1, bow: 'sharp' }, carcarrier: { tall: 1.4, bow: 'round' },
  boxship: { tall: 1.25, bow: 'sharp' }, liner: { tall: 1.35, bow: 'sharp' },
};

/** How far the ship reaches left of its deck and right of it, in world units, so a picture of one can be fitted to its box. */
export const SHIP_REACH = { left: 5, right: 18, up: 17, down: 7 } as const;

const INK = '#141414', GLASS = '#1f3e5c', WHITE = '#f7f7f2';

/** Draws the ship. `waterY` is the water line in pixels, `deckY` where the deck is (above the water), `u` pixels per world unit. */
export function drawShip(ctx: CanvasRenderingContext2D, look: ShipLook, deckX: number, deckW: number, deckY: number, waterY: number, u: number, t = 0) {
  const bits = KIND_BITS[look.kind], k = look.kind;
  const stern = deckX - 3 * u, cabinW = 9 * u, cx = deckX + deckW + 1 * u, bowX = deckX + deckW + cabinW + 2 * u, bowTip = bowX + 6 * u;
  const keelY = waterY + 4.5 * u * bits.tall, top = deckY, line = Math.max(1.5, 0.32 * u);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const box = (x: number, y: number, w: number, h: number, fill: string) => { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.strokeRect(x, y, w, h); };
  const windows = (x: number, y: number, w: number, rows: number, gap = 1.7) => {
    ctx.fillStyle = GLASS;
    const n = Math.max(1, Math.floor((w - 0.6 * u) / (gap * u)));
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) ctx.fillRect(x + 0.6 * u + i * gap * u, y + 0.7 * u + r * 2 * u, gap * u * 0.6, 0.9 * u);
  };
  const band = (x: number, y: number, w: number, h: number, fill: string) => { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); };
  const mastLight = (x: number, y: number) => { ctx.fillStyle = '#fff6b0'; ctx.beginPath(); ctx.arc(x, y, 0.55 * u, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = line * 0.7; ctx.stroke(); };
  const pole = (x0: number, y0: number, x1: number, y1: number, w = 0.5) => { ctx.strokeStyle = INK; ctx.lineWidth = w * u + line; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };

  // ---- the hull ----
  const sheer = bits.bow === 'round' ? 0.6 * u : 1.8 * u;
  ctx.beginPath();
  ctx.moveTo(stern - 2 * u, top - 0.4 * u);
  ctx.lineTo(bowX - 2 * u, top);
  ctx.lineTo(bowX, top - sheer);
  if (bits.bow === 'sharp') { ctx.lineTo(bowTip, top - sheer - 0.4 * u); ctx.quadraticCurveTo(bowTip - 2.5 * u, (top + keelY) / 2, bowX + 1 * u, keelY); }
  else if (bits.bow === 'ice') { ctx.lineTo(bowTip, top - sheer); ctx.lineTo(bowTip - 0.5 * u, waterY - 0.5 * u); ctx.quadraticCurveTo(bowX + 1 * u, keelY - 0.4 * u, bowX - 2 * u, keelY); }
  else { ctx.lineTo(bowX + 2 * u, top - sheer); ctx.quadraticCurveTo(bowTip + 1 * u, (top + keelY) / 2, bowX - 2 * u, keelY); }
  ctx.lineTo(stern + 2 * u, keelY);
  ctx.quadraticCurveTo(stern - 1.5 * u, keelY - 0.6 * u, stern - 2.2 * u, waterY - 0.6 * u);
  ctx.closePath();
  ctx.fillStyle = look.hull; ctx.fill();
  ctx.save(); ctx.clip();
  // the trim along the top, a shadow under it, and the red below the water line with its black boot-top
  band(stern - 4 * u, top - 3 * u, bowTip - stern + 8 * u, 3 * u + 1.1 * u, look.trim);
  band(stern - 4 * u, top + 1.1 * u, bowTip - stern + 8 * u, 0.35 * u, shade(look.hull, -0.35));
  band(stern - 4 * u, waterY - 0.15 * u, bowTip - stern + 8 * u, 0.5 * u, '#1b1b1b');
  band(stern - 4 * u, waterY + 0.35 * u, bowTip - stern + 8 * u, keelY, '#a3322a');
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = line * 1.3; ctx.stroke();
  // an anchor at the bow, portholes on the passenger ships
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bowX + 1.2 * u, top + 1.6 * u, 0.45 * u, 0, 7); ctx.fill();
  if (k === 'ferry' || k === 'liner' || k === 'research' || k === 'tug' || k === 'fishing') {
    ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = line * 0.6;
    const n = Math.max(3, Math.floor((bowX - stern) / (3 * u)));
    for (let i = 1; i < n; i++) { ctx.beginPath(); ctx.arc(stern + i * ((bowX - stern) / n), top + 2.3 * u, 0.4 * u, 0, 7); ctx.fill(); ctx.stroke(); }
  }
  // its name on the bow
  if (look.name && u >= 2) {
    ctx.font = `800 ${Math.max(8, Math.round(1.2 * u))}px Nunito, sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = inkFor(look.hull);
    ctx.fillText(look.name, bowX - 0.5 * u, Math.min(waterY - 0.9 * u, top + 2.6 * u));
  }
  // tug fenders: tyres all round, and the black push knees on its bow
  if (k === 'tug') {
    ctx.fillStyle = '#222';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(stern + 1 * u + i * ((bowX - stern) / 4.6), top + 1 * u, 0.8 * u, 0, 7); ctx.fill(); }
    ctx.fillRect(bowX + 1.6 * u, top - 1 * u, 1.6 * u, (waterY - top) + 1 * u);
  }

  // ---- the superstructure and gear ----
  let funnelX = cx + cabinW * 0.55, funnelTop = top - 12 * u, funnelW = 2.8 * u, funnelBase = top - 4 * u;
  if (k === 'tug') {
    box(cx - 1 * u, top - 5 * u, 8 * u, 5 * u, WHITE); windows(cx - 1 * u, top - 5 * u, 8 * u, 1);
    box(cx + 0.5 * u, top - 8.6 * u, 6 * u, 3.6 * u, WHITE);
    band(cx + 1 * u, top - 7.8 * u, 5 * u, 1.6 * u, GLASS);
    pole(cx + 3.5 * u, top - 8.6 * u, cx + 3.5 * u, top - 12.5 * u, 0.3); mastLight(cx + 3.5 * u, top - 12.5 * u);
    funnelX = cx - 3.4 * u; funnelW = 2.2 * u; funnelTop = top - 8.5 * u; funnelBase = top;
  } else if (k === 'fishing') {
    box(cx + 1 * u, top - 6 * u, 6.5 * u, 6 * u, WHITE); windows(cx + 1 * u, top - 6 * u, 6.5 * u, 1, 2);
    box(cx + 1.5 * u, top - 8 * u, 5.5 * u, 2 * u, look.trim);
    // the mast and its derrick, a net drum at the stern
    pole(cx + 4 * u, top - 8 * u, cx + 4 * u, top - 15 * u, 0.35); pole(cx + 2 * u, top - 13.5 * u, cx + 6 * u, top - 13.5 * u, 0.25); mastLight(cx + 4 * u, top - 15 * u);
    ctx.strokeStyle = '#4b4b4b'; ctx.lineWidth = Math.max(1, 0.18 * u); ctx.beginPath(); ctx.moveTo(cx + 4 * u, top - 14 * u); ctx.lineTo(stern + 1 * u, top - 6 * u); ctx.stroke();
    ctx.fillStyle = '#e07b39'; ctx.beginPath(); ctx.arc(stern + 1 * u, top - 1.3 * u, 1.3 * u, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.stroke();
    funnelX = cx - 1.8 * u; funnelW = 1.8 * u; funnelTop = top - 7 * u; funnelBase = top;
  } else if (k === 'research') {
    box(cx - 1 * u, top - 6 * u, cabinW + 2 * u, 6 * u, WHITE); windows(cx - 1 * u, top - 6 * u, cabinW + 2 * u, 2);
    box(cx + 0.5 * u, top - 9.5 * u, cabinW - 1 * u, 3.5 * u, WHITE); band(cx + 1 * u, top - 8.8 * u, cabinW - 2 * u, 1.4 * u, GLASS);
    pole(cx + 6 * u, top - 9.5 * u, cx + 6 * u, top - 14 * u, 0.3);
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(cx + 6 * u, top - 15 * u, 1.3 * u, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.stroke();
    // the orange A-frame over the stern
    ctx.strokeStyle = INK; ctx.lineWidth = 1 * u + line; ctx.beginPath(); ctx.moveTo(stern - 1 * u, top); ctx.lineTo(stern + 0.8 * u, top - 8 * u); ctx.lineTo(stern + 2.6 * u, top); ctx.stroke();
    ctx.strokeStyle = '#ff7a00'; ctx.lineWidth = 1 * u; ctx.stroke();
    funnelX = cx + 2 * u; funnelW = 2.4 * u; funnelTop = top - 12 * u; funnelBase = top - 9.5 * u;
  } else if (k === 'ferry') {
    box(cx - 3 * u, top - 4 * u, cabinW + 4 * u, 4 * u, WHITE); windows(cx - 3 * u, top - 4 * u, cabinW + 4 * u, 1, 1.4);
    box(cx - 2 * u, top - 8 * u, cabinW + 3 * u, 4 * u, WHITE); windows(cx - 2 * u, top - 8 * u, cabinW + 3 * u, 1, 1.4);
    box(cx, top - 11 * u, cabinW, 3 * u, WHITE); band(cx + 0.5 * u, top - 10.3 * u, cabinW - 1 * u, 1.3 * u, GLASS);
    // lifeboats
    for (const lx of [cx - 1.5 * u, cx + 3 * u]) { ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.roundRect(lx, top - 6.6 * u, 3.6 * u, 1.4 * u, 0.7 * u); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = line * 0.8; ctx.stroke(); }
    funnelX = cx + 5 * u; funnelW = 2.6 * u; funnelTop = top - 14 * u; funnelBase = top - 11 * u;
  } else if (k === 'liner') {
    box(cx - 4 * u, top - 4 * u, cabinW + 6 * u, 4 * u, WHITE); windows(cx - 4 * u, top - 4 * u, cabinW + 6 * u, 1, 1.2);
    box(cx - 3.5 * u, top - 8 * u, cabinW + 5 * u, 4 * u, WHITE); windows(cx - 3.5 * u, top - 8 * u, cabinW + 5 * u, 1, 1.2);
    box(cx - 2.5 * u, top - 11.5 * u, cabinW + 3 * u, 3.5 * u, WHITE); windows(cx - 2.5 * u, top - 11.5 * u, cabinW + 3 * u, 1, 1.2);
    for (const lx of [cx - 3 * u, cx + 1 * u, cx + 5 * u]) { ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.roundRect(lx, top - 5.5 * u, 3 * u, 1.2 * u, 0.6 * u); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = line * 0.7; ctx.stroke(); }
    // its second funnel, behind the first
    const f2 = cx - 1 * u;
    box(f2, top - 16 * u, 2.6 * u, 4.5 * u, look.funnel); band(f2, top - 16 * u, 2.6 * u, 0.8 * u, INK);
    funnelX = cx + 3.5 * u; funnelW = 2.8 * u; funnelTop = top - 16.5 * u; funnelBase = top - 11.5 * u;
  } else if (k === 'carcarrier') {
    // a tall slab-sided garage over the front, white with a band of the hull's colour, its front sloping down to the bow
    ctx.beginPath(); ctx.moveTo(cx - 3 * u, top); ctx.lineTo(cx - 3 * u, top - 11 * u); ctx.lineTo(bowX - 1 * u, top - 11 * u);
    ctx.lineTo(bowX + 2 * u, top - sheer - 1 * u); ctx.lineTo(bowX - 2 * u, top); ctx.closePath();
    ctx.fillStyle = '#eef1f3'; ctx.fill();
    ctx.save(); ctx.clip(); band(cx - 3 * u, top - 6.5 * u, bowX - cx + 6 * u, 2 * u, look.hull); band(cx - 3 * u, top - 9.5 * u, bowX - cx + 6 * u, 0.4 * u, '#0003'); ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.stroke();
    box(cx + 3 * u, top - 13 * u, 5 * u, 2 * u, WHITE); band(cx + 3.4 * u, top - 12.6 * u, 4.2 * u, 1 * u, GLASS);
    funnelX = cx - 1 * u; funnelW = 2.4 * u; funnelTop = top - 14 * u; funnelBase = top - 11 * u;
  } else {
    // feeder, container ship, icebreaker, tanker: an accommodation block with its bridge and wings on top
    const tall = k === 'boxship' ? 12 : k === 'icebreaker' ? 11 : 9.5, bw = k === 'boxship' ? cabinW : cabinW - 1 * u;
    box(cx, top - tall * u, bw, tall * u, WHITE); windows(cx, top - tall * u + 2.4 * u, bw, Math.floor((tall - 3) / 2));
    box(cx - 1 * u, top - (tall + 2) * u, bw + 2 * u, 2 * u, WHITE); band(cx - 0.4 * u, top - (tall + 1.5) * u, bw + 0.8 * u, 1 * u, GLASS);
    pole(cx + bw * 0.5, top - (tall + 2) * u, cx + bw * 0.5, top - (tall + 4.5) * u, 0.3); mastLight(cx + bw * 0.5, top - (tall + 4.5) * u);
    funnelX = cx - 3 * u; funnelW = 2.6 * u; funnelTop = top - (tall - 1) * u; funnelBase = top;
    if (k === 'boxship') {
      // yellow cell guides at each end of the deck, where the containers are lashed
      for (const gx of [deckX - 0.6 * u, deckX + deckW + 0.1 * u]) { box(gx, top - 9 * u, 0.5 * u, 9 * u, '#ffcc00'); }
      funnelX = cx + bw - 0.2 * u; funnelTop = top - (tall + 1) * u; funnelBase = top - (tall - 3) * u;
    }
    if (k === 'tanker') {
      ctx.strokeStyle = '#5b636b'; ctx.lineWidth = 0.6 * u; ctx.beginPath(); ctx.moveTo(stern, top - 0.7 * u); ctx.lineTo(bowX - 1 * u, top - 0.7 * u); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = line * 0.7; ctx.beginPath();
      for (let x = stern + 2 * u; x < bowX - 2 * u; x += 4 * u) { ctx.moveTo(x, top); ctx.lineTo(x, top - 1.4 * u); }
      ctx.stroke();
      box(deckX + deckW * 0.45, top - 2.2 * u, 1.6 * u, 2.2 * u, '#e63946');
    }
    if (k === 'icebreaker') {
      // a little crane on the foredeck and the helideck's H over the stern
      pole(bowX - 3 * u, top, bowX - 1 * u, top - 6 * u, 0.4); pole(bowX - 1 * u, top - 6 * u, bowX + 2 * u, top - 4 * u, 0.3);
      band(stern - 2 * u, top - 1 * u, 6 * u, 0.6 * u, '#ffcc00');
    }
  }
  // ---- the funnel and its mark ----
  const fh = Math.max(2 * u, funnelBase - funnelTop);
  box(funnelX, funnelTop, funnelW, fh, look.funnel);
  band(funnelX, funnelTop, funnelW, 0.8 * u, INK);
  ctx.strokeStyle = INK; ctx.lineWidth = line; ctx.strokeRect(funnelX, funnelTop, funnelW, fh);
  if (look.mark && u >= 2.5 && funnelW >= 2.4 * u) { ctx.font = `${Math.round(1.8 * u)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(look.mark, funnelX + funnelW / 2, funnelTop + Math.min(fh * 0.55, 3 * u)); }
  // a puff of smoke now and then
  if (t) {
    const puff = (t * 0.5) % 1;
    ctx.fillStyle = `rgba(235,235,235,${0.55 * (1 - puff)})`; ctx.beginPath(); ctx.arc(funnelX + funnelW / 2 - puff * 3 * u, funnelTop - 0.8 * u - puff * 5 * u, (0.7 + puff * 1.6) * u, 0, 7); ctx.fill();
  }
}

/** Draws a ship to fit a box (w by h pixels), standing on a strip of water: for shop tiles, the Load button and the go's card. */
export function drawShipFitted(ctx: CanvasRenderingContext2D, look: ShipLook, deckUnits: number, w: number, h: number, water = true) {
  const span = deckUnits + SHIP_REACH.left + SHIP_REACH.right, rise = SHIP_REACH.up + SHIP_REACH.down;
  const u = Math.min(w / span, h / rise), waterY = (h + (SHIP_REACH.up - SHIP_REACH.down) * u) / 2 + 2.5 * u;
  const deckX = (w - span * u) / 2 + SHIP_REACH.left * u;
  if (water) {
    ctx.fillStyle = '#1f9a8a'; ctx.fillRect(0, waterY, w, h - waterY);
    ctx.fillStyle = '#ffffff55'; ctx.fillRect(0, waterY, w, Math.max(1, 0.3 * u));
  }
  drawShip(ctx, { ...look, name: '' }, deckX, deckUnits * u, waterY - 2.6 * u, waterY, u);
  if (water) { ctx.fillStyle = '#1f9a8acc'; ctx.fillRect(0, waterY + 0.8 * u, w, h); }
}
