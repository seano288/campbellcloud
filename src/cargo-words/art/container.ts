// The container: the game's signature shape, the same in the questions and on the quay. A corrugated steel box with a darker rail along
// its top and bottom, a corner casting at each corner, the doors and their locking bars at the right end, a colour, a stripe and a
// company mark, chosen separately (port/looks.ts), and a syllable written on its side in Andika on a white plate.
// Drawn on a canvas for the Crane, the Port and "Watch it run"; the questions draw the same thing in HTML and CSS (cargo-words.css,
// .cw-box). Small ones (the yard, ships far off) skip the detail that wouldn't show.

export interface BoxLook {
  /** Body colour. */
  readonly hex: string;
  /** A band along it: none, a stripe across the middle, a band at the top, two thin stripes, or a chevron. */
  readonly stripe: Stripe;
  readonly stripeHex: string;
  /** The company mark painted at one end: an emoji or a letter shape. */
  readonly mark: string;
}
export const STRIPES = ['none', 'band', 'top', 'twin', 'chevron', 'dots', 'diagonal', 'checks'] as const;
export type Stripe = (typeof STRIPES)[number];
export const PLAIN_LOOK: BoxLook = { hex: '#c8452f', stripe: 'none', stripeHex: '#ffffff', mark: '' };

/** A darker or lighter shade of a colour, for ribs and shadows. */
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (v: number) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
  return `#${((m(r) << 16) | (m(g) << 8) | m(b)).toString(16).padStart(6, '0')}`;
}
/** Dark writing on a light container, light on a dark one. */
export function inkFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#141414' : '#ffffff';
}

const shades = new Map<string, readonly [string, string, string]>();
/** The rib shadow, the rib light and the rail colour of a body colour, worked out once. */
function shadesOf(hex: string) {
  let s = shades.get(hex);
  if (!s) { s = [shade(hex, -0.28), shade(hex, 0.22), shade(hex, -0.42)]; shades.set(hex, s); }
  return s;
}

/** Draws a container with its top-left at (x, y), w by h pixels. `lit` rings it in yellow. */
export function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, look: BoxLook, syl: string | null, lit = false) {
  const [dark, light, rail] = shadesOf(look.hex), tiny = h < 14;
  ctx.fillStyle = look.hex;
  ctx.fillRect(x, y, w, h);
  // the band
  ctx.fillStyle = look.stripeHex;
  if (look.stripe === 'band') ctx.fillRect(x, y + h * 0.42, w, h * 0.16);
  else if (look.stripe === 'top') ctx.fillRect(x, y + h * 0.12, w, h * 0.14);
  else if (look.stripe === 'twin') { ctx.fillRect(x, y + h * 0.2, w, h * 0.07); ctx.fillRect(x, y + h * 0.73, w, h * 0.07); }
  else if (look.stripe === 'chevron') { ctx.beginPath(); ctx.moveTo(x + w * 0.6, y); ctx.lineTo(x + w * 0.76, y + h / 2); ctx.lineTo(x + w * 0.6, y + h); ctx.lineTo(x + w * 0.69, y + h); ctx.lineTo(x + w * 0.85, y + h / 2); ctx.lineTo(x + w * 0.69, y); ctx.fill(); }
  else if (look.stripe === 'dots') { for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + w * (0.12 + i * 0.14), y + h * 0.8, h * 0.05, 0, 7); ctx.fill(); } }
  else if (look.stripe === 'diagonal') { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w * 0.18, y + h); ctx.lineTo(x + w * 0.38, y); ctx.lineTo(x + w * 0.2, y); ctx.fill(); }
  else if (look.stripe === 'checks') { for (let i = 0; i < 8; i++) if (i % 2 === 0) ctx.fillRect(x + (w / 8) * i, y + h * 0.1, w / 8, h * 0.1); }
  // the corrugation: a shadow and a light edge for each rib
  const ribs = Math.max(4, Math.round(w / Math.max(4, h * 0.2))), step = (w * 0.84) / ribs, rw = Math.max(1, step * 0.28);
  ctx.fillStyle = dark;
  for (let i = 1; i < ribs; i++) ctx.fillRect(x + step * i, y + h * 0.09, rw, h * 0.82);
  if (!tiny) { ctx.fillStyle = light; for (let i = 1; i < ribs; i++) ctx.fillRect(x + step * i - rw * 0.7, y + h * 0.09, rw * 0.6, h * 0.82); }
  // the rails along the top and bottom
  ctx.fillStyle = rail;
  ctx.fillRect(x, y, w, h * 0.09); ctx.fillRect(x, y + h * 0.91, w, h * 0.09);
  // the doors at the right end, with their locking bars
  ctx.fillStyle = dark; ctx.fillRect(x + w * 0.86, y + h * 0.09, w * 0.012 + 1, h * 0.82);
  if (!tiny) {
    ctx.fillStyle = rail;
    for (const f of [0.905, 0.955]) ctx.fillRect(x + w * f - Math.max(1, w * 0.008), y + h * 0.1, Math.max(1.5, w * 0.016), h * 0.8);
    // the corner castings
    const cc = Math.max(2, h * 0.13);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x, y, cc, cc); ctx.fillRect(x + w - cc, y, cc, cc); ctx.fillRect(x, y + h - cc, cc, cc); ctx.fillRect(x + w - cc, y + h - cc, cc, cc);
  }
  // the company mark
  if (look.mark && !tiny) { ctx.font = `${Math.round(h * 0.32)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(look.mark, x + w * 0.11, y + h * 0.32); }
  // the outline
  ctx.strokeStyle = lit ? '#ffd23f' : '#141414';
  ctx.lineWidth = lit ? Math.max(3, h * 0.11) : Math.max(1, Math.min(4, h * 0.075));
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  // the syllable, on a white plate so it reads on any colour
  if (syl) {
    const size = Math.round(Math.min(h * 0.5, (w * 0.86) / Math.max(2.2, syl.length * 0.6)));
    ctx.font = `700 ${size}px Andika, Nunito, sans-serif`;
    const tw = ctx.measureText(syl).width, pw = tw + size * 0.5, ph = size * 1.22, px = Math.max(x + w * 0.04, x + w * 0.45 - pw / 2), py = y + h / 2 - ph / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, size * 0.22); ctx.fill();
    ctx.strokeStyle = '#141414'; ctx.lineWidth = Math.max(1.5, size * 0.07); ctx.stroke();
    ctx.fillStyle = '#141414'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(syl, px + pw / 2, y + h / 2 + size * 0.05);
  }
}
