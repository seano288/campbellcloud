// The container: the game's signature shape, the same in the questions and on the quay. A box with ribs down its side, doors' bars at
// one end, a colour, a stripe and a company mark, chosen separately (port/looks.ts), with a syllable written on its side in Andika.
// Drawn on a canvas for the Crane and "Watch it run"; the questions draw the same thing in HTML and CSS (cargo-words.css, .cw-box).

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

/** Draws a container with its top-left at (x, y), w by h pixels. `lit` rings it in yellow. */
export function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, look: BoxLook, syl: string | null, lit = false) {
  const r = Math.max(1, w * 0.03);
  ctx.fillStyle = look.hex;
  ctx.fillRect(x, y, w, h);
  // the band
  ctx.fillStyle = look.stripeHex;
  if (look.stripe === 'band') ctx.fillRect(x, y + h * 0.42, w, h * 0.16);
  else if (look.stripe === 'top') ctx.fillRect(x, y + h * 0.06, w, h * 0.14);
  else if (look.stripe === 'twin') { ctx.fillRect(x, y + h * 0.18, w, h * 0.07); ctx.fillRect(x, y + h * 0.75, w, h * 0.07); }
  else if (look.stripe === 'chevron') { ctx.beginPath(); ctx.moveTo(x + w * 0.62, y); ctx.lineTo(x + w * 0.8, y + h / 2); ctx.lineTo(x + w * 0.62, y + h); ctx.lineTo(x + w * 0.72, y + h); ctx.lineTo(x + w * 0.9, y + h / 2); ctx.lineTo(x + w * 0.72, y); ctx.fill(); }
  else if (look.stripe === 'dots') { for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + w * (0.12 + i * 0.152), y + h * 0.86, h * 0.05, 0, 7); ctx.fill(); } }
  else if (look.stripe === 'diagonal') { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w * 0.18, y + h); ctx.lineTo(x + w * 0.38, y); ctx.lineTo(x + w * 0.2, y); ctx.fill(); }
  else if (look.stripe === 'checks') { for (let i = 0; i < 8; i++) if (i % 2 === 0) ctx.fillRect(x + (w / 8) * i, y + h * 0.04, w / 8, h * 0.1); }
  // ribs down the side
  ctx.strokeStyle = shade(look.hex, -0.25);
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.beginPath();
  for (let i = 1; i < 12; i++) { const rx = x + (w / 12) * i; ctx.moveTo(rx, y + h * 0.08); ctx.lineTo(rx, y + h * 0.92); }
  ctx.stroke();
  // the door bars at the right end
  ctx.strokeStyle = shade(look.hex, -0.4);
  ctx.lineWidth = Math.max(1, w * 0.02);
  ctx.beginPath(); ctx.moveTo(x + w * 0.93, y + h * 0.1); ctx.lineTo(x + w * 0.93, y + h * 0.9); ctx.stroke();
  // the company mark
  if (look.mark) { ctx.font = `${Math.round(h * 0.34)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(look.mark, x + w * 0.1, y + h * 0.3); }
  // the outline
  ctx.strokeStyle = lit ? '#ffd23f' : '#141414';
  ctx.lineWidth = lit ? Math.max(3, w * 0.05) : Math.max(1.5, w * 0.022);
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
  // the syllable, on a white plate so it reads on any colour
  if (syl) {
    const size = Math.round(Math.min(h * 0.52, (w * 0.95) / Math.max(2.2, syl.length * 0.62)));
    ctx.font = `700 ${size}px Andika, Nunito, sans-serif`;
    const tw = ctx.measureText(syl).width, pw = tw + size * 0.5, ph = size * 1.2;
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.beginPath(); ctx.roundRect(x + w / 2 - pw / 2, y + h / 2 - ph / 2, pw, ph, r * 3); ctx.fill();
    ctx.fillStyle = '#141414'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(syl, x + w / 2, y + h / 2 + size * 0.04);
  }
}
