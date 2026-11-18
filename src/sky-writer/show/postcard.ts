// A postcard: a Free Sky drawing over the Show it was drawn at, redrawn from its points (it's kept as numbers, not a picture, so the
// save stays small). `upTo` draws only part of it, so the Wall can replay him drawing it.
import { EMOJI_FONT } from '../art/plane';
import { SHAPES, SMOKES } from '../airfield/parts';
import type { Postcard } from '../airfield/state';
import { paintBackdrop } from './backdrop';
import { show } from './places';

/** The strokes of a postcard, in 0 to 1 across and down. */
export function strokesOf(card: Pick<Postcard, 'pts'>): [number, number][][] {
  const out: [number, number][][] = [[]];
  for (let i = 0; i < card.pts.length; i++) {
    if (card.pts[i] === -1) { out.push([]); continue; }
    out.at(-1)!.push([card.pts[i]! / 255, (card.pts[i + 1] ?? 0) / 255]); i++;
  }
  return out.filter(s => s.length);
}

export function smokeColorOf(id: string, i = 0) {
  const c = SMOKES.find(s => s.id === id)?.color ?? '#ffffff';
  return c === 'rainbow' ? `hsl(${(i * 37) % 360} 90% 62%)` : c === 'glow' ? '#fffbd0' : c;
}

const scenes = new Map<string, HTMLCanvasElement>();
export function drawPostcard(c: CanvasRenderingContext2D, card: Postcard, w: number, h: number, upTo = Infinity) {
  const key = `${card.show}:${w}x${h}`;
  let bg = scenes.get(key);
  if (!bg) { bg = paintBackdrop(show(card.show), w, h); if (scenes.size > 40) scenes.clear(); scenes.set(key, bg); }
  c.drawImage(bg, 0, 0, w, h);
  const mark = SHAPES.find(s => s.id === card.shape)?.mark ?? '', lw = Math.max(2, h * 0.018);
  let n = 0;
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const s of strokesOf(card)) {
    const pts = s.slice(0, Math.max(0, upTo - n));
    n += s.length;
    if (!pts.length) break;
    c.strokeStyle = smokeColorOf(card.smoke, n); c.globalAlpha = 0.35; c.lineWidth = lw * 2.2;
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h))); c.stroke();
    c.globalAlpha = 1; c.lineWidth = lw; c.stroke();
    if (mark && mark !== 'dot' && mark !== 'bubble') { c.font = `${lw * 3}px ${EMOJI_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < pts.length; i += 6) c.fillText(mark, pts[i]![0] * w, pts[i]![1] * h); }
    if (upTo !== Infinity && n >= upTo) break;
  }
  c.globalAlpha = 1;
}
