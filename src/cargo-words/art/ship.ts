// Ships from the side, drawn in code: the ten kinds he can own (and every generated visitor) share one hull shape, given its own bow,
// superstructure, funnel and trim by its kind. The deck where containers stand runs from `deckX` for `deckW` pixels; the bridge and the bow
// are to the right of it (the ship sails off to the right), the stern a little to the left.
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

const KIND_BITS: Record<ShipKind, { tall: number; cabin: 'tug' | 'boat' | 'bridge' | 'block' | 'liner' | 'ferry'; bow: 'round' | 'sharp' | 'ice'; extra?: 'mast' | 'aframe' | 'pipes' | 'tyres' }> = {
  tug: { tall: 1.1, cabin: 'tug', bow: 'round', extra: 'tyres' },
  fishing: { tall: 1, cabin: 'boat', bow: 'round', extra: 'mast' },
  research: { tall: 1.1, cabin: 'bridge', bow: 'sharp', extra: 'aframe' },
  ferry: { tall: 1.2, cabin: 'ferry', bow: 'round' },
  feeder: { tall: 1.1, cabin: 'bridge', bow: 'sharp' },
  icebreaker: { tall: 1.3, cabin: 'bridge', bow: 'ice' },
  tanker: { tall: 1, cabin: 'bridge', bow: 'sharp', extra: 'pipes' },
  carcarrier: { tall: 1.5, cabin: 'block', bow: 'round' },
  boxship: { tall: 1.25, cabin: 'bridge', bow: 'sharp' },
  liner: { tall: 1.4, cabin: 'liner', bow: 'sharp' },
};

/** Draws the ship. `waterY` is the water line in pixels, `deckY` where the deck is (above the water), `u` pixels per world unit. */
export function drawShip(ctx: CanvasRenderingContext2D, look: ShipLook, deckX: number, deckW: number, deckY: number, waterY: number, u: number, t = 0) {
  const bits = KIND_BITS[look.kind];
  const stern = deckX - 3 * u, cabinW = 9 * u, bowX = deckX + deckW + cabinW + 2 * u, bowTip = bowX + 6 * u;
  const keelY = waterY + 4.5 * u * bits.tall, top = deckY;
  ctx.lineJoin = 'round';
  // the hull
  ctx.beginPath();
  ctx.moveTo(stern - 2 * u, top);
  ctx.lineTo(bowX, top);
  if (bits.bow === 'sharp') { ctx.lineTo(bowTip, top - 1.2 * u); ctx.lineTo(bowX + 1.5 * u, keelY); }
  else if (bits.bow === 'ice') { ctx.lineTo(bowTip, top - 0.8 * u); ctx.quadraticCurveTo(bowTip - 1 * u, keelY - 1 * u, bowX - 1 * u, keelY); }
  else ctx.quadraticCurveTo(bowTip + 1 * u, (top + keelY) / 2, bowX - 2 * u, keelY);
  ctx.lineTo(stern + 1 * u, keelY);
  ctx.quadraticCurveTo(stern - 2 * u, keelY - 1 * u, stern - 2 * u, top);
  ctx.closePath();
  ctx.fillStyle = look.hull; ctx.fill();
  // the red below the water line
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#9b2a22'; ctx.fillRect(stern - 4 * u, waterY + 0.4 * u, bowTip - stern + 8 * u, keelY);
  ctx.fillStyle = look.trim; ctx.fillRect(stern - 4 * u, top, bowTip - stern + 8 * u, 1.1 * u);
  ctx.restore();
  ctx.strokeStyle = '#141414'; ctx.lineWidth = Math.max(2, 0.35 * u); ctx.stroke();
  // its name on the bow, and portholes
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(stern + (i + 1) * ((bowX - stern) / 7), top + 2.3 * u, 0.35 * u, 0, 7); ctx.fill(); }
  if (look.name) {
    ctx.font = `800 ${Math.max(9, Math.round(1.3 * u))}px Nunito, sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = look.trim === '#ffffff' ? '#141414' : '#ffffff';
    ctx.fillText(look.name, bowX - 0.5 * u, top + 3.4 * u);
  }
  // fenders on a tug
  if (bits.extra === 'tyres') { ctx.fillStyle = '#222'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(stern + i * ((bowX - stern) / 3.5) + u, top + 1.2 * u, 0.9 * u, 0, 7); ctx.fill(); } }
  // the superstructure
  const cx = deckX + deckW + 1 * u, line = Math.max(2, 0.3 * u);
  const box = (x: number, y: number, w: number, h: number, fill: string) => { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#141414'; ctx.lineWidth = line; ctx.strokeRect(x, y, w, h); };
  const windows = (x: number, y: number, w: number, rows: number) => { ctx.fillStyle = '#7fd3ff'; for (let r = 0; r < rows; r++) for (let i = 0; i < Math.floor(w / (1.6 * u)); i++) ctx.fillRect(x + 0.5 * u + i * 1.6 * u, y + 0.6 * u + r * 1.8 * u, 1 * u, 0.9 * u); };
  let funnelX = cx + cabinW * 0.6, funnelTop = top - 10 * u;
  if (bits.cabin === 'tug') { box(cx, top - 7 * u, cabinW * 0.8, 7 * u, '#ffffff'); windows(cx, top - 7 * u, cabinW * 0.8, 1); funnelX = cx + cabinW * 0.2; funnelTop = top - 11 * u; }
  else if (bits.cabin === 'boat') { box(cx, top - 5 * u, cabinW * 0.7, 5 * u, '#ffffff'); windows(cx, top - 5 * u, cabinW * 0.7, 1); funnelTop = top - 7 * u; funnelX = cx + cabinW * 0.75; }
  else if (bits.cabin === 'bridge') { box(cx, top - 10 * u, cabinW, 10 * u, '#f4f4f0'); windows(cx, top - 10 * u, cabinW, 4); box(cx - 1 * u, top - 11 * u, cabinW + 2 * u, 1.4 * u, '#f4f4f0'); funnelTop = top - 14 * u; }
  else if (bits.cabin === 'block') { box(cx, top - 12 * u, cabinW, 12 * u, look.hull); windows(cx, top - 12 * u, cabinW, 1); funnelTop = top - 15 * u; }
  else if (bits.cabin === 'ferry') { box(cx - 2 * u, top - 8 * u, cabinW + 2 * u, 8 * u, '#ffffff'); windows(cx - 2 * u, top - 8 * u, cabinW + 2 * u, 3); funnelTop = top - 12 * u; }
  else { box(cx - 2 * u, top - 12 * u, cabinW + 3 * u, 12 * u, '#ffffff'); windows(cx - 2 * u, top - 12 * u, cabinW + 3 * u, 5); funnelTop = top - 16 * u; }
  // the funnel and its mark
  const fw = 2.8 * u, fh = Math.max(2 * u, (top - 4 * u) - funnelTop);
  box(funnelX, funnelTop, fw, fh, look.funnel);
  ctx.fillStyle = '#141414'; ctx.fillRect(funnelX, funnelTop, fw, 0.8 * u);
  if (look.mark) { ctx.font = `${Math.round(1.9 * u)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(look.mark, funnelX + fw / 2, funnelTop + fh * 0.55); }
  // a puff of smoke now and then
  const puff = (t * 0.6) % 1;
  ctx.fillStyle = `rgba(230,230,230,${0.6 * (1 - puff)})`; ctx.beginPath(); ctx.arc(funnelX + fw / 2 - puff * 3 * u, funnelTop - puff * 5 * u, (0.8 + puff * 1.6) * u, 0, 7); ctx.fill();
  // extras
  ctx.strokeStyle = '#141414'; ctx.lineWidth = line;
  if (bits.extra === 'mast') { ctx.beginPath(); ctx.moveTo(stern + 2 * u, top); ctx.lineTo(stern + 2 * u, top - 11 * u); ctx.lineTo(cx, top - 4 * u); ctx.stroke(); }
  if (bits.extra === 'aframe') { ctx.strokeStyle = '#ff7a00'; ctx.lineWidth = 0.8 * u; ctx.beginPath(); ctx.moveTo(stern - 1 * u, top); ctx.lineTo(stern + 1 * u, top - 7 * u); ctx.lineTo(stern + 3 * u, top); ctx.stroke(); }
  if (bits.extra === 'pipes') { ctx.strokeStyle = '#6b6b6b'; ctx.lineWidth = 0.5 * u; ctx.beginPath(); ctx.moveTo(deckX, top - 0.6 * u); ctx.lineTo(deckX + deckW, top - 0.6 * u); ctx.stroke(); }
}
