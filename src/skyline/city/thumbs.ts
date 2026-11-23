// Little pictures of buildings and vehicles for the shop's tiles, drawn once each into an image and kept.
import { drawBuilding, drawVehicle, emoji, faceHeight, vehicleSize } from '../art/draw';
import type { Look, Vehicle } from './catalog';

const cache = new Map<string, string>();
const W = 120;

/** A building as it stands in the City, with `floors` floors. */
export function buildingThumb(key: string, look: Look, floors: number, size: 's' | 'w' | 'l', night = false): string {
  const id = `${key}|${floors}|${night}`;
  const hit = cache.get(id);
  if (hit) return hit;
  // cropped to the building itself (its front, roof and anything on top), so the tile shows it as big as it can
  const fw = size === 's' ? 52 : 96, fd = size === 'l' ? 52 : 30;
  const above = look.special ? Math.max(70, faceHeight(floors) + 44) : faceHeight(floors) + fd * .62 + 38;
  const w = fw + 20, h = above + fd + 8, k = 3;
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext('2d')!;
  g.scale(k, k);
  g.translate(10, above + 2);
  drawBuilding(g, look, floors, 0, 0, fw, fd, { night, seed: key.length * 31 + floors });
  const url = cropped(c).toDataURL();
  cache.set(id, url);
  return url;
}

export function vehicleThumb(v: Vehicle, colour: string): string {
  const id = `v|${v.key}|${colour}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = W * 2; c.height = 90 * 2;
  const g = c.getContext('2d')!;
  const { L, W: wide } = vehicleSize(v);
  g.scale(2, 2); g.translate(W / 2, 45); g.scale(Math.min(104 / L, 64 / wide, 3), Math.min(104 / L, 64 / wide, 3));
  drawVehicle(g, v, colour, 0, 0, 0, .4);
  const url = c.toDataURL();
  cache.set(id, url);
  return url;
}

/** The canvas cut down to what was drawn on it (plus a little room), so a short house fills its tile as well as a tall tower does. */
function cropped(c: HTMLCanvasElement): HTMLCanvasElement {
  const { width: w, height: h } = c, data = c.getContext('2d')!.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3]! > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  const pad = 6, cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2, out = document.createElement('canvas');
  out.width = cw; out.height = ch;
  out.getContext('2d')!.drawImage(c, x0 - pad, y0 - pad, cw, ch, 0, 0, cw, ch);
  return out;
}

export function emojiThumb(e: string, bg = '#ffffff'): string {
  const id = `e|${e}|${bg}`;
  const hit = cache.get(id);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 160; c.height = 160;
  const g = c.getContext('2d')!;
  g.fillStyle = bg; g.beginPath(); g.arc(80, 80, 70, 0, Math.PI * 2); g.fill();
  emoji(g, e, 80, 86, 92);
  const url = c.toDataURL();
  cache.set(id, url);
  return url;
}
