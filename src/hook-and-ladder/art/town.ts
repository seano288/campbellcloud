// The Town at night, drawn in code: each Call he has answered stands on its lot as the same building he saved at the Call (drawn by
// call/draw.ts's scene drawing), with its windows lit warm; a lot whose Call he hasn't answered yet is a building site, a wooden
// fence with the faint shape of what will stand there. Drawn once per size on a plain 2D canvas (art/CanvasArt.tsx), never per frame.
import { drawSceneBody } from '../call/draw';
import type { Prop, SceneDef } from '../call/scenes';

const OUT = '#141414';
/** How far above its top floor each kind of building reaches (roofs, flags, signs), in floors. */
const ROOF: Partial<Record<SceneDef['look'], number>> = {
  house: 1.15, treehouse: 1.15, barn: 1.45, castle: 1.55, lighthouse: 1.25, airport: 0.65, hotel: 1.05, school: 0.8,
  cabin: 1.15, zoo: 1.5, windmill: 1.35, library: 1.6, museum: 1.7, hospital: 1.7, stadium: 1.5, giant: 1.75, volcano: 1.25, station: 1.1, pizza: 1, toystore: 1,
};
/** Left, right and top of a prop, in world units. Water lies under the ground and doesn't count. */
function extent(p: Prop): [number, number, number] | null {
  switch (p.kind) {
    case 'tree': { const h = p.h ?? 2.4; return [p.x - 1.05, p.x + 1.05, h * 0.75 + 0.78]; }
    case 'bush': return [p.x - 0.72, p.x + 0.72, 1.0];
    case 'bin': return [p.x - 0.5, p.x + 0.5, 0.95];
    case 'lamp': return [p.x - 0.22, p.x + 0.22, 2.6];
    case 'car': return [p.x - 1.05, p.x + 1.05, 1.12];
    case 'plane': return [p.x - 2.45, p.x + 2.05, 2.12];
    case 'rocket': return [p.x - 1.05, p.x + 1.05, 8.8];
    case 'tent': return [p.x - 1.05, p.x + 1.05, 1.55];
    case 'campfire': return [p.x - 0.75, p.x + 0.75, 0.4];
    case 'hay': { const n = p.h ?? 1; return [p.x - n * 0.55, p.x + n * 0.55, 0.5 + (n - 1) * 0.95 + 0.55]; }
    case 'tractor': return [p.x - 0.98, p.x + 0.85, 1.75];
    case 'train': return [p.x - 0.35, p.x + (p.w ?? 4.6) + 0.35, 1.75];
    case 'blades': return [p.x - 2.1, p.x + 2.1, (p.h ?? 4) + 2.1];
    case 'rock': return [p.x - 0.45, p.x + (p.w ?? 4) + 0.45, p.h ?? 1.5];
    case 'bigtop': return [p.x - (p.w ?? 5.6) / 2 - 0.05, p.x + (p.w ?? 5.6) / 2 + 0.5, (p.h ?? 4.4) + 0.65];
    case 'pole': return [p.x - 1.45, p.x + 1.45, (p.h ?? 3) + 0.2];
    case 'volcano': { const h = p.h ?? 6; return [p.x - h * 0.75, p.x + h * 0.75, h + 1.4]; }
    case 'palm': { const h = p.h ?? 3; return [p.x - 1.3, p.x + 1.3, h + 0.5]; }
    default: return null;
  }
}

/** The part of a scene a lot shows: from its leftmost to its rightmost thing, from the ground to its roof. */
export function boundsOf(s: SceneDef) {
  let x0 = Infinity, x1 = -Infinity, top = 1;
  for (const b of s.blocks) {
    x0 = Math.min(x0, b.x - 0.35); x1 = Math.max(x1, b.x + b.w + 0.35);
    top = Math.max(top, (b.base ?? 0) + b.floors + (ROOF[s.look] ?? 0.2));
  }
  for (const p of s.props) { const e = extent(p); if (e) { x0 = Math.min(x0, e[0]); x1 = Math.max(x1, e[1]); top = Math.max(top, e[2]); } }
  if (s.look === 'ship') { x0 = Math.min(x0, 7.6); x1 = Math.max(x1, 13.6); top = Math.max(top, 4.2); }
  return { x0, x1, top };
}

/** A lot: the pavement, and on it the building he saved (lit) or a building site. `kMax` keeps every lot on one scale, so a little
 *  house stays little next to the Skyscraper; anything taller than the lot allows shrinks to fit. */
export function drawLot(ctx: CanvasRenderingContext2D, s: SceneDef, built: boolean, x: number, w: number, h: number, kMax: number) {
  const pave = Math.max(5, Math.round(h * 0.07));
  ctx.save();
  ctx.beginPath(); ctx.rect(x, 0, w, h); ctx.clip();
  // the pavement and its kerb
  ctx.fillStyle = '#7d8794'; ctx.fillRect(x, h - pave, w, pave);
  ctx.fillStyle = '#b9c2cc'; ctx.fillRect(x, h - pave, w, Math.max(2, pave * 0.28));
  const B = boundsOf(s), bw = B.x1 - B.x0;
  const k = Math.min((w * 0.94) / bw, ((h - pave) * 0.94) / B.top, kMax);
  const m = { k, ox: x + w / 2 - (B.x0 + bw / 2) * k, oy: h - pave };
  if (built) drawSceneBody(ctx, s, m, true);
  else {
    // the shape of what will stand here, faint, behind a wooden site fence
    ctx.globalAlpha = 0.16; drawSceneBody(ctx, s, m, false); ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const fh = Math.min(h * 0.3, Math.max(14, 1.2 * k)), fy = h - pave - fh, fx = x + w * 0.06, fw = w * 0.88, planks = Math.max(3, Math.round(fw / Math.max(10, fh * 0.42)));
    ctx.lineWidth = Math.max(1.5, fh * 0.06); ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
    for (let i = 0; i < planks; i++) {
      const px = fx + (i * fw) / planks, pw = fw / planks, tall = i % 2 ? 0.92 : 1;
      ctx.fillStyle = i % 2 ? '#b8793c' : '#c98b4a';
      ctx.beginPath(); ctx.moveTo(px, h - pave); ctx.lineTo(px, fy + fh * (1 - tall) + pw * 0.3); ctx.lineTo(px + pw / 2, fy + fh * (1 - tall)); ctx.lineTo(px + pw, fy + fh * (1 - tall) + pw * 0.3); ctx.lineTo(px + pw, h - pave); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(fx, fy + fh * 0.45, fw, Math.max(3, fh * 0.12)); ctx.strokeRect(fx, fy + fh * 0.45, fw, Math.max(3, fh * 0.12));
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** One scale for a whole row of lots `h` pixels high: five floors fill a lot, and taller things shrink to fit their own. */
export const lotScale = (h: number) => (h * 0.93) / 5.4;

/** A street of lots side by side across the whole canvas (the Home tile: the last buildings he saved, or sites if there are none).
 *  As many lots as the shape allows while each stays big enough to read: two on a tile about as wide as it is tall. */
export function drawStreet(ctx: CanvasRenderingContext2D, lots: readonly { scene: SceneDef; built: boolean }[], w: number, h: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const fit = Math.max(1, Math.round((w / h) * 1.5)), built = lots.filter(l => l.built);
  const shown = [...built.slice(-fit), ...lots.filter(l => !l.built)].slice(0, fit);
  const n = Math.max(1, shown.length), lw = w / n, kMax = lotScale(h);
  shown.forEach((l, i) => drawLot(ctx, l.scene, l.built, Math.round(i * lw), Math.round((i + 1) * lw) - Math.round(i * lw), h, kMax));
}
