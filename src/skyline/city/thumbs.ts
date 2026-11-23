// Little pictures of buildings and vehicles for the shop's tiles, drawn once each into an image and kept.
import { drawBuilding, drawVehicle, emoji, faceHeight } from '../art/draw';
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
  const url = c.toDataURL();
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
  g.scale(2, 2); g.translate(W / 2, 45); g.scale(1.6, 1.6);
  drawVehicle(g, v, colour, 0, 0, 0, .4);
  const url = c.toDataURL();
  cache.set(id, url);
  return url;
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
