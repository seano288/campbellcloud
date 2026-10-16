// Shorthand for writing Aircraft specs.
import type { Section, Station, V3 } from '../three/geometry';
import { panel, roundTip } from '../three/geometry';

/** A round section of radius r at x (centre height y). */
export const circle = (x: number, r: number, y = 0): Section => ({ x, w: r, top: r, bot: r, y });
/** An oval section: half-width, height above and below the centre line. */
export const oval = (x: number, w: number, top: number, bot: number, y = 0, n?: number, nb?: number): Section => ({ x, w, top, bot, y, ...(n ? { n } : {}), ...(nb ? { nb } : {}) });

/** A bubble canopy from x0 to x1 sitting on a fuselage top at height y: half-width w and height h at its peak (at `peak` along it). */
export function bubble(x0: number, x1: number, y: number, w: number, h: number, peak = 0.45): Section[] {
  const L = x1 - x0;
  return [0, 0.12, 0.3, peak, Math.min(peak + 0.25, 0.85), 0.94, 1].map(f => {
    const k = f <= peak ? Math.sin((f / peak) * (Math.PI / 2)) : Math.cos(((f - peak) / (1 - peak)) * (Math.PI / 2));
    const kk = Math.max(Math.pow(Math.max(k, 0), 0.6), 0.03);
    return { x: x0 + f * L, w: w * kk, top: h * Math.max(Math.pow(Math.max(k, 0), 0.8), 0.02), bot: 0.12, y };
  });
}

/** A straight wing or tail panel between two leading-edge points. */
export const wingPanel = (root: V3, rootChord: number, tip: V3, tipChord: number, t = 0.05, tTip = t, steps = 3): Station[] =>
  panel({ le: root, chord: rootChord, t }, { le: tip, chord: tipChord, t: tTip }, steps);

/** A panel with an elliptical (WWII-style) tip. */
export function roundedPanel(root: V3, rootChord: number, tip: V3, tipChord: number, t: number, tTip: number, tipLength: number, steps = 3): Station[] {
  const main = wingPanel(root, rootChord, tip, tipChord, t, tTip, steps);
  const dir = [tip[0] - root[0], tip[1] - root[1], tip[2] - root[2]] as const, len = Math.hypot(...dir);
  return [...main, ...roundTip(main[main.length - 1]!, [dir[0] / len, dir[1] / len, dir[2] / len], tipLength, 4)];
}

/** Several panels joined end to end (a cranked or gull wing): stations from root to tip. */
export const joined = (...parts: Station[][]): Station[] => parts.flatMap((p, i) => (i ? p.slice(1) : p));
